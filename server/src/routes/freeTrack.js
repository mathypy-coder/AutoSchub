import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { EXAM_CENTERS } from '../data/examCenters.js';
import { FREE_TRACK_REGIONS, localizedRules, ROADBOOK_CONDITIONS } from '../data/freeTrack.js';
import { PLANS_BY_ID } from '../data/plans.js';
import { isRouteId, routesForCenter } from '../data/practiceRoutes.js';
import { HttpError } from '../errors.js';
import { freeTrackProgress, saveFreeTrackProfile } from '../freeTrack.js';
import { getActiveSubscription } from '../subscriptions.js';
import { isIsoDate } from '../validation.js';

const MAX_ENTRIES = 1000;

// Tous les parcours d'entraînement : packs Filière libre et Intégral. Sinon, la boucle urbaine de chaque centre.
async function hasAllRoutes(db, user) {
  if (!user) return false;
  if (user.role === 'instructor') return true;
  const sub = await getActiveSubscription(db, user.id);
  const plan = sub && PLANS_BY_ID.get(sub.plan_id);
  return Boolean(plan && (plan.freeTrack || plan.id === 'integral'));
}

const dateOrNull = (value) => {
  if (value === null || value === '') return null;
  if (!isIsoDate(value)) throw new HttpError(400, 'Date invalide (AAAA-MM-JJ).');
  return value;
};

const serializeEntry = (r) => ({
  id: r.id,
  date: r.drive_date,
  durationMin: r.duration_min,
  distanceKm: r.distance_km,
  conditions: JSON.parse(r.conditions || '[]'),
  routeId: r.route_id,
  guideName: r.guide_name,
  notes: r.notes,
});

export function freeTrackRoutes(db) {
  const router = Router();

  // Guide de la filière libre (public, mis en cache par le CDN).
  router.get('/rules', (req, res) => {
    res.json(localizedRules(req.lang));
  });

  // Parcours d'entraînement autour d'un centre d'examen.
  router.get('/routes/:centerId', async (req, res) => {
    const routes = routesForCenter(req.params.centerId, req.lang);
    if (!routes) throw new HttpError(404, 'Centre d’examen introuvable.');
    const unlocked = await hasAllRoutes(db, req.user);
    res.json({
      centerId: req.params.centerId,
      unlocked,
      routes: routes.map((r) => (unlocked || r.free ? r : { ...r, locked: true, waypoints: [], mapsUrl: null, focus: [] })),
    });
  });

  router.use(requireAuth('student'));

  router.get('/me', async (req, res) => {
    const progress = await freeTrackProgress(db, req.user.id, req.lang);
    res.json({ ...progress, allRoutes: await hasAllRoutes(db, req.user) });
  });

  router.put('/me', async (req, res) => {
    const body = req.body ?? {};
    const changes = {};
    if (body.region !== undefined) {
      if (!FREE_TRACK_REGIONS.includes(body.region)) throw new HttpError(400, 'Région inconnue.');
      changes.region = body.region;
    }
    if (body.examCenterId !== undefined) {
      if (body.examCenterId !== null && !EXAM_CENTERS.some((c) => c.id === body.examCenterId)) {
        throw new HttpError(400, 'Centre d’examen introuvable.');
      }
      changes.examCenterId = body.examCenterId;
    }
    for (const key of ['provisionalAt', 'guideSessionAt', 'examDate', 'licenseAt']) {
      if (body[key] !== undefined) changes[key] = dateOrNull(body[key]);
    }
    if (body.guides !== undefined) {
      if (!Array.isArray(body.guides) || body.guides.length > 2) {
        throw new HttpError(400, 'Deux guides maximum.');
      }
      changes.guides = body.guides.map((g) => String(g ?? '').trim().slice(0, 60)).filter(Boolean);
    }
    if (!Object.keys(changes).length) throw new HttpError(400, 'Rien à mettre à jour.');
    await saveFreeTrackProfile(db, req.user.id, changes);

    // Pack Filière libre : les dates déclarées ici suivent aussi le parcours du pack.
    const sub = await getActiveSubscription(db, req.user.id);
    if (sub && PLANS_BY_ID.get(sub.plan_id)?.freeTrack) {
      const mirror = { provisional_at: changes.provisionalAt, exam_date: changes.examDate, license_obtained_at: changes.licenseAt };
      const cols = Object.entries(mirror).filter(([, v]) => v !== undefined);
      if (changes.licenseAt) cols.push(['cancel_at_period_end', 1]);
      if (cols.length) {
        await db.run(
          `UPDATE subscriptions SET ${cols.map(([c]) => `${c} = ?`).join(', ')} WHERE id = ?`,
          ...cols.map(([, v]) => v),
          sub.id,
        );
      }
    }
    const progress = await freeTrackProgress(db, req.user.id, req.lang);
    res.json({ ...progress, allRoutes: await hasAllRoutes(db, req.user) });
  });

  // ——— Carnet de bord ———
  router.get('/roadbook', async (req, res) => {
    const rows = await db.all(
      'SELECT * FROM roadbook_entries WHERE user_id = ? ORDER BY drive_date DESC, id DESC LIMIT 500',
      req.user.id,
    );
    res.json({ entries: rows.map(serializeEntry) });
  });

  router.post('/roadbook', async (req, res) => {
    const b = req.body ?? {};
    if (!isIsoDate(b.date)) throw new HttpError(400, 'Date invalide (AAAA-MM-JJ).');
    if (b.date > new Date().toISOString().slice(0, 10)) throw new HttpError(400, 'Le trajet ne peut pas être dans le futur.');
    const durationMin = Math.trunc(Number(b.durationMin));
    const distanceKm = Math.round(Number(b.distanceKm) * 10) / 10;
    if (!(durationMin >= 5 && durationMin <= 720)) throw new HttpError(400, 'Durée invalide (5 à 720 minutes).');
    if (!(distanceKm > 0 && distanceKm <= 1000)) throw new HttpError(400, 'Distance invalide (0 à 1000 km).');
    const conditions = Array.isArray(b.conditions)
      ? [...new Set(b.conditions.filter((c) => Object.hasOwn(ROADBOOK_CONDITIONS, c)))]
      : [];
    if (b.routeId != null && b.routeId !== '' && !isRouteId(b.routeId)) throw new HttpError(400, 'Parcours inconnu.');
    const { n } = await db.get('SELECT COUNT(*) AS n FROM roadbook_entries WHERE user_id = ?', req.user.id);
    if (n >= MAX_ENTRIES) throw new HttpError(409, 'Carnet de bord complet.');
    const inserted = await db.run(
      `INSERT INTO roadbook_entries (user_id, drive_date, duration_min, distance_km, conditions, route_id, guide_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      req.user.id,
      b.date,
      durationMin,
      distanceKm,
      JSON.stringify(conditions),
      b.routeId || null,
      String(b.guideName ?? '').trim().slice(0, 60),
      String(b.notes ?? '').trim().slice(0, 500),
    );
    const row = await db.get('SELECT * FROM roadbook_entries WHERE id = ?', inserted.lastInsertRowid);
    res.status(201).json({ entry: serializeEntry(row) });
  });

  router.delete('/roadbook/:id', async (req, res) => {
    const result = await db.run(
      'DELETE FROM roadbook_entries WHERE id = ? AND user_id = ?',
      Number(req.params.id),
      req.user.id,
    );
    if (!result.changes) throw new HttpError(404, 'Trajet introuvable.');
    res.json({ ok: true });
  });

  return router;
}
