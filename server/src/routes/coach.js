import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { aiEnabled, coachChat, coachExplain, sanitizeMessages, studyPlan } from '../coach.js';
import { THEORY_CATEGORIES } from '../data/permits.js';
import { QUESTIONS } from '../data/questions.js';
import { HttpError } from '../errors.js';
import { hasActiveSubscription } from '../subscriptions.js';
import { theoryInsights } from './theory.js';

const THEORY_CODES = THEORY_CATEGORIES.map((c) => c.code);
const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

// Questions au coach IA par jour : sans pack / avec un pack.
export const COACH_DAILY_FREE = 10;
export const COACH_DAILY_PACK = 60;

const today = () => new Date().toISOString().slice(0, 10);

export function coachRoutes(db) {
  const router = Router();
  router.use(requireAuth());

  const quota = async (user) => {
    const limit =
      user.role === 'instructor' || (await hasActiveSubscription(db, user.id)) ? COACH_DAILY_PACK : COACH_DAILY_FREE;
    const row = await db.get('SELECT count FROM coach_usage WHERE user_id = ? AND day = ?', user.id, today());
    const used = row?.count ?? 0;
    return { limit, used, remaining: Math.max(0, limit - used) };
  };

  // Réserve une question dans le quota du jour (atomique : pas de dépassement en cas de clics simultanés).
  const consume = async (user) => {
    const { limit } = await quota(user);
    const result = await db.run(
      `INSERT INTO coach_usage (user_id, day, count) VALUES (?, ?, 1)
       ON CONFLICT (user_id, day) DO UPDATE SET count = count + 1 WHERE count < ?`,
      user.id,
      today(),
      limit,
    );
    if (!result.changes) throw new HttpError(429, 'Tu as atteint le nombre de questions au coach pour aujourd’hui. Reviens demain ou passe à un pack.');
  };

  const category = (req) => {
    const value = req.body?.category ?? req.query.category ?? 'B';
    if (!THEORY_CODES.includes(value)) throw new HttpError(400, 'Catégorie théorique invalide.');
    return value;
  };

  // Profil d'apprentissage résumé pour personnaliser les réponses (thèmes faibles, préparation).
  const profileOf = async (req, cat) => {
    const insights = await theoryInsights(db, req.user.id, cat, 'en');
    const weak = insights.themes.filter((t) => t.rate != null && t.rate < 70).map((t) => `${t.themeLabel} (${t.rate}%)`);
    return `readiness ${insights.readiness}/100, ${insights.examsTaken} recent mock exam(s), ${insights.toReview} question(s) to review${
      weak.length ? `, weak topics: ${weak.slice(0, 4).join(', ')}` : ''
    }.`;
  };

  router.get('/status', async (req, res) => {
    res.json({ ai: aiEnabled(), quota: await quota(req.user) });
  });

  router.post('/chat', async (req, res) => {
    const cat = category(req);
    const messages = sanitizeMessages(req.body?.messages);
    if (!messages.length) throw new HttpError(400, 'Écris ta question au coach.');
    await consume(req.user);
    const answer = await coachChat({ messages, category: cat, lang: req.lang, profile: await profileOf(req, cat) });
    res.json({ ...answer, quota: await quota(req.user) });
  });

  router.post('/explain', async (req, res) => {
    const cat = category(req);
    const question = QUESTIONS_BY_ID.get(req.body?.questionId);
    if (!question) throw new HttpError(404, 'Question introuvable.');
    await consume(req.user);
    const given = Number.isInteger(req.body?.given) ? req.body.given : null;
    const answer = await coachExplain({ question, given, category: cat, lang: req.lang, profile: await profileOf(req, cat) });
    res.json({ ...answer, quota: await quota(req.user) });
  });

  // Plan de révision sur 7 jours à partir de la progression (ne consomme pas de quota).
  router.get('/plan', async (req, res) => {
    const cat = category(req);
    const insights = await theoryInsights(db, req.user.id, cat, req.lang);
    res.json({ category: cat, ...studyPlan({ ...insights, lang: req.lang }) });
  });

  return router;
}
