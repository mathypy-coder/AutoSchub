import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../../api.js';
import { Chips, ErrorMessage } from '../../components/ui.jsx';

const formatDate = (iso) =>
  new Intl.DateTimeFormat('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

const hoursLabel = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};

export default function Pack() {
  const [catalog, setCatalog] = useState(null);
  const [permits, setPermits] = useState([]);
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    api('/subscriptions/me')
      .then(setState)
      .catch((err) => setError(err.message));

  useEffect(() => {
    api('/subscriptions/plans').then(setCatalog).catch((err) => setError(err.message));
    api('/permits').then((d) => setPermits(d.permits)).catch(() => {});
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

  if (!catalog || !state) return <div className="page">{error ? <ErrorMessage error={error} /> : 'Chargement…'}</div>;

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
          <strong>🎉 Félicitations pour ton permis !</strong>
          <span className="small">Ton pack est terminé. Un autre permis en vue ?</span>
        </div>
      )}
      <h1>Les packs AutoSchub</h1>
      <p className="muted">
        Un abonnement mensuel qui t’accompagne de la théorie jusqu’au permis : heures de conduite incluses, réductions et suivi
        de chaque étape. Sans engagement.
      </p>

      <div className="label">Pour quel permis ?</div>
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
      <p className="muted small">Objectif indicatif : {catalog.targetHours[category]} h de conduite pour le permis {category}.</p>

      <div className="plans">
        {catalog.plans.map((plan) => (
          <article key={plan.id} className={`card plan ${plan.popular ? 'plan-popular' : ''}`}>
            {plan.popular && <span className="plan-flag">Le plus choisi</span>}
            <h2>{plan.name}</h2>
            <p className="muted small">{plan.tagline}</p>
            <div className="plan-price">
              {formatPrice(plan.priceMonthly)}
              <span className="muted small"> / mois</span>
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
              Choisir {plan.name} · permis {category}
            </button>
          </article>
        ))}
      </div>
      <p className="muted small center">
        Sans pack : {catalog.freeExamsPerWeek} examens blancs gratuits par semaine et leçons au tarif du moniteur.
        <br />
        Paiement de démonstration — aucun montant n’est débité.
      </p>
    </>
  );
}

function ActivePack({ state, catalog, onCall }) {
  const { subscription: sub, journey } = state;
  const [declaring, setDeclaring] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const otherPlans = catalog.plans.filter((p) => p.id !== sub.plan.id);
  const DECLARE_FIELDS = { provisional: 'provisionalAt', exam: 'examDate', license: 'licenseObtainedAt' };

  return (
    <>
      <div className="card pack-hero">
        <div className="row-between">
          <span className="badge badge-in_progress">Pack {sub.plan.name}</span>
          <strong>{formatPrice(sub.plan.priceMonthly)}/mois</strong>
        </div>
        <h1>Permis {sub.category}</h1>
        {sub.includedMinutes > 0 && (
          <>
            <div className="row-between small">
              <span>Heures incluses ce mois-ci</span>
              <strong>
                {hoursLabel(sub.remainingMinutes)} restantes / {hoursLabel(sub.includedMinutes)}
              </strong>
            </div>
            <div className="progress">
              <div style={{ width: `${(sub.remainingMinutes / sub.includedMinutes) * 100}%` }} />
            </div>
          </>
        )}
        <p className="small muted">
          {sub.cancelAtPeriodEnd
            ? `Résilié : le pack reste actif jusqu’au ${formatDate(sub.currentPeriodEnd)}.`
            : `Renouvellement le ${formatDate(sub.currentPeriodEnd)}.`}
          {sub.plan.discount > 0 && ` · -${Math.round(sub.plan.discount * 100)} % sur les heures en plus.`}
        </p>
        <Link className="btn btn-primary btn-block" to="/reserver">
          Réserver une leçon
        </Link>
      </div>

      {journey.nextStep && (
        <div className="card next-step">
          <strong>👉 Prochaine étape</strong>
          <span className="small">{journey.nextStep.advice}</span>
        </div>
      )}

      {journey.coach && sub.plan.id === 'integral' && (
        <div className="card">
          <strong>🧑‍🏫 Ton moniteur référent</strong>
          <span className="small">
            {journey.coach.firstName} {journey.coach.lastName} — {journey.coach.lessons} leçon(s) ensemble. Il suit ta
            progression jusqu’à l’examen.
          </span>
        </div>
      )}

      <h2 className="section-title">Ton parcours vers le permis</h2>
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
                  Passer un examen blanc →
                </Link>
              )}
              {step.declarable && declaring !== step.id && (
                <button type="button" className="link-button small" onClick={() => setDeclaring(step.id)}>
                  {step.done ? 'Modifier la date' : 'Déclarer cette étape'}
                </button>
              )}
              {declaring === step.id && (
                <form
                  className="row declare"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (step.id === 'license' && !window.confirm('Bravo ! Déclarer ton permis obtenu clôture ton pack. Continuer ?')) return;
                    await onCall('/subscriptions/me/journey', 'PATCH', { [DECLARE_FIELDS[step.id]]: date });
                    setDeclaring(null);
                  }}
                >
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  <button className="btn btn-primary">OK</button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ol>

      <h2 className="section-title">Changer de formule</h2>
      <div className="row wrap">
        {otherPlans.map((p) => (
          <button
            key={p.id}
            type="button"
            className="btn btn-secondary"
            onClick={() => onCall('/subscriptions/me/plan', 'POST', { planId: p.id })}
          >
            {p.name} · {formatPrice(p.priceMonthly)}/mois
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`btn ${sub.cancelAtPeriodEnd ? 'btn-primary' : 'btn-danger'} btn-block logout`}
        onClick={() => onCall('/subscriptions/me/cancel', 'POST', { resume: sub.cancelAtPeriodEnd })}
      >
        {sub.cancelAtPeriodEnd ? 'Réactiver mon pack' : 'Résilier à la fin du mois'}
      </button>
    </>
  );
}
