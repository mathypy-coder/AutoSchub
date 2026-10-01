// Point d'entrée Vercel : l'API Express tourne comme une fonction serverless.
// Le système de fichiers de Vercel est en lecture seule sauf /tmp, et ce stockage
// est éphémère (perdu à chaque démarrage à froid) : pour des données durables,
// brancher une base hébergée (Turso, Neon…).
import { createApp } from '../server/src/app.js';
import { openDb } from '../server/src/db.js';
import { seedIfEmpty } from '../server/src/seed.js';

const db = openDb(process.env.DB_FILE || '/tmp/autoschub.db');
if (process.env.SEED !== '0') seedIfEmpty(db);

export default createApp(db);
