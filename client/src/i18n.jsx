import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Traductions de l'interface (français, néerlandais, anglais).
// Chaque fichier de `./i18n/` exporte `{ fr: {...}, nl: {...}, en: {...} }` ;
// ses clés sont préfixées par le nom du fichier : `login.js` → t('login.title').
export const LANGS = [
  { code: 'fr', label: 'Français', short: 'FR', locale: 'fr-BE' },
  { code: 'nl', label: 'Nederlands', short: 'NL', locale: 'nl-BE' },
  { code: 'en', label: 'English', short: 'EN', locale: 'en-BE' },
];
const CODES = LANGS.map((l) => l.code);
const STORAGE_KEY = 'autoschub.lang';

const MESSAGES = { fr: {}, nl: {}, en: {} };
const modules = import.meta.glob('./i18n/*.js', { eager: true });
for (const [path, mod] of Object.entries(modules)) {
  const ns = path.split('/').pop().replace(/\.js$/, '');
  for (const code of CODES) {
    for (const [key, value] of Object.entries(mod.default?.[code] ?? {})) MESSAGES[code][`${ns}.${key}`] = value;
  }
}

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (CODES.includes(saved)) return saved;
  } catch {
    // stockage indisponible
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = String(tag ?? '').slice(0, 2).toLowerCase();
    if (CODES.includes(code)) return code;
  }
  return 'fr';
}

// Langue courante, lisible hors des composants (appels API, formats de date et de prix).
let currentLang = detectLang();
export const getLang = () => currentLang;
export const getLocale = () => LANGS.find((l) => l.code === currentLang)?.locale ?? 'fr-BE';

// Traduction hors composant. `vars` remplace les {variables} ; une valeur
// `{ one, other }` choisit la forme selon `vars.count`.
export function translate(key, vars = {}, lang = currentLang) {
  let value = MESSAGES[lang]?.[key] ?? MESSAGES.fr[key];
  if (value == null) return key;
  if (typeof value === 'object') value = vars.count === 1 ? (value.one ?? value.other) : value.other;
  return String(value).replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match));
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(currentLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!CODES.includes(code)) return;
    currentLang = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // stockage indisponible
    }
    setLangState(code);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, locale: getLocale(), t: (key, vars) => translate(key, vars, lang) }),
    [lang, setLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;

// Sélecteur de langue compact (FR · NL · EN).
export function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('common.language')}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          title={l.label}
          aria-pressed={lang === l.code}
          className={`lang-btn ${lang === l.code ? 'lang-btn-active' : ''}`}
          onClick={() => setLang(l.code)}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
