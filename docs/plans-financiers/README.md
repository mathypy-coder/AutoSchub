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

**Paramètres repris de l’app** : packs à 9,99 € / 149 € / 279 € par mois, avec 0, 3 ou 6 h de conduite incluses et 0 / 10 / 15 % de réduction sur
les heures supplémentaires. Commission de 20 %. Le moniteur est payé au prix plein. Tarif moyen des moniteurs : 58 €/h. Théorie gratuite limitée à 2 examens
blancs par semaine.

**Marché** : environ 78 000 candidats entrent en formation pratique chaque année (réussites à l’examen théorique : 152 005 examens à 37 % en Wallonie en 2025,
53 721 examens à 41 % à Bruxelles en 2024).

| Scénario (valeurs figées dans l’onglet « Scénarios ») | CA an 5 | EBITDA an 5 | Besoin de financement max. | EBITDA durablement positif |
| --- | ---: | ---: | ---: | --- |
| Central, grille actuelle de l’app (référence) | 1,49 M€ | −169 k€ | 961 k€ | au-delà de 2031 |
| Central, grille recommandée | 0,77 M€* | −93 k€ | 790 k€ | au-delà de 2031 |
| Central, grille recommandée + écoles partenaires | 0,84 M€* | −26 k€ | 648 k€ | 10/2031 |
| Central, plan d’action complet (en plus : commission à 25 %) | 1,02 M€* | +160 k€ | 360 k€ | 06/2030 |
| Ambitieux, grille actuelle | 2,31 M€ | +147 k€ | 366 k€ | 07/2030 |
| Prudent, grille actuelle | 0,72 M€ | −458 k€ | 1,71 M€ | au-delà de 2031 |

\* Avec la grille recommandée, le CA baisse parce que les heures incluses sont encaissées pour le compte des moniteurs : elles ne
comptent plus dans le CA. La marge, elle, augmente.

**Constats à traiter avant le lancement**

1. **Réglementation.** Les heures qui comptent pour la formation officielle doivent être données par une école de conduite agréée : 20 h en filière école,
   30 h en accès direct, 6 h après deux échecs, et le rendez-vous pédagogique de 3 h. Les moniteurs indépendants servent la filière libre et le perfectionnement.
   → Il faut deux canaux dans l’app, et l’auto-école du plan 2 devient le partenaire agréé.
2. **TVA des packs.** Avec la grille actuelle, la TVA de 21 % porte sur tout le pack. L’heure incluse revient à 49,67 € (Conduite) et 46,50 € (Intégral) pour l’élève,
   contre 58 € à la carte. La contribution par abonné-mois est d’environ 17 € et 19 €. Elle devient négative si l’élève utilise toutes ses heures :
   −1,48 € et −18,16 €.
   → Grille recommandée : un abonnement de service (19,99 € ou 29,99 €) et des crédits d’heures vendus au nom et pour compte des moniteurs.
   À valider par un fiscaliste.
3. **Volume.** Une commission de 20 % sur un prix TTC laisse environ 9,6 € HTVA par heure. L’équilibre demande environ 85 000 à 100 000 heures par an,
   soit 15 à 18 % des candidats.
4. Paiement à brancher sur Mollie (Bancontact, puis prélèvement SEPA pour les renouvellements). Analyse d’impact RGPD à faire : géolocalisation, élèves de 17 ans.

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
