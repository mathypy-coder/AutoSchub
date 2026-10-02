import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Le secret doit être identique sur toutes les instances (Vercel en lance plusieurs),
// sinon une connexion faite sur une instance est refusée par une autre (« Authentification requise »).
// Ordre : AUTH_SECRET, puis dérivé du jeton Turso, puis secret généré au build de la
// fonction Vercel (commun à toutes ses instances, renouvelé à chaque déploiement).
function resolveSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.TURSO_AUTH_TOKEN) {
    return createHash('sha256').update(`autoschub-auth:${process.env.TURSO_AUTH_TOKEN}`).digest('hex');
  }
  if (process.env.AUTOSCHUB_BUILD_SECRET) return process.env.AUTOSCHUB_BUILD_SECRET;
  if (process.env.VERCEL) {
    console.warn('AUTH_SECRET non défini : les connexions ne survivront pas aux redémarrages des fonctions.');
  }
  return randomBytes(32).toString('hex');
}

const SECRET = resolveSecret();
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

function sign(data) {
  return createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function createToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ uid: user.id, role: user.role, exp: Date.now() + TOKEN_TTL_MS }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readToken(token) {
  if (typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function authMiddleware(db) {
  return async (req, _res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const data = readToken(token);
    if (data) req.user = (await db.get('SELECT * FROM users WHERE id = ?', data.uid)) || null;
    next();
  };
}

export function requireAuth(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentification requise.' });
    if (role && req.user.role !== role) {
      return res.status(403).json({ error: 'Accès réservé.' });
    }
    next();
  };
}
