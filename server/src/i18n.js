// Langue de la réponse (français par défaut, néerlandais, anglais).
// Le contenu source est rédigé en français ; `data/i18n/nl.js` et `data/i18n/en.js`
// fournissent les traductions (textes de données, messages d'erreur).
import en from './data/i18n/en.js';
import nl from './data/i18n/nl.js';

export const LANGS = ['fr', 'nl', 'en'];
const DICTS = { nl, en };

export function pickLang(req) {
  const query = String(req.query?.lang ?? '').toLowerCase();
  if (LANGS.includes(query)) return query;
  for (const part of String(req.headers?.['accept-language'] ?? '').split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (LANGS.includes(code)) return code;
  }
  return 'fr';
}

// Dictionnaire de la langue (vide en français : on garde le texte source).
export const dict = (lang) => DICTS[lang] ?? {};

// Traduit une valeur d'une section du dictionnaire, sinon renvoie le texte source.
export const tr = (lang, section, key, fallback) => dict(lang)[section]?.[key] ?? fallback;

export function translateError(message, lang) {
  if (lang === 'fr' || typeof message !== 'string') return message;
  const d = dict(lang);
  if (d.errors?.[message]) return d.errors[message];
  for (const [source, replacement] of d.errorPatterns ?? []) {
    const re = new RegExp(source);
    if (re.test(message)) return message.replace(re, replacement);
  }
  return message;
}

// Pose `req.lang` et traduit le champ `error` des réponses JSON.
export function langMiddleware(req, res, next) {
  req.lang = pickLang(req);
  const json = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body.error === 'string') body = { ...body, error: translateError(body.error, req.lang) };
    return json(body);
  };
  next();
}

// ——— Contenus traduits ———

export function localizePermit(permit, lang) {
  const t = dict(lang).permits?.[permit.code];
  return t ? { ...permit, ...t } : permit;
}

export function localizePermitGroup(group, lang) {
  const label = dict(lang).permitGroups?.[group.id];
  return label ? { ...group, label } : group;
}

export function localizePlan(plan, lang) {
  const t = dict(lang).plans?.[plan.id];
  return t ? { ...plan, ...t } : plan;
}

export const localizeTheme = (theme, lang) => tr(lang, 'themes', theme, theme);

// `theme` reste l'identifiant (français) du thème ; `themeLabel` est le libellé traduit.
export function localizeQuestion(question, lang) {
  const t = dict(lang).questions?.[question.id];
  return { ...question, ...(t ?? {}), theme: question.theme, themeLabel: localizeTheme(question.theme, lang) };
}

export function localizeSkill(skill, lang) {
  return {
    ...skill,
    // Un même id peut avoir un libellé propre à une catégorie (tracteur…) : `skillLabels` par libellé source.
    label: tr(lang, 'skillLabels', skill.label, tr(lang, 'skills', skill.id, skill.label)),
    group: tr(lang, 'skillGroups', skill.group, skill.group),
  };
}

export const localizeRegion = (region, lang) => ({ ...region, label: tr(lang, 'regions', region.id, region.label) });

export const localizeSkillLevels = (levels, lang) =>
  levels.map((l) => ({ ...l, label: tr(lang, 'skillLevels', String(l.level), l.label) }));
