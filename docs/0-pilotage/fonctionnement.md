# Fonctionnement de l'équipe

## Rituels

| Quand | Quoi | Durée | Sortie |
| --- | --- | --- | --- |
| Chaque semaine (ex. lundi soir) | Point d'équipe : fait / à faire / bloquants, revue du tableau | 30 min | Tableau à jour, 3 priorités de la semaine |
| Chaque mois | Revue : indicateurs, pipeline, roadmap, budget | 1 h 30 | Décisions consignées, roadmap ajustée |
| Chaque trimestre | Atelier stratégie : objectifs du trimestre (OKR) | ½ journée | Objectifs du trimestre dans [roadmap-globale](roadmap-globale.md) |

## Outils

| Besoin | Outil | Remarque |
| --- | --- | --- |
| Code, documentation, décisions | GitHub (ce dépôt) | Tout est versionné |
| Tâches de toute nature | GitHub Issues + **GitHub Projects** (tableau) | Aussi pour le commercial et le juridique, pas seulement le code |
| Fichiers lourds / confidentiels (deck PowerPoint, contrats, statuts) | Drive partagé | Lien depuis la doc, pas le fichier |
| Contacts & suivi commercial | [pipeline](../3-commercial/pipeline-partenaires.md) au début, puis un CRM (Odoo CRM, HubSpot gratuit…) | Bart connaît Odoo |
| Discussion rapide | WhatsApp / Signal | Ce qui est décidé est reporté ici |

## Tableau GitHub Projects (à créer une fois)

Colonnes : **Idées → À faire → En cours → En attente (externe) → Fait**.

Libellés (labels) d'issues :

- Domaine : `produit`, `tech`, `commercial`, `partenariat`, `juridique`, `finance`, `marketing`, `pitch`
- Priorité : `P1-urgent`, `P2-important`, `P3-plus-tard`
- Type : `bug`, `idée`, `décision-à-prendre`

Chaque issue a **un seul responsable** et, si possible, une échéance.

## Code : comment on contribue

- `main` = version en ligne. On ne travaille pas directement dessus.
- Une branche par sujet, puis une pull request relue par Barthélemy (ou Pierre-Yves pour les textes/offres).
- `npm test` doit passer avant de fusionner.
