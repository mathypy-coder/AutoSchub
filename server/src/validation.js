import { HttpError } from './errors.js';
import { PERMIT_CODES } from './data/permits.js';

export const LANGUAGES = ['fr', 'nl', 'de', 'en', 'ar', 'it', 'es'];
export const TRANSMISSIONS = ['manuelle', 'automatique', 'les deux'];
export const MIN_RATE = 20;
export const MAX_RATE = 250;

// Texte saisi : chaîne nettoyée, '' si absent ou d'un autre type (nombre, objet…).
export const text = (value, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export const optionalText = (value, max = 500) => text(value, max) || null;

// Date AAAA-MM-JJ réelle (refuse 2024-13-45).
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function readPosition(lat, lng) {
  const position = { lat: Number(lat), lng: Number(lng) };
  if (
    lat === null || lng === null || lat === '' || lng === '' ||
    !Number.isFinite(position.lat) || !Number.isFinite(position.lng) ||
    Math.abs(position.lat) > 90 || Math.abs(position.lng) > 180
  ) {
    throw new HttpError(400, 'Position invalide.');
  }
  return position;
}

export function readRate(value) {
  const rate = Number(value);
  if (value === null || value === '' || !Number.isFinite(rate) || rate < MIN_RATE || rate > MAX_RATE) {
    throw new HttpError(400, `Le tarif horaire doit être compris entre ${MIN_RATE} € et ${MAX_RATE} €.`);
  }
  return Math.round(rate * 100);
}

export function readCategories(value) {
  const categories = [...new Set((Array.isArray(value) ? value : []).filter((c) => PERMIT_CODES.includes(c)))];
  if (!categories.length) throw new HttpError(400, 'Indiquez au moins une catégorie de permis enseignée.');
  return categories;
}

export function readLanguages(value) {
  const languages = [...new Set((Array.isArray(value) ? value : []).filter((l) => LANGUAGES.includes(l)))];
  if (!languages.length) throw new HttpError(400, 'Langues invalides.');
  return languages;
}

export function readTransmission(value) {
  if (!TRANSMISSIONS.includes(value)) throw new HttpError(400, 'Boîte de vitesses invalide.');
  return value;
}
