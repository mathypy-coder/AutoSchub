// Fichier .ics pour ajouter une leçon à l'agenda du téléphone (Apple, Google, Outlook).
const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = (value) => String(value ?? '').replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export function downloadLessonIcs(booking, otherName) {
  const start = new Date(booking.startAt);
  const end = new Date(start.getTime() + booking.durationMin * 60000);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AutoSchub//Lecons//FR',
    'BEGIN:VEVENT',
    `UID:lecon-${booking.id}@autoschub`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`Leçon de conduite (permis ${booking.category}) – ${otherName}`)}`,
    `LOCATION:${escape(booking.pickupAddress)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Leçon de conduite dans 1 h',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `lecon-autoschub-${booking.id}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
