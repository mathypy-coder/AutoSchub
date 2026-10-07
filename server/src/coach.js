// Coach IA pour l'examen théorique.
// Avec ANTHROPIC_API_KEY : réponses rédigées par Claude, appuyées sur la banque de questions de l'app.
// Sans clé (ou si l'API ne répond pas) : coach « hors ligne » qui répond à partir de la banque
// de questions et de ses explications. L'élève a donc toujours une réponse.
import Anthropic from '@anthropic-ai/sdk';
import { QUESTIONS } from './data/questions.js';
import { localizeQuestion, localizeTheme } from './i18n.js';

export const COACH_MODEL = process.env.COACH_MODEL || 'claude-opus-5-5';
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY) && process.env.COACH_AI !== '0';

let client = null;
const getClient = () => {
  // Délai court : la fonction Vercel est limitée à 30 s ; en cas de lenteur, on répond hors ligne.
  client ??= new Anthropic({ timeout: 25000, maxRetries: 1 });
  return client;
};

const LANG_NAMES = { fr: 'French', nl: 'Dutch (Belgian usage, informal "je")', en: 'British English' };

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const STOP = new Set(
  'avec dans pour quoi quel quelle quels quelles est-ce comment faut peut sont etre cette votre vous suis elle elles dont plus moins tres aussi mais donc alors quand that what with when where which have from your this there their should would could about wanneer welke moet mijn naar voor zijn heeft niet een het dat wat waar hoe mag kan'.split(
    ' ',
  ),
);
const words = (text) => normalize(text).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));

// Recherche des questions de la banque les plus proches d'une demande (dans toutes les langues).
export function retrieveQuestions(query, { category, lang = 'fr', limit = 4 } = {}) {
  const wanted = new Set(words(query));
  if (!wanted.size) return [];
  return QUESTIONS.filter((q) => !category || q.categories.includes(category))
    .map((q) => {
      const local = localizeQuestion(q, lang);
      const haystack = new Set(words(`${q.theme} ${q.question} ${q.explanation} ${local.question} ${local.explanation} ${local.themeLabel}`));
      let score = 0;
      for (const w of wanted) if (haystack.has(w)) score += w.length > 5 ? 2 : 1;
      return { q: local, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.q);
}

const formatReference = (q) =>
  `- [${q.themeLabel}] ${q.question}\n  Answer: ${q.choices[q.answer]}${q.grave ? ' (serious fault if wrong)' : ''}\n  Why: ${q.explanation}`;

function systemPrompt({ lang, category, profile, references, extra }) {
  return [
    `You are the theory coach of AutoSchub, a Belgian driving-school app. You help a learner prepare the Belgian theory test for licence category ${category}.`,
    `Always answer in ${LANG_NAMES[lang] ?? LANG_NAMES.fr}, in a warm, encouraging and informal tone (tutoiement in French).`,
    'Keep answers short and practical: at most about 180 words, with a clear rule, a concrete example and, when useful, a memory trick. Use short paragraphs or bullet points; no tables.',
    'Rules are those of the Belgian Highway Code (Code de la route / Wegcode, royal decree of 1 December 1975) and the regional rules of Brussels, Wallonia and Flanders. Cite an article number only if you are certain of it. If a rule differs between regions or you are not sure, say so and point to the official sources (SPF Mobilité / FOD Mobiliteit, the Region, the test centre operator).',
    'The Belgian theory test has 50 questions; the pass mark is 41/50 and a serious-fault question costs 5 points.',
    'Stay on driving topics (theory test, road rules, signs, safe driving, supervised learning "filière libre" / "vrije begeleiding", practical test preparation). Politely decline anything else. Never help anyone cheat at the official test.',
    profile ? `Learner profile: ${profile}` : '',
    references.length
      ? `Reference items from the app's question bank (validated content, prefer them when relevant):\n${references.map(formatReference).join('\n')}`
      : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

// Appel à Claude. Renvoie le texte, ou null si la réponse est refusée.
async function callClaude(system, messages, maxTokens = 2000) {
  const response = await getClient().beta.messages.create({
    model: COACH_MODEL,
    max_tokens: maxTokens,
    // Si le modèle décline une demande légitime, l'API la relance sur le modèle de repli recommandé.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system,
    messages,
  });
  if (response.stop_reason === 'refusal') return null;
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return text || null;
}

const OFFLINE = {
  fr: {
    intro: 'Voici ce que dit la banque de questions de l’app :',
    none: 'Je n’ai pas trouvé de question liée dans la banque. Essaie avec d’autres mots (ex. « priorité de droite », « ligne blanche », « autoroute »), ou entraîne-toi par thème dans l’onglet Théorie.',
    answer: 'Bonne réponse',
    grave: 'faute grave à l’examen',
    refusal: 'Je ne peux pas répondre à cette demande. Pose-moi une question sur le code de la route ou l’examen.',
    explainIntro: 'La bonne réponse était',
    yourAnswer: 'Tu as répondu',
    tip: 'Astuce : relis la règle, puis refais 5 questions du thème « {theme} » pour l’ancrer.',
    offlineNote: 'Coach hors ligne : réponse tirée des explications de la banque de questions.',
  },
  nl: {
    intro: 'Dit zegt de vragenbank van de app:',
    none: 'Ik vond geen verwante vraag in de vragenbank. Probeer andere woorden (bv. ‘voorrang van rechts’, ‘witte lijn’, ‘autosnelweg’) of oefen per thema in het tabblad Theorie.',
    answer: 'Juist antwoord',
    grave: 'zware fout op het examen',
    refusal: 'Daar kan ik niet op antwoorden. Stel me een vraag over de verkeersregels of het examen.',
    explainIntro: 'Het juiste antwoord was',
    yourAnswer: 'Jij antwoordde',
    tip: 'Tip: lees de regel opnieuw en doe daarna 5 vragen uit het thema ‘{theme}’ om ze goed te onthouden.',
    offlineNote: 'Offline coach: antwoord op basis van de uitleg in de vragenbank.',
  },
  en: {
    intro: 'Here is what the app’s question bank says:',
    none: 'I couldn’t find a related question in the bank. Try other words (e.g. “priority to the right”, “white line”, “motorway”), or practise by topic in the Theory tab.',
    answer: 'Correct answer',
    grave: 'serious fault in the test',
    refusal: 'I can’t help with that. Ask me about the Highway Code or the test.',
    explainIntro: 'The correct answer was',
    yourAnswer: 'You answered',
    tip: 'Tip: reread the rule, then do 5 questions on “{theme}” to make it stick.',
    offlineNote: 'Offline coach: answer based on the question bank explanations.',
  },
};
const offlineText = (lang) => OFFLINE[lang] ?? OFFLINE.fr;
// Ponctuation propre à chaque langue (espace avant « : » et guillemets français).
const SEP = { fr: ' : ', nl: ': ', en: ': ' };
const quote = (text, lang) => (lang === 'fr' ? `« ${text} »` : `“${text}”`);

function offlineAnswer(query, { category, lang }) {
  const o = offlineText(lang);
  const refs = retrieveQuestions(query, { category, lang, limit: 3 });
  if (!refs.length) return o.none;
  return [
    o.intro,
    ...refs.map(
      (q) => `• ${q.question}\n  ${o.answer}${SEP[lang] ?? SEP.fr}${q.choices[q.answer]}${q.grave ? ` (${o.grave})` : ''}\n  ${q.explanation}`,
    ),
  ].join('\n\n');
}

// Nettoie l'historique envoyé par l'app : rôles alternés, textes bornés, dernier message de l'élève.
export function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const m of raw.slice(-10)) {
    const role = m?.role === 'assistant' ? 'assistant' : 'user';
    const content = String(m?.content ?? '').trim().slice(0, 1500);
    if (!content) continue;
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += `\n\n${content}`;
    else out.push({ role, content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out.length && out[out.length - 1].role === 'user' ? out : [];
}

// Réponse libre du coach (question sur le code de la route).
export async function coachChat({ messages, category, lang, profile }) {
  const question = messages[messages.length - 1].content;
  if (aiEnabled()) {
    const references = retrieveQuestions(messages.map((m) => m.content).join(' '), { category, lang, limit: 5 });
    try {
      const text = await callClaude(systemPrompt({ lang, category, profile, references }), messages);
      return { reply: text ?? offlineText(lang).refusal, source: 'ai', references: references.map((r) => r.id) };
    } catch (err) {
      logApiError(err);
    }
  }
  return { reply: offlineAnswer(question, { category, lang }), source: 'offline' };
}

// Explication personnalisée d'une erreur à une question de la banque.
export async function coachExplain({ question, given, category, lang, profile }) {
  const q = localizeQuestion(question, lang);
  const o = offlineText(lang);
  const givenText = Number.isInteger(given) && q.choices[given] != null ? q.choices[given] : null;
  if (aiEnabled()) {
    const prompt = [
      `Question (${q.themeLabel}): ${q.question}`,
      `Choices: ${q.choices.map((c, i) => `${i + 1}. ${c}`).join(' | ')}`,
      `Correct answer: ${q.choices[q.answer]}${q.grave ? ' (serious-fault question: -5 points)' : ''}`,
      givenText ? `The learner answered: ${givenText}` : 'The learner did not answer.',
      `Official explanation from the bank: ${q.explanation}`,
      'Explain in a few lines why the correct answer is right and, if relevant, why the learner’s answer is a trap. Then give one memory trick and one real-life situation where the rule applies.',
    ].join('\n');
    const references = retrieveQuestions(`${q.theme} ${question.question}`, { category, lang, limit: 3 }).filter(
      (r) => r.id !== q.id,
    );
    try {
      const text = await callClaude(systemPrompt({ lang, category, profile, references }), [
        { role: 'user', content: prompt },
      ]);
      if (text) return { reply: text, source: 'ai' };
    } catch (err) {
      logApiError(err);
    }
  }
  const lines = [
    `${o.explainIntro}${SEP[lang] ?? SEP.fr}${quote(q.choices[q.answer], lang)}${q.grave ? ` (${o.grave})` : ''}.`,
    givenText ? `${o.yourAnswer}${SEP[lang] ?? SEP.fr}${quote(givenText, lang)}.` : null,
    q.explanation,
    o.tip.replace('{theme}', q.themeLabel),
  ].filter(Boolean);
  return { reply: lines.join('\n\n'), source: 'offline' };
}

function logApiError(err) {
  // Erreurs typées du SDK : on journalise et on bascule sur le coach hors ligne.
  if (err instanceof Anthropic.RateLimitError) console.warn('Coach IA : limite de débit atteinte.');
  else if (err instanceof Anthropic.AuthenticationError) console.error('Coach IA : clé ANTHROPIC_API_KEY refusée.');
  else if (err instanceof Anthropic.APIError) console.error(`Coach IA : erreur API ${err.status ?? ''}`, err.message);
  else console.error('Coach IA :', err?.message ?? err);
}

// ——— Plan de révision sur 7 jours (calculé, sans IA) ———
const PLAN_TEXT = {
  fr: {
    review: 'Revoir tes {count} erreurs',
    practice: 'Entraînement « {theme} » (10 questions)',
    discover: 'Découvrir le thème « {theme} » (10 questions)',
    exam: 'Examen blanc complet (50 questions)',
    coach: 'Demander au coach d’expliquer « {theme} »',
    rest: 'Repos actif : relis les panneaux et les fautes graves',
    headlineLow: 'On pose les bases : un thème par jour et tes erreurs en priorité.',
    headlineMid: 'Tu progresses : cible tes thèmes faibles et passe des examens blancs.',
    headlineHigh: 'Presque prêt·e : enchaîne les examens blancs pour assurer le 41/50.',
    ready: 'Tu es prêt·e : inscris-toi à l’examen théorique officiel !',
  },
  nl: {
    review: 'Je {count} fouten herhalen',
    practice: 'Oefenen op ‘{theme}’ (10 vragen)',
    discover: 'Het thema ‘{theme}’ ontdekken (10 vragen)',
    exam: 'Volledig proefexamen (50 vragen)',
    coach: 'Vraag de coach om ‘{theme}’ uit te leggen',
    rest: 'Actieve rust: herlees de borden en de zware fouten',
    headlineLow: 'We leggen de basis: één thema per dag en eerst je fouten.',
    headlineMid: 'Je gaat vooruit: focus op je zwakke thema’s en doe proefexamens.',
    headlineHigh: 'Bijna klaar: doe proefexamen na proefexamen om 41/50 te halen.',
    ready: 'Je bent klaar: schrijf je in voor het officiële theorie-examen!',
  },
  en: {
    review: 'Review your {count} mistakes',
    practice: 'Practise “{theme}” (10 questions)',
    discover: 'Discover the “{theme}” topic (10 questions)',
    exam: 'Full mock exam (50 questions)',
    coach: 'Ask the coach to explain “{theme}”',
    rest: 'Light day: reread the signs and serious faults',
    headlineLow: 'Building the basics: one topic a day, mistakes first.',
    headlineMid: 'You’re improving: target your weak topics and take mock exams.',
    headlineHigh: 'Almost there: take mock exam after mock exam to secure 41/50.',
    ready: 'You’re ready: book your official theory test!',
  },
};

export function studyPlan({ readiness, ready, examsTaken, toReview, themes, lang = 'fr', days = 7 }) {
  const t = PLAN_TEXT[lang] ?? PLAN_TEXT.fr;
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  // Thèmes à travailler : jamais vus d'abord, puis les plus faibles (< 80 %).
  const unseen = themes.filter((th) => th.rate == null);
  const weak = themes.filter((th) => th.rate != null && th.rate < 80).sort((a, b) => a.rate - b.rate);
  const queue = [...weak, ...unseen];
  const examEvery = readiness >= 70 ? 1 : readiness >= 40 ? 2 : 3;
  const plan = [];
  let reviewLeft = toReview;
  for (let day = 1; day <= days; day += 1) {
    const tasks = [];
    if (reviewLeft > 0 && day % 2 === 1) {
      tasks.push({ type: 'review', label: fill(t.review, { count: reviewLeft }) });
      reviewLeft = Math.max(0, reviewLeft - 10);
    }
    const theme = queue.length ? queue[(day - 1) % queue.length] : null;
    if (theme) {
      const label = theme.themeLabel ?? localizeTheme(theme.theme, lang);
      tasks.push({ type: 'practice', theme: theme.theme, label: fill(theme.rate == null ? t.discover : t.practice, { theme: label }) });
      if (day === 2 || day === 5) tasks.push({ type: 'coach', theme: theme.theme, themeLabel: label, label: fill(t.coach, { theme: label }) });
    }
    if (day % examEvery === 0 || day === days) tasks.push({ type: 'exam', label: t.exam });
    if (!tasks.length) tasks.push({ type: 'rest', label: t.rest });
    plan.push({ day, tasks });
  }
  const headline = ready ? t.ready : readiness >= 70 ? t.headlineHigh : readiness >= 40 || examsTaken ? t.headlineMid : t.headlineLow;
  return { readiness, ready, headline, days: plan };
}
