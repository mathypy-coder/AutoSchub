// Heure de Bruxelles (heure d'été/hiver comprise) ↔ instants UTC.
// Les disponibilités des moniteurs sont exprimées en heure locale belge,
// les leçons sont stockées en UTC (ISO 8601).
export const TIME_ZONE = 'Europe/Brussels';

const offsetFormatter = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeZoneName: 'shortOffset' });
const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Décalage de Bruxelles par rapport à UTC, en minutes (60 en hiver, 120 en été).
export function brusselsOffsetMinutes(date) {
  const name = offsetFormatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1';
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === '-' ? -minutes : minutes;
}

// « 2026-10-12 » à 9 h 30 (570 min) heure de Bruxelles → Date UTC.
export function brusselsToUtc(dateStr, minutes) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  let utc = naive - brusselsOffsetMinutes(new Date(naive)) * 60000;
  // Second passage pour les jours de changement d'heure.
  utc = naive - brusselsOffsetMinutes(new Date(utc)) * 60000;
  return new Date(utc);
}

// Instant → { date: 'AAAA-MM-JJ', minutes, weekday (0 = dimanche) } à Bruxelles.
export function utcToBrussels(value) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(value)).map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    date,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
  };
}

export const formatHM = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
