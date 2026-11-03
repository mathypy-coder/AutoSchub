# Architecture technique

Responsable : **Barthélemy**. Détails d'installation et de déploiement : [README](../../README.md).

```
client/  React 19 + Vite (PWA mobile-first, Leaflet/OpenStreetMap)
server/  Node 22 + Express 5 — API REST, auth par jeton HMAC, mots de passe scrypt
         SQLite local (node:sqlite) / Turso en production
api/     Point d'entrée serverless Vercel
scripts/ Build : copie dist/ et génère .vercel/output
```

- Hébergement : Vercel (région Paris `cdg1`), base Turso.
- Tests : `npm test` (inscription, recherche géographique, cycle de réservation, barème théorie).

## Chantiers techniques à prévoir

- Environnements séparés **démo / production** (aujourd'hui des comptes de démo sont créés automatiquement).
- Sauvegardes de la base et plan de reprise.
- Intégration continue (tests automatiques sur chaque pull request).
- Revue sécurité avant d'accueillir de vraies données personnelles.
