const EARTH_RADIUS_KM = 6371;
const AVERAGE_CITY_SPEED_KMH = 30;

export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function etaMinutes(km) {
  return Math.max(2, Math.round((km / AVERAGE_CITY_SPEED_KMH) * 60));
}

// Centre de Bruxelles, utilisé quand l'élève ne partage pas sa position.
export const DEFAULT_POSITION = { lat: 50.8467, lng: 4.3525 };
