// Grille de compétences (fiche de suivi) remplie par le moniteur après chaque leçon,
// inspirée des points évalués à l'examen pratique belge. Contenu indicatif.
//
// Niveaux : 0 non abordé · 1 abordé · 2 en progrès · 3 maîtrisé.
export const SKILL_LEVELS = [
  { level: 0, label: 'Non abordé' },
  { level: 1, label: 'Abordé' },
  { level: 2, label: 'En progrès' },
  { level: 3, label: 'Maîtrisé' },
];
export const MASTERED = 3;

const COMMON = [
  { id: 'installation', group: 'Avant de partir', label: 'Installation, réglages et vérifications' },
  { id: 'observation', group: 'Circulation', label: 'Observation, rétroviseurs et angles morts' },
  { id: 'placement', group: 'Circulation', label: 'Placement sur la chaussée' },
  { id: 'vitesse', group: 'Circulation', label: 'Vitesse adaptée et distances de sécurité' },
  { id: 'priorites', group: 'Circulation', label: 'Priorités et carrefours' },
  { id: 'ronds-points', group: 'Circulation', label: 'Ronds-points' },
  { id: 'usagers', group: 'Circulation', label: 'Piétons, cyclistes et usagers vulnérables' },
  { id: 'changement-bande', group: 'Circulation', label: 'Changement de bande et dépassement' },
  { id: 'signalisation', group: 'Circulation', label: 'Respect de la signalisation' },
];

const CAR = [
  { id: 'demarrage-cote', group: 'Maniement', label: 'Démarrage en côte' },
  { id: 'creneau', group: 'Manœuvres', label: 'Stationnement en créneau' },
  { id: 'marche-arriere', group: 'Manœuvres', label: 'Marche arrière en ligne / en courbe' },
  { id: 'demi-tour', group: 'Manœuvres', label: 'Demi-tour' },
  { id: 'autoroute', group: 'Circulation', label: 'Autoroute : insertion, tirette, couloir de secours' },
  { id: 'eco-conduite', group: 'Circulation', label: 'Conduite économique et souple' },
];

const TWO_WHEELS = [
  { id: 'equipement', group: 'Avant de partir', label: 'Équipement de protection' },
  { id: 'maniabilite-lente', group: 'Plateau', label: 'Maniabilité à allure lente' },
  { id: 'slalom', group: 'Plateau', label: 'Slalom et évitement' },
  { id: 'freinage-urgence', group: 'Plateau', label: 'Freinage d’urgence' },
  { id: 'trajectoire', group: 'Circulation', label: 'Trajectoires en virage' },
];

const HEAVY = [
  { id: 'verifications', group: 'Avant de partir', label: 'Vérifications techniques du véhicule' },
  { id: 'gabarit', group: 'Maniement', label: 'Gabarit et angles morts du véhicule lourd' },
  { id: 'mise-a-quai', group: 'Manœuvres', label: 'Marche arrière et mise à quai' },
  { id: 'attelage', group: 'Manœuvres', label: 'Attelage et dételage' },
  { id: 'chargement', group: 'Avant de partir', label: 'Chargement / passagers en sécurité' },
];

const TRACTOR = [
  { id: 'attelage', group: 'Manœuvres', label: 'Attelage d’outils et de remorque' },
  { id: 'gabarit', group: 'Maniement', label: 'Gabarit et signalisation du convoi agricole' },
  { id: 'marche-arriere', group: 'Manœuvres', label: 'Marche arrière avec remorque' },
];

const GROUP_EXTRAS = {
  'deux-roues': TWO_WHEELS,
  voiture: CAR,
  'poids-lourd': HEAVY,
  bus: HEAVY,
  agricole: TRACTOR,
};

export function skillsForGroup(group) {
  const extras = GROUP_EXTRAS[group] ?? CAR;
  const seen = new Set();
  return [...extras.filter((s) => s.group === 'Avant de partir'), ...COMMON, ...extras]
    .filter((s) => (seen.has(s.id) ? false : seen.add(s.id)));
}
