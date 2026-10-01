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

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export const STATUS_LABELS = {
  pending: 'En attente du moniteur',
  accepted: 'Confirmée',
  en_route: 'Moniteur en route',
  in_progress: 'Leçon en cours',
  completed: 'Terminée',
  declined: 'Refusée',
  cancelled: 'Annulée',
};

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
  new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(euros);

export const formatDateTime = (iso) =>
  new Intl.DateTimeFormat('fr-BE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
