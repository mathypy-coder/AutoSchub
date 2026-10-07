import { getLang, getLocale, translate } from './i18n.jsx';

const TOKEN_KEY = 'autoschub.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // stockage indisponible (navigation privée) : la session reste en mémoire
  }
}

// auth: false pour les données publiques, que le CDN peut alors mettre en cache.
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const token = auth ? getToken() : null;
  // La langue voyage dans l'URL (clé de cache du CDN) et dans l'en-tête Accept-Language.
  const lang = getLang();
  const url = `/api${path}${path.includes('?') ? '&' : '?'}lang=${lang}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Accept-Language': lang,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  // Connexion refusée par le serveur (session expirée, nouveau déploiement…).
  // (Un 401 de connexion/inscription = mauvais identifiants, pas une session expirée.)
  if (res.status === 401 && token && !/^\/auth\/(login|register)/.test(path)) {
    window.dispatchEvent(new Event('autoschub:session-expired'));
  }
  if (!res.ok) {
    const error = new Error([data.error || translate('common.errorStatus', { status: res.status }), data.detail].filter(Boolean).join(' — '));
    error.status = res.status;
    throw error;
  }
  return data;
}

export const STATUS_LIST = ['pending', 'accepted', 'en_route', 'in_progress', 'completed', 'declined', 'cancelled', 'expired'];
export const statusLabel = (status) => translate(`common.status_${status}`);

// Langues parlées par les moniteurs (nom de chaque langue dans sa propre langue).
export const LANGUAGE_LABELS = {
  fr: 'Français',
  nl: 'Nederlands',
  de: 'Deutsch',
  en: 'English',
  ar: 'العربية',
  it: 'Italiano',
  es: 'Español',
};

export const formatPrice = (euros) =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'EUR' }).format(euros);

export const formatDateTime = (iso) =>
  new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
