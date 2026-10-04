import { Router } from 'express';
import { createToken, hashPassword, requireAuth, verifyPassword } from '../auth.js';
import { serializeUser } from '../serializers.js';
import { HttpError } from '../errors.js';
import {
  optionalText,
  readCategories,
  readLanguages,
  readPosition,
  readRate,
  readTransmission,
  text,
} from '../validation.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Anti-force brute : au-delà de 10 échecs en 15 min pour un couple IP + e-mail, connexion bloquée.
// Stocké en base pour valoir sur toutes les instances serverless.
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

const isUniqueViolation = (err) => /UNIQUE/i.test(String(err?.message));

export function authRoutes(db) {
  const router = Router();

  router.post('/register', async (req, res) => {
    const body = req.body ?? {};
    const { role, password } = body;
    const instructor = body.instructor && typeof body.instructor === 'object' ? body.instructor : {};
    const firstName = text(body.firstName, 80);
    const lastName = text(body.lastName, 80);
    const email = text(body.email, 254).toLowerCase();
    if (!['student', 'instructor'].includes(role)) throw new HttpError(400, 'Rôle invalide.');
    if (!firstName || !lastName) throw new HttpError(400, 'Nom et prénom requis.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Adresse e-mail invalide.');
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
      throw new HttpError(400, 'Le mot de passe doit contenir entre 8 et 200 caractères.');
    }
    if (await db.get('SELECT 1 FROM users WHERE email = ?', email)) {
      throw new HttpError(409, 'Un compte existe déjà avec cette adresse e-mail.');
    }

    let profile = null;
    if (role === 'instructor') {
      const categories = readCategories(instructor.categories);
      const approvalNumber = text(instructor.approvalNumber, 50);
      if (!approvalNumber) throw new HttpError(400, 'Le numéro d’agrément (brevet de moniteur) est requis.');
      const hasPosition = instructor.lat != null || instructor.lng != null;
      const position = hasPosition ? readPosition(instructor.lat, instructor.lng) : { lat: null, lng: null };
      profile = {
        categories,
        approvalNumber,
        rateCents: instructor.hourlyRate == null ? 5500 : readRate(instructor.hourlyRate),
        languages: instructor.languages == null ? ['fr'] : readLanguages(instructor.languages),
        transmission: instructor.transmission == null ? 'manuelle' : readTransmission(instructor.transmission),
        ...position,
      };
    }

    let user;
    try {
      user = await db.transaction(async (tx) => {
        const { lastInsertRowid } = await tx.run(
          `INSERT INTO users (role, first_name, last_name, email, password_hash, phone, city)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          role,
          firstName,
          lastName,
          email,
          hashPassword(password),
          optionalText(body.phone, 30),
          optionalText(body.city, 80),
        );
        if (profile) {
          await tx.run(
            `INSERT INTO instructors (user_id, bio, school_name, approval_number, categories, languages,
               transmission, vehicle, hourly_rate_cents, lat, lng)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            lastInsertRowid,
            text(instructor.bio, 2000),
            text(instructor.schoolName, 120),
            profile.approvalNumber,
            JSON.stringify(profile.categories),
            JSON.stringify(profile.languages),
            profile.transmission,
            text(instructor.vehicle, 120),
            profile.rateCents,
            profile.lat,
            profile.lng,
          );
        }
        return tx.get('SELECT * FROM users WHERE id = ?', lastInsertRowid);
      });
    } catch (err) {
      // Deux inscriptions simultanées avec le même e-mail : la seconde perd.
      if (isUniqueViolation(err)) throw new HttpError(409, 'Un compte existe déjà avec cette adresse e-mail.');
      throw err;
    }

    res.status(201).json({ token: createToken(user), user: serializeUser(user) });
  });

  router.post('/login', async (req, res) => {
    const email = text(req.body?.email, 254).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const key = `${req.ip}|${email}`;
    const now = Date.now();

    const attempts = await db.get('SELECT failures, first_at FROM login_attempts WHERE key = ?', key);
    const recent = attempts && now - attempts.first_at < FAILURE_WINDOW_MS;
    if (recent && attempts.failures >= MAX_FAILURES) {
      res.set('Retry-After', String(Math.ceil((attempts.first_at + FAILURE_WINDOW_MS - now) / 1000)));
      throw new HttpError(429, 'Trop de tentatives. Réessaie dans quelques minutes.');
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    // Vérification faite même sans compte : même temps de réponse dans les deux cas.
    const valid = verifyPassword(password, user?.password_hash) && Boolean(user);
    if (!valid) {
      await db.run(
        `INSERT INTO login_attempts (key, failures, first_at) VALUES (?, 1, ?)
           ON CONFLICT(key) DO UPDATE SET
             failures = CASE WHEN ? - first_at < ? THEN failures + 1 ELSE 1 END,
             first_at = CASE WHEN ? - first_at < ? THEN first_at ELSE ? END`,
        key, now, now, FAILURE_WINDOW_MS, now, FAILURE_WINDOW_MS, now,
      );
      throw new HttpError(401, 'E-mail ou mot de passe incorrect.');
    }
    if (attempts) await db.run('DELETE FROM login_attempts WHERE key = ? OR first_at < ?', key, now - FAILURE_WINDOW_MS);
    res.json({ token: createToken(user), user: serializeUser(user) });
  });

  router.get('/me', requireAuth(), async (req, res) => {
    res.json({ user: serializeUser(req.user) });
  });

  return router;
}
