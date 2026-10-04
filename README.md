# AutoSchub — le Uber de l’auto-école en Belgique

Application mobile-first (PWA) qui met en relation **élèves** et **moniteurs agréés** pour tous les permis motorisés belges,
avec un module de **théorie** intégré.

- **Élève** : choisit sa catégorie de permis, voit les moniteurs autour de lui sur une carte, réserve une leçon
  *maintenant* (moniteur en ligne) ou *planifiée*, suit son moniteur « en route », puis le note.
- **Moniteur** : comme un chauffeur Uber, il passe **en ligne / hors ligne**, partage sa position, reçoit les demandes,
  les accepte ou les refuse, fait avancer la leçon (en route → en cours → terminée), laisse un retour pédagogique
  et suit ses gains (commission plateforme 20 %).
- **Packs d’abonnement** (Théorie 9,99 €, Conduite 149 €, Intégral 279 € / mois, liés à une catégorie de permis) :
  heures de conduite incluses chaque mois, réduction sur les heures supplémentaires, examens blancs illimités
  (2 par semaine sans pack) et **suivi du parcours complet** — théorie réussie, permis provisoire, heures de conduite
  vs objectif, examen pratique planifié, permis obtenu — avec conseil sur la prochaine étape et moniteur référent.
  Le moniteur est toujours payé au prix plein de la leçon ; le paiement de l’abonnement est simulé.
  Un changement de formule prend effet au renouvellement suivant ; déclarer le permis obtenu arrête le
  renouvellement et le pack se termine à la fin du mois en cours.
- **Demandes sans réponse** : une demande « maintenant » expire après 15 min, une demande planifiée à son heure de
  début ; le créneau est libéré et les heures du pack rendues.
- **Centres d’examen** : les 32 centres agréés (2 à Bruxelles, 14 en Wallonie, 16 en Flandre) affichés sur la carte
  de réservation, et un onglet de recherche (ville, code postal, opérateur, Région, tri par distance) avec itinéraire,
  lien de prise de rendez-vous et réservation d’une leçon près du centre. Coordonnées GPS approximatives.
- **Réservation sur créneaux** : chaque moniteur définit ses disponibilités hebdomadaires (heure belge) ;
  l’élève choisit un jour puis un créneau libre (les leçons déjà prévues sont exclues, réservation jusqu’à 60 jours).
- **Fiche de suivi des compétences** : après chaque leçon, le moniteur note chaque compétence de 0 à 3
  (installation, priorités, ronds-points, créneau, autoroute… adaptées à la moto, au camion, au bus ou au tracteur).
  L’élève voit sa fiche dans son profil ; le parcours du pack inclut « 80 % des compétences maîtrisées ».
- **Messagerie** élève ↔ moniteur par leçon, avec compteur de messages non lus.
- **Agenda** : ajout d’une leçon au calendrier du téléphone (.ics avec rappel 1 h avant) ; « Réserver à nouveau ».
- **Théorie adaptative** : les questions ratées reviennent en révision jusqu’à deux bonnes réponses d’affilée,
  réussite par thème et score de préparation (objectif 85 %).
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

- `server/` — Node.js 22, Express 5, SQLite intégré à Node (`node:sqlite`) en local, Turso (`@libsql/client/web`) en production,
  auth par jeton signé HMAC + mots de passe scrypt.
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

Comptes de démo (mot de passe `demo1234`) : `eleve@autoschub.be` (sans pack), `eleve.pack@autoschub.be`
(pack Intégral permis B déjà avancé : théorie réussie, permis provisoire, 8 h de conduite, une leçon à venir)
et `moniteur@autoschub.be`
(10 moniteurs répartis à Bruxelles, Gand, Anvers, Liège, Namur, Charleroi, Mons, Eupen…).

Variables d’environnement : `PORT` (3001), `DB_FILE` (`data/autoschub.db`, base locale),
`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (base hébergée, prioritaire sur `DB_FILE`), `AUTH_SECRET`
(aléatoire par défaut — les sessions sont alors perdues au redémarrage), `SEED=0` / `SEED=1` pour désactiver / forcer la démo,
`DEMO_PACK=0` pour ne pas créer l’élève avec pack, `TRUST_PROXY=1` derrière un proxy de confiance (adresse IP du client,
utilisée pour limiter les tentatives de connexion ; automatique sur Vercel).

Les comptes de démo ont un mot de passe public : ils sont créés par défaut **en local uniquement**. En production
(Vercel ou base Turso), il faut les demander avec `SEED=1`, à réserver à une instance de démonstration.

## Déployer sur Vercel

`vercel.json` est fourni : le site compilé est copié dans `dist/` (dossier attendu par Vercel) et l’API Express tourne comme
fonction serverless (`api/index.js`).

Vercel lance plusieurs instances éphémères de l’API : les données doivent donc vivre dans une **base hébergée**,
sinon packs, leçons et inscriptions disparaissent ou n’apparaissent que par moments. L’app utilise
[Turso](https://turso.tech) (SQLite hébergé, offre gratuite) :

1. Crée une base sur turso.tech (ou `turso db create autoschub`), puis récupère son URL (`libsql://…`)
   et un jeton (`turso db tokens create autoschub`).
2. Dans Vercel → *Settings* → *Environment Variables*, ajoute :
   - `TURSO_DATABASE_URL` = l’URL `libsql://…`
   - `TURSO_AUTH_TOKEN` = le jeton
   - (facultatif) `AUTH_SECRET` = une longue chaîne aléatoire ; sinon il est dérivé du jeton Turso.
3. Redéploie. Les tables sont créées automatiquement au premier appel. Les comptes de démo ne sont
   créés que si `SEED=1` (instance de démonstration uniquement : leur mot de passe est public).
   Une base qui les contient déjà les garde : supprime-les si l’instance sert de vrais élèves.

Le build génère aussi directement la sortie finale de Vercel (`.vercel/output`, « Build Output API » :
site, fonction API compilée avec esbuild et routage). Le déploiement fonctionne donc même si le projet
Vercel ignore `vercel.json`, utilise un autre préréglage (Vite…) ou a `client` comme *Root Directory*.
Un seul projet Vercel suffit : supprime les doublons pour éviter de te tromper d’adresse.

Réglages du projet : *Root Directory* = racine du dépôt, *Framework Preset* = « Other », Node.js 22.x.

Optimisations incluses :

- **Région** : l’API tourne à Paris (`cdg1`). Crée ta base Turso dans une région proche
  (Paris ou Francfort) : chaque requête fait plusieurs allers-retours vers la base.
- **Démarrage à froid** : schéma et données de démo mémorisés dans la base (`app_meta`) ;
  une instance qui démarre ne fait qu’une requête au lieu d’une dizaine. Si la base ne répond pas,
  l’API renvoie une erreur 503 et réessaie à la requête suivante.
- **Cache** : fichiers du site (`/assets`) en cache 1 an ; permis, centres d’examen, packs et catégories
  de théorie servis par le CDN de Vercel sans réveiller la fonction.
- **Front** : écrans et carte chargés à la demande ; rafraîchissement automatique en pause quand
  l’onglet est caché.
- **Diagnostic** : `/api/health` indique la base utilisée (`turso` ou `locale`), l’origine du secret
  d’authentification (`AUTH_SECRET`, `turso`, `build` ou `aléatoire`) et la région Vercel.

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
| GET | `/api/subscriptions/plans`, `/api/subscriptions/me`, `/api/bookings/quote` | — / élève |
| POST | `/api/subscriptions`, `/api/subscriptions/me/plan`, `/api/subscriptions/me/cancel` · PATCH `/api/subscriptions/me/journey` | élève |
| GET | `/api/exam-centers?q&region&lat&lng` | — |
| GET | `/api/instructors/:id/slots?date&durationMin`, `/api/config` | — |
| GET/PUT | `/api/instructors/me/availability` | moniteur |
| GET/POST | `/api/bookings/:id/skills`, `/api/bookings/:id/messages` · GET `/api/progress/skills` | élève / moniteur |
| GET | `/api/theory/insights`, `/api/theory/quiz?mode=review` | élève |
| GET | `/api/theory/categories`, `/api/theory/quiz`, POST `/api/theory/submit`, GET `/api/theory/history` | — |

## Pistes pour la suite

- Paiement en ligne (Bancontact / Payconiq via Stripe ou Mollie) et facturation, y compris le prélèvement
  mensuel des packs (aujourd’hui simulé) et la rémunération des moniteurs sur les heures incluses.
- Suivi temps réel par WebSocket (aujourd’hui : rafraîchissement toutes les 5 s).
- Vérification des agréments moniteurs (back-office) et des permis provisoires des élèves.
- Traductions NL / DE / EN et banque de questions élargie (≥ 50 questions par catégorie, panneaux illustrés).
  Les questions actuelles sont indicatives et doivent être validées par un moniteur agréé.
- Agenda de disponibilités hebdomadaires pour les moniteurs, véhicule de l’élève pour la filière libre.
