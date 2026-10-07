import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { ErrorMessage } from './ui.jsx';
import { translate, useT } from '../i18n.jsx';

// Niveaux 0 à 3 ; libellé traduit à la demande (la langue peut changer).
export const LEVELS = [0, 1, 2, 3];
export const levelLabel = (level) => translate(`skills.level${level}`);

// Regroupe les compétences par thème (« Manœuvres », « Circulation »…).
export function groupSkills(skills) {
  const groups = new Map();
  for (const s of skills) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);
  return [...groups.entries()];
}

export function LevelBar({ level }) {
  const t = useT();
  return (
    <span className="level-bar" aria-label={t(`skills.level${level}`)}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= level ? `on level-${level}` : ''} />
      ))}
    </span>
  );
}

// Fiche de suivi d'une leçon : le moniteur note chaque compétence (0 à 3), l'élève consulte.
export default function SkillsSheet({ bookingId, editable }) {
  const t = useT();
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

  if (!data) return <div className="skills-sheet">{error ? <ErrorMessage error={error} /> : <p className="muted small">{t('common.loading')}</p>}</div>;

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
                  {LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={levels[s.id] === level}
                      title={t(`skills.level${level}`)}
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
          <p className="muted small">{t('skills.legend')}</p>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
            {busy ? t('skills.saving') : t('skills.save')}
          </button>
          {saved && <span className="success small"> {t('skills.saved')}</span>}
        </>
      ) : (
        <p className="muted small">{t('skills.readonlyNote')}</p>
      )}
      <ErrorMessage error={error} />
    </div>
  );
}
