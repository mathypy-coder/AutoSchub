import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { transaction } from '../db.js';
import { HttpError } from '../errors.js';
import { serializeBooking } from '../serializers.js';

const BOOKING_SELECT = `
  SELECT b.*,
    si.first_name AS s_first_name, si.last_name AS s_last_name, si.phone AS s_phone,
    iu.first_name AS i_first_name, iu.last_name AS i_last_name, iu.phone AS i_phone,
    i.vehicle AS i_vehicle, i.transmission AS i_transmission, i.lat AS i_lat, i.lng AS i_lng
  FROM bookings b
  JOIN users si ON si.id = b.student_id
  JOIN users iu ON iu.id = b.instructor_id
  JOIN instructors i ON i.user_id = b.instructor_id`;

const ALLOWED_DURATIONS = [60, 90, 120];
const BLOCKING_STATUSES = ['pending', 'accepted', 'en_route', 'in_progress'];

// Cycle de vie d'une leçon, comme une course Uber :
// demandée → acceptée → moniteur en route → en cours → terminée.
const TRANSITIONS = {
  pending: { accepted: 'instructor', declined: 'instructor', cancelled: 'student' },
  accepted: { en_route: 'instructor', in_progress: 'instructor', cancelled: 'any' },
  en_route: { in_progress: 'instructor', cancelled: 'any' },
  in_progress: { completed: 'instructor' },
};

const overlaps = (startA, durA, startB, durB) => {
  const a0 = Date.parse(startA);
  const b0 = Date.parse(startB);
  return a0 < b0 + durB * 60000 && b0 < a0 + durA * 60000;
};

export function bookingRoutes(db) {
  const router = Router();
  router.use(requireAuth());

  const findBooking = (id) => db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(id);

  const loadOwnBooking = (req) => {
    const row = findBooking(Number(req.params.id));
    const ownerColumn = req.user.role === 'student' ? 'student_id' : 'instructor_id';
    if (!row || row[ownerColumn] !== req.user.id) throw new HttpError(404, 'Leçon introuvable.');
    return row;
  };

  router.get('/', (req, res) => {
    const column = req.user.role === 'student' ? 'b.student_id' : 'b.instructor_id';
    const rows = db.prepare(`${BOOKING_SELECT} WHERE ${column} = ? ORDER BY b.start_at DESC`).all(req.user.id);
    res.json({ bookings: rows.map((row) => serializeBooking(row, req.user.role)) });
  });

  router.get('/:id', (req, res) => {
    res.json({ booking: serializeBooking(loadOwnBooking(req), req.user.role) });
  });

  router.post('/', requireAuth('student'), (req, res) => {
    const { instructorId, category, startAt, durationMin = 60, pickupAddress, pickupLat, pickupLng } = req.body ?? {};
    const instructor = db.prepare('SELECT * FROM instructors WHERE user_id = ?').get(Number(instructorId));
    if (!instructor) throw new HttpError(404, 'Moniteur introuvable.');
    if (!JSON.parse(instructor.categories).includes(category)) {
      throw new HttpError(400, `Ce moniteur n’enseigne pas la catégorie ${category ?? '?'}.`);
    }
    if (!ALLOWED_DURATIONS.includes(Number(durationMin))) {
      throw new HttpError(400, 'Durée invalide (60, 90 ou 120 minutes).');
    }
    if (!pickupAddress?.trim()) throw new HttpError(400, 'Adresse de prise en charge requise.');

    const isInstant = !startAt;
    let start;
    if (isInstant) {
      if (!instructor.is_online) throw new HttpError(409, 'Ce moniteur n’est pas disponible maintenant.');
      start = new Date().toISOString();
    } else {
      const parsed = Date.parse(startAt);
      if (Number.isNaN(parsed)) throw new HttpError(400, 'Date de début invalide.');
      if (parsed < Date.now()) throw new HttpError(400, 'La date de début est déjà passée.');
      start = new Date(parsed).toISOString();
    }

    const duration = Number(durationMin);
    const id = transaction(db, () => {
      const busy = db
        .prepare(
          `SELECT start_at, duration_min FROM bookings
           WHERE instructor_id = ? AND status IN (${BLOCKING_STATUSES.map(() => '?').join(',')})`,
        )
        .all(instructor.user_id, ...BLOCKING_STATUSES);
      if (busy.some((b) => overlaps(start, duration, b.start_at, b.duration_min))) {
        throw new HttpError(409, 'Ce créneau n’est plus disponible.');
      }
      const priceCents = Math.round((instructor.hourly_rate_cents * duration) / 60);
      return db
        .prepare(
          `INSERT INTO bookings (student_id, instructor_id, category, start_at, duration_min, is_instant,
             pickup_address, pickup_lat, pickup_lng, price_cents)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          req.user.id,
          instructor.user_id,
          category,
          start,
          duration,
          isInstant ? 1 : 0,
          pickupAddress.trim(),
          Number.isFinite(Number(pickupLat)) ? Number(pickupLat) : null,
          Number.isFinite(Number(pickupLng)) ? Number(pickupLng) : null,
          priceCents,
        ).lastInsertRowid;
    });

    res.status(201).json({ booking: serializeBooking(findBooking(id), 'student') });
  });

  router.post('/:id/status', (req, res) => {
    const row = loadOwnBooking(req);
    const next = req.body?.status;
    const allowedBy = TRANSITIONS[row.status]?.[next];
    if (!allowedBy) throw new HttpError(409, `Transition impossible : ${row.status} → ${next}.`);
    if (allowedBy !== 'any' && allowedBy !== req.user.role) {
      throw new HttpError(403, 'Action non autorisée pour votre rôle.');
    }
    db.prepare(`UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(next, row.id);
    res.json({ booking: serializeBooking(findBooking(row.id), req.user.role) });
  });

  router.post('/:id/review', requireAuth('student'), (req, res) => {
    const row = loadOwnBooking(req);
    const ratingValue = Number(req.body?.rating);
    if (row.status !== 'completed') throw new HttpError(409, 'Vous pourrez noter la leçon une fois terminée.');
    if (row.student_rating != null) throw new HttpError(409, 'Cette leçon a déjà été notée.');
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      throw new HttpError(400, 'La note doit être comprise entre 1 et 5.');
    }
    transaction(db, () => {
      db.prepare(
        `UPDATE bookings SET student_rating = ?, student_comment = ?, updated_at = datetime('now') WHERE id = ?`,
      ).run(ratingValue, req.body?.comment?.trim() || null, row.id);
      db.prepare(
        'UPDATE instructors SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE user_id = ?',
      ).run(ratingValue, row.instructor_id);
    });
    res.json({ booking: serializeBooking(findBooking(row.id), 'student') });
  });

  router.post('/:id/feedback', requireAuth('instructor'), (req, res) => {
    const row = loadOwnBooking(req);
    if (row.status !== 'completed') throw new HttpError(409, 'Le retour se donne après la leçon.');
    const feedback = String(req.body?.feedback ?? '').trim();
    if (!feedback) throw new HttpError(400, 'Le retour ne peut pas être vide.');
    db.prepare(`UPDATE bookings SET instructor_feedback = ?, updated_at = datetime('now') WHERE id = ?`).run(
      feedback,
      row.id,
    );
    res.json({ booking: serializeBooking(findBooking(row.id), 'instructor') });
  });

  return router;
}
