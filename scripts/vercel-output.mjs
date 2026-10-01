// Génère la sortie finale de Vercel (Build Output API v3) dans .vercel/output.
// Vercel la déploie telle quelle, sans dépendre des réglages du projet
// (préréglage de framework, « Output Directory », lecture de vercel.json…).
// Ne fait rien en dehors d'un build Vercel.
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

if (!process.env.VERCEL) {
  process.exit(0);
}

const OUT = '.vercel/output';
const FUNC = `${OUT}/functions/api.func`;
rmSync(OUT, { recursive: true, force: true });

// 1. Site statique
cpSync('client/dist', `${OUT}/static`, { recursive: true });

// 2. API Express en une seule fonction, toutes dépendances incluses.
mkdirSync(FUNC, { recursive: true });
await build({
  entryPoints: ['api/index.js'],
  outfile: `${FUNC}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Client SQLite natif (base locale) laissé de côté : en production, Turso passe par
  // le client web (@libsql/client/web), lui bien inclus dans la fonction.
  plugins: [
    {
      name: 'exclure-sqlite-natif',
      setup(b) {
        b.onResolve({ filter: /^@libsql\/client$/ }, (args) => ({ path: args.path, external: true }));
      },
    },
  ],
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'warning',
});
writeFileSync(
  `${FUNC}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      maxDuration: 10,
      regions: ['cdg1'],
    },
    null,
    2,
  ),
);

// 3. Routage : API, cache des fichiers, puis application (SPA).
writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: '^/assets/(.*)$',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        {
          src: '^/(.*)$',
          headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' },
          continue: true,
        },
        { src: '^/api(?:/(.*))?$', dest: '/api?__path=$1' },
        { handle: 'filesystem' },
        { src: '^/(.*)$', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
);
console.log('Sortie Vercel générée dans .vercel/output (site + API).');
