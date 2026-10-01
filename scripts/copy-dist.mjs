// Copie l'app compilée (client/dist) vers dist/ à la racine : c'est le dossier
// que Vercel attend par défaut (« Output Directory » = dist).
import { cpSync, existsSync, rmSync } from 'node:fs';

if (!existsSync('client/dist/index.html')) {
  console.error('client/dist introuvable : le build du client a échoué.');
  process.exit(1);
}
rmSync('dist', { recursive: true, force: true });
cpSync('client/dist', 'dist', { recursive: true });
console.log('App copiée dans dist/.');
