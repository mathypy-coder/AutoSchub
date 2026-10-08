import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { groupSkills, LevelBar } from '../components/SkillsSheet.jsx';
import { SectionHead } from '../components/ui.jsx';
import { LanguageSwitcher, useI18n, useT } from '../i18n.jsx';
import '../styles/pages.css';

export default function Profile() {
  const { t, locale } = useI18n();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    api('/bookings').then((d) => setBookings(d.bookings)).catch(() => {});
    api('/theory/history').then((d) => setAttempts(d.attempts)).catch(() => {});
  }, []);

  const completed = bookings.filter((b) => b.status === 'completed');
  const hoursByCategory = completed.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.durationMin / 60;
    return acc;
  }, {});
  const exams = attempts.filter((a) => a.mode === 'exam');
  const best = exams.reduce((max, a) => Math.max(max, a.score / a.maxScore), 0);

  const showFree = user.goalCategory === 'B' || user.learningTrack === 'free';
  const menu = [
    { to: '/pack', icon: '🎟️', title: t('profile.menuPack'), text: t('profile.menuPackText') },
    { to: '/centres', icon: '🏁', title: t('profile.menuCentres'), text: t('profile.menuCentresText') },
    ...(showFree ? [{ to: '/libre', icon: '🧭', title: t('profile.menuFree'), text: t('profile.menuFreeText') }] : []),
    { to: '/coach', icon: '🤖', title: t('profile.menuCoach'), text: t('profile.menuCoachText') },
    { to: '/accueil', icon: '📈', title: t('profile.menuProgress'), text: t('profile.menuProgressText') },
  ];
  const goal = user.goalCategory
    ? [t('profile.permit', { category: user.goalCategory }), user.learningTrack && t(`home.track_${user.learningTrack}`)]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <div className="page pg">
      <header className="card pg-profile">
        <div className="pg-profile-row">
          <div className="pg-profile-avatar" aria-hidden="true">
            {(user.firstName?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="grow pg-profile-id">
            <h1>
              {user.firstName} {user.lastName}
            </h1>
            <p className="small">
              {user.email}
              {user.city && ` · ${user.city}`}
            </p>
          </div>
        </div>
        <div className="pg-goal">
          <span aria-hidden="true">🎯</span>
          <span className="grow">
            <small>{t('profile.goalLabel')}</small>
            <strong>{goal ?? t('profile.noGoal')}</strong>
          </span>
          <Link to="/bienvenue" className="pg-goal-edit">
            {goal ? t('profile.editGoal') : t('profile.setGoal')}
          </Link>
        </div>
      </header>

      <section>
        <SectionHead title={t('profile.spaceTitle')} subtitle={t('profile.spaceSub')} />
        <nav className="pg-menu card" aria-label={t('profile.spaceTitle')}>
          {menu.map((m) => (
            <Link key={m.to} to={m.to} className="pg-menu-item">
              <span className="pg-menu-icon" aria-hidden="true">{m.icon}</span>
              <span className="grow">
                <strong>{m.title}</strong>
                <small>{m.text}</small>
              </span>
              <span className="pg-chevron" aria-hidden="true">›</span>
            </Link>
          ))}
        </nav>
      </section>

      <section>
        <SectionHead title={t('profile.progress')} subtitle={t('profile.progressSub')} />
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{completed.length}</span>
            <span className="muted small">{t('profile.lessonsCompleted')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{exams.length ? new Intl.NumberFormat(locale, { style: 'percent' }).format(Math.round(best * 100) / 100) : '—'}</span>
            <span className="muted small">{t('profile.bestMock')}</span>
          </div>
        </div>

        <SkillsOverview
          category={Object.entries(hoursByCategory).sort((x, y) => y[1] - x[1])[0]?.[0] ?? user.goalCategory ?? 'B'}
        />

        {Object.keys(hoursByCategory).length > 0 && (
          <div className="card">
            <strong>{t('profile.hoursByPermit')}</strong>
            {Object.entries(hoursByCategory).map(([cat, hours]) => (
              <div key={cat} className="row-between small">
                <span>{t('profile.permit', { category: cat })}</span>
                <span>{t('profile.hours', { hours: hours.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead title={t('profile.journeyTitle')} subtitle={t('profile.journeySub')} />
        <div className="card">
          <ol className="small steps">
            <li>{t('profile.step1')}</li>
            <li>{t('profile.step2')}</li>
            <li>{t('profile.step3')}</li>
            <li>{t('profile.step4')}</li>
          </ol>
          <p className="muted small">{t('profile.regionsNote')}</p>
        </div>
      </section>

      <section>
        <SectionHead title={t('profile.settingsTitle')} />
        <div className="card">
          <strong>{t('profile.language')}</strong>
          <LanguageSwitcher />
        </div>
        <button type="button" className="btn btn-danger btn-block logout" onClick={logout}>
          {t('profile.logout')}
        </button>
      </section>
    </div>
  );
}

// Fiche de compétences : dernier niveau noté par les moniteurs pour chaque compétence.
function SkillsOverview({ category }) {
  const t = useT();
  const [data, setData] = useState(null);

  useEffect(() => {
    api(`/progress/skills?category=${category}`).then(setData).catch(() => setData(null));
  }, [category]);

  if (!data) return null;
  const { summary } = data;
  return (
    <div className="card">
      <div className="row-between">
        <strong>{t('profile.skillsTitle', { category })}</strong>
        <span className="small">
          {t('profile.mastered', { mastered: summary.mastered, total: summary.total })}
        </span>
      </div>
      <div className="progress">
        <div style={{ width: `${summary.progress * 100}%` }} />
      </div>
      {groupSkills(data.skills).map(([group, skills]) => (
        <div key={group} className="skills-group">
          <div className="label">{group}</div>
          {skills.map((s) => (
            <div key={s.id} className="skill-row">
              <span className="small grow">{s.label}</span>
              <LevelBar level={s.level} />
            </div>
          ))}
        </div>
      ))}
      <p className="muted small">{t('profile.skillsNote')}</p>
    </div>
  );
}
