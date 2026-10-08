import { Link } from 'react-router-dom';
import { formatDateTime, statusLabel } from '../../api.js';
import { getLocale, useT } from '../../i18n.jsx';
import { usePolling } from '../../hooks.js';
import { ErrorMessage, ProgressRing } from '../../components/ui.jsx';

const STEP_ICONS = { goal: '🎯', theory: '📝', provisional: '🪪', practice: '🚗', exam: '🏁', license: '🎉' };
const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : '';
const formatNumber = (n) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(n);

// Accueil de l'élève : prochaine action, route vers le permis, raccourcis.
export default function Home() {
  const t = useT();
  const { data, error } = usePolling('/home', 30000);

  if (!data) {
    return (
      <div className="page">
        <ErrorMessage error={error} />
        <div className="skeleton" style={{ minHeight: 60 }} />
        <div className="skeleton" style={{ minHeight: 140 }} />
        <div className="skeleton" style={{ minHeight: 320 }} />
      </div>
    );
  }

  const trackLabel = data.track ? t(`home.track_${data.track}`) : t('home.track_none');
  const practice = data.steps.find((s) => s.id === 'practice');
  const quick = [
    { to: '/reserver', icon: '🚗', label: t('home.qBook') },
    { to: '/theorie', icon: '📝', label: t('home.qTheory') },
    { to: '/coach', icon: '🤖', label: t('home.qCoach') },
    { to: '/centres', icon: '🏁', label: t('home.qCentres') },
    ...(data.category === 'B' ? [{ to: '/libre', icon: '🧭', label: t('home.qFree') }] : []),
    { to: '/pack', icon: '🎟️', label: t('home.qPack') },
  ];

  return (
    <div className="page home">
      <header className="home-hello">
        <div>
          <span className="eyebrow">
            <span className="l-plate" aria-hidden="true">L</span> {t('home.eyebrow', { category: data.category, track: trackLabel })}
          </span>
          <h1>{t('home.hello', { name: data.firstName })}</h1>
          <p className="muted">{t('home.progressLine', { progress: data.progress })}</p>
        </div>
        <ProgressRing value={data.progress} size={64} label={t('home.progressAria', { progress: data.progress })} />
      </header>

      {/* Une seule prochaine action, bien visible */}
      <Link to={data.nextAction.to} className="next-action">
        <span className="next-action-kicker">{t('home.nextAction')}</span>
        <strong>{t(`home.action_${data.nextAction.id}_title`)}</strong>
        <span>{t(`home.action_${data.nextAction.id}_text`, { toReview: data.theory.toReview })}</span>
        <span className="next-action-cta">{t(`home.action_${data.nextAction.id}_cta`)} →</span>
      </Link>

      {data.nextLesson && (
        <Link to="/lecons" className="card card-link lesson-teaser">
          <div className="row-between">
            <strong>{t('home.nextLesson')}</strong>
            <span className={`badge badge-${data.nextLesson.status}`}>{statusLabel(data.nextLesson.status)}</span>
          </div>
          <span>
            {formatDateTime(data.nextLesson.startAt)} · {data.nextLesson.durationMin} min · {t('home.withInstructor', { name: data.nextLesson.instructorFirstName })}
          </span>
          {data.unreadMessages > 0 && <span className="small">💬 {t('home.unread', { count: data.unreadMessages })}</span>}
        </Link>
      )}

      <section aria-labelledby="route-title">
        <div className="section-head">
          <div className="grow">
            <h2 id="route-title">{t('home.routeTitle', { category: data.category })}</h2>
            <p>{t('home.routeSubtitle')}</p>
          </div>
        </div>
        <ol className="roadmap">
          {data.steps.map((step, i) => {
            const state = step.done ? 'done' : step.id === data.currentStep ? 'current' : 'todo';
            return (
              <li key={step.id} className={`roadmap-step ${state}`}>
                <span className="roadmap-marker" aria-hidden="true">
                  {step.done ? '✓' : STEP_ICONS[step.id]}
                </span>
                <div className="roadmap-body">
                  <span className="roadmap-kicker">{t('home.stepN', { n: i + 1 })}</span>
                  <strong>{t(`home.step_${step.id}${step.id === 'practice' && step.kind === 'km' ? 'Free' : ''}`)}</strong>
                  <span className="small muted">{stepDetail(step, t)}</span>
                  {step.progress != null && !step.done && step.progress > 0 && (
                    <div className="progress">
                      <div style={{ width: `${step.progress * 100}%` }} />
                    </div>
                  )}
                  {state === 'current' && (
                    <Link className="small roadmap-link" to={data.nextAction.to}>
                      {t(`home.action_${data.nextAction.id}_cta`)} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="home-stats">
        <Link to="/theorie" className="stat-card">
          <ProgressRing value={data.theory.readiness} size={56} />
          <span>
            <strong>{t('home.statTheory')}</strong>
            <small>{data.theory.passed ? t('home.theoryPassed') : t('home.statTheoryText', { count: data.theory.toReview })}</small>
          </span>
        </Link>
        <Link to={practice.kind === 'km' ? '/libre?tab=roadbook' : '/lecons'} className="stat-card">
          <ProgressRing value={(practice.progress ?? 0) * 100} size={56} color="var(--accent)" />
          <span>
            <strong>{practice.kind === 'km' ? t('home.statKm') : t('home.statHours')}</strong>
            <small>
              {formatNumber(practice.value)} / {formatNumber(practice.target)} {practice.kind === 'km' ? 'km' : 'h'}
            </small>
          </span>
        </Link>
        {data.pack && (
          <Link to="/pack" className="stat-card">
            <span className="stat-emoji" aria-hidden="true">🎟️</span>
            <span>
              <strong>{data.pack.name}</strong>
              <small>
                {data.pack.includedMinutes > 0
                  ? t('home.packHours', { hours: formatNumber(data.pack.remainingMinutes / 60) })
                  : t('home.packActive')}
              </small>
            </span>
          </Link>
        )}
      </section>

      <section>
        <div className="section-head">
          <div className="grow">
            <h2>{t('home.quickTitle')}</h2>
          </div>
        </div>
        <div className="quick-grid">
          {quick.map((q) => (
            <Link key={q.to} to={q.to} className="quick-item">
              <span aria-hidden="true">{q.icon}</span>
              {q.label}
            </Link>
          ))}
        </div>
      </section>

      {!data.pack && (
        <Link to="/pack" className="card card-link pack-promo">
          <strong>{t('home.packPromoTitle')}</strong>
          <span className="small">{t(`home.packPromo_${data.track ?? 'school'}`)}</span>
        </Link>
      )}

      <Link to="/bienvenue" className="small muted center change-goal">
        {t('home.changeGoal')}
      </Link>
    </div>
  );
}

function stepDetail(step, t) {
  switch (step.id) {
    case 'goal':
      return step.done ? t('home.goalDone') : t('home.goalTodo');
    case 'theory':
      return step.done ? t('home.theoryPassed') : t('home.theoryReadiness', { readiness: step.readiness });
    case 'provisional':
      return step.done ? t('home.since', { date: formatDate(step.date) }) : t('home.provisionalTodo');
    case 'practice':
      return step.kind === 'km'
        ? t('home.practiceKm', { value: formatNumber(step.value), target: formatNumber(step.target) })
        : t('home.practiceHours', { value: formatNumber(step.value), target: step.target, count: step.lessons });
    case 'exam':
      if (step.done) return t('home.examOn', { date: formatDate(step.date) });
      return step.eligibleFrom ? t('home.examFrom', { date: formatDate(step.eligibleFrom) }) : t('home.examTodo');
    case 'license':
      return step.done ? t('home.licenseDone', { date: formatDate(step.date) }) : t('home.licenseTodo');
    default:
      return '';
  }
}
