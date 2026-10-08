import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { useT } from '../../i18n.jsx';
import { ErrorMessage, PageHeader, Stepper } from '../../components/ui.jsx';

const TRACKS = [
  { id: 'school', icon: '🚗', plan: 'conduite' },
  { id: 'free', icon: '🧭', plan: 'libre' },
  { id: 'theory', icon: '📝', plan: 'theorie' },
];
const REGIONS = [
  { id: 'bruxelles', icon: '🏙️' },
  { id: 'wallonie', icon: '🌲' },
  { id: 'flandre', icon: '🌷' },
];

// Accueil guidé en 3 questions : permis visé → façon d'apprendre → Région, puis la route à suivre.
export default function Onboarding() {
  const t = useT();
  const navigate = useNavigate();
  const { user, updateMe } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(null);
  const [group, setGroup] = useState(null);
  const [category, setCategory] = useState(user.goalCategory ?? null);
  const [track, setTrack] = useState(user.learningTrack ?? null);
  const [region, setRegion] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/permits', { auth: false })
      .then((d) => {
        setData(d);
        const current = d.permits.find((p) => p.code === (user.goalCategory ?? 'B'));
        setGroup(current?.group ?? 'voiture');
      })
      .catch((err) => setError(err.message));
  }, [user.goalCategory]);

  const steps = [
    { id: 'permit', label: t('onboarding.stepPermit') },
    { id: 'track', label: t('onboarding.stepTrack') },
    { id: 'region', label: t('onboarding.stepRegion') },
    { id: 'route', label: t('onboarding.stepRoute') },
  ];
  // La filière libre (guide) concerne le permis B.
  const freeAllowed = category === 'B';

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      await updateMe({ goalCategory: category, learningTrack: track });
      if (region && track === 'free') await api('/free-track/me', { method: 'PUT', body: { region } });
      navigate('/accueil', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const next = () => setStep((s) => s + 1);
  const canNext = [Boolean(category), Boolean(track), true][step] ?? true;

  return (
    <div className="page onboarding">
      <Stepper steps={steps} current={step} />

      {step === 0 && (
        <>
          <PageHeader eyebrow={t('onboarding.eyebrow', { name: user.firstName })} title={t('onboarding.permitTitle')} subtitle={t('onboarding.permitSubtitle')} />
          <div className="choice-grid">
            {(data?.groups ?? []).map((g) => (
              <button key={g.id} type="button" className={`choice-card ${group === g.id ? 'selected' : ''}`} onClick={() => setGroup(g.id)}>
                <span className="choice-icon" aria-hidden="true">{g.icon}</span>
                <strong>{g.label}</strong>
              </button>
            ))}
          </div>
          {group && (
            <div className="choice-list onboarding-permits">
              {data.permits
                .filter((p) => p.group === group)
                .map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    className={`choice-card ${category === p.code ? 'selected' : ''}`}
                    onClick={() => {
                      setCategory(p.code);
                      if (p.code !== 'B' && track === 'free') setTrack(null);
                    }}
                  >
                    <span className="permit-code">{p.code}</span>
                    <span>
                      <strong>{p.label}</strong>
                      <small>{p.description}</small>
                      <small>{t('onboarding.minAge', { age: p.minAge })}</small>
                    </span>
                  </button>
                ))}
            </div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <PageHeader eyebrow={t('onboarding.permitChosen', { category })} title={t('onboarding.trackTitle')} subtitle={t('onboarding.trackSubtitle')} />
          <div className="choice-list">
            {TRACKS.map((tr) => {
              const disabled = tr.id === 'free' && !freeAllowed;
              return (
                <button
                  key={tr.id}
                  type="button"
                  disabled={disabled}
                  className={`choice-card ${track === tr.id ? 'selected' : ''}`}
                  onClick={() => setTrack(tr.id)}
                >
                  <span className="choice-icon" aria-hidden="true">{tr.icon}</span>
                  <span>
                    <strong>{t(`onboarding.track_${tr.id}`)}</strong>
                    <small>{t(`onboarding.track_${tr.id}_text`)}</small>
                    {disabled ? <small>{t('onboarding.freeOnlyB')}</small> : <span className="tag">{t(`onboarding.track_${tr.id}_tag`)}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <PageHeader eyebrow={t('onboarding.almostDone')} title={t('onboarding.regionTitle')} subtitle={t(track === 'free' ? 'onboarding.regionSubtitleFree' : 'onboarding.regionSubtitle')} />
          <div className="choice-list">
            {REGIONS.map((r) => (
              <button key={r.id} type="button" className={`choice-card ${region === r.id ? 'selected' : ''}`} onClick={() => setRegion(r.id)}>
                <span className="choice-icon" aria-hidden="true">{r.icon}</span>
                <span>
                  <strong>{t(`onboarding.region_${r.id}`)}</strong>
                  <small>{t(`onboarding.region_${r.id}_text`)}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <PageHeader eyebrow={t('onboarding.ready')} title={t('onboarding.routeTitle', { category })} subtitle={t('onboarding.routeSubtitle')} />
          <ol className="route-preview">
            {['theory', 'provisional', track === 'free' ? 'practiceFree' : 'practiceSchool', 'exam', 'license'].map((id, i) => (
              <li key={id}>
                <span className="step-badge">{i + 1}</span>
                <span>
                  <strong>{t(`onboarding.route_${id}`)}</strong>
                  <small>{t(`onboarding.route_${id}_text`)}</small>
                </span>
              </li>
            ))}
          </ol>
          <div className="card pack-suggest">
            <strong>{t('onboarding.packSuggestTitle')}</strong>
            <span className="small">{t(`onboarding.packSuggest_${track}`)}</span>
            <Link className="small" to="/pack">
              {t('onboarding.seePacks')}
            </Link>
          </div>
        </>
      )}

      <ErrorMessage error={error} />
      <div className="sticky-cta">
        {step > 0 && (
          <button type="button" className="btn btn-secondary" onClick={() => setStep((s) => s - 1)} disabled={busy}>
            {t('common.back')}
          </button>
        )}
        <div className="grow" />
        {step === 2 && (
          <button type="button" className="btn btn-secondary" onClick={next}>
            {t('onboarding.skip')}
          </button>
        )}
        {step < 3 ? (
          <button type="button" className="btn btn-primary" disabled={!canNext} onClick={next}>
            {t('onboarding.continue')}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={finish}>
            {t('onboarding.start')}
          </button>
        )}
      </div>
    </div>
  );
}
