import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { createSignedToken, readToken, requireAuth } from '../auth.js';
import { EXAM_RULES, THEORY_CATEGORIES } from '../data/permits.js';
import { QUESTIONS } from '../data/questions.js';
import { FREE_EXAMS_PER_WEEK } from '../data/plans.js';
import { HttpError } from '../errors.js';
import { hasActiveSubscription } from '../subscriptions.js';

const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
const THEORY_CODES = THEORY_CATEGORIES.map((c) => c.code);

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Marge pour l'envoi des réponses après la fin du chrono (réseau, démarrage à froid…).
const SUBMIT_GRACE_MS = 2 * 60 * 1000;
const PRACTICE_TTL_MS = 6 * 3600 * 1000;
const MAX_PRACTICE_QUESTIONS = 50;

const forCategory = (category) => QUESTIONS.filter((q) => q.categories.includes(category));

// Barème belge : 1 point par faute, 5 points par faute grave.
export function gradeAnswers(questions, answers) {
  let score = questions.length;
  let correct = 0;
  let graveFaults = 0;
  const corrections = questions.map((q) => {
    const given = answers[q.id];
    const isCorrect = given === q.answer;
    if (isCorrect) correct += 1;
    else {
      score -= q.grave ? EXAM_RULES.gravePenalty : 1;
      if (q.grave) graveFaults += 1;
    }
    return {
      id: q.id,
      question: q.question,
      choices: q.choices,
      given: Number.isInteger(given) ? given : null,
      answer: q.answer,
      correct: isCorrect,
      grave: q.grave,
      theme: q.theme,
      explanation: q.explanation,
    };
  });
  score = Math.max(0, score);
  const passMark = Math.ceil(questions.length * EXAM_RULES.passRatio);
  return {
    score,
    maxScore: questions.length,
    passMark,
    passed: score >= passMark,
    correct,
    total: questions.length,
    graveFaults,
    corrections,
  };
}

// Sans pack : quelques examens blancs gratuits par semaine. Avec un pack : illimité.
async function assertExamAllowed(db, user) {
  if (!user) throw new HttpError(401, 'Connecte-toi pour passer un examen blanc.');
  if (user.role !== 'student' || (await hasActiveSubscription(db, user.id))) return;
  const { n } = await db.get(
    `SELECT COUNT(*) AS n FROM theory_attempts
       WHERE user_id = ? AND mode = 'exam' AND created_at >= datetime('now', '-7 days')`,
    user.id,
  );
  if (n >= FREE_EXAMS_PER_WEEK) {
    throw new HttpError(
      402,
      `Tu as utilisé tes ${FREE_EXAMS_PER_WEEK} examens blancs gratuits de la semaine. Passe à un pack pour un accès illimité.`,
    );
  }
}

export function theoryRoutes(db) {
  const router = Router();

  router.get('/categories', (_req, res) => {
    res.json({
      rules: EXAM_RULES,
      categories: THEORY_CATEGORIES.map((c) => {
        const questions = forCategory(c.code);
        return { ...c, questionCount: questions.length, themes: [...new Set(questions.map((q) => q.theme))] };
      }),
    });
  });

  router.get('/quiz', async (req, res) => {
    const { category, theme } = req.query;
    const mode = req.query.mode === 'exam' ? 'exam' : 'practice';
    if (!THEORY_CODES.includes(category)) throw new HttpError(400, 'Catégorie théorique invalide.');
    if (mode === 'exam') await assertExamAllowed(db, req.user);

    let pool = forCategory(category);
    if (mode === 'practice' && theme) pool = pool.filter((q) => q.theme === theme);
    if (!pool.length) throw new HttpError(404, 'Aucune question pour cette sélection.');

    const count =
      mode === 'exam'
        ? EXAM_RULES.questionCount
        : Math.min(MAX_PRACTICE_QUESTIONS, Math.max(1, Math.trunc(Number(req.query.count)) || 10));
    const picked = shuffle(pool).slice(0, count);
    const durationMinutes = mode === 'exam' ? EXAM_RULES.durationMinutes : null;

    // Le quiz est signé par le serveur : la correction ne porte que sur ces questions,
    // pour cet utilisateur, une seule fois et dans le temps imparti.
    const quizToken = createSignedToken({
      typ: 'quiz',
      jti: randomUUID(),
      uid: req.user?.id ?? null,
      category,
      mode,
      theme: mode === 'practice' ? (theme ?? null) : null,
      ids: picked.map((q) => q.id),
      exp: Date.now() + (durationMinutes ? durationMinutes * 60000 + SUBMIT_GRACE_MS : PRACTICE_TTL_MS),
    });

    res.json({
      category,
      mode,
      theme: mode === 'practice' ? (theme ?? null) : null,
      durationMinutes,
      quizToken,
      // En examen, la gravité des questions n'est révélée qu'à la correction.
      questions: picked.map(({ id, theme: t, question, choices, grave }) => ({
        id,
        theme: t,
        question,
        choices,
        ...(mode === 'practice' ? { grave } : {}),
      })),
    });
  });

  router.post('/submit', async (req, res) => {
    const quiz = readToken(req.body?.quizToken, 'quiz');
    if (!quiz) throw new HttpError(400, 'Quiz expiré ou invalide. Relance un nouveau quiz.');
    if (quiz.uid !== (req.user?.id ?? null)) throw new HttpError(403, 'Ce quiz a été délivré à un autre compte.');
    const questions = quiz.ids.map((id) => QUESTIONS_BY_ID.get(id));
    if (!questions.length || questions.some((q) => !q)) throw new HttpError(400, 'Questions invalides.');
    const raw = req.body?.answers;
    const answers = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

    // Quota revérifié à la correction (plusieurs quiz ont pu être ouverts avant d'en rendre un).
    if (quiz.mode === 'exam') await assertExamAllowed(db, req.user);

    const result = gradeAnswers(questions, answers);
    if (req.user) {
      try {
        await db.run(
          `INSERT INTO theory_attempts (user_id, category, mode, theme, score, max_score, correct, total, grave_faults,
             passed, quiz_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          req.user.id,
          quiz.category,
          quiz.mode,
          quiz.theme,
          result.score,
          result.maxScore,
          result.correct,
          result.total,
          result.graveFaults,
          result.passed ? 1 : 0,
          quiz.jti,
        );
      } catch (err) {
        if (/UNIQUE/i.test(String(err?.message))) throw new HttpError(409, 'Ce quiz a déjà été corrigé.');
        throw err;
      }
    }
    res.json(result);
  });

  router.get('/history', requireAuth(), async (req, res) => {
    const attempts = (
      await db.all(
        `SELECT id, category, mode, theme, score, max_score AS maxScore, correct, total,
                grave_faults AS graveFaults, passed, created_at AS createdAt
         FROM theory_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
        req.user.id,
      )
    ).map((a) => ({ ...a, passed: Boolean(a.passed) }));
    const { n: examsThisWeek } = await db.get(
      `SELECT COUNT(*) AS n FROM theory_attempts
         WHERE user_id = ? AND mode = 'exam' AND created_at >= datetime('now', '-7 days')`,
      req.user.id,
    );
    const unlimited = req.user.role !== 'student' || (await hasActiveSubscription(db, req.user.id));
    res.json({
      attempts,
      freeExamsLeft: unlimited ? null : Math.max(0, FREE_EXAMS_PER_WEEK - examsThisWeek),
    });
  });

  return router;
}
