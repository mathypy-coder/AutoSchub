// Catégories de permis de conduire en Belgique (véhicules motorisés).
// Les âges minimums sont indicatifs : vérifier les conditions à jour auprès
// du SPF Mobilité et de la Région (Wallonie, Bruxelles, Flandre).
export const PERMIT_GROUPS = [
  { id: 'deux-roues', label: 'Deux-roues', icon: '🏍️' },
  { id: 'voiture', label: 'Voiture', icon: '🚗' },
  { id: 'poids-lourd', label: 'Poids lourds', icon: '🚚' },
  { id: 'bus', label: 'Bus & autocars', icon: '🚌' },
  { id: 'agricole', label: 'Agricole', icon: '🚜' },
];

export const PERMITS = [
  {
    code: 'AM',
    group: 'deux-roues',
    label: 'Cyclomoteur',
    description: 'Cyclomoteurs (max 45 km/h), quadricycles légers et speed pedelecs.',
    minAge: 16,
    theoryCategory: 'AM',
  },
  {
    code: 'A1',
    group: 'deux-roues',
    label: 'Moto légère',
    description: 'Motos jusqu’à 125 cm³ et 11 kW.',
    minAge: 18,
    theoryCategory: 'A',
  },
  {
    code: 'A2',
    group: 'deux-roues',
    label: 'Moto intermédiaire',
    description: 'Motos jusqu’à 35 kW.',
    minAge: 18,
    theoryCategory: 'A',
  },
  {
    code: 'A',
    group: 'deux-roues',
    label: 'Moto',
    description: 'Toutes les motos (accès direct à 24 ans, ou 2 ans d’A2).',
    minAge: 24,
    theoryCategory: 'A',
  },
  {
    code: 'B',
    group: 'voiture',
    label: 'Voiture',
    description: 'Véhicules jusqu’à 3,5 t et 8 passagers. Permis provisoire possible dès 17 ans.',
    minAge: 18,
    theoryCategory: 'B',
  },
  {
    code: 'BE',
    group: 'voiture',
    label: 'Voiture + remorque',
    description: 'Voiture tractant une remorque de plus de 750 kg.',
    minAge: 18,
    theoryCategory: 'B',
  },
  {
    code: 'C1',
    group: 'poids-lourd',
    label: 'Camion léger',
    description: 'Camions de 3,5 t à 7,5 t.',
    minAge: 18,
    theoryCategory: 'C',
  },
  {
    code: 'C1E',
    group: 'poids-lourd',
    label: 'Camion léger + remorque',
    description: 'C1 avec remorque de plus de 750 kg (MMA totale ≤ 12 t).',
    minAge: 18,
    theoryCategory: 'C',
  },
  {
    code: 'C',
    group: 'poids-lourd',
    label: 'Camion',
    description: 'Camions de plus de 3,5 t (21 ans, 18 ans avec CAP).',
    minAge: 21,
    theoryCategory: 'C',
  },
  {
    code: 'CE',
    group: 'poids-lourd',
    label: 'Semi-remorque',
    description: 'Camion avec remorque de plus de 750 kg.',
    minAge: 21,
    theoryCategory: 'C',
  },
  {
    code: 'D1',
    group: 'bus',
    label: 'Minibus',
    description: 'Jusqu’à 16 passagers, longueur max 8 m.',
    minAge: 21,
    theoryCategory: 'D',
  },
  {
    code: 'D1E',
    group: 'bus',
    label: 'Minibus + remorque',
    description: 'D1 avec remorque de plus de 750 kg.',
    minAge: 21,
    theoryCategory: 'D',
  },
  {
    code: 'D',
    group: 'bus',
    label: 'Bus / autocar',
    description: 'Plus de 8 passagers (24 ans, 21 ans avec CAP).',
    minAge: 24,
    theoryCategory: 'D',
  },
  {
    code: 'DE',
    group: 'bus',
    label: 'Bus + remorque',
    description: 'Bus avec remorque de plus de 750 kg.',
    minAge: 24,
    theoryCategory: 'D',
  },
  {
    code: 'G',
    group: 'agricole',
    label: 'Tracteur agricole',
    description: 'Tracteurs agricoles et forestiers, machines agricoles automotrices.',
    minAge: 16,
    theoryCategory: 'G',
  },
];

export const PERMIT_CODES = PERMITS.map((p) => p.code);

export const THEORY_CATEGORIES = [
  { code: 'AM', label: 'Cyclomoteur (AM)' },
  { code: 'A', label: 'Moto (A1, A2, A)' },
  { code: 'B', label: 'Voiture (B, BE)' },
  { code: 'C', label: 'Poids lourds (C1, C, CE)' },
  { code: 'D', label: 'Bus (D1, D, DE)' },
  { code: 'G', label: 'Tracteur (G)' },
];

// Règle de l'examen théorique belge : 50 questions, réussite à 41/50,
// une faute grave coûte 5 points. Pour les banques plus petites,
// le seuil est ramené à la même proportion (82 %).
export const EXAM_RULES = {
  questionCount: 50,
  passRatio: 41 / 50,
  gravePenalty: 5,
  durationMinutes: 30,
};
