import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { HttpError } from '../errors.js';
import { serializeBooking } from '../serializers.js';
import { quoteLesson } from '../subscriptions.js';
import { BLOCKING_STATUSES, expireStaleBookings } from '../bookingRules.js';
import { optionalText, text } from '../validation.js';

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
  router.use(async (_req, _res, next) => {
    await expireStaleBookings(db);
    next();
  });

  const findBooking = (id) => db.get(`${BOOKING_SELECT} WHERE b.id = ?`, id);

  const loadOwnBooking = async (req) => {
    const id = Number(req.params.id);
    const row = Number.isInteger(id) ? await findBooking(id) : undefined;
    const ownerColumn = req.user.role === 'student' ? 'student_id' : 'instructor_id';
    if (!row || row[ownerColumn] !== req.user.id) throw new HttpError(404, 'Leçon introuvable.');
    return row;
  };

  router.get('/', async (req, res) => {
    const column = req.user.role === 'student' ? 'b.student_id' : 'b.instructor_id';
    const rows = await db.all(`${BOOKING_SELECT} WHERE ${column} = ? ORDER BY b.start_at DESC`, req.user.id);
    res.json({ bookings: rows.map((row) => serializeBooking(row, req.user.role)) });
  });

  // Devis avant réservation : prix de la leçon et part couverte par le pack.
  router.get('/quote', requireAuth('student'), async (req, res) => {
    const instructor = await db.get(
      'SELECT hourly_rate_cents FROM instructors WHERE user_id = ?',
      Number(req.query.instructorId),
    );
    if (!instructor) throw new HttpError(404, 'Moniteur introuvable.');
    const duration = Number(req.query.durationMin) || 60;
    const quote = await quoteLesson(db, req.user.id, req.query.category, duration, instructor.hourly_rate_cents);
    res.json({
      lessonPrice: quote.lessonCents / 100,
      studentPrice: quote.studentPriceCents / 100,
      coveredMinutes: quote.coveredMinutes,
      withPack: Boolean(quote.subscription),
    });
  });

  router.get('/:id', async (req, res) => {
    res.json({ booking: serializeBooking(await loadOwnBooking(req), req.user.role) });
  });

  router.post('/', requireAuth('student'), async (req, res) => {
    const { instructorId, category, startAt, durationMin = 60, pickupAddress, pickupLat, pickupLng } = req.body ?? {};
    const instructor = await db.get('SELECT * FROM instructors WHERE user_id = ?', Number(instructorId));
    if (!instructor) throw new HttpError(404, 'Moniteur introuvable.');
    if (typeof category !== 'string' || !JSON.parse(instructor.categories).includes(category)) {
      throw new HttpError(400, `Ce moniteur n’enseigne pas la catégorie ${category ?? '?'}.`);
    }
    if (!ALLOWED_DURATIONS.includes(Number(durationMin))) {
      throw new HttpError(400, 'Durée invalide (60, 90 ou 120 minutes).');
    }
    const address = text(pickupAddress, 200);
    if (!address) throw new HttpError(400, 'Adresse de prise en charge requise.');

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
    const id = await db.transaction(async (tx) => {
      // Créneaux occupés du moniteur, mais aussi de l'élève (pas deux leçons en même temps).
      const busy = await tx.all(
        `SELECT instructor_id, start_at, duration_min FROM bookings
           WHERE (instructor_id = ? OR student_id = ?)
             AND status IN (${BLOCKING_STATUSES.map(() => '?').join(',')})`,
        instructor.user_id,
        req.user.id,
        ...BLOCKING_STATUSES,
      );
      const clash = busy.find((b) => overlaps(start, duration, b.start_at, b.duration_min));
      if (clash) {
        throw new HttpError(
          409,
          clash.instructor_id === instructor.user_id
            ? 'Ce créneau n’est plus disponible.'
            : 'Tu as déjà une leçon prévue sur ce créneau.',
        );
      }
      // Le moniteur touche toujours le prix de la leçon ; le pack de l'élève
      // couvre des heures incluses et/ou une réduction sur sa part.
      const quote = await quoteLesson(tx, req.user.id, category, duration, instructor.hourly_rate_cents);
      const inserted = await tx.run(
        `INSERT INTO bookings (student_id, instructor_id, category, start_at, duration_min, is_instant,
             pickup_address, pickup_lat, pickup_lng, price_cents, student_price_cents, covered_minutes,
             subscription_id, subscription_period)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        req.user.id,
        instructor.user_id,
        category,
        start,
        duration,
        isInstant ? 1 : 0,
        address,
        Number.isFinite(Number(pickupLat)) ? Number(pickupLat) : null,
        Number.isFinite(Number(pickupLng)) ? Number(pickupLng) : null,
        quote.lessonCents,
        quote.studentPriceCents,
        quote.coveredMinutes,
        quote.subscription?.id ?? null,
        quote.subscription?.current_period_start ?? null,
      );
      return inserted.lastInsertRowid;
    });

    res.status(201).json({ booking: serializeBooking(await findBooking(id), 'student') });
  });

  router.post('/:id/status', async (req, res) => {
    const row = await loadOwnBooking(req);
    const next = req.body?.status;
    const allowedBy = TRANSITIONS[row.status]?.[next];
    if (!allowedBy) throw new HttpError(409, `Transition impossible : ${row.status} → ${next}.`);
    if (allowedBy !== 'any' && allowedBy !== req.user.role) {
      throw new HttpError(403, 'Action non autorisée pour votre rôle.');
    }
    // Mise à jour conditionnelle : si l'autre partie a changé le statut entre-temps, on refuse.
    const { changes } = await db.run(
      `UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ? AND status = ?`,
      next,
      row.id,
      row.status,
    );
    if (!changes) throw new HttpError(409, 'La leçon a changé entre-temps. Rafraîchis la page.');
    res.json({ booking: serializeBooking(await findBooking(row.id), req.user.role) });
  });

  router.post('/:id/review', requireAuth('student'), async (req, res) => {
    const row = await loadOwnBooking(req);
    const ratingValue = Number(req.body?.rating);
    if (row.status !== 'completed') throw new HttpError(409, 'Vous pourrez noter la leçon une fois terminée.');
    if (row.student_rating != null) throw new HttpError(409, 'Cette leçon a déjà été notée.');
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      throw new HttpError(400, 'La note doit être comprise entre 1 et 5.');
    }
    await db.transaction(async (tx) => {
      // Condition « pas encore notée » dans la requête : deux envois simultanés ne comptent qu'une fois.
      const { changes } = await tx.run(
        `UPDATE bookings SET student_rating = ?, student_comment = ?, updated_at = datetime('now')
           WHERE id = ? AND student_rating IS NULL`,
        ratingValue,
        optionalText(req.body?.comment, 1000),
        row.id,
      );
      if (!changes) throw new HttpError(409, 'Cette leçon a déjà été notée.');
      await tx.run(
        'UPDATE instructors SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE user_id = ?',
        ratingValue,
        row.instructor_id,
      );
    });
    res.json({ booking: serializeBooking(await findBooking(row.id), 'student') });
  });

  router.post('/:id/feedback', requireAuth('instructor'), async (req, res) => {
    const row = await loadOwnBooking(req);
    if (row.status !== 'completed') throw new HttpError(409, 'Le retour se donne après la leçon.');
    const feedback = text(req.body?.feedback, 2000);
    if (!feedback) throw new HttpError(400, 'Le retour ne peut pas être vide.');
    await db.run(
      `UPDATE bookings SET instructor_feedback = ?, updated_at = datetime('now') WHERE id = ?`,
      feedback,
      row.id,
    );
    res.json({ booking: serializeBooking(await findBooking(row.id), 'instructor') });
  });

  return router;
}
