import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setBlobApiForTests } from '../src/blobSync.js';
import { openDb } from '../src/db.js';

// Faux Vercel Blob en mémoire, avec ETag et écritures conditionnelles comme le vrai service.
class BlobNotFoundError extends Error {}
class BlobPreconditionFailedError extends Error {}
const store = new Map();
let version = 0;
setBlobApiForTests({
  BlobNotFoundError,
  BlobPreconditionFailedError,
  async get(path) {
    const item = store.get(path);
    if (!item) return null;
    return { statusCode: 200, stream: new Blob([item.bytes]).stream(), blob: { etag: item.etag } };
  },
  async head(path) {
    const item = store.get(path);
    if (!item) throw new BlobNotFoundError('not found');
    return { etag: item.etag };
  },
  async put(path, bytes, options) {
    const item = store.get(path);
    if (options.ifMatch && item?.etag !== options.ifMatch) throw new BlobPreconditionFailedError('etag');
    if (!options.ifMatch && options.allowOverwrite === false && item) throw new Error('This blob already exists');
    const etag = `"v${++version}"`;
    store.set(path, { bytes: Buffer.from(bytes), etag });
    return { etag };
  },
});

const dir = mkdtempSync(join(tmpdir(), 'blobsync-'));
const env = { ...process.env };
process.env.BLOB_READ_WRITE_TOKEN = 'test';
delete process.env.TURSO_DATABASE_URL;
after(() => {
  process.env = env;
  rmSync(dir, { recursive: true, force: true });
});

const instance = (name) => openDb(join(dir, name, 'db.sqlite'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('les données survivent à une nouvelle instance et passent d’une instance à l’autre', async () => {
  const a = await instance('a');
  assert.equal(a.persistent, true);
  assert.equal(await a.sync.flush(), true); // première sauvegarde (schéma)
  await a.run(`INSERT INTO users (role, first_name, last_name, email, password_hash) VALUES ('student', 'Léa', 'A', 'lea@x.be', 'h')`);
  assert.equal(await a.sync.flush(), true);
  assert.equal(await a.sync.flush(), false); // rien de neuf

  // Nouvelle instance (démarrage à froid) : elle retrouve le compte.
  const b = await instance('b');
  assert.ok(await b.get(`SELECT 1 FROM users WHERE email = 'lea@x.be'`));

  // B écrit ; A recharge la version de B à sa prochaine requête.
  await b.run(`INSERT INTO users (role, first_name, last_name, email, password_hash) VALUES ('student', 'Tom', 'B', 'tom@x.be', 'h')`);
  await b.sync.flush();
  await wait(1100);
  await a.sync.ensureFresh();
  assert.ok(await a.get(`SELECT 1 FROM users WHERE email = 'tom@x.be'`));
  a.close();
  b.close();
});

test('conflit : une instance en retard ne remplace pas une version plus récente', async () => {
  const c = await instance('c');
  const d = await instance('d');
  await c.run(`INSERT INTO users (role, first_name, last_name, email, password_hash) VALUES ('student', 'C', 'C', 'c@x.be', 'h')`);
  await c.sync.flush();
  await d.run(`INSERT INTO users (role, first_name, last_name, email, password_hash) VALUES ('student', 'D', 'D', 'd@x.be', 'h')`);
  assert.equal(await d.sync.flush(), 'conflict');
  // D a repris la version de C (la plus récente) : rien n'est écrasé.
  assert.ok(await d.get(`SELECT 1 FROM users WHERE email = 'c@x.be'`));
  const e = await instance('e');
  assert.ok(await e.get(`SELECT 1 FROM users WHERE email = 'c@x.be'`));
  c.close();
  d.close();
  e.close();
});
