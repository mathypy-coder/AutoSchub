import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { PERMIT_CODES } from '../data/permits.js';
import { FREE_EXAMS_PER_WEEK, PERIOD_DAYS, PLANS, PLANS_BY_ID, TARGET_HOURS } from '../data/plans.js';
import { HttpError } from '../errors.js';
import { addDays, buildJourney, getActiveSubscription, serializeSubscription } from '../subscriptions.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function subscriptionRoutes(db) {
  const router = Router();

  router.get('/plans', (_req, res) => {
    res.json({
      plans: PLANS,
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
    res.json({ subscription: await serializeSubscription(db, sub), journey: await buildJourney(db, sub) });

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
    if (await getActiveSubscription(db, req.user.id)) {
      throw new HttpError(409, 'Tu as déjà un pack actif. Change de formule depuis ton pack.');
    }
    const now = new Date().toISOString();
    const { lastInsertRowid } = await db.run(
      `INSERT INTO subscriptions (student_id, plan_id, category, current_period_start, current_period_end, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      req.user.id,
      planId,
      category,
      now,
      addDays(now, PERIOD_DAYS),
      now,
    );
    res.status(201);
    await respond(res, await db.get('SELECT * FROM subscriptions WHERE id = ?', lastInsertRowid));
  });

  router.post('/me/plan', async (req, res) => {
    const sub = await current(req);
    const { planId } = req.body ?? {};
    if (!PLANS_BY_ID.has(planId)) throw new HttpError(400, 'Pack inconnu.');
    await db.run('UPDATE subscriptions SET plan_id = ? WHERE id = ?', planId, sub.id);
    await respond(res, { ...sub, plan_id: planId });
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
      if (body[key] !== null && !DATE_RE.test(body[key])) throw new HttpError(400, 'Date invalide (AAAA-MM-JJ).');
      updates[column] = body[key];
    }
    const columns = Object.keys(updates);
    if (!columns.length) throw new HttpError(400, 'Rien à mettre à jour.');
    await db.run(
      `UPDATE subscriptions SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      ...Object.values(updates),
      sub.id,
    );
    let updated = await db.get('SELECT * FROM subscriptions WHERE id = ?', sub.id);
    // Permis obtenu : le parcours est terminé, l'abonnement s'arrête.
    if (updated.license_obtained_at) {
      await db.run(`UPDATE subscriptions SET status = 'completed' WHERE id = ?`, sub.id);
      updated = { ...updated, status: 'completed' };
    }
    await respond(res, updated);
  });

  return router;
}
