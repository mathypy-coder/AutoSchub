import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { EXAM_RULES, THEORY_CATEGORIES } from '../data/permits.js';
import { QUESTIONS } from '../data/questions.js';
import { HttpError } from '../errors.js';

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

  router.get('/quiz', (req, res) => {
    const { category, theme } = req.query;
    const mode = req.query.mode === 'exam' ? 'exam' : 'practice';
    if (!THEORY_CODES.includes(category)) throw new HttpError(400, 'Catégorie théorique invalide.');

    let pool = forCategory(category);
    if (mode === 'practice' && theme) pool = pool.filter((q) => q.theme === theme);
    if (!pool.length) throw new HttpError(404, 'Aucune question pour cette sélection.');

    const count = mode === 'exam' ? EXAM_RULES.questionCount : Number(req.query.count) || 10;
    const questions = shuffle(pool)
      .slice(0, count)
      .map(({ id, theme: t, question, choices, grave }) => ({ id, theme: t, question, choices, grave }));

    res.json({
      category,
      mode,
      theme: mode === 'practice' ? (theme ?? null) : null,
      durationMinutes: mode === 'exam' ? EXAM_RULES.durationMinutes : null,
      questions,
    });
  });

  router.post('/submit', (req, res) => {
    const { category, mode = 'practice', theme = null, answers = {} } = req.body ?? {};
    if (!THEORY_CODES.includes(category)) throw new HttpError(400, 'Catégorie théorique invalide.');
    const ids = Object.keys(answers);
    if (Array.isArray(req.body?.questionIds)) ids.splice(0, ids.length, ...req.body.questionIds);
    const questions = ids.map((id) => QUESTIONS_BY_ID.get(id));
    if (!questions.length || questions.some((q) => !q || !q.categories.includes(category))) {
      throw new HttpError(400, 'Questions invalides pour cette catégorie.');
    }

    const result = gradeAnswers(questions, answers);
    if (req.user) {
      db.prepare(
        `INSERT INTO theory_attempts (user_id, category, mode, theme, score, max_score, correct, total, grave_faults, passed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        req.user.id,
        category,
        mode === 'exam' ? 'exam' : 'practice',
        theme,
        result.score,
        result.maxScore,
        result.correct,
        result.total,
        result.graveFaults,
        result.passed ? 1 : 0,
      );
    }
    res.json(result);
  });

  router.get('/history', requireAuth(), (req, res) => {
    const attempts = db
      .prepare(
        `SELECT id, category, mode, theme, score, max_score AS maxScore, correct, total,
                grave_faults AS graveFaults, passed, created_at AS createdAt
         FROM theory_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
      )
      .all(req.user.id)
      .map((a) => ({ ...a, passed: Boolean(a.passed) }));
    res.json({ attempts });
  });

  return router;
}
