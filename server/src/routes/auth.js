import { Router } from 'express';
import { createToken, hashPassword, requireAuth, verifyPassword } from '../auth.js';
import { transaction } from '../db.js';
import { PERMIT_CODES } from '../data/permits.js';
import { serializeUser } from '../serializers.js';
import { HttpError } from '../errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function authRoutes(db) {
  const router = Router();

  router.post('/register', (req, res) => {
    const { role, firstName, lastName, email, password, phone, city, instructor = {} } = req.body ?? {};
    if (!['student', 'instructor'].includes(role)) throw new HttpError(400, 'Rôle invalide.');
    if (!firstName?.trim() || !lastName?.trim()) throw new HttpError(400, 'Nom et prénom requis.');
    if (!EMAIL_RE.test(email ?? '')) throw new HttpError(400, 'Adresse e-mail invalide.');
    if (typeof password !== 'string' || password.length < 8) {
      throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalizedEmail)) {
      throw new HttpError(409, 'Un compte existe déjà avec cette adresse e-mail.');
    }

    let categories = [];
    if (role === 'instructor') {
      categories = (instructor.categories ?? []).filter((c) => PERMIT_CODES.includes(c));
      if (!categories.length) throw new HttpError(400, 'Indiquez au moins une catégorie de permis enseignée.');
      if (!instructor.approvalNumber?.trim()) {
        throw new HttpError(400, 'Le numéro d’agrément (brevet de moniteur) est requis.');
      }
    }

    const user = transaction(db, () => {
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO users (role, first_name, last_name, email, password_hash, phone, city)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(role, firstName.trim(), lastName.trim(), normalizedEmail, hashPassword(password), phone ?? null, city ?? null);
      if (role === 'instructor') {
        const rate = Number(instructor.hourlyRate) || 55;
        db.prepare(
          `INSERT INTO instructors (user_id, bio, school_name, approval_number, categories, languages,
             transmission, vehicle, hourly_rate_cents, lat, lng)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          lastInsertRowid,
          instructor.bio ?? '',
          instructor.schoolName ?? '',
          instructor.approvalNumber.trim(),
          JSON.stringify(categories),
          JSON.stringify(instructor.languages?.length ? instructor.languages : ['fr']),
          ['manuelle', 'automatique', 'les deux'].includes(instructor.transmission) ? instructor.transmission : 'manuelle',
          instructor.vehicle ?? '',
          Math.round(rate * 100),
          instructor.lat ?? null,
          instructor.lng ?? null,
        );
      }
      return db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
    });

    res.status(201).json({ token: createToken(user), user: serializeUser(user) });
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim().toLowerCase());
    if (!user || !verifyPassword(String(password ?? ''), user.password_hash)) {
      throw new HttpError(401, 'E-mail ou mot de passe incorrect.');
    }
    res.json({ token: createToken(user), user: serializeUser(user) });
  });

  router.get('/me', requireAuth(), (req, res) => {
    res.json({ user: serializeUser(req.user) });
  });

  return router;
}
