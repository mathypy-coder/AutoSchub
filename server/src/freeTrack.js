// Filière libre : profil, carnet de bord et progression vers l'examen pratique.
import { REGION_RULES } from './data/freeTrack.js';
import { journeyText } from './data/journeyText.js';
import { PERMITS } from './data/permits.js';

const DAY_MS = 24 * 3600 * 1000;
export const ROUTES_GOAL = 3;

export async function getFreeTrackProfile(db, userId) {
  const row = await db.get('SELECT * FROM free_track WHERE user_id = ?', userId);
  return {
    region: row?.region ?? null,
    category: row?.category ?? 'B',
    examCenterId: row?.exam_center_id ?? null,
    provisionalAt: row?.provisional_at ?? null,
    guideSessionAt: row?.guide_session_at ?? null,
    examDate: row?.exam_date ?? null,
    licenseAt: row?.license_at ?? null,
    guides: row ? JSON.parse(row.guides || '[]') : [],
  };
}

const COLUMNS = {
  region: 'region',
  category: 'category',
  examCenterId: 'exam_center_id',
  provisionalAt: 'provisional_at',
  guideSessionAt: 'guide_session_at',
  examDate: 'exam_date',
  licenseAt: 'license_at',
  guides: 'guides',
};

// Crée ou met à jour le profil (seuls les champs fournis changent).
export async function saveFreeTrackProfile(db, userId, changes) {
  const entries = Object.entries(changes).filter(([k, v]) => COLUMNS[k] && v !== undefined);
  if (!entries.length) return;
  const cols = entries.map(([k]) => COLUMNS[k]);
  const values = entries.map(([k, v]) => (k === 'guides' ? JSON.stringify(v) : v));
  await db.run(
    `INSERT INTO free_track (user_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})
     ON CONFLICT (user_id) DO UPDATE SET ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}, updated_at = datetime('now')`,
    userId,
    ...values,
  );
}

export async function roadbookTotals(db, userId) {
  const rows = await db.all(
    'SELECT duration_min, distance_km, conditions, route_id FROM roadbook_entries WHERE user_id = ?',
    userId,
  );
  const byCondition = {};
  const routes = new Set();
  let km = 0;
  let minutes = 0;
  for (const r of rows) {
    km += r.distance_km;
    minutes += r.duration_min;
    for (const c of JSON.parse(r.conditions || '[]')) byCondition[c] = (byCondition[c] ?? 0) + 1;
    if (r.route_id) routes.add(r.route_id);
  }
  return { entries: rows.length, km: Math.round(km), minutes, byCondition, routes: [...routes] };
}

// Mois entiers écoulés entre deux dates (AAAA-MM-JJ).
export function monthsBetween(fromIso, to = new Date()) {
  const from = new Date(`${fromIso}T00:00:00Z`);
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function addMonths(isoDate, months) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Délai minimum avant l'examen, selon la Région (Bruxelles : réduit avec assez d'heures d'auto-école).
export function minMonthsFor(rules, lessonHours) {
  if (rules.minMonthsWithLessons && lessonHours >= rules.lessonHoursForShorterWait) return rules.minMonthsWithLessons;
  return rules.minMonths;
}

// Étapes de la filière libre, de la théorie au permis, avec conseil sur la prochaine étape.
export async function freeTrackProgress(db, userId, lang = 'fr', now = new Date()) {
  const text = journeyText(lang);
  const profile = await getFreeTrackProfile(db, userId);
  const permit = PERMITS.find((p) => p.code === profile.category);
  const theoryCategory = permit?.theoryCategory ?? 'B';
  const rules = REGION_RULES[profile.region] ?? null;
  const totals = await roadbookTotals(db, userId);

  const bestExam = await db.get(
    `SELECT score, max_score, passed, created_at FROM theory_attempts
       WHERE user_id = ? AND category = ? AND mode = 'exam'
       ORDER BY passed DESC, CAST(score AS REAL) / max_score DESC LIMIT 1`,
    userId,
    theoryCategory,
  );
  const lessons = await db.get(
    `SELECT COUNT(*) AS n, COALESCE(SUM(duration_min), 0) AS minutes FROM bookings
       WHERE student_id = ? AND category = ? AND status = 'completed'`,
    userId,
    profile.category,
  );
  const lessonHours = lessons.minutes / 60;

  const kmTarget = rules?.kmTarget ?? 1500;
  const minMonths = rules ? minMonthsFor(rules, lessonHours) : null;
  const elapsed = profile.provisionalAt ? monthsBetween(profile.provisionalAt, now) : 0;
  const eligibleFrom = profile.provisionalAt && minMonths != null ? addMonths(profile.provisionalAt, minMonths) : null;
  const centerRoutes = profile.examCenterId
    ? totals.routes.filter((id) => id.startsWith(`${profile.examCenterId}:`)).length
    : totals.routes.length;

  const steps = [
    {
      id: 'theory',
      label: text('theory'),
      done: Boolean(bestExam?.passed),
      date: bestExam?.passed ? bestExam.created_at : null,
      detail: bestExam ? text('theoryBest', { score: bestExam.score, max: bestExam.max_score }) : text('theoryNone'),
    },
    {
      id: 'provisional',
      label: text('provisionalM36'),
      done: Boolean(profile.provisionalAt),
      date: profile.provisionalAt,
      declarable: true,
    },
    {
      id: 'guide',
      label: `${rules ? rules.guideTrainingLabel[lang] ?? rules.guideTrainingLabel.fr : text('guideOptional')}${
        rules && !rules.guideTraining.required ? ` ${text('guideOptional')}` : ''
      }`,
      done: Boolean(profile.guideSessionAt) || (rules ? !rules.guideTraining.required && totals.entries > 0 : false),
      date: profile.guideSessionAt,
      declarable: true,
      optional: rules ? !rules.guideTraining.required : false,
    },
    {
      id: 'roadbook',
      label: text('roadbook', { target: kmTarget.toLocaleString(lang === 'en' ? 'en-GB' : `${lang}-BE`) }),
      done: totals.km >= kmTarget,
      detail: text('roadbookDetail', { km: totals.km, target: kmTarget, entries: totals.entries }),
      progress: Math.min(1, totals.km / kmTarget),
    },
    {
      id: 'duration',
      label: text('duration', { months: minMonths ?? '…' }),
      done: Boolean(eligibleFrom) && eligibleFrom <= now.toISOString().slice(0, 10),
      detail: eligibleFrom
        ? text('durationDetail', { elapsed: Math.min(elapsed, minMonths), months: minMonths, date: eligibleFrom })
        : text('durationNoProvisional'),
      progress: minMonths ? Math.min(1, elapsed / minMonths) : 0,
    },
    {
      id: 'routes',
      label: text('routes'),
      done: centerRoutes >= ROUTES_GOAL,
      detail: text('routesDetail', { done: Math.min(centerRoutes, ROUTES_GOAL), goal: ROUTES_GOAL }),
      progress: Math.min(1, centerRoutes / ROUTES_GOAL),
    },
    {
      id: 'checkLesson',
      label: text('checkLesson'),
      done: lessons.n > 0,
      detail: text('checkLessonDetail', { lessons: lessons.n }),
      optional: true,
    },
    { id: 'exam', label: text('exam'), done: Boolean(profile.examDate), date: profile.examDate, declarable: true },
    { id: 'license', label: text('license'), done: Boolean(profile.licenseAt), date: profile.licenseAt, declarable: true },
  ];

  // Les étapes conseillées (optional) ne bloquent pas le conseil sur la prochaine étape obligatoire.
  const next = !rules ? { id: 'region' } : (steps.find((s) => !s.done && !s.optional) ?? steps.find((s) => !s.done));
  const doneCount = steps.filter((s) => s.done).length;
  return {
    profile,
    region: rules ? rules.id : null,
    kmTarget,
    minMonths,
    eligibleFrom,
    totals,
    lessons: { count: lessons.n, hours: Math.round(lessonHours * 10) / 10 },
    steps,
    progress: Math.round((doneCount / steps.length) * 100),
    nextStep: next ? { id: next.id, advice: text.advice(next.id) ?? null } : null,
  };
}

// Jours restants avant une date (AAAA-MM-JJ), utile pour l'examen.
export const daysUntil = (isoDate, now = new Date()) =>
  isoDate ? Math.ceil((Date.parse(`${isoDate}T00:00:00Z`) - now.getTime()) / DAY_MS) : null;
