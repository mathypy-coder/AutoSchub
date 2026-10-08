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

  const activeDays = DAYS.filter((d) => week[d]);
  const weeklyHours =
    activeDays.reduce((sum, d) => sum + Math.max(0, toMinutes(week[d].end) - toMinutes(week[d].start)), 0) / 60;
  const firstActive = activeDays[0];
  const copyToAll = () =>
    setWeek((w) => Object.fromEntries(Object.keys(w).map((d) => [d, { ...w[firstActive] }])));

  return (
    <div className="card ins-avail">
      <div className="ins-avail-summary">
        <strong>{t('availability.summary', { days: activeDays.length, hours: Math.round(weeklyHours * 10) / 10 })}</strong>
        {isDefault && <small>{t('availability.defaultNote')}</small>}
      </div>
      {DAYS.map((weekday) => {
        const label = t(`availability.day${weekday}`);
        const on = Boolean(week[weekday]);
        return (
          <div key={weekday} className={`avail-row ins-avail-row ${on ? 'on' : ''}`}>
            <label className="ins-toggle">
              <input type="checkbox" checked={on} onChange={() => toggle(weekday)} />
              <span className="ins-toggle-track" aria-hidden="true" />
              <span className="ins-toggle-label">{label}</span>
            </label>
            {on ? (
              <span className="row">
                <input
                  type="time"
                  step={1800}
                  value={week[weekday].start}
                  aria-label={t('availability.start', { day: label })}
                  onChange={(e) => setWeek({ ...week, [weekday]: { ...week[weekday], start: e.target.value } })}
                />
                <span aria-hidden="true">–</span>
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
      {activeDays.length > 1 && (
        <button type="button" className="ins-text-btn" onClick={copyToAll}>
          {t('availability.copyFirst', { day: t(`availability.day${firstActive}`) })}
        </button>
      )}
      <ErrorMessage error={error} />
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <button type="button" className="btn btn-primary btn-block" onClick={save}>
        {t('availability.save')}
      </button>
    </div>
  );
}
