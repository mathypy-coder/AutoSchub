import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { PERMIT_CODES } from '../data/permits.js';
import { DEFAULT_POSITION } from '../geo.js';
import { HttpError } from '../errors.js';
import { centsToEuros, rating, serializeInstructor } from '../serializers.js';

const INSTRUCTOR_SELECT = `
  SELECT i.*, u.first_name, u.last_name, u.city
  FROM instructors i JOIN users u ON u.id = i.user_id`;

const COMMISSION_RATE = 0.2;

function readPosition(query) {
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
    const from = readPosition(req.query);
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
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new HttpError(400, 'Position invalide.');
      set('lat', lat);
      set('lng', lng);
    }
    if (body.hourlyRate !== undefined) {
      const rate = Number(body.hourlyRate);
      if (!Number.isFinite(rate) || rate < 20 || rate > 250) {
        throw new HttpError(400, 'Le tarif horaire doit être compris entre 20 € et 250 €.');
      }
      set('hourly_rate_cents', Math.round(rate * 100));
    }
    if (body.categories !== undefined) {
      const categories = (Array.isArray(body.categories) ? body.categories : []).filter((c) =>
        PERMIT_CODES.includes(c),
      );
      if (!categories.length) throw new HttpError(400, 'Indiquez au moins une catégorie.');
      set('categories', JSON.stringify(categories));
    }
    if (body.languages !== undefined) {
      if (!Array.isArray(body.languages) || !body.languages.length) throw new HttpError(400, 'Langues invalides.');
      set('languages', JSON.stringify(body.languages));
    }
    if (body.transmission !== undefined) {
      if (!['manuelle', 'automatique', 'les deux'].includes(body.transmission)) {
        throw new HttpError(400, 'Boîte de vitesses invalide.');
      }
      set('transmission', body.transmission);
    }
    for (const [key, column] of [
      ['bio', 'bio'],
      ['vehicle', 'vehicle'],
      ['schoolName', 'school_name'],
    ]) {
      if (body[key] !== undefined) set(column, String(body[key]));
    }

    if (updates.length) {
      await db.run(`UPDATE instructors SET ${updates.join(', ')} WHERE user_id = ?`, ...values, req.user.id);
    }
    const row = await db.get(`${INSTRUCTOR_SELECT} WHERE i.user_id = ?`, req.user.id);
    res.json({ instructor: serializeInstructor(row) });
  });

  router.get('/me/stats', requireAuth('instructor'), async (req, res) => {
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
    res.json({ instructor: serializeInstructor(row, readPosition(req.query)), reviews });
  });

  return router;
}
