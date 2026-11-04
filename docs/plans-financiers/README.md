# Plans financiers 2027-2031 — Wallonie & Bruxelles

Deux plans financiers prévisionnels sur 5 ans (60 mois, janvier 2027 – décembre 2031). Ils sont construits pour répondre au contenu du
**plan financier obligatoire à la constitution d’une SRL (art. 5:4 CSA)** : description de l’activité, sources de financement,
bilan d’ouverture et bilans projetés, comptes de résultats projetés, budget de trésorerie mensuel et hypothèses sourcées.

| Fichier | Objet |
| --- | --- |
| [`AutoSchub_Plan_financier_Application_2027-2031.xlsx`](AutoSchub_Plan_financier_Application_2027-2031.xlsx) | La plateforme AutoSchub (cette application) |
| [`Auto-ecole_agreee_Plan_financier_2027-2031.xlsx`](Auto-ecole_agreee_Plan_financier_2027-2031.xlsx) | La création d’une école de conduite agréée (site wallon puis site bruxellois) |

Tout est calculé par formules à partir de l’onglet **Hypothèses**. Les cellules bleues sont modifiables, les cellules sur fond jaune sont
les hypothèses clés, et le contrôle du bilan (dernière ligne de la Synthèse) doit toujours valoir 0. Des sélecteurs permettent de changer
de scénario (prudent / central / ambitieux). Dans le plan de l’app, un sélecteur choisit la grille tarifaire ; dans celui de
l’auto-école, un autre active ou non le site bruxellois.

## Plan 1 — Application AutoSchub

**Hypothèses de base (mise à jour)** : le groupe a sa propre école de conduite agréée (plan 2), partenaire de l’app.

- **Prix des leçons** : 75 €/h TTC, aligné sur les auto-écoles actuelles (forfait 20 h médian ≈ 1 647 € en Wallonie, heure à la carte ≈ 81 €). Ce prix remplace les 58 €/h du seed.
- **Packs revalorisés** : Théorie 14,99 € (au lieu de 9,99 €), Conduite 219 € (au lieu de 149 €) pour 3 h incluses, Intégral 429 € (au lieu de 279 €) pour 6 h incluses. Les réductions de 10 % et 15 % sur les heures supplémentaires sont conservées.
- **Commission** : 20 %. Le moniteur est payé au prix plein.
- **Heures obligatoires après échec** (nouveau segment) :
  - environ 12 500 candidats par an (Wallonie + Bruxelles) échouent deux fois à l’examen pratique et doivent suivre 6 h en école agréée ;
  - environ 30 000 candidats échouent deux fois à l’examen théorique et doivent suivre 12 h de cours (obligation confirmée à Bruxelles, à vérifier en Wallonie) ;
  - l’app propose ces heures dans l’auto-école du groupe et prend 20 % de commission ;
  - captation retenue : 2 % puis jusqu’à 12 % pour la pratique, 1 % puis jusqu’à 7 % pour la théorie ;
  - chaque candidat achète en moyenne 2 h supplémentaires.

**Marché** : environ 78 000 candidats entrent en formation pratique chaque année (réussites à l’examen théorique : 152 005 examens à 37 % en Wallonie en 2025,
53 721 examens à 41 % à Bruxelles en 2024).

| Scénario (valeurs figées dans l’onglet « Scénarios ») | CA an 5 | EBITDA an 5 | Besoin de financement max. | EBITDA durablement positif |
| --- | ---: | ---: | ---: | --- |
| **Central (référence)** | 2,37 M€ | +404 k€ | 140 k€ | 10/2028 |
| Central + abonnements écoles partenaires | 2,44 M€ | +470 k€ | 130 k€ | 07/2028 |
| Central, grille « pack scindé » | 1,22 M€* | +287 k€ | 196 k€ | 07/2029 |
| Ambitieux | 3,63 M€ | +1,00 M€ | 78 k€ | 04/2028 |
| Prudent | 1,17 M€ | −165 k€ | 892 k€ | au-delà de 2031 |
| *Pour comparaison : anciens paramètres (58 €/h, 9,99 / 149 / 279 €, sans heures obligatoires)* | 1,49 M€ | −169 k€ | 961 k€ | au-delà de 2031 |

\* Dans la grille « pack scindé », les heures incluses sont encaissées pour le compte des moniteurs : elles ne comptent donc pas dans le CA.

**Financement prévu (central)** :

- 30 k€ de capital ;
- 200 k€ de levée seed (tax shelter 45 %) au mois 9 ;
- 75 k€ de prêt subordonné régional ;
- 50 k€ de crédit bancaire garanti ;
- 5 k€ de subsides.

La trésorerie reste positive sur les 60 mois. Une deuxième levée d’environ 700 k€ n’est nécessaire que si le scénario prudent se confirme.

**Constats**

1. **Réglementation.** Les heures officielles doivent être données par une école agréée : 20 h en filière école, 30 h en accès direct, 6 h après deux échecs,
   et le rendez-vous pédagogique de 3 h. L’auto-école du groupe joue ce rôle. Les moniteurs indépendants servent la filière libre.
2. **Packs.** Avec les nouveaux prix, l’heure incluse revient à 73 € (Conduite) et 71,50 € (Intégral), juste sous les 75 € de l’auto-école.
   La contribution passe à environ 43 € et 79 € par abonné-mois. Elle reste positive même si l’élève consomme toutes ses heures : environ 20 € et 32 €.
   Avec les anciens prix, elle tombait à −1,48 € et −18,16 €.
3. **Capacité.** Le scénario central compte environ 83 000 heures par an en année 5, soit environ 150 moniteurs actifs. L’auto-école du groupe n’en absorbera
   qu’une partie : il faut un réseau d’écoles partenaires, en particulier pour les heures obligatoires.
4. Paiement à brancher sur Mollie (Bancontact, puis prélèvement SEPA pour les renouvellements). Analyse d’impact RGPD à faire : géolocalisation, élèves de 17 ans.
   Les prix des packs dans `server/src/data/plans.js` sont encore les anciens (9,99 / 149 / 279 €).

## Plan 2 — École de conduite agréée

**Modèle** : un site wallon (Namur, Charleroi ou Liège) ouvre en avril 2027, après 3 mois de constitution et d’agrément. Un site bruxellois ouvre en janvier 2029.
Les prix moyens sont de 75 €/h en Wallonie et 80 €/h à Bruxelles (TTC), dont 10 % d’heures financées par le chèque permis du Forem.
Le directeur est le fondateur, titulaire du brevet I. Les moniteurs sont à 50 % salariés (CP 140.03) et à 50 % indépendants payés à l’heure.
Les véhicules sont en renting, équipés de doubles commandes. 15 à 25 % des heures sont vendues via AutoSchub.

| Scénario | CA an 5 | EBITDA an 5 | Besoin de financement max. | EBITDA durablement positif |
| --- | ---: | ---: | ---: | --- |
| Central, 2 sites (référence) | 1,09 M€ | +93 k€ | 310 k€ | 08/2028 |
| Central, site wallon seul | 0,60 M€ | +59 k€ | 140 k€ | 08/2028 |
| Ambitieux, 2 sites | 1,20 M€ | +178 k€ | 227 k€ | 06/2028 |
| Prudent, 2 sites | 0,89 M€ | −61 k€ | 588 k€ | au-delà de 2031 |

**Financement prévu (central)** :

- 40 k€ de capital ;
- un crédit bancaire de 100 k€ avec garantie Wallonie Entreprendre ;
- un Prêt Coup de pouce de 50 k€ ;
- la prime Airbag (12,5 k€), dont l’éligibilité est à vérifier ;
- pour le site bruxellois : 150 k€ d’augmentation de capital et 150 k€ de prêt.

**Point mort d’un véhicule** : il faut environ 50 % de remplissage pour qu’un véhicule couvre son moniteur, sa location et son assurance
(onglet « Rentabilité véhicule »).

**Risques principaux** :

- la pénurie de moniteurs brevetés ;
- la concurrence des écoles sociales (45 €/h) et des mutualités (35-45 €/h) ;
- la TVA (un ruling est conseillé) ;
- les loyers et la zone de basses émissions à Bruxelles ;
- des fonds propres négatifs pendant la phase de démarrage, d’où l’augmentation de capital prévue.

## Méthode et limites

- Les recherches ont été faites le 04/11/2026. Les sources sont listées dans l’onglet « Sources » de chaque classeur : textes régionaux, Bruxelles Mobilité,
  SPF Finances, réponses parlementaires, comparateurs de prix, secrétariats sociaux.
- La TVA est réglée chaque trimestre, l’impôt des sociétés est calculé chaque année avec report des pertes, et les réductions ONSS pour premiers engagements
  suivent le régime en vigueur au 01/07/2026.
- Les créances clients et les dettes fournisseurs sont supposées nulles, et l’ISOC est payé l’année suivante. Les chiffres de marché viennent de réponses
  parlementaires relayées par la presse et de comparateurs privés : ils sont à recouper avec le SPW Mobilité et Bruxelles Mobilité. Les prix, salaires et loyers
  sont à confirmer par des devis.
- Ces plans sont une aide à la décision. Avant le dépôt chez le notaire, ils doivent être relus par un expert-comptable ITAA, un fiscaliste et un avocat.

## Régénérer les classeurs

Les scripts Python de `generateur/` (openpyxl) reconstruisent les deux classeurs. `driver.py app|school` calcule les scénarios
avec LibreOffice puis écrit le fichier final. Pour un simple ajustement, il suffit de modifier directement l’onglet « Hypothèses » dans Excel.
