// Point d'entrée Vercel : l'API Express tourne comme une fonction serverless.
// Les données doivent vivre dans une base hébergée (Turso) : Vercel lance plusieurs
// instances éphémères, chacune avec son propre disque, effacé à chaque démarrage.
import { createApp } from '../server/src/app.js';
import { openDb } from '../server/src/db.js';
import { seedDemo } from '../server/src/seed.js';

if (!process.env.TURSO_DATABASE_URL) {
  console.warn('TURSO_DATABASE_URL non défini : données stockées dans /tmp, perdues entre les instances.');
}

async function init() {
  const db = await openDb(process.env.DB_FILE || '/tmp/autoschub.db');
  await seedDemo(db);
  return createApp(db);
}

// Initialisation une seule fois par instance, partagée entre les requêtes.
// En cas d'échec (base injoignable…), on réessaie à la requête suivante
// au lieu de laisser l'instance en panne jusqu'à son recyclage.
let ready = null;

export default async function handler(req, res) {
  ready ??= init().catch((err) => {
    ready = null;
    throw err;
  });
  try {
    const app = await ready;
    return app(req, res);
  } catch (err) {
    console.error('Initialisation de l’API impossible :', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Retry-After', '5');
    res.end(JSON.stringify({ error: 'Service momentanément indisponible, réessaie dans quelques secondes.' }));
  }
}
