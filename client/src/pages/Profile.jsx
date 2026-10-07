import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { groupSkills, LevelBar } from '../components/SkillsSheet.jsx';
import { LanguageSwitcher, useI18n, useT } from '../i18n.jsx';

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

  return (
    <div className="page">
      <div className="row">
        <div className="avatar avatar-lg">{user.firstName[0]}</div>
        <div>
          <h1>
            {user.firstName} {user.lastName}
          </h1>
          <p className="muted small">
            {user.email}
            {user.city && ` · ${user.city}`}
          </p>
        </div>
      </div>

      <h2 className="section-title">{t('profile.progress')}</h2>
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
        category={Object.entries(hoursByCategory).sort((x, y) => y[1] - x[1])[0]?.[0] ?? 'B'}
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

      <div className="card">
        <strong>{t('profile.journeyTitle')}</strong>
        <ol className="small steps">
          <li>{t('profile.step1')}</li>
          <li>{t('profile.step2')}</li>
          <li>{t('profile.step3')}</li>
          <li>{t('profile.step4')}</li>
        </ol>
        <p className="muted small">{t('profile.regionsNote')}</p>
      </div>

      <div className="card">
        <strong>{t('profile.language')}</strong>
        <LanguageSwitcher />
      </div>

      <button type="button" className="btn btn-danger btn-block logout" onClick={logout}>
        {t('profile.logout')}
      </button>
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
