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

// Les routes Vercel envoient /api/<chemin> vers /api?__path=<chemin> :
// on restaure l'adresse d'origine pour qu'Express trouve la bonne route,
// quelle que soit la façon dont la plateforme réécrit l'URL.
function restoreOriginalUrl(req) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.searchParams.get('__path');
  if (path === null) return;
  url.searchParams.delete('__path');
  req.url = `/api/${path.replace(/^\/+/, '')}${url.search}`;
}

// Cause lisible (sans secret) pour savoir quoi corriger dans les réglages Vercel.
function describeInitError(err) {
  const message = String(err?.message ?? err)
    .replaceAll(process.env.TURSO_AUTH_TOKEN || '\u0000', '***')
    .slice(0, 200);
  if (!process.env.TURSO_DATABASE_URL) return `Base locale indisponible : ${message}`;
  if (/401|403|unauthori[sz]ed|forbidden|jwt|token/i.test(message)) {
    return `Turso refuse la connexion : vérifie TURSO_AUTH_TOKEN (${message})`;
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|404|not found|invalid url|URL_INVALID/i.test(message)) {
    return `Base Turso introuvable : vérifie TURSO_DATABASE_URL (${message})`;
  }
  return `Erreur Turso : ${message}`;
}

export default async function handler(req, res) {
  restoreOriginalUrl(req);
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
    res.end(
      JSON.stringify({
        error: 'Service momentanément indisponible, réessaie dans quelques secondes.',
        detail: describeInitError(err),
      }),
    );
  }
}
