import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../../api.js';
import { Chips, ErrorMessage } from '../../components/ui.jsx';
import { getLocale, translate, useT } from '../../i18n.jsx';

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

  if (!catalog || !state) return <div className="page">{error ? <ErrorMessage error={error} /> : t('common.loading')}</div>;

  return (
    <div className="page">
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
  const [category, setCategory] = useState('B');
  const [busy, setBusy] = useState(false);

  const subscribe = async (planId) => {
    setBusy(true);
    await onSubscribe(planId, category);
    setBusy(false);
  };

  return (
    <>
      {completed && (
        <div className="card result-pass center">
          <strong>{t('pack.congratsTitle')}</strong>
          <span className="small">{t('pack.congratsText')}</span>
        </div>
      )}
      <h1>{t('pack.title')}</h1>
      <p className="muted">{t('pack.intro')}</p>

      <div className="label">{t('pack.whichPermit')}</div>
      <div className="chips chips-scroll">
        {permits.map((p) => (
          <button
            key={p.code}
            type="button"
            className={`chip ${p.code === category ? 'chip-active' : ''}`}
            onClick={() => setCategory(p.code)}
          >
            {p.code}
          </button>
        ))}
      </div>
      <p className="muted small">{t('pack.targetHours', { hours: catalog.targetHours[category], category })}</p>

      <div className="plans">
        {catalog.plans.map((plan) => (
          <article key={plan.id} className={`card plan ${plan.popular ? 'plan-popular' : ''}`}>
            {plan.popular && <span className="plan-flag">{t('pack.popular')}</span>}
            <h2>{plan.name}</h2>
            <p className="muted small">{plan.tagline}</p>
            <div className="plan-price">
              {formatPrice(plan.priceMonthly)}
              <span className="muted small">{t('pack.perMonth')}</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <button
              type="button"
              className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-block`}
              disabled={busy}
              onClick={() => subscribe(plan.id)}
            >
              {t('pack.choose', { plan: plan.name, category })}
            </button>
          </article>
        ))}
      </div>
      <p className="muted small center">
        {t('pack.withoutPack', { count: catalog.freeExamsPerWeek })}
        <br />
        {t('pack.demoPayment')}
      </p>
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
      <div className="card pack-hero">
        <div className="row-between">
          <span className="badge badge-in_progress">{t('pack.packBadge', { plan: sub.plan.name })}</span>
          <strong>{t('pack.pricePerMonth', { price: formatPrice(sub.plan.priceMonthly) })}</strong>
        </div>
        <h1>{t('pack.permitTitle', { category: sub.category })}</h1>
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

      <h2 className="section-title">{t('pack.journeyTitle')}</h2>
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

      <h2 className="section-title">{t('pack.changePlan')}</h2>
      <p className="muted small">{t('pack.changePlanHint', { date: formatDate(sub.currentPeriodEnd) })}</p>
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
