import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { ErrorMessage } from './ui.jsx';

export const LEVEL_LABELS = ['Non abordé', 'Abordé', 'En progrès', 'Maîtrisé'];

// Regroupe les compétences par thème (« Manœuvres », « Circulation »…).
export function groupSkills(skills) {
  const groups = new Map();
  for (const s of skills) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);
  return [...groups.entries()];
}

export function LevelBar({ level }) {
  return (
    <span className="level-bar" aria-label={LEVEL_LABELS[level]}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= level ? `on level-${level}` : ''} />
      ))}
    </span>
  );
}

// Fiche de suivi d'une leçon : le moniteur note chaque compétence (0 à 3), l'élève consulte.
export default function SkillsSheet({ bookingId, editable }) {
  const [data, setData] = useState(null);
  const [levels, setLevels] = useState({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/bookings/${bookingId}/skills`)
      .then((d) => {
        setData(d);
        setLevels(Object.fromEntries(d.skills.map((s) => [s.id, s.lessonLevel ?? s.level])));
      })
      .catch((err) => setError(err.message));
  }, [bookingId]);

  const groups = useMemo(() => groupSkills(data?.skills ?? []), [data]);

  const save = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await api(`/bookings/${bookingId}/skills`, { method: 'POST', body: { levels } });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="skills-sheet">{error ? <ErrorMessage error={error} /> : <p className="muted small">Chargement…</p>}</div>;

  return (
    <div className="skills-sheet">
      {groups.map(([group, skills]) => (
        <div key={group} className="skills-group">
          <div className="label">{group}</div>
          {skills.map((s) => (
            <div key={s.id} className="skill-row">
              <span className="small grow">{s.label}</span>
              {editable ? (
                <div className="level-picker" role="radiogroup" aria-label={s.label}>
                  {LEVEL_LABELS.map((label, level) => (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={levels[s.id] === level}
                      title={label}
                      className={levels[s.id] === level ? `on level-${level}` : ''}
                      onClick={() => {
                        setSaved(false);
                        setLevels({ ...levels, [s.id]: level });
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              ) : (
                <LevelBar level={s.level} />
              )}
            </div>
          ))}
        </div>
      ))}
      {editable ? (
        <>
          <p className="muted small">0 non abordé · 1 abordé · 2 en progrès · 3 maîtrisé</p>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
            {busy ? 'Enregistrement…' : 'Enregistrer la fiche'}
          </button>
          {saved && <span className="success small"> Fiche enregistrée ✔</span>}
        </>
      ) : (
        <p className="muted small">Niveau actuel pour chaque compétence, d’après les fiches de tes moniteurs.</p>
      )}
      <ErrorMessage error={error} />
    </div>
  );
}
