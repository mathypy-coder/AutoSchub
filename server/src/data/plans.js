// Packs d'abonnement mensuels, liés à une catégorie de permis.
// Ils suivent l'élève tout au long du parcours : théorie, permis provisoire,
// heures de conduite, examen pratique, puis obtention du permis.
export const PLANS = [
  {
    id: 'theorie',
    name: 'Théorie',
    tagline: 'Pour décrocher ton examen théorique',
    priceMonthly: 9.99,
    includedMinutes: 0,
    discount: 0,
    features: [
      'Examens blancs illimités',
      'Suivi de ton parcours jusqu’au permis',
      'Historique et corrections détaillées',
    ],
  },
  {
    id: 'conduite',
    name: 'Conduite',
    tagline: 'Théorie + pratique, à ton rythme',
    priceMonthly: 149,
    includedMinutes: 180,
    discount: 0.1,
    popular: true,
    features: [
      'Tout le pack Théorie',
      '3 h de conduite incluses chaque mois',
      '-10 % sur les heures supplémentaires',
      'Rappels d’étapes et objectifs d’heures',
    ],
  },
  {
    id: 'integral',
    name: 'Intégral',
    tagline: 'Accompagnement complet jusqu’au permis',
    priceMonthly: 279,
    includedMinutes: 360,
    discount: 0.15,
    features: [
      'Tout le pack Conduite',
      '6 h de conduite incluses chaque mois',
      '-15 % sur les heures supplémentaires',
      'Moniteur référent qui suit ta progression',
      'Préparation dédiée à l’examen pratique',
    ],
  },
];

export const PLANS_BY_ID = new Map(PLANS.map((p) => [p.id, p]));

// Examens blancs gratuits par période de 7 jours sans pack.
export const FREE_EXAMS_PER_WEEK = 2;

// Objectif d'heures de conduite indicatif par catégorie (à adapter avec le moniteur).
export const TARGET_HOURS = {
  AM: 8,
  A1: 16,
  A2: 16,
  A: 16,
  B: 20,
  BE: 8,
  C1: 16,
  C1E: 8,
  C: 20,
  CE: 12,
  D1: 16,
  D1E: 8,
  D: 20,
  DE: 12,
  G: 8,
};

export const PERIOD_DAYS = 30;
