import { PERIOD_DAYS, PLANS_BY_ID, TARGET_HOURS } from './data/plans.js';
import { PERMITS } from './data/permits.js';
import { skillsSummary } from './progress.js';
import { journeyText } from './data/journeyText.js';
import { freeTrackProgress } from './freeTrack.js';
import { localizePlan } from './i18n.js';

const DAY_MS = 24 * 3600 * 1000;
const COUNTED_STATUSES = ['pending', 'accepted', 'en_route', 'in_progress', 'completed'];

const toIso = (value) => (value && !value.includes('T') ? `${value.replace(' ', 'T')}Z` : value);

export const addDays = (iso, days) => new Date(Date.parse(iso) + days * DAY_MS).toISOString();

// Renouvelle (ou clôture) l'abonnement si sa période est échue.
// Le renouvellement est calculé à la lecture : pas besoin de tâche planifiée.
// Un changement de formule demandé en cours de mois prend effet au renouvellement :
// les heures incluses d'une formule supérieure ne sont pas données avant d'être payées.
async function refreshPeriod(db, sub, now = Date.now()) {
  let { current_period_start: start, current_period_end: end, plan_id: planId, pending_plan_id: pending } = sub;
  let status = sub.status;
  while (status === 'active' && Date.parse(end) <= now) {
    if (sub.license_obtained_at) {
      status = 'completed';
    } else if (sub.cancel_at_period_end) {
      status = 'cancelled';
    } else {
      start = end;
      end = addDays(end, PERIOD_DAYS);
      if (pending) {
        planId = pending;
        pending = null;
      }
    }
  }
  if (status !== sub.status || start !== sub.current_period_start) {
    // Condition sur la période lue : deux lectures simultanées ne renouvellent qu'une fois.
    await db.run(
      `UPDATE subscriptions SET status = ?, current_period_start = ?, current_period_end = ?, plan_id = ?,
         pending_plan_id = ?
       WHERE id = ? AND current_period_start = ?`,
      status,
      start,
      end,
      planId,
      pending ?? null,
      sub.id,
      sub.current_period_start,
    );
    return {
      ...sub,
      status,
      current_period_start: start,
      current_period_end: end,
      plan_id: planId,
      pending_plan_id: pending ?? null,
    };
  }
  return sub;
}

export async function getActiveSubscription(db, studentId) {
  const sub = await db.get(
    `SELECT * FROM subscriptions WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`,
    studentId,
  );
  if (!sub) return null;
  const fresh = await refreshPeriod(db, sub);
  return fresh.status === 'active' ? fresh : null;
}

export async function usedMinutes(db, sub) {
  const { minutes } = await db.get(
    `SELECT COALESCE(SUM(covered_minutes), 0) AS minutes FROM bookings
       WHERE subscription_id = ? AND subscription_period = ?
         AND status IN (${COUNTED_STATUSES.map(() => '?').join(',')})`,
    sub.id,
    sub.current_period_start,
    ...COUNTED_STATUSES,
  );
  return minutes;
}

// Calcule ce que l'élève paie pour une leçon, en tenant compte de son pack.
export async function quoteLesson(db, studentId, category, durationMin, hourlyRateCents) {
  const lessonCents = Math.round((hourlyRateCents * durationMin) / 60);
  const sub = await getActiveSubscription(db, studentId);
  if (!sub || sub.category !== category) {
    return { lessonCents, studentPriceCents: lessonCents, coveredMinutes: 0, subscription: null };
  }
  const plan = PLANS_BY_ID.get(sub.plan_id);
  const remaining = Math.max(0, plan.includedMinutes - (await usedMinutes(db, sub)));
  const coveredMinutes = Math.min(remaining, durationMin);
  const extraCents = Math.round((hourlyRateCents * (durationMin - coveredMinutes)) / 60);
  return {
    lessonCents,
    studentPriceCents: Math.round(extraCents * (1 - plan.discount)),
    coveredMinutes,
    subscription: sub,
  };
}

export async function hasActiveSubscription(db, studentId) {
  return Boolean(await getActiveSubscription(db, studentId));
}

export async function buildJourney(db, sub, lang = 'fr') {
  const text = journeyText(lang);
  // Pack filière libre : parcours avec guide (permis provisoire M36, carnet de bord, délais régionaux).
  if (PLANS_BY_ID.get(sub.plan_id)?.freeTrack) {
    const ft = await freeTrackProgress(db, sub.student_id, lang);
    return {
      category: sub.category,
      theoryCategory: PERMITS.find((p) => p.code === sub.category)?.theoryCategory ?? sub.category,
      freeTrack: true,
      region: ft.region,
      km: ft.totals.km,
      kmTarget: ft.kmTarget,
      eligibleFrom: ft.eligibleFrom,
      steps: [{ id: 'pack', label: text('pack'), done: true, date: toIso(sub.created_at) }, ...ft.steps],
      nextStep: ft.nextStep,
      coach: null,
    };
  }
  const permit = PERMITS.find((p) => p.code === sub.category);
  const theoryCategory = permit?.theoryCategory ?? sub.category;
  const bestExam = await db.get(
    `SELECT score, max_score, passed, created_at FROM theory_attempts
       WHERE user_id = ? AND category = ? AND mode = 'exam'
       ORDER BY passed DESC, CAST(score AS REAL) / max_score DESC LIMIT 1`,
    sub.student_id,
    theoryCategory,
  );
  const driving = await db.get(
    `SELECT COUNT(*) AS lessons, COALESCE(SUM(duration_min), 0) AS minutes FROM bookings
       WHERE student_id = ? AND category = ? AND status = 'completed'`,
    sub.student_id,
    sub.category,
  );
  const coach = await db.get(
    `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, COUNT(*) AS lessons
       FROM bookings b JOIN users u ON u.id = b.instructor_id
       WHERE b.student_id = ? AND b.category = ? AND b.status = 'completed'
       GROUP BY u.id ORDER BY lessons DESC LIMIT 1`,
    sub.student_id,
    sub.category,
  );

  const skills = await skillsSummary(db, sub.student_id, sub.category);
  const targetHours = TARGET_HOURS[sub.category] ?? 20;
  const hours = Math.round((driving.minutes / 60) * 10) / 10;
  const theoryPassed = Boolean(bestExam?.passed);

  const steps = [
    { id: 'pack', label: text('pack'), done: true, date: toIso(sub.created_at) },
    {
      id: 'theory',
      label: text('theory'),
      done: theoryPassed,
      date: theoryPassed ? toIso(bestExam.created_at) : null,
      detail: bestExam ? text('theoryBest', { score: bestExam.score, max: bestExam.max_score }) : text('theoryNone'),
    },
    {
      id: 'provisional',
      label: text('provisional'),
      done: Boolean(sub.provisional_at),
      date: sub.provisional_at,
      declarable: true,
    },
    {
      id: 'driving',
      label: text('driving', { target: targetHours }),
      done: hours >= targetHours,
      detail: text('drivingDetail', { hours, target: targetHours, lessons: driving.lessons }),
      progress: Math.min(1, hours / targetHours),
    },
    {
      id: 'skills',
      label: text('skills'),
      // Prêt pour l'examen : au moins 80 % des compétences notées « maîtrisé ».
      done: skills.mastered >= Math.ceil(skills.total * 0.8),
      detail: text('skillsDetail', { mastered: skills.mastered, total: skills.total }),
      progress: skills.progress,
    },
    {
      id: 'exam',
      label: text('exam'),
      done: Boolean(sub.exam_date),
      date: sub.exam_date,
      declarable: true,
    },
    {
      id: 'license',
      label: text('license'),
      done: Boolean(sub.license_obtained_at),
      date: sub.license_obtained_at,
      declarable: true,
    },
  ];

  const next = steps.find((s) => !s.done);

  return {
    category: sub.category,
    theoryCategory,
    hours,
    targetHours,
    steps,
    nextStep: next ? { id: next.id, advice: text.advice(next.id) } : null,
    coach: coach ?? null,
  };
}

export async function serializeSubscription(db, sub, lang = 'fr') {
  const plan = localizePlan(PLANS_BY_ID.get(sub.plan_id), lang);
  const used = await usedMinutes(db, sub);
  return {
    id: sub.id,
    plan,
    category: sub.category,
    status: sub.status,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    pendingPlan: sub.pending_plan_id ? localizePlan(PLANS_BY_ID.get(sub.pending_plan_id), lang) : null,
    licenseObtained: Boolean(sub.license_obtained_at),
    includedMinutes: plan.includedMinutes,
    usedMinutes: used,
    remainingMinutes: Math.max(0, plan.includedMinutes - used),
    createdAt: toIso(sub.created_at),
  };
}
