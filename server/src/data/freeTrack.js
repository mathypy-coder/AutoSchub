// Filière libre (apprentissage avec un guide, permis provisoire M36) : règles par Région.
// Relevé en 2026 auprès des Régions et des sites spécialisés (voir `sources`).
// Les règles évoluent : l'app renvoie toujours vers la source officielle.
// Textes en trois langues : { fr, nl, en }.

export const FREE_TRACK_CATEGORIES = ['B'];

// Points communs aux trois Régions (permis B, permis provisoire « M36 »).
export const COMMON_RULES = {
  provisionalMonths: 36,
  minAgeLearner: 17,
  maxGuides: 2,
  guideLicenseYears: 8,
  items: [
    {
      fr: 'Permis provisoire « M36 » valable 36 mois, à demander à ta commune après la réussite de l’examen théorique.',
      nl: 'Voorlopig rijbewijs ‘M36’, 36 maanden geldig, aan te vragen bij je gemeente na het slagen voor het theorie-examen.',
      en: 'The “M36” provisional licence is valid for 36 months; apply at your municipality after passing the theory test.',
    },
    {
      fr: 'Apprentissage possible dès 17 ans ; examen pratique à partir de 18 ans.',
      nl: 'Leren rijden kan vanaf 17 jaar; het praktijkexamen vanaf 18 jaar.',
      en: 'You can start learning at 17; the practical test can be taken from 18.',
    },
    {
      fr: 'Un ou deux guides maximum, mentionnés sur le permis provisoire, titulaires du permis B depuis au moins 8 ans.',
      nl: 'Maximaal één of twee begeleiders, vermeld op het voorlopig rijbewijs, die minstens 8 jaar een rijbewijs B hebben.',
      en: 'One or two supervisors at most, named on the provisional licence, who have held a category B licence for at least 8 years.',
    },
    {
      fr: 'Le guide est toujours assis à côté de toi. Pas d’autres passagers (sauf exceptions régionales).',
      nl: 'De begeleider zit altijd naast je. Geen andere passagiers (behalve regionale uitzonderingen).',
      en: 'Your supervisor always sits next to you. No other passengers (apart from regional exceptions).',
    },
    {
      fr: 'Plaque « L » obligatoire à l’arrière du véhicule ; conduite uniquement en Belgique.',
      nl: 'L-plaat verplicht achteraan op het voertuig; alleen rijden in België.',
      en: 'An “L” plate is compulsory at the rear of the car; driving is allowed in Belgium only.',
    },
    {
      fr: 'Le véhicule doit être assuré pour la conduite avec permis provisoire : préviens ton assureur.',
      nl: 'Het voertuig moet verzekerd zijn voor rijden met een voorlopig rijbewijs: verwittig je verzekeraar.',
      en: 'The car must be insured for driving on a provisional licence: tell your insurer.',
    },
    {
      fr: 'Depuis 2026, l’examen pratique se passe dans la Région où tu as suivi ta formation.',
      nl: 'Sinds 2026 leg je het praktijkexamen af in het gewest waar je je opleiding volgde.',
      en: 'Since 2026, the practical test is taken in the region where you did your training.',
    },
  ],
};

export const REGION_RULES = {
  wallonie: {
    id: 'wallonie',
    minMonths: 3,
    kmTarget: 1500,
    roadbookRequired: true,
    guideTraining: { required: true, hours: 3 },
    nightBan: false,
    title: { fr: 'Wallonie', nl: 'Wallonië', en: 'Wallonia' },
    guideTrainingLabel: {
      fr: 'Séance pédagogique de 3 h (candidat + guide) dans une école de conduite',
      nl: 'Pedagogische sessie van 3 u (kandidaat + begeleider) in een rijschool',
      en: '3-hour teaching session (learner + supervisor) at a driving school',
    },
    items: [
      {
        fr: 'Avant de prendre le volant : séance pédagogique de 3 h, ensemble avec ton guide, dans une école de conduite agréée.',
        nl: 'Voor je achter het stuur kruipt: pedagogische sessie van 3 uur, samen met je begeleider, in een erkende rijschool.',
        en: 'Before you drive: a 3-hour teaching session together with your supervisor at an approved driving school.',
      },
      {
        fr: 'Au moins 3 mois de conduite avec le permis provisoire avant de pouvoir passer l’examen pratique.',
        nl: 'Minstens 3 maanden rijden met het voorlopig rijbewijs voor je het praktijkexamen mag afleggen.',
        en: 'At least 3 months of driving on the provisional licence before you can take the practical test.',
      },
      {
        fr: 'Carnet de bord : objectif de 1 500 km parcourus, à présenter à l’examen.',
        nl: 'Logboek: doel van 1 500 gereden kilometers, voor te leggen op het examen.',
        en: 'Logbook: aim for 1,500 km driven, to be shown at the test.',
      },
    ],
    sources: [
      {
        label: 'Wallonie — Passer le permis de conduire pratique',
        url: 'https://infrastructures.wallonie.be/fr/demandes/2858_passer-le-permis-de-conduire-pratique.html',
      },
      { label: 'Permis.online — Rendez-vous pédagogique', url: 'https://www.permis.online/demarches/rendez-vous-pedagogique' },
    ],
  },
  bruxelles: {
    id: 'bruxelles',
    minMonths: 9,
    minMonthsWithLessons: 6,
    lessonHoursForShorterWait: 14,
    kmTarget: 1500,
    roadbookRequired: true,
    guideTraining: { required: false, hours: 0 },
    nightBan: false,
    title: { fr: 'Bruxelles', nl: 'Brussel', en: 'Brussels' },
    guideTrainingLabel: {
      fr: 'Séance de préparation avec ton guide (conseillée)',
      nl: 'Voorbereidende sessie met je begeleider (aanbevolen)',
      en: 'Preparation session with your supervisor (recommended)',
    },
    items: [
      {
        fr: 'Au moins 9 mois de conduite avec le permis provisoire avant l’examen pratique (6 mois si tu as suivi au moins 14 h en école de conduite).',
        nl: 'Minstens 9 maanden rijden met het voorlopig rijbewijs voor het praktijkexamen (6 maanden als je minstens 14 u rijschool volgde).',
        en: 'At least 9 months of driving on the provisional licence before the practical test (6 months if you took at least 14 hours of driving-school lessons).',
      },
      {
        fr: 'Journal de bord obligatoire : note chaque trajet (date, durée, km, conditions). Vise 1 000 à 1 500 km.',
        nl: 'Logboek verplicht: noteer elke rit (datum, duur, km, omstandigheden). Mik op 1 000 tot 1 500 km.',
        en: 'Logbook required: record every drive (date, duration, km, conditions). Aim for 1,000 to 1,500 km.',
      },
      {
        fr: 'Pas de formation obligatoire pour le guide, mais une séance avec un moniteur est vivement conseillée.',
        nl: 'Geen verplichte opleiding voor de begeleider, maar een sessie met een instructeur is sterk aanbevolen.',
        en: 'No mandatory training for the supervisor, but a session with an instructor is strongly recommended.',
      },
    ],
    sources: [
      { label: 'Permis.online — Démarches à Bruxelles', url: 'https://www.permis.online/demarches/bruxelles' },
      { label: 'Permis.online — Filières et délais', url: 'https://www.permis.online/filieres/delais' },
    ],
  },
  flandre: {
    id: 'flandre',
    minMonths: 5,
    kmTarget: 1500,
    roadbookRequired: false,
    guideTraining: { required: true, hours: 3 },
    nightBan: true,
    title: { fr: 'Flandre', nl: 'Vlaanderen', en: 'Flanders' },
    guideTrainingLabel: {
      fr: 'Vormingsmoment de 3 h pour le guide dans une école de conduite',
      nl: 'Vormingsmoment van 3 u voor de begeleider in een rijschool',
      en: '3-hour “vormingsmoment” training for the supervisor at a driving school',
    },
    items: [
      {
        fr: 'Le guide suit un « vormingsmoment » de 3 h dans une école de conduite (obligatoire depuis le 1er mars 2024).',
        nl: 'De begeleider volgt een vormingsmoment van 3 uur in een rijschool (verplicht sinds 1 maart 2024).',
        en: 'The supervisor attends a 3-hour “vormingsmoment” at a driving school (compulsory since 1 March 2024).',
      },
      {
        fr: 'Au moins 5 mois de conduite avec le permis provisoire avant l’examen pratique.',
        nl: 'Minstens 5 maanden rijden met het voorlopig rijbewijs voor het praktijkexamen.',
        en: 'At least 5 months of driving on the provisional licence before the practical test.',
      },
      {
        fr: 'Pas de conduite entre 22 h et 6 h les nuits de vendredi à samedi, de samedi à dimanche et de dimanche à lundi, ni la veille et la nuit des jours fériés.',
        nl: 'Niet rijden tussen 22 en 6 uur in de nachten van vrijdag op zaterdag, zaterdag op zondag en zondag op maandag, en de nacht voor en van een feestdag.',
        en: 'No driving between 10 pm and 6 am on Friday, Saturday and Sunday nights, or on the eve and night of public holidays.',
      },
      {
        fr: 'Le guide ne peut pas avoir été déchu du droit de conduire au cours des 3 dernières années.',
        nl: 'De begeleider mag de voorbije 3 jaar geen rijverbod hebben gehad.',
        en: 'The supervisor must not have been disqualified from driving in the last 3 years.',
      },
    ],
    sources: [
      { label: 'GOCA Vlaanderen — Categorie B', url: 'https://www.gocavlaanderen.be/detail-page/categorie-b' },
      { label: 'Permis.online — Nouvelles règles', url: 'https://www.permis.online/pratique/nouvelles-regles' },
    ],
  },
};

export const FREE_TRACK_REGIONS = Object.keys(REGION_RULES);

// Conditions de conduite notées dans le carnet de bord.
export const ROADBOOK_CONDITIONS = {
  ville: { fr: 'Ville', nl: 'Stad', en: 'City' },
  campagne: { fr: 'Campagne', nl: 'Landelijk', en: 'Country roads' },
  autoroute: { fr: 'Autoroute / voie rapide', nl: 'Autosnelweg', en: 'Motorway' },
  nuit: { fr: 'Nuit', nl: 'Nacht', en: 'Night' },
  pluie: { fr: 'Pluie / mauvais temps', nl: 'Regen / slecht weer', en: 'Rain / bad weather' },
  trafic: { fr: 'Trafic dense', nl: 'Druk verkeer', en: 'Heavy traffic' },
  manoeuvres: { fr: 'Manœuvres', nl: 'Manoeuvres', en: 'Manoeuvres' },
  examen: { fr: 'Parcours d’examen', nl: 'Examenroute', en: 'Test route' },
};

// Conseils pour le jour de l'examen pratique.
export const EXAM_TIPS = [
  {
    fr: 'Arrive 15 min en avance avec ta carte d’identité, ton permis provisoire, ton guide et le carnet de bord.',
    nl: 'Kom 15 min vooraf met je identiteitskaart, voorlopig rijbewijs, begeleider en logboek.',
    en: 'Arrive 15 minutes early with your ID card, provisional licence, supervisor and logbook.',
  },
  {
    fr: 'Vérifie le véhicule la veille : plaque L, feux, pneus, documents de bord, assurance et contrôle technique valides.',
    nl: 'Controleer de wagen de dag voordien: L-plaat, lichten, banden, boorddocumenten, geldige verzekering en keuring.',
    en: 'Check the car the day before: L plate, lights, tyres, vehicle papers, valid insurance and roadworthiness test.',
  },
  {
    fr: 'Les fautes graves (priorité refusée, feu rouge, STOP, mise en danger) sont éliminatoires : entraîne-toi d’abord sur elles.',
    nl: 'Zware fouten (voorrang niet verleend, rood licht, STOP, gevaar veroorzaken) zijn eliminerend: oefen die eerst.',
    en: 'Serious faults (failing to give way, red light, STOP sign, endangering others) mean an immediate fail: practise those first.',
  },
  {
    fr: 'Une leçon de contrôle avec un moniteur une à deux semaines avant l’examen permet de corriger les derniers défauts.',
    nl: 'Een controleles met een instructeur een tot twee weken voor het examen helpt de laatste fouten weg te werken.',
    en: 'A check-up lesson with an instructor one or two weeks before the test helps iron out the last mistakes.',
  },
];

export const pickText = (value, lang) => (value && typeof value === 'object' ? (value[lang] ?? value.fr) : value);

export function localizedRules(lang) {
  return {
    common: { ...COMMON_RULES, items: COMMON_RULES.items.map((i) => pickText(i, lang)) },
    regions: FREE_TRACK_REGIONS.map((id) => {
      const r = REGION_RULES[id];
      return {
        ...r,
        title: pickText(r.title, lang),
        guideTrainingLabel: pickText(r.guideTrainingLabel, lang),
        items: r.items.map((i) => pickText(i, lang)),
      };
    }),
    conditions: Object.entries(ROADBOOK_CONDITIONS).map(([id, label]) => ({ id, label: pickText(label, lang) })),
    examTips: EXAM_TIPS.map((t) => pickText(t, lang)),
    checkedAt: '2026-10',
  };
}
