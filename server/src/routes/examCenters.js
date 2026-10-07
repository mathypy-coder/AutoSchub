import { Router } from 'express';
import { EXAM_CENTERS, OPERATORS, REGIONS } from '../data/examCenters.js';
import { distanceKm } from '../geo.js';
import { localizeRegion } from '../i18n.js';

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function serializeCenter(center, from) {
  const operator = OPERATORS[center.operator];
  const address = `${center.street}, ${center.postalCode} ${center.city}`;
  const result = {
    ...center,
    operator: operator.name,
    operatorWebsite: operator.website,
    address,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}, Belgique`)}`,
  };
  if (from) result.distanceKm = Math.round(distanceKm(from.lat, from.lng, center.lat, center.lng) * 10) / 10;
  return result;
}

export function examCenterRoutes() {
  const router = Router();

  // Recherche par texte (ville, code postal, nom, opérateur), Région et proximité.
  router.get('/', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const from = req.query.lat && req.query.lng && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    const terms = normalize(req.query.q).split(/\s+/).filter(Boolean);
    const { region } = req.query;

    const centers = EXAM_CENTERS.map((c) => serializeCenter(c, from))
      .filter((c) => !region || c.region === region)
      .filter((c) => {
        const haystack = normalize(`${c.name} ${c.address} ${c.operator} ${c.region}`);
        return terms.every((t) => haystack.includes(t));
      })
      .sort((a, b) => (from ? a.distanceKm - b.distanceKm : a.name.localeCompare(b.name, 'fr')));

    res.json({ regions: REGIONS.map((r) => localizeRegion(r, req.lang)), total: EXAM_CENTERS.length, centers });
  });

  return router;
}
