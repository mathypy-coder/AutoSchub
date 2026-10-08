// Sauvegarde de la base SQLite dans Vercel Blob (sans service de base de données externe).
//
// Sur Vercel, chaque instance a un disque éphémère (/tmp). Quand BLOB_READ_WRITE_TOKEN est défini
// (stockage Blob relié au projet) et qu'il n'y a pas de base Turso :
// - au démarrage, l'instance télécharge la dernière copie de la base ;
// - avant chaque requête (au plus une fois par seconde), elle vérifie si une autre instance
//   a enregistré une version plus récente et la recharge ;
// - après chaque requête qui a modifié des données, elle renvoie la base avant de répondre.
// L'ETag garantit qu'une instance n'écrase pas une version plus récente sans le savoir.
// Convient à un trafic modéré ; au-delà, une base hébergée (Turso) reste préférable.
import { writeFileSync } from 'node:fs';

const BLOB_PATH = 'autoschub/database.sqlite';
const FRESHNESS_MS = 1000;

export const blobSyncEnabled = (env = process.env) =>
  Boolean(env.BLOB_READ_WRITE_TOKEN) && !env.TURSO_DATABASE_URL?.trim() && env.BLOB_SYNC !== '0';

let api = null;
async function blobApi() {
  api ??= await import('@vercel/blob');
  return api;
}
// Tests : remplace le SDK Vercel Blob par une implémentation en mémoire.
export const setBlobApiForTests = (fake) => {
  api = fake;
};

async function download(path) {
  const { get } = await blobApi();
  const result = await get(BLOB_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  writeFileSync(path, bytes);
  return result.blob.etag ?? null;
}

// Télécharge la base avant son ouverture. Renvoie l'ETag de la copie (null si aucune copie).
export async function restoreDatabase(path) {
  try {
    return await download(path);
  } catch (err) {
    console.error('Vercel Blob : lecture de la base impossible.', err?.message ?? err);
    throw err;
  }
}

export function createBlobSync(db, path, initialEtag) {
  let etag = initialEtag;
  // Aucune copie encore enregistrée (ou migration à l'ouverture) : la base est à sauvegarder.
  let savedChanges = initialEtag ? db.client.totalChanges() : -1;
  let lastCheck = Date.now();
  let queue = Promise.resolve();

  // Une seule opération de synchronisation à la fois par instance.
  const serial = (task) => {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  };

  const reload = async () => {
    const tmp = `${path}.download`;
    const remoteEtag = await download(tmp);
    if (!remoteEtag) return;
    await db.client.replaceWith(tmp);
    etag = remoteEtag;
    savedChanges = db.client.totalChanges();
  };

  return {
    get etag() {
      return etag;
    },

    // Avant une requête : recharger si une autre instance a enregistré une version plus récente.
    ensureFresh: () =>
      serial(async () => {
        if (Date.now() - lastCheck < FRESHNESS_MS) return;
        lastCheck = Date.now();
        if (db.client.totalChanges() !== savedChanges) return; // modifications locales en attente
        const { head, BlobNotFoundError } = await blobApi();
        try {
          const info = await head(BLOB_PATH);
          if (info.etag !== etag) await reload();
        } catch (err) {
          if (!(err instanceof BlobNotFoundError)) console.error('Vercel Blob :', err?.message ?? err);
        }
      }),

    // Après une requête : envoyer la base si elle a changé.
    flush: () =>
      serial(async () => {
        const changes = db.client.totalChanges();
        if (changes === savedChanges) return false;
        const { put, BlobPreconditionFailedError } = await blobApi();
        const bytes = await db.client.snapshot();
        try {
          const result = await put(BLOB_PATH, bytes, {
            access: 'private',
            addRandomSuffix: false,
            contentType: 'application/x-sqlite3',
            cacheControlMaxAge: 60,
            ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
          });
          etag = result.etag;
          savedChanges = changes;
          lastCheck = Date.now();
          return true;
        } catch (err) {
          if (err instanceof BlobPreconditionFailedError || /already exists/i.test(String(err?.message))) {
            // Une autre instance a enregistré entre-temps : on reprend sa version (la plus récente).
            // Les modifications de cette requête sont abandonnées : l'app demande de réessayer.
            console.warn('Vercel Blob : version plus récente trouvée, rechargement.');
            await reload();
            return 'conflict';
          }
          throw err;
        }
      }),
  };
}
