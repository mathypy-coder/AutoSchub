import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { createSignedToken, readToken, requireAuth } from '../auth.js';
import { EXAM_RULES, THEORY_CATEGORIES } from '../data/permits.js';
import { QUESTIONS } from '../data/questions.js';
import { FREE_EXAMS_PER_WEEK } from '../data/plans.js';
import { HttpError } from '../errors.js';
import { localizeQuestion, localizeTheme, tr } from '../i18n.js';
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
      themeLabel: q.themeLabel ?? q.theme,
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

// Une question ratée revient en révision jusqu'à 2 bonnes réponses d'affilée (répétition espacée).
const REVIEW_STREAK_TO_CLEAR = 2;

async function recordLearning(db, userId, category, corrections) {
  await db.transaction(async (tx) => {
    for (const c of corrections) {
      await tx.run(
        `INSERT INTO theory_theme_stats (user_id, category, theme, answered, correct) VALUES (?, ?, ?, 1, ?)
         ON CONFLICT (user_id, category, theme) DO UPDATE SET answered = answered + 1, correct = correct + excluded.correct`,
        userId,
        category,
        c.theme,
        c.correct ? 1 : 0,
      );
      if (!c.correct) {
        await tx.run(
          `INSERT INTO theory_mistakes (user_id, question_id, category, wrong_count, streak) VALUES (?, ?, ?, 1, 0)
           ON CONFLICT (user_id, question_id, category)
             DO UPDATE SET wrong_count = wrong_count + 1, streak = 0, updated_at = datetime('now')`,
          userId,
          c.id,
          category,
        );
      } else {
        await tx.run(
          `UPDATE theory_mistakes SET streak = streak + 1, updated_at = datetime('now')
             WHERE user_id = ? AND question_id = ? AND category = ?`,
          userId,
          c.id,
          category,
        );
      }
    }
    await tx.run(
      'DELETE FROM theory_mistakes WHERE user_id = ? AND category = ? AND streak >= ?',
      userId,
      category,
      REVIEW_STREAK_TO_CLEAR,
    );
  });
}

// Score de préparation (0–100) : 70 % moyenne des 3 derniers examens blancs,
// 30 % part des thèmes maîtrisés (≥ 80 % de bonnes réponses sur au moins 3 questions).
export function readinessScore(recentExams, themeStats, allThemes) {
  const examAvg = recentExams.length
    ? recentExams.reduce((sum, e) => sum + e.score / e.max_score, 0) / recentExams.length
    : 0;
  const masteredThemes = themeStats.filter((t) => t.answered >= 3 && t.correct / t.answered >= 0.8).length;
  const themeShare = allThemes.length ? masteredThemes / allThemes.length : 0;
  return Math.round(100 * (0.7 * examAvg + 0.3 * themeShare));
}


// Préparation à l'examen théorique d'un élève (utilisé aussi par le coach IA).
export async function theoryInsights(db, userId, category, lang = 'fr') {
  const allThemes = [...new Set(forCategory(category).map((q) => q.theme))];
  const themeStats = await db.all(
    'SELECT theme, answered, correct FROM theory_theme_stats WHERE user_id = ? AND category = ?',
    userId,
    category,
  );
  const recentExams = await db.all(
    `SELECT score, max_score FROM theory_attempts WHERE user_id = ? AND category = ? AND mode = 'exam'
       ORDER BY id DESC LIMIT 3`,
    userId,
    category,
  );
  const { n: toReview } = await db.get(
    'SELECT COUNT(*) AS n FROM theory_mistakes WHERE user_id = ? AND category = ?',
    userId,
    category,
  );
  const byTheme = new Map(themeStats.map((t) => [t.theme, t]));
  const readiness = readinessScore(recentExams, themeStats, allThemes);
  return {
    category,
    readiness,
    ready: readiness >= 85 && recentExams.length >= 2,
    examsTaken: recentExams.length,
    toReview,
    themes: allThemes
      .map((theme) => {
        const t = byTheme.get(theme);
        return {
          theme,
          themeLabel: localizeTheme(theme, lang),
          answered: t?.answered ?? 0,
          rate: t?.answered ? Math.round((t.correct / t.answered) * 100) : null,
        };
      })
      .sort((a, b) => (a.rate ?? -1) - (b.rate ?? -1)),
  };
}

export function theoryRoutes(db) {
  const router = Router();

  router.get('/categories', (req, res) => {
    res.json({
      rules: EXAM_RULES,
      categories: THEORY_CATEGORIES.map((c) => {
        const questions = forCategory(c.code);
        const themes = [...new Set(questions.map((q) => q.theme))];
        return {
          ...c,
          label: tr(req.lang, 'theoryCategories', c.code, c.label),
          questionCount: questions.length,
          themes,
          themeLabels: Object.fromEntries(themes.map((t) => [t, localizeTheme(t, req.lang)])),
        };
      }),
    });
  });

  router.get('/quiz', async (req, res) => {
    const { category, theme } = req.query;
    const mode = ['exam', 'review'].includes(req.query.mode) ? req.query.mode : 'practice';
    if (!THEORY_CODES.includes(category)) throw new HttpError(400, 'Catégorie théorique invalide.');
    if (mode === 'exam') await assertExamAllowed(db, req.user);

    let pool = forCategory(category);
    if (mode === 'practice' && theme) pool = pool.filter((q) => q.theme === theme);
    if (mode === 'review') {
      // Révision espacée : les questions ratées, les plus souvent ratées d'abord.
      if (!req.user) throw new HttpError(401, 'Connecte-toi pour revoir tes erreurs.');
      const due = await db.all(
        `SELECT question_id FROM theory_mistakes WHERE user_id = ? AND category = ?
           ORDER BY wrong_count DESC, updated_at ASC LIMIT ?`,
        req.user.id,
        category,
        MAX_PRACTICE_QUESTIONS,
      );
      const wanted = new Set(due.map((d) => d.question_id));
      pool = pool.filter((q) => wanted.has(q.id));
      if (!pool.length) throw new HttpError(404, 'Aucune erreur à revoir : bravo ! 🎉');
    }
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
      questions: picked.map((q) => localizeQuestion(q, req.lang)).map(({ id, theme: t, themeLabel, question, choices, grave }) => ({
        id,
        theme: t,
        themeLabel,
        question,
        choices,
        ...(mode !== 'exam' ? { grave } : {}),
      })),
    });
  });

  router.post('/submit', async (req, res) => {
    const quiz = readToken(req.body?.quizToken, 'quiz');
    if (!quiz) throw new HttpError(400, 'Quiz expiré ou invalide. Relance un nouveau quiz.');
    if (quiz.uid !== (req.user?.id ?? null)) throw new HttpError(403, 'Ce quiz a été délivré à un autre compte.');
    const source = quiz.ids.map((id) => QUESTIONS_BY_ID.get(id));
    if (!source.length || source.some((q) => !q)) throw new HttpError(400, 'Questions invalides.');
    const questions = source.map((q) => localizeQuestion(q, req.lang));
    const raw = req.body?.answers;
    const answers = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

    // Quota revérifié à la correction (plusieurs quiz ont pu être ouverts avant d'en rendre un).
    if (quiz.mode === 'exam') await assertExamAllowed(db, req.user);

    const result = gradeAnswers(questions, answers);
    if (req.user) await recordLearning(db, req.user.id, quiz.category, result.corrections);
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

  // Tableau de bord d'apprentissage : préparation, thèmes forts/faibles, erreurs à revoir.
  router.get('/insights', requireAuth(), async (req, res) => {
    const { category } = req.query;
    if (!THEORY_CODES.includes(category)) throw new HttpError(400, 'Catégorie théorique invalide.');
    res.json(await theoryInsights(db, req.user.id, category, req.lang));
  });

  router.get('/history', requireAuth(), async (req, res) => {
    const attempts = (
      await db.all(
        `SELECT id, category, mode, theme, score, max_score AS maxScore, correct, total,
                grave_faults AS graveFaults, passed, created_at AS createdAt
         FROM theory_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
        req.user.id,
      )
    ).map((a) => ({ ...a, themeLabel: a.theme ? localizeTheme(a.theme, req.lang) : null, passed: Boolean(a.passed) }));
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
