import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorMessage } from './ui.jsx';
import { useT } from '../i18n.jsx';

// Ordre d'affichage (lundi → dimanche) ; libellé : t(`availability.day${weekday}`).
const DAYS = [1, 2, 3, 4, 5, 6, 0];

const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Plages de travail hebdomadaires du moniteur (heure de Bruxelles) : les élèves ne voient que ces créneaux.
export default function AvailabilityEditor() {
  const t = useT();
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
      setMessage(t('availability.saved'));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <strong>{t('availability.title')}</strong>
      <p className="muted small">
        {t('availability.intro')}
        {isDefault && t('availability.defaultNote')}
      </p>
      {DAYS.map((weekday) => {
        const label = t(`availability.day${weekday}`);
        return (
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
                  aria-label={t('availability.start', { day: label })}
                  onChange={(e) => setWeek({ ...week, [weekday]: { ...week[weekday], start: e.target.value } })}
                />
                <span>–</span>
                <input
                  type="time"
                  step={1800}
                  value={week[weekday].end}
                  aria-label={t('availability.end', { day: label })}
                  onChange={(e) => setWeek({ ...week, [weekday]: { ...week[weekday], end: e.target.value } })}
                />
              </span>
            ) : (
              <span className="muted small">{t('availability.off')}</span>
            )}
          </div>
        );
      })}
      <ErrorMessage error={error} />
      {message && <p className="success">{message}</p>}
      <button type="button" className="btn btn-primary" onClick={save}>
        {t('availability.save')}
      </button>
    </div>
  );
}
