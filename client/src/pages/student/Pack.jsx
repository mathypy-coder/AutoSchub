import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { ErrorMessage, PageHeader, SectionHead } from '../../components/ui.jsx';
import { getLocale, translate, useT } from '../../i18n.jsx';
import '../../styles/pages.css';

// Formule recommandée selon la filière choisie à l'accueil guidé.
const RECOMMENDED_BY_TRACK = { school: 'conduite', free: 'libre', theory: 'theorie' };

const formatDate = (iso) =>
  new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

const hoursLabel = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? translate('pack.hoursMinutes', { h, m: String(m).padStart(2, '0') }) : translate('pack.hours', { h });
};

export default function Pack() {
  const t = useT();
  const [catalog, setCatalog] = useState(null);
  const [permits, setPermits] = useState([]);
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    api('/subscriptions/me')
      .then(setState)
      .catch((err) => setError(err.message));

  useEffect(() => {
    api('/subscriptions/plans', { auth: false }).then(setCatalog).catch((err) => setError(err.message));
    api('/permits', { auth: false }).then((d) => setPermits(d.permits)).catch(() => {});
    load();
  }, []);

  const call = async (path, method, body) => {
    setError('');
    try {
      setState(await api(path, { method, body }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!catalog || !state) {
    return (
      <div className="page pg">
        <PageHeader eyebrow={t('pack.eyebrow')} title={t('pack.title')} />
        {error ? (
          <ErrorMessage error={error} />
        ) : (
          <>
            <div className="skeleton" style={{ minHeight: 220 }} />
            <div className="skeleton" style={{ minHeight: 220 }} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page pg">
      <ErrorMessage error={error} />
      {state.subscription && state.subscription.status === 'active' ? (
        <ActivePack state={state} catalog={catalog} onCall={call} />
      ) : (
        <PlanPicker
          catalog={catalog}
          permits={permits}
          completed={state.subscription?.status === 'completed'}
          onSubscribe={(planId, category) => call('/subscriptions', 'POST', { planId, category })}
        />
      )}
    </div>
  );
}

function PlanPicker({ catalog, permits, completed, onSubscribe }) {
  const t = useT();
  const { user } = useAuth();
  const recommendedId = RECOMMENDED_BY_TRACK[user?.learningTrack] ?? null;
  const plans = recommendedId
    ? [...catalog.plans].sort((a, b) => (b.id === recommendedId) - (a.id === recommendedId))
    : catalog.plans;
  const [planId, setPlanId] = useState(
    () => (recommendedId && plans.some((p) => p.id === recommendedId) ? recommendedId : plans.find((p) => p.popular)?.id ?? plans[0]?.id),
  );
  const [category, setCategory] = useState(user?.goalCategory || 'B');
  const [busy, setBusy] = useState(false);
  const selected = plans.find((p) => p.id === planId);

  const subscribe = async () => {
    if (!selected) return;
    setBusy(true);
    await onSubscribe(selected.id, category);
    setBusy(false);
  };

  return (
    <>
      <PageHeader eyebrow={t('pack.eyebrow')} title={t('pack.title')} subtitle={t('pack.intro')} />
      {completed && (
        <div className="card result-pass center">
          <strong>{t('pack.congratsTitle')}</strong>
          <span className="small">{t('pack.congratsText')}</span>
        </div>
      )}

      <section>
        <SectionHead
          step={1}
          done={!!selected}
          title={t('pack.stepPlan')}
          subtitle={recommendedId ? t('pack.stepPlanSubReco') : t('pack.stepPlanSub')}
        />
        <div className="pg-plans" role="radiogroup" aria-label={t('pack.stepPlan')}>
          {plans.map((plan) => {
            const isReco = plan.id === recommendedId;
            const flag = isReco ? t('pack.recommended') : !recommendedId && plan.popular ? t('pack.popular') : null;
            const isSelected = plan.id === planId;
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`pg-plan ${isSelected ? 'selected' : ''} ${isReco ? 'reco' : ''}`}
                onClick={() => setPlanId(plan.id)}
              >
                {flag && <span className="pg-plan-flag">{flag}</span>}
                <span className="pg-plan-head">
                  <span className="grow">
                    <strong className="pg-plan-name">{plan.name}</strong>
                    <small className="muted">{plan.tagline}</small>
                  </span>
                  <span className="pg-radio" aria-hidden="true" />
                </span>
                <span className="pg-plan-price">
                  <strong>{formatPrice(plan.priceMonthly)}</strong>
                  <span className="muted small">{t('pack.perMonth')}</span>
                </span>
                <span className="pg-plan-hours">
                  {plan.includedMinutes > 0
                    ? t('pack.hoursIncluded', { hours: hoursLabel(plan.includedMinutes) })
                    : t('pack.noHoursIncluded')}
                </span>
                <ul className="pg-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="pg-check" aria-hidden="true">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHead
          step={2}
          title={t('pack.whichPermit')}
          subtitle={t('pack.targetHours', { hours: catalog.targetHours[category], category })}
        />
        <div className="chips chips-scroll" role="group" aria-label={t('pack.whichPermit')}>
          {permits.map((p) => (
            <button
              key={p.code}
              type="button"
              aria-pressed={p.code === category}
              className={`chip ${p.code === category ? 'chip-active' : ''}`}
              onClick={() => setCategory(p.code)}
            >
              {p.code}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionHead step={3} title={t('pack.stepConfirm')} subtitle={t('pack.stepConfirmSub')} />
        <p className="muted small center">
          {t('pack.withoutPack', { count: catalog.freeExamsPerWeek })}
          <br />
          {t('pack.demoPayment')}
        </p>
      </section>

      {selected && (
        <div className="sticky-cta">
          <span className="grow">
            <strong>
              {selected.name} · {t('pack.permitTitle', { category })}
            </strong>
            <small>{t('pack.pricePerMonth', { price: formatPrice(selected.priceMonthly) })} · {t('pack.noCommitment')}</small>
          </span>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={subscribe}>
            {t('pack.subscribe')}
          </button>
        </div>
      )}
    </>
  );
}

function ActivePack({ state, catalog, onCall }) {
  const t = useT();
  const { subscription: sub, journey } = state;
  const [declaring, setDeclaring] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const otherPlans = catalog.plans.filter((p) => p.id !== sub.plan.id);
  const DECLARE_FIELDS = { provisional: 'provisionalAt', guide: 'guideSessionAt', exam: 'examDate', license: 'licenseObtainedAt' };
  const FREE_TRACK_LINKS = { roadbook: 'roadbook', routes: 'routes', duration: 'guide' };

  return (
    <>
      <PageHeader eyebrow={t('pack.eyebrowActive')} title={t('pack.activeTitle')} subtitle={t('pack.activeSubtitle')} />
      <div className="card pack-hero">
        <div className="row-between">
          <span className="badge badge-in_progress">{t('pack.packBadge', { plan: sub.plan.name })}</span>
          <strong>{t('pack.pricePerMonth', { price: formatPrice(sub.plan.priceMonthly) })}</strong>
        </div>
        <h2 className="pg-pack-permit">{t('pack.permitTitle', { category: sub.category })}</h2>
        {sub.includedMinutes > 0 && (
          <>
            <div className="row-between small">
              <span>{t('pack.includedHours')}</span>
              <strong>
                {t('pack.remaining', { remaining: hoursLabel(sub.remainingMinutes), included: hoursLabel(sub.includedMinutes) })}
              </strong>
            </div>
            <div className="progress">
              <div style={{ width: `${(sub.remainingMinutes / sub.includedMinutes) * 100}%` }} />
            </div>
          </>
        )}
        <p className="small muted">
          {sub.licenseObtained
            ? t('pack.licenseObtained', { date: formatDate(sub.currentPeriodEnd) })
            : sub.cancelAtPeriodEnd
              ? t('pack.cancelled', { date: formatDate(sub.currentPeriodEnd) })
              : t('pack.renewal', { date: formatDate(sub.currentPeriodEnd) })}
          {sub.pendingPlan && t('pack.pendingPlan', { plan: sub.pendingPlan.name })}
          {sub.plan.discount > 0 && t('pack.discount', { percent: Math.round(sub.plan.discount * 100) })}
        </p>
        <Link className="btn btn-primary btn-block" to="/reserver">
          {t('pack.bookLesson')}
        </Link>
      </div>

      {journey.nextStep && (
        <div className="card next-step">
          <strong>{t('pack.nextStep')}</strong>
          <span className="small">{journey.nextStep.advice}</span>
        </div>
      )}

      {journey.coach && sub.plan.id === 'integral' && (
        <div className="card">
          <strong>{t('pack.coachTitle')}</strong>
          <span className="small">
            {t('pack.coachText', {
              name: `${journey.coach.firstName} ${journey.coach.lastName}`,
              count: journey.coach.lessons,
            })}
          </span>
        </div>
      )}

      {journey.freeTrack && (
        <Link className="card card-link" to="/libre">
          <strong>{t('pack.freeTrackTitle')}</strong>
          <span className="small">{t('pack.freeTrackText')}</span>
        </Link>
      )}

      <SectionHead title={t('pack.journeyTitle')} subtitle={t('pack.journeySub')} />
      <ol className="journey">
        {journey.steps.map((step) => (
          <li key={step.id} className={`journey-step ${step.done ? 'done' : ''} ${journey.nextStep?.id === step.id ? 'current' : ''}`}>
            <span className="journey-dot" aria-hidden="true">
              {step.done ? '✓' : ''}
            </span>
            <div className="grow">
              <strong>{step.label}</strong>
              {step.detail && <div className="small muted">{step.detail}</div>}
              {step.progress != null && (
                <div className="progress">
                  <div style={{ width: `${step.progress * 100}%` }} />
                </div>
              )}
              {step.date && <div className="small muted">{formatDate(step.date)}</div>}
              {step.id === 'theory' && !step.done && (
                <Link className="small" to="/theorie">
                  {t('pack.takeMockExam')}
                </Link>
              )}
              {journey.freeTrack && FREE_TRACK_LINKS[step.id] && !step.done && (
                <Link className="small" to={`/libre?tab=${FREE_TRACK_LINKS[step.id]}`}>
                  {t('pack.openFreeTrack')}
                </Link>
              )}
              {step.declarable && declaring !== step.id && (
                <button type="button" className="link-button small" onClick={() => setDeclaring(step.id)}>
                  {step.done ? t('pack.editDate') : t('pack.declareStep')}
                </button>
              )}
              {declaring === step.id && (
                <form
                  className="row declare"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (step.id === 'license' && !window.confirm(t('pack.confirmLicense'))) return;
                    await onCall('/subscriptions/me/journey', 'PATCH', { [DECLARE_FIELDS[step.id]]: date });
                    setDeclaring(null);
                  }}
                >
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  <button className="btn btn-primary">{t('pack.ok')}</button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ol>

      <SectionHead title={t('pack.changePlan')} subtitle={t('pack.changePlanHint', { date: formatDate(sub.currentPeriodEnd) })} />
      <div className="row wrap">
        {otherPlans.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`btn ${sub.pendingPlan?.id === p.id ? 'btn-primary' : 'btn-secondary'}`}
            disabled={sub.pendingPlan?.id === p.id}
            onClick={() => onCall('/subscriptions/me/plan', 'POST', { planId: p.id })}
          >
            {t('pack.planOption', { plan: p.name, price: formatPrice(p.priceMonthly) })}
            {sub.pendingPlan?.id === p.id ? t('pack.scheduled') : ''}
          </button>
        ))}
        {sub.pendingPlan && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onCall('/subscriptions/me/plan', 'POST', { planId: sub.plan.id })}
          >
            {t('pack.keepPlan', { plan: sub.plan.name })}
          </button>
        )}
      </div>
      <button
        type="button"
        className={`btn ${sub.cancelAtPeriodEnd ? 'btn-primary' : 'btn-danger'} btn-block logout`}
        onClick={() => onCall('/subscriptions/me/cancel', 'POST', { resume: sub.cancelAtPeriodEnd })}
      >
        {sub.cancelAtPeriodEnd ? t('pack.resume') : t('pack.cancel')}
      </button>
    </>
  );
}
