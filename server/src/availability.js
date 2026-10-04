import { BLOCKING_STATUSES } from './bookingRules.js';
import { brusselsToUtc, formatHM, utcToBrussels } from './time.js';

// Plages par défaut d'un moniteur qui n'a rien configuré : du lundi au samedi, 8 h – 19 h.
export const DEFAULT_WEEK = [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startMin: 480, endMin: 1140 }));

const SLOT_STEP_MIN = 30;
// Délai minimum entre la réservation et le début d'une leçon planifiée.
const MIN_LEAD_MIN = 60;
// Horizon de réservation.
export const BOOKING_HORIZON_DAYS = 60;

export async function getWeek(db, instructorId) {
  const rows = await db.all(
    'SELECT weekday, start_min AS startMin, end_min AS endMin FROM instructor_availability WHERE instructor_id = ? ORDER BY weekday',
    instructorId,
  );
  return { week: rows.length ? rows : DEFAULT_WEEK, isDefault: !rows.length };
}

// Une leçon planifiée doit tenir entièrement dans la plage du jour (heure de Bruxelles).
export function fitsWeek(week, startIso, durationMin) {
  const local = utcToBrussels(startIso);
  const day = week.find((d) => d.weekday === local.weekday);
  return Boolean(day) && local.minutes >= day.startMin && local.minutes + durationMin <= day.endMin;
}

const overlaps = (a0, aDur, b0, bDur) => a0 < b0 + bDur * 60000 && b0 < a0 + aDur * 60000;

// Créneaux libres d'un moniteur pour une date (et un élève, pour éviter ses propres conflits).
export async function freeSlots(db, instructorId, dateStr, durationMin, studentId = null, now = Date.now()) {
  const { week } = await getWeek(db, instructorId);
  const weekday = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
  const day = week.find((d) => d.weekday === weekday);
  if (!day) return [];

  const dayStart = brusselsToUtc(dateStr, 0).getTime();
  const busy = await db.all(
    `SELECT start_at, duration_min FROM bookings
       WHERE (instructor_id = ? OR student_id = ?)
         AND status IN (${BLOCKING_STATUSES.map(() => '?').join(',')})
         AND start_at >= ? AND start_at < ?`,
    instructorId,
    studentId ?? -1,
    ...BLOCKING_STATUSES,
    new Date(dayStart - 4 * 3600000).toISOString(),
    new Date(dayStart + 28 * 3600000).toISOString(),
  );

  const slots = [];
  for (let m = day.startMin; m + durationMin <= day.endMin; m += SLOT_STEP_MIN) {
    const start = brusselsToUtc(dateStr, m).getTime();
    if (start < now + MIN_LEAD_MIN * 60000) continue;
    if (busy.some((b) => overlaps(start, durationMin, Date.parse(b.start_at), b.duration_min))) continue;
    slots.push({ startAt: new Date(start).toISOString(), label: formatHM(m) });
  }
  return slots;
}
