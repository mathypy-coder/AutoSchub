import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { DEFAULT_POSITION } from '../geo.js';
import { HttpError } from '../errors.js';
import { centsToEuros, rating, serializeInstructor } from '../serializers.js';
import { expireStaleBookings } from '../bookingRules.js';
import { BOOKING_HORIZON_DAYS, freeSlots, getWeek } from '../availability.js';
import { isIsoDate } from '../validation.js';
import { readCategories, readLanguages, readPosition, readRate, readTransmission, text } from '../validation.js';

const INSTRUCTOR_SELECT = `
  SELECT i.*, u.first_name, u.last_name, u.city
  FROM instructors i JOIN users u ON u.id = i.user_id`;

const COMMISSION_RATE = 0.2;

function searchOrigin(query) {
  const lat = Number(query.lat);
  const lng = Number(query.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && query.lat !== '' && query.lng !== '') {
    return { lat, lng };
  }
  return DEFAULT_POSITION;
}

export function instructorRoutes(db) {
  const router = Router();

  // Recherche « à la Uber » : moniteurs proches, triés par distance.
  router.get('/', async (req, res) => {
    const from = searchOrigin(req.query);
    const { category, transmission, language } = req.query;
    const onlineOnly = req.query.onlineOnly === '1' || req.query.onlineOnly === 'true';
    const maxKm = Number(req.query.maxKm) || 50;

    const rows = await db.all(`${INSTRUCTOR_SELECT} WHERE i.lat IS NOT NULL AND i.lng IS NOT NULL`);
    const instructors = rows
      .map((row) => serializeInstructor(row, from))
      .filter((i) => i.distanceKm <= maxKm)
      .filter((i) => !category || i.categories.includes(category))
      .filter((i) => !transmission || i.transmission === transmission || i.transmission === 'les deux')
      .filter((i) => !language || i.languages.includes(language))
      .filter((i) => !onlineOnly || i.isOnline)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline) || a.distanceKm - b.distanceKm);

    res.json({ from, instructors });
  });

  // Espace moniteur : profil, statut en ligne, statistiques.
  router.get('/me/profile', requireAuth('instructor'), async (req, res) => {
    const row = await db.get(`${INSTRUCTOR_SELECT} WHERE i.user_id = ?`, req.user.id);
    res.json({ instructor: serializeInstructor(row) });
  });

  router.patch('/me/profile', requireAuth('instructor'), async (req, res) => {
    const body = req.body ?? {};
    const updates = [];
    const values = [];
    const set = (column, value) => {
      updates.push(`${column} = ?`);
      values.push(value);
    };

    if (body.isOnline !== undefined) set('is_online', body.isOnline ? 1 : 0);
    if (body.lat !== undefined || body.lng !== undefined) {
      const { lat, lng } = readPosition(body.lat, body.lng);
      set('lat', lat);
      set('lng', lng);
    }
    if (body.hourlyRate !== undefined) set('hourly_rate_cents', readRate(body.hourlyRate));
    if (body.categories !== undefined) set('categories', JSON.stringify(readCategories(body.categories)));
    if (body.languages !== undefined) set('languages', JSON.stringify(readLanguages(body.languages)));
    if (body.transmission !== undefined) set('transmission', readTransmission(body.transmission));
    for (const [key, column, max] of [
      ['bio', 'bio', 2000],
      ['vehicle', 'vehicle', 120],
      ['schoolName', 'school_name', 120],
    ]) {
      if (body[key] !== undefined) set(column, text(body[key], max));
    }

    if (updates.length) {
      await db.run(`UPDATE instructors SET ${updates.join(', ')} WHERE user_id = ?`, ...values, req.user.id);
    }
    const row = await db.get(`${INSTRUCTOR_SELECT} WHERE i.user_id = ?`, req.user.id);
    res.json({ instructor: serializeInstructor(row) });
  });

  router.get('/me/stats', requireAuth('instructor'), async (req, res) => {
    await expireStaleBookings(db);
    const totals = await db.get(
      `SELECT COUNT(*) AS lessons, COALESCE(SUM(duration_min), 0) AS minutes,
                COALESCE(SUM(price_cents), 0) AS gross
         FROM bookings WHERE instructor_id = ? AND status = 'completed'`,
      req.user.id,
    );
    const week = await db.get(
      `SELECT COALESCE(SUM(price_cents), 0) AS gross FROM bookings
         WHERE instructor_id = ? AND status = 'completed' AND start_at >= ?`,
      req.user.id,
      new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    );
    const pending = await db.get(
      `SELECT COUNT(*) AS n FROM bookings WHERE instructor_id = ? AND status = 'pending'`,
      req.user.id,
    );
    const profile = await db.get('SELECT rating_sum, rating_count FROM instructors WHERE user_id = ?', req.user.id);

    res.json({
      lessons: totals.lessons,
      hours: Math.round((totals.minutes / 60) * 10) / 10,
      gross: centsToEuros(totals.gross),
      net: centsToEuros(totals.gross * (1 - COMMISSION_RATE)),
      weekNet: centsToEuros(week.gross * (1 - COMMISSION_RATE)),
      commissionRate: COMMISSION_RATE,
      pendingRequests: pending.n,
      rating: rating(profile),
      ratingCount: profile.rating_count,
    });
  });

  // Disponibilités hebdomadaires (heure de Bruxelles) : une plage par jour travaillé.
  router.get('/me/availability', requireAuth('instructor'), async (req, res) => {
    res.json(await getWeek(db, req.user.id));
  });

  router.put('/me/availability', requireAuth('instructor'), async (req, res) => {
    const days = Array.isArray(req.body?.week) ? req.body.week : null;
    if (!days) throw new HttpError(400, 'Disponibilités invalides.');
    const week = [];
    for (const d of days) {
      const weekday = Number(d?.weekday);
      const startMin = Number(d?.startMin);
      const endMin = Number(d?.endMin);
      const valid =
        Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 &&
        Number.isInteger(startMin) && Number.isInteger(endMin) &&
        startMin >= 0 && endMin <= 24 * 60 && endMin - startMin >= 60;
      if (!valid) throw new HttpError(400, 'Chaque plage doit durer au moins 1 h, entre 00:00 et 24:00.');
      if (week.some((w) => w.weekday === weekday)) throw new HttpError(400, 'Un seul créneau par jour.');
      week.push({ weekday, startMin, endMin });
    }
    if (!week.length) throw new HttpError(400, 'Indique au moins un jour de disponibilité.');
    await db.transaction(async (tx) => {
      await tx.run('DELETE FROM instructor_availability WHERE instructor_id = ?', req.user.id);
      for (const w of week) {
        await tx.run(
          'INSERT INTO instructor_availability (instructor_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)',
          req.user.id,
          w.weekday,
          w.startMin,
          w.endMin,
        );
      }
    });
    res.json(await getWeek(db, req.user.id));
  });

  // Créneaux libres d'un moniteur pour une date (réservation planifiée).
  router.get('/:id/slots', async (req, res) => {
    const id = Number(req.params.id);
    const instructor = Number.isInteger(id) ? await db.get('SELECT user_id FROM instructors WHERE user_id = ?', id) : null;
    if (!instructor) throw new HttpError(404, 'Moniteur introuvable.');
    const { date } = req.query;
    if (!isIsoDate(date)) throw new HttpError(400, 'Date invalide (AAAA-MM-JJ).');
    const horizon = Date.now() + BOOKING_HORIZON_DAYS * 24 * 3600000;
    if (Date.parse(`${date}T00:00:00Z`) > horizon) {
      throw new HttpError(400, `Réservation possible jusqu’à ${BOOKING_HORIZON_DAYS} jours à l’avance.`);
    }
    const duration = [60, 90, 120].includes(Number(req.query.durationMin)) ? Number(req.query.durationMin) : 60;
    await expireStaleBookings(db);
    const studentId = req.user?.role === 'student' ? req.user.id : null;
    res.set('Cache-Control', 'no-store');
    res.json({ date, durationMin: duration, slots: await freeSlots(db, id, date, duration, studentId) });
  });

  router.get('/:id', async (req, res) => {
    const row = await db.get(`${INSTRUCTOR_SELECT} WHERE i.user_id = ?`, Number(req.params.id));
    if (!row) throw new HttpError(404, 'Moniteur introuvable.');
    const reviews = await db.all(
      `SELECT b.student_rating AS rating, b.student_comment AS comment, b.updated_at AS date,
                b.category, u.first_name AS author
         FROM bookings b JOIN users u ON u.id = b.student_id
         WHERE b.instructor_id = ? AND b.student_rating IS NOT NULL
         ORDER BY b.updated_at DESC LIMIT 10`,
      row.user_id,
    );
    res.json({ instructor: serializeInstructor(row, searchOrigin(req.query)), reviews });
  });

  return router;
}
