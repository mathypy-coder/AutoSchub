import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { groupSkills, LevelBar } from '../components/SkillsSheet.jsx';

export default function Profile() {
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

      <h2 className="section-title">Ma progression</h2>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{completed.length}</span>
          <span className="muted small">Leçons terminées</span>
        </div>
        <div className="stat">
          <span className="stat-value">{exams.length ? `${Math.round(best * 100)} %` : '—'}</span>
          <span className="muted small">Meilleur examen blanc</span>
        </div>
      </div>

      <SkillsOverview
        category={Object.entries(hoursByCategory).sort((x, y) => y[1] - x[1])[0]?.[0] ?? 'B'}
      />

      {Object.keys(hoursByCategory).length > 0 && (
        <div className="card">
          <strong>Heures de conduite par permis</strong>
          {Object.entries(hoursByCategory).map(([cat, hours]) => (
            <div key={cat} className="row-between small">
              <span>Permis {cat}</span>
              <span>{hours.toFixed(1)} h</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <strong>Le parcours du permis en Belgique</strong>
        <ol className="small steps">
          <li>Réussir l’examen théorique (41/50) dans un centre agréé.</li>
          <li>Obtenir un permis provisoire (filière libre avec guide ou filière école).</li>
          <li>Suivre tes leçons pratiques avec un moniteur agréé — c’est ici !</li>
          <li>Passer l’examen pratique, puis la séance de retour d’expérience si requise par ta Région.</li>
        </ol>
        <p className="muted small">Les règles varient selon la Région (Wallonie, Bruxelles, Flandre) : vérifie les conditions à jour.</p>
      </div>

      <button type="button" className="btn btn-danger btn-block logout" onClick={logout}>
        Se déconnecter
      </button>
    </div>
  );
}

// Fiche de compétences : dernier niveau noté par les moniteurs pour chaque compétence.
function SkillsOverview({ category }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api(`/progress/skills?category=${category}`).then(setData).catch(() => setData(null));
  }, [category]);

  if (!data) return null;
  const { summary } = data;
  return (
    <div className="card">
      <div className="row-between">
        <strong>Ma fiche de compétences · permis {category}</strong>
        <span className="small">
          {summary.mastered}/{summary.total} maîtrisées
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
      <p className="muted small">Ton moniteur remplit la fiche après chaque leçon. Objectif : 80 % des compétences maîtrisées.</p>
    </div>
  );
}
