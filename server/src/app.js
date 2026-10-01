import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authMiddleware } from './auth.js';
import { PERMITS, PERMIT_GROUPS } from './data/permits.js';
import { errorHandler } from './errors.js';
import { authRoutes } from './routes/auth.js';
import { bookingRoutes } from './routes/bookings.js';
import { instructorRoutes } from './routes/instructors.js';
import { theoryRoutes } from './routes/theory.js';

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp(db) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(authMiddleware(db));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/permits', (_req, res) => res.json({ groups: PERMIT_GROUPS, permits: PERMITS }));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/instructors', instructorRoutes(db));
  app.use('/api/bookings', bookingRoutes(db));
  app.use('/api/theory', theoryRoutes(db));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue.' }));

  // En production, le serveur sert aussi l'application web compilée.
  if (existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: CLIENT_DIST }));
  }

  app.use(errorHandler);
  return app;
}
