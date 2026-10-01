// Point d'entrée Vercel : l'API Express tourne comme une fonction serverless.
// Les données doivent vivre dans une base hébergée (Turso) : Vercel lance plusieurs
// instances éphémères, chacune avec son propre disque, effacé à chaque démarrage.
import { createApp } from '../server/src/app.js';
import { openDb } from '../server/src/db.js';
import { seedIfEmpty } from '../server/src/seed.js';

if (!process.env.TURSO_DATABASE_URL) {
  console.warn('TURSO_DATABASE_URL non défini : données stockées dans /tmp, perdues entre les instances.');
}

// Initialisation une seule fois par instance, partagée entre les requêtes.
const ready = (async () => {
  const db = await openDb(process.env.DB_FILE || '/tmp/autoschub.db');
  if (process.env.SEED !== '0') await seedIfEmpty(db);
  return createApp(db);
})();

export default async function handler(req, res) {
  const app = await ready;
  return app(req, res);
}
