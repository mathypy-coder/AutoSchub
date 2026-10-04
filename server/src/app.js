import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authMiddleware, SECRET_SOURCE } from './auth.js';
import { PERMITS, PERMIT_GROUPS } from './data/permits.js';
import { errorHandler } from './errors.js';
import { authRoutes } from './routes/auth.js';
import { bookingRoutes } from './routes/bookings.js';
import { examCenterRoutes } from './routes/examCenters.js';
import { progressRoutes } from './routes/progress.js';
import { demoEnabled } from './seed.js';
import { instructorRoutes } from './routes/instructors.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { theoryRoutes } from './routes/theory.js';

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));

// Données publiques qui changent rarement : mises en cache par le CDN (Vercel)
// pour éviter de réveiller la fonction serverless à chaque visite.
const PUBLIC_CACHE = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
const cachePublic = (_req, res, next) => {
  res.set('Cache-Control', PUBLIC_CACHE);
  next();
};

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  // Sur Vercel, l'adresse du client arrive par X-Forwarded-For (posé par la plateforme) : utile
  // pour limiter les tentatives de connexion. Ailleurs, l'en-tête pourrait être falsifié.
  if (process.env.VERCEL || process.env.TRUST_PROXY === '1') app.set('trust proxy', true);
  app.use(express.json({ limit: '100kb' }));

  // Diagnostic de configuration (sans révéler de secret).
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({
      ok: true,
      database: db.isRemote ? 'turso' : 'locale',
      authSecret: SECRET_SOURCE,
      region: process.env.VERCEL_REGION ?? null,
    });
  });
  // Configuration publique pour l'app (ex. afficher ou non les comptes de démo).
  app.get('/api/config', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json({
      demo: demoEnabled() && process.env.DEMO_LOGIN !== '0',
      // Sur Vercel sans base Turso, chaque instance a sa propre base temporaire :
      // les comptes créés peuvent disparaître. L'app l'indique clairement.
      persistent: db.isRemote || !process.env.VERCEL,
    });
  });
  app.get('/api/permits', cachePublic, (_req, res) => res.json({ groups: PERMIT_GROUPS, permits: PERMITS }));
  app.get(['/api/exam-centers', '/api/subscriptions/plans', '/api/theory/categories'], cachePublic);

  app.use(authMiddleware(db));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/instructors', instructorRoutes(db));
  app.use('/api/bookings', bookingRoutes(db));
  app.use('/api/theory', theoryRoutes(db));
  app.use('/api/subscriptions', subscriptionRoutes(db));
  app.use('/api/exam-centers', examCenterRoutes());
  app.use('/api/progress', progressRoutes(db));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue.' }));

  // En production, le serveur sert aussi l'application web compilée.
  if (existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: CLIENT_DIST }));
  }

  app.use(errorHandler);
  return app;
}
