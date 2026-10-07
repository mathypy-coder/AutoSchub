import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { PERMIT_CODES } from '../data/permits.js';
import { FREE_EXAMS_PER_WEEK, PERIOD_DAYS, PLANS, PLANS_BY_ID, TARGET_HOURS } from '../data/plans.js';
import { HttpError } from '../errors.js';
import { addDays, buildJourney, getActiveSubscription, serializeSubscription } from '../subscriptions.js';
import { isIsoDate } from '../validation.js';
import { saveFreeTrackProfile } from '../freeTrack.js';
import { localizePlan } from '../i18n.js';

export function subscriptionRoutes(db) {
  const router = Router();

  router.get('/plans', (req, res) => {
    res.json({
      plans: PLANS.map((p) => localizePlan(p, req.lang)),
      targetHours: TARGET_HOURS,
      periodDays: PERIOD_DAYS,
      freeExamsPerWeek: FREE_EXAMS_PER_WEEK,
    });
  });

  router.use(requireAuth('student'));

  const current = async (req) => {
    const sub = await getActiveSubscription(db, req.user.id);
    if (!sub) throw new HttpError(404, 'Aucun pack actif.');
    return sub;
  };

  const respond = async (res, sub) =>
    res.json({
      subscription: await serializeSubscription(db, sub, res.req.lang),
      journey: await buildJourney(db, sub, res.req.lang),
    });

  router.get('/me', async (req, res) => {
    const sub = await getActiveSubscription(db, req.user.id);
    if (!sub) return res.json({ subscription: null, journey: null });
    await respond(res, sub);
  });

  // Souscription. Le paiement est simulé : à brancher sur Mollie/Stripe (Bancontact).
  router.post('/', async (req, res) => {
    const { planId, category } = req.body ?? {};
    if (!PLANS_BY_ID.has(planId)) throw new HttpError(400, 'Pack inconnu.');
    if (!PERMIT_CODES.includes(category)) throw new HttpError(400, 'Catégorie de permis invalide.');
    const now = new Date().toISOString();
    // Vérification et création dans la même transaction : pas deux packs actifs en cas de double clic.
    const lastInsertRowid = await db.transaction(async (tx) => {
      if (await getActiveSubscription(tx, req.user.id)) {
        throw new HttpError(409, 'Tu as déjà un pack actif. Change de formule depuis ton pack.');
      }
      const inserted = await tx.run(
        `INSERT INTO subscriptions (student_id, plan_id, category, current_period_start, current_period_end, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        req.user.id,
        planId,
        category,
        now,
        addDays(now, PERIOD_DAYS),
        now,
      );
      return inserted.lastInsertRowid;
    });
    res.status(201);
    await respond(res, await db.get('SELECT * FROM subscriptions WHERE id = ?', lastInsertRowid));
  });

  // Changement de formule : appliqué au prochain renouvellement (choisir la formule actuelle annule le changement).
  router.post('/me/plan', async (req, res) => {
    const sub = await current(req);
    const { planId } = req.body ?? {};
    if (!PLANS_BY_ID.has(planId)) throw new HttpError(400, 'Pack inconnu.');
    const pending = planId === sub.plan_id ? null : planId;
    await db.run('UPDATE subscriptions SET pending_plan_id = ? WHERE id = ?', pending, sub.id);
    await respond(res, { ...sub, pending_plan_id: pending });
  });

  router.post('/me/cancel', async (req, res) => {
    const sub = await current(req);
    const cancel = req.body?.resume ? 0 : 1;
    await db.run('UPDATE subscriptions SET cancel_at_period_end = ? WHERE id = ?', cancel, sub.id);
    await respond(res, { ...sub, cancel_at_period_end: cancel });
  });

  // L'élève déclare les étapes administratives de son parcours.
  router.patch('/me/journey', async (req, res) => {
    const sub = await current(req);
    const body = req.body ?? {};
    const updates = {};
    for (const [key, column] of [
      ['provisionalAt', 'provisional_at'],
      ['examDate', 'exam_date'],
      ['licenseObtainedAt', 'license_obtained_at'],
    ]) {
      if (body[key] === undefined) continue;
      if (body[key] !== null && !isIsoDate(body[key])) throw new HttpError(400, 'Date invalide (AAAA-MM-JJ).');
      updates[column] = body[key];
    }
    // Permis obtenu : plus de renouvellement, le pack se termine à la fin de la période déjà payée
    // (et non immédiatement, ce qui permettrait de reprendre aussitôt un pack aux heures neuves).
    if (updates.license_obtained_at) updates.cancel_at_period_end = 1;
    // Séance avec le guide (filière libre) : enregistrée dans le profil filière libre.
    const guideSessionAt = body.guideSessionAt;
    if (guideSessionAt !== undefined && guideSessionAt !== null && !isIsoDate(guideSessionAt)) {
      throw new HttpError(400, 'Date invalide (AAAA-MM-JJ).');
    }
    // Pack filière libre : les étapes déclarées alimentent aussi le profil filière libre.
    if (PLANS_BY_ID.get(sub.plan_id)?.freeTrack) {
      await saveFreeTrackProfile(db, req.user.id, {
        category: sub.category,
        provisionalAt: updates.provisional_at,
        examDate: updates.exam_date,
        licenseAt: updates.license_obtained_at,
        guideSessionAt,
      });
    }
    const columns = Object.keys(updates);
    if (!columns.length) {
      if (guideSessionAt !== undefined) return respond(res, sub);
      throw new HttpError(400, 'Rien à mettre à jour.');
    }
    await db.run(
      `UPDATE subscriptions SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      ...Object.values(updates),
      sub.id,
    );
    await respond(res, await db.get('SELECT * FROM subscriptions WHERE id = ?', sub.id));
  });

  return router;
}
