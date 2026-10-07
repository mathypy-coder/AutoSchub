// Génère la sortie finale de Vercel (Build Output API v3) : site + API + routage.
// Vercel la déploie telle quelle, sans dépendre des réglages du projet
// (préréglage de framework, « Output Directory », vercel.json ignoré, ou
// « Root Directory » = client). Ne fait rien en dehors d'un build Vercel.
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.VERCEL) process.exit(0);

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// Vercel lit .vercel/output dans le dossier racine du projet, là où le build a été lancé
// (racine du dépôt, ou client/ si le projet est configuré ainsi).
const PROJECT_DIR = process.env.INIT_CWD || process.cwd();
const OUT = join(PROJECT_DIR, '.vercel/output');
const FUNC = join(OUT, 'functions/api.func');

// Projet Vercel limité à client/ : npm n'a installé que les dépendances du client.
const fromServer = createRequire(join(ROOT, 'server/package.json'));
try {
  fromServer.resolve('express');
  fromServer.resolve('@libsql/client/web');
  fromServer.resolve('@anthropic-ai/sdk');
} catch {
  console.log('Installation des dépendances du serveur…');
  execSync('npm install --workspaces --include-workspace-root --no-audit --no-fund', { cwd: ROOT, stdio: 'inherit' });
}
const { build } = await import('esbuild');

rmSync(OUT, { recursive: true, force: true });

// 1. Site statique
const dist = join(ROOT, 'client/dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('client/dist introuvable : lance d’abord le build du client.');
cpSync(dist, join(OUT, 'static'), { recursive: true });

// 2. API Express en une seule fonction, toutes dépendances incluses.
mkdirSync(FUNC, { recursive: true });
await build({
  entryPoints: [join(ROOT, 'api/index.js')],
  outfile: join(FUNC, 'index.mjs'),
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
  // Secret de connexion commun à toutes les instances de ce déploiement (voir server/src/auth.js).
  // Il reste dans le code serveur : jamais envoyé aux navigateurs.
  define: { 'process.env.AUTOSCHUB_BUILD_SECRET': JSON.stringify(randomBytes(32).toString('hex')) },
  logLevel: 'warning',
});
writeFileSync(
  join(FUNC, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      maxDuration: 30,
      regions: ['cdg1'],
    },
    null,
    2,
  ),
);

// 3. Routage : en-têtes, API, fichiers statiques, puis application (SPA).
writeFileSync(
  join(OUT, 'config.json'),
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
console.log(`Sortie Vercel générée dans ${OUT} (site + API).`);
