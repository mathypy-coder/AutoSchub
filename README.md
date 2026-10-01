# AutoSchub — le Uber de l’auto-école en Belgique

Application mobile-first (PWA) qui met en relation **élèves** et **moniteurs agréés** pour tous les permis motorisés belges,
avec un module de **théorie** intégré.

- **Élève** : choisit sa catégorie de permis, voit les moniteurs autour de lui sur une carte, réserve une leçon
  *maintenant* (moniteur en ligne) ou *planifiée*, suit son moniteur « en route », puis le note.
- **Moniteur** : comme un chauffeur Uber, il passe **en ligne / hors ligne**, partage sa position, reçoit les demandes,
  les accepte ou les refuse, fait avancer la leçon (en route → en cours → terminée), laisse un retour pédagogique
  et suit ses gains (commission plateforme 20 %).
- **Théorie** : entraînement par thème et examens blancs au barème belge (réussite à 41/50, faute grave = 5 points),
  correction détaillée et historique.

## Permis couverts

| Groupe | Catégories |
| --- | --- |
| Deux-roues | AM, A1, A2, A |
| Voiture | B, BE |
| Poids lourds | C1, C1E, C, CE |
| Bus | D1, D1E, D, DE |
| Agricole | G |

## Stack

- `server/` — Node.js 22, Express 5, SQLite intégré (`node:sqlite`), auth par jeton signé HMAC + mots de passe scrypt.
- `client/` — React 19 + Vite, React Router, Leaflet / OpenStreetMap pour la carte.

## Démarrer

```bash
npm install
npm run dev:server   # API sur http://localhost:3001 (crée des données de démo au premier lancement)
npm run dev:client   # app sur http://localhost:5173 (proxy /api → 3001)
```

Production (un seul process qui sert l’API et l’app compilée) :

```bash
npm run build
AUTH_SECRET=une-longue-valeur-secrète npm start
```

Comptes de démo (mot de passe `demo1234`) : `eleve@autoschub.be` et `moniteur@autoschub.be`
(10 moniteurs répartis à Bruxelles, Gand, Anvers, Liège, Namur, Charleroi, Mons, Eupen…).

Variables d’environnement : `PORT` (3001), `DB_FILE` (`data/autoschub.db`), `AUTH_SECRET`
(aléatoire par défaut — les sessions sont alors perdues au redémarrage), `SEED=0` pour désactiver la démo.

## Déployer sur Vercel

`vercel.json` est fourni : le site compilé est servi depuis `client/dist` et l’API Express tourne comme
fonction serverless (`api/index.js`). Dans les réglages du projet Vercel :

- **Root Directory** : la racine du dépôt (pas `client/` ni `server/`), *Framework Preset* : « Other ».
- **Node.js Version** : 22.x (requis pour `node:sqlite`).
- **Variable d’environnement** `AUTH_SECRET` : une longue chaîne aléatoire (sinon les connexions expirent
  à chaque redémarrage de fonction).

⚠️ Sur Vercel, la base SQLite vit dans `/tmp` : elle est **éphémère** (les comptes de démo sont recréés,
mais les inscriptions et réservations peuvent disparaître). Pour la production, brancher une base hébergée
(Turso, Neon, Supabase…).

## Tests

```bash
npm test
```

Couvre l’inscription/connexion, la recherche géographique, tout le cycle d’une réservation
(conflits de créneaux, droits par rôle, notation, gains) et le barème de l’examen théorique.

## API (résumé)

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | — |
| GET | `/api/permits` | — |
| GET | `/api/instructors?lat&lng&category&transmission&language&onlineOnly` | — |
| GET/PATCH | `/api/instructors/me/profile`, GET `/api/instructors/me/stats` | moniteur |
| GET/POST | `/api/bookings` | élève (création) |
| POST | `/api/bookings/:id/status` (`accepted`, `declined`, `en_route`, `in_progress`, `completed`, `cancelled`) | selon l’étape |
| POST | `/api/bookings/:id/review`, `/api/bookings/:id/feedback` | élève / moniteur |
| GET | `/api/theory/categories`, `/api/theory/quiz`, POST `/api/theory/submit`, GET `/api/theory/history` | — |

## Pistes pour la suite

- Paiement en ligne (Bancontact / Payconiq via Stripe ou Mollie) et facturation.
- Suivi temps réel par WebSocket (aujourd’hui : rafraîchissement toutes les 5 s).
- Vérification des agréments moniteurs (back-office) et des permis provisoires des élèves.
- Traductions NL / DE / EN et banque de questions élargie (≥ 50 questions par catégorie, panneaux illustrés).
  Les questions actuelles sont indicatives et doivent être validées par un moniteur agréé.
- Agenda de disponibilités hebdomadaires pour les moniteurs, véhicule de l’élève pour la filière libre.
