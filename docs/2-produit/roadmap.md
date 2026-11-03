# Roadmap produit

Responsable : **Barthélemy**. Chaque ligne devient une issue GitHub avec le label `produit` ou `tech`.

## Déjà en ligne (v0.1)

Réservation façon Uber, espace moniteur, théorie et examens blancs, packs avec suivi du parcours,
32 centres d'examen, déploiement Vercel + base Turso. Détail dans le [README](../../README.md).

## Jalon « Pilote » — utilisable par de vrais utilisateurs

- [ ] Paiement réel (Bancontact / Payconiq via Stripe ou Mollie), y compris prélèvement des packs
- [ ] Vérification des agréments moniteurs et des permis provisoires (back-office)
- [ ] CGU, politique de confidentialité, consentements RGPD, suppression de compte
- [ ] Agenda de disponibilités hebdomadaires des moniteurs
- [ ] Notifications (e-mail / push) : demande, acceptation, rappel de leçon
- [ ] Questions de théorie validées par un moniteur agréé
- [ ] Suivi d'usage (analytics respectueux de la vie privée) et monitoring des erreurs

## Jalon « Lancement »

- [ ] Version néerlandaise (puis allemande et anglaise)
- [ ] Temps réel (WebSocket) au lieu du rafraîchissement toutes les 5 s
- [ ] Espace école de conduite (plusieurs moniteurs, facturation) — selon le cadre réglementaire
- [ ] Banque de questions élargie (≥ 50 par catégorie, panneaux illustrés)
- [ ] Véhicule de l'élève pour la filière libre

## Plus tard

- Applications iOS / Android (aujourd'hui PWA installable)
- Intégration ERP / comptabilité (Odoo ?) pour la facturation et la compta
- Offres B2B (entreprises, flottes, code 95)
