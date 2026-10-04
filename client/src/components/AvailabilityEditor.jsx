import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorMessage } from './ui.jsx';

const DAYS = [
  { weekday: 1, label: 'Lundi' },
  { weekday: 2, label: 'Mardi' },
  { weekday: 3, label: 'Mercredi' },
  { weekday: 4, label: 'Jeudi' },
  { weekday: 5, label: 'Vendredi' },
  { weekday: 6, label: 'Samedi' },
  { weekday: 0, label: 'Dimanche' },
];

const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Plages de travail hebdomadaires du moniteur (heure de Bruxelles) : les élèves ne voient que ces créneaux.
export default function AvailabilityEditor() {
  const [week, setWeek] = useState(null);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/instructors/me/availability')
      .then((d) => {
        setIsDefault(d.isDefault);
        setWeek(Object.fromEntries(d.week.map((w) => [w.weekday, { start: toTime(w.startMin), end: toTime(w.endMin) }])));
      })
      .catch((err) => setError(err.message));
  }, []);

  if (!week) return error ? <ErrorMessage error={error} /> : null;

  const toggle = (weekday) =>
    setWeek((w) => {
      const next = { ...w };
      if (next[weekday]) delete next[weekday];
      else next[weekday] = { start: '09:00', end: '18:00' };
      return next;
    });

  const save = async () => {
    setError('');
    setMessage('');
    try {
      await api('/instructors/me/availability', {
        method: 'PUT',
        body: {
          week: Object.entries(week).map(([weekday, d]) => ({
            weekday: Number(weekday),
            startMin: toMinutes(d.start),
            endMin: toMinutes(d.end),
          })),
        },
      });
      setIsDefault(false);
      setMessage('Disponibilités enregistrées ✔');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <strong>Mes disponibilités</strong>
      <p className="muted small">
        Les élèves réservent uniquement dans ces plages (heure belge).
        {isDefault && ' Plages par défaut : du lundi au samedi, 8 h – 19 h.'}
      </p>
      {DAYS.map(({ weekday, label }) => (
        <div key={weekday} className="avail-row">
          <label className="switch">
            <input type="checkbox" checked={Boolean(week[weekday])} onChange={() => toggle(weekday)} />
            {label}
          </label>
          {week[weekday] ? (
            <span className="row">
              <input
                type="time"
                step={1800}
                value={week[weekday].start}
                aria-label={`${label} début`}
                onChange={(e) => setWeek({ ...week, [weekday]: { ...week[weekday], start: e.target.value } })}
              />
              <span>–</span>
              <input
                type="time"
                step={1800}
                value={week[weekday].end}
                aria-label={`${label} fin`}
                onChange={(e) => setWeek({ ...week, [weekday]: { ...week[weekday], end: e.target.value } })}
              />
            </span>
          ) : (
            <span className="muted small">Repos</span>
          )}
        </div>
      ))}
      <ErrorMessage error={error} />
      {message && <p className="success">{message}</p>}
      <button type="button" className="btn btn-primary" onClick={save}>
        Enregistrer mes disponibilités
      </button>
    </div>
  );
}
