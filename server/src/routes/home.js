import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { PERMITS } from '../data/permits.js';
import { PLANS_BY_ID, TARGET_HOURS } from '../data/plans.js';
import { freeTrackProgress } from '../freeTrack.js';
import { localizePlan } from '../i18n.js';
import { getActiveSubscription, usedMinutes } from '../subscriptions.js';
import { theoryInsights } from './theory.js';

const ACTIVE = ['pending', 'accepted', 'en_route', 'in_progress'];

// Tableau de bord de l'élève : sa « route vers le permis » en 6 étapes et la prochaine action à faire.
// Les libellés sont traduits côté app à partir des identifiants d'étape.
export function homeRoutes(db) {
  const router = Router();
  router.use(requireAuth('student'));

  router.get('/', async (req, res) => {
    const user = req.user;
    const sub = await getActiveSubscription(db, user.id);
    const plan = sub ? PLANS_BY_ID.get(sub.plan_id) : null;
    const category = user.goal_category ?? sub?.category ?? 'B';
    const permit = PERMITS.find((p) => p.code === category);
    const theoryCategory = permit?.theoryCategory ?? 'B';
    const track = user.learning_track ?? (plan?.freeTrack ? 'free' : null);

    const insights = await theoryInsights(db, user.id, theoryCategory, req.lang);
    const passed = await db.get(
      `SELECT created_at FROM theory_attempts WHERE user_id = ? AND category = ? AND mode = 'exam' AND passed = 1
         ORDER BY id LIMIT 1`,
      user.id,
      theoryCategory,
    );
    const driving = await db.get(
      `SELECT COUNT(*) AS lessons, COALESCE(SUM(duration_min), 0) AS minutes FROM bookings
         WHERE student_id = ? AND category = ? AND status = 'completed'`,
      user.id,
      category,
    );
    const nextLesson = await db.get(
      `SELECT b.id, b.start_at AS startAt, b.duration_min AS durationMin, b.status, b.category,
              u.first_name AS instructorFirstName, u.last_name AS instructorLastName
         FROM bookings b JOIN users u ON u.id = b.instructor_id
         WHERE b.student_id = ? AND b.status IN (${ACTIVE.map(() => '?').join(',')})
         ORDER BY CASE WHEN b.status IN ('en_route', 'in_progress') THEN 0 ELSE 1 END, b.start_at LIMIT 1`,
      user.id,
      ...ACTIVE,
    );
    const { n: unread } = await db.get(
      `SELECT COUNT(*) AS n FROM messages m JOIN bookings b ON b.id = m.booking_id
         WHERE b.student_id = ? AND m.sender_id != ? AND m.read_at IS NULL`,
      user.id,
      user.id,
    );

    const free = track === 'free' ? await freeTrackProgress(db, user.id, req.lang) : null;
    const provisionalAt = free?.profile.provisionalAt ?? sub?.provisional_at ?? null;
    const examDate = free?.profile.examDate ?? sub?.exam_date ?? null;
    const licenseAt = free?.profile.licenseAt ?? sub?.license_obtained_at ?? null;
    const targetHours = TARGET_HOURS[category] ?? 20;
    const hours = Math.round((driving.minutes / 60) * 10) / 10;
    const practice = free
      ? { kind: 'km', value: free.totals.km, target: free.kmTarget, done: free.totals.km >= free.kmTarget }
      : { kind: 'hours', value: hours, target: targetHours, done: hours >= targetHours, lessons: driving.lessons };

    const steps = [
      { id: 'goal', done: Boolean(user.goal_category && user.learning_track) },
      { id: 'theory', done: Boolean(passed), progress: insights.readiness / 100, readiness: insights.readiness },
      { id: 'provisional', done: Boolean(provisionalAt), date: provisionalAt },
      { id: 'practice', done: practice.done, progress: Math.min(1, practice.value / practice.target), ...practice },
      { id: 'exam', done: Boolean(examDate), date: examDate, eligibleFrom: free?.eligibleFrom ?? null },
      { id: 'license', done: Boolean(licenseAt), date: licenseAt },
    ];
    const current = steps.find((s) => !s.done) ?? null;

    // Prochaine action : une seule chose claire à faire maintenant.
    let nextAction;
    if (nextLesson && ['en_route', 'in_progress'].includes(nextLesson.status)) nextAction = { id: 'lessonLive', to: '/lecons' };
    else if (!current) nextAction = { id: 'done', to: '/profil' };
    else if (current.id === 'goal') nextAction = { id: 'onboarding', to: '/bienvenue' };
    else if (current.id === 'theory') nextAction = insights.toReview > 0 ? { id: 'review', to: '/theorie' } : { id: 'theory', to: '/theorie' };
    else if (current.id === 'provisional') nextAction = { id: 'provisional', to: track === 'free' ? '/libre' : sub ? '/pack' : '/libre?tab=guide' };
    else if (current.id === 'practice') nextAction = track === 'free' ? { id: 'roadbook', to: '/libre?tab=roadbook' } : { id: 'book', to: '/reserver' };
    else if (current.id === 'exam') nextAction = { id: 'exam', to: '/centres' };
    else nextAction = { id: 'license', to: sub ? '/pack' : '/libre' };

    res.json({
      firstName: user.first_name,
      category,
      permit: permit ? { code: permit.code, group: permit.group } : null,
      track,
      steps,
      currentStep: current?.id ?? null,
      progress: Math.round((steps.filter((s) => s.done).length / steps.length) * 100),
      nextAction,
      nextLesson: nextLesson ?? null,
      unreadMessages: unread,
      theory: { readiness: insights.readiness, toReview: insights.toReview, examsTaken: insights.examsTaken, passed: Boolean(passed) },
      pack: sub
        ? {
            planId: sub.plan_id,
            name: localizePlan(plan, req.lang).name,
            includedMinutes: plan.includedMinutes,
            remainingMinutes: Math.max(0, plan.includedMinutes - (await usedMinutes(db, sub))),
          }
        : null,
      freeTrack: free ? { region: free.region, km: free.totals.km, kmTarget: free.kmTarget, eligibleFrom: free.eligibleFrom } : null,
    });
  });

  return router;
}
