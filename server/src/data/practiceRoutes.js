// Parcours d'entraînement autour des centres d'examen (filière libre).
// Les parcours officiels ne sont pas publiés et changent d'un examen à l'autre : on propose
// trois boucles au départ de chaque centre (ville, routes régionales, voie rapide),
// calculées à partir de sa position. L'itinéraire exact est tracé par Google Maps.
import { EXAM_CENTERS } from './examCenters.js';
import { pickText } from './freeTrack.js';

const KM_PER_DEG_LAT = 111.32;

// Graine stable par centre : chaque centre a ses propres boucles, identiques d'une visite à l'autre.
function seedFrom(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 2 ** 32;
}

const round = (n) => Math.round(n * 100000) / 100000;

// Points de passage répartis autour du centre (boucle), rayon en km.
function loop(center, radiusKm, points, seed) {
  const start = seed * 2 * Math.PI;
  const kmPerDegLng = KM_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180);
  return Array.from({ length: points }, (_, i) => {
    const angle = start + (i * 2 * Math.PI) / points;
    // Rayon légèrement variable : une boucle moins régulière, plus proche d'un vrai parcours.
    const r = radiusKm * (0.8 + 0.4 * seedFrom(`${seed}-${i}`));
    return {
      lat: round(center.lat + (r * Math.sin(angle)) / KM_PER_DEG_LAT),
      lng: round(center.lng + (r * Math.cos(angle)) / kmPerDegLng),
    };
  });
}

export const ROUTE_TYPES = [
  {
    type: 'ville',
    radiusKm: 1,
    points: 4,
    minutes: 20,
    free: true,
    name: { fr: 'Boucle urbaine', nl: 'Stadslus', en: 'Town loop' },
    summary: {
      fr: 'Quartiers autour du centre : carrefours, priorités de droite, ronds-points, zones 30 et écoles.',
      nl: 'Wijken rond het centrum: kruispunten, voorrang van rechts, rotondes, zones 30 en scholen.',
      en: 'Streets around the centre: junctions, priority to the right, roundabouts, 30 km/h zones and schools.',
    },
    focus: [
      {
        fr: 'Priorité de droite aux carrefours sans signalisation : regarde loin à droite, ralentis tôt.',
        nl: 'Voorrang van rechts op kruispunten zonder borden: kijk ver naar rechts en vertraag tijdig.',
        en: 'Priority to the right at unmarked junctions: look well to the right and slow down early.',
      },
      {
        fr: 'Ronds-points : céder le passage en entrant, clignoteur à droite avant la sortie.',
        nl: 'Rotondes: voorrang verlenen bij het oprijden, rechts richting aangeven voor de afrit.',
        en: 'Roundabouts: give way when entering, indicate right before your exit.',
      },
      {
        fr: 'Zones 30, abords d’écoles et passages pour piétons : vitesse adaptée et anticipation.',
        nl: 'Zones 30, schoolomgevingen en zebrapaden: aangepaste snelheid en anticipatie.',
        en: '30 km/h zones, school areas and zebra crossings: suitable speed and anticipation.',
      },
      {
        fr: 'Cyclistes et trottinettes : distance latérale d’au moins 1,5 m hors agglomération, 1 m en agglomération.',
        nl: 'Fietsers en steps: zijdelingse afstand van minstens 1,5 m buiten de bebouwde kom, 1 m erbinnen.',
        en: 'Cyclists and e-scooters: at least 1.5 m side clearance outside built-up areas, 1 m inside.',
      },
      {
        fr: 'Manœuvres près du centre : créneau, demi-tour en trois mouvements, marche arrière, démarrage en côte.',
        nl: 'Manoeuvres in de buurt: fileparkeren, keren in drie bewegingen, achteruitrijden, hellingproef.',
        en: 'Manoeuvres nearby: parallel parking, three-point turn, reversing, hill start.',
      },
    ],
  },
  {
    type: 'mixte',
    radiusKm: 2.1,
    points: 5,
    minutes: 30,
    free: false,
    name: { fr: 'Boucle routes régionales', nl: 'Lus gewestwegen', en: 'Regional roads loop' },
    summary: {
      fr: 'Sortie d’agglomération : nationales, routes de campagne, changements de vitesse et dépassements de cyclistes.',
      nl: 'De bebouwde kom uit: gewestwegen, landelijke wegen, snelheidswissels en fietsers inhalen.',
      en: 'Leaving town: main roads, country roads, changing speed limits and overtaking cyclists.',
    },
    focus: [
      {
        fr: 'Changements de limitation (50 → 70 → 90) : repère les panneaux et adapte-toi sans à-coups.',
        nl: 'Wisselende snelheidslimieten (50 → 70 → 90): let op de borden en pas je vlot aan.',
        en: 'Changing limits (50 → 70 → 90): spot the signs and adapt smoothly.',
      },
      {
        fr: 'Placement à droite, distance de sécurité de 2 secondes minimum, regard loin devant.',
        nl: 'Rechts houden, minstens 2 seconden afstand, ver vooruit kijken.',
        en: 'Keep right, at least a 2-second gap, look far ahead.',
      },
      {
        fr: 'Tourne-à-gauche sur une nationale : bande de présélection, contrôle de l’angle mort.',
        nl: 'Links afslaan op een gewestweg: voorsorteerstrook, dodehoekcontrole.',
        en: 'Turning left on a main road: use the turning lane and check your blind spot.',
      },
      {
        fr: 'Virages et routes étroites : vitesse adaptée avant le virage, pas pendant.',
        nl: 'Bochten en smalle wegen: snelheid aanpassen voor de bocht, niet erin.',
        en: 'Bends and narrow roads: adjust your speed before the bend, not in it.',
      },
      {
        fr: 'Passages à niveau et entrées d’agglomération : ralentis et observe.',
        nl: 'Overwegen en het binnenrijden van de bebouwde kom: vertragen en observeren.',
        en: 'Level crossings and entering built-up areas: slow down and observe.',
      },
    ],
  },
  {
    type: 'rapide',
    radiusKm: 3.6,
    points: 5,
    minutes: 40,
    free: false,
    name: { fr: 'Boucle voie rapide', nl: 'Lus snelweg', en: 'Fast-road loop' },
    summary: {
      fr: 'Voies rapides, ring ou autoroute proches : insertion, tirette, sortie et couloir de secours.',
      nl: 'Nabije snelwegen of ring: invoegen, ritsen, afrijden en reddingsstrook.',
      en: 'Nearby dual carriageways, ring road or motorway: merging, zip merging, exits and emergency corridor.',
    },
    focus: [
      {
        fr: 'Insertion : accélère sur la bande d’accélération jusqu’à la vitesse du trafic, clignoteur et angle mort.',
        nl: 'Invoegen: versnel op de invoegstrook tot de snelheid van het verkeer, richting aangeven en dodehoekcontrole.',
        en: 'Merging: accelerate on the slip road to traffic speed, indicate and check your blind spot.',
      },
      {
        fr: 'Tirette (fermeture éclair) obligatoire à l’endroit où la bande se rétrécit.',
        nl: 'Ritsen is verplicht op de plaats waar de rijstrook versmalt.',
        en: 'Zip merging is compulsory where the lane narrows.',
      },
      {
        fr: 'Couloir de secours dès que le trafic ralentit : à gauche sur la bande de gauche, à droite pour les autres.',
        nl: 'Reddingsstrook zodra het verkeer vertraagt: links op de linkerstrook, rechts voor de andere stroken.',
        en: 'Emergency corridor as soon as traffic slows: left lane moves left, other lanes move right.',
      },
      {
        fr: 'Sortie : place-toi tôt à droite, décélère sur la bande de décélération, pas sur l’autoroute.',
        nl: 'Afrijden: tijdig rechts gaan rijden, vertragen op de uitrijstrook, niet op de snelweg.',
        en: 'Exiting: move right early and slow down on the exit lane, not on the motorway.',
      },
      {
        fr: 'Dépassement uniquement par la gauche, retour à droite dès que possible.',
        nl: 'Alleen links inhalen, zo snel mogelijk terug naar rechts.',
        en: 'Overtake on the left only and move back right as soon as possible.',
      },
    ],
  },
];

const routeUrl = (center, waypoints) => {
  const origin = `${center.lat},${center.lng}`;
  const via = waypoints.map((w) => `${w.lat},${w.lng}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${encodeURIComponent(via)}&travelmode=driving`;
};

// Longueur approximative de la boucle (à vol d'oiseau × 1,3 pour les détours de la route).
function loopKm(center, waypoints) {
  const pts = [center, ...waypoints, center];
  let km = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const dLat = (pts[i].lat - pts[i - 1].lat) * KM_PER_DEG_LAT;
    const dLng = (pts[i].lng - pts[i - 1].lng) * KM_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180);
    km += Math.hypot(dLat, dLng);
  }
  return Math.round(km * 1.3);
}

export function routesForCenter(centerId, lang = 'fr') {
  const center = EXAM_CENTERS.find((c) => c.id === centerId);
  if (!center) return null;
  return ROUTE_TYPES.map((rt) => {
    const waypoints = loop(center, rt.radiusKm, rt.points, seedFrom(`${center.id}:${rt.type}`));
    return {
      id: `${center.id}:${rt.type}`,
      centerId: center.id,
      type: rt.type,
      free: rt.free,
      name: pickText(rt.name, lang),
      summary: pickText(rt.summary, lang),
      focus: rt.focus.map((f) => pickText(f, lang)),
      minutes: rt.minutes,
      distanceKm: loopKm(center, waypoints),
      start: { lat: center.lat, lng: center.lng },
      waypoints,
      mapsUrl: routeUrl(center, waypoints),
    };
  });
}

export const isRouteId = (id) => {
  const [centerId, type] = String(id ?? '').split(':');
  return EXAM_CENTERS.some((c) => c.id === centerId) && ROUTE_TYPES.some((r) => r.type === type);
};
