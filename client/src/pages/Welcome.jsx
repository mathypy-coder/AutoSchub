import { Link } from 'react-router-dom';
import { LanguageSwitcher, useT } from '../i18n.jsx';

// Les textes sont traduits au rendu : on ne garde ici que les icônes et les clés.
const FEATURES = [
  { icon: '📍', key: 'f1' },
  { icon: '🏍️', key: 'f2' },
  { icon: '📝', key: 'f3' },
  { icon: '🎟️', key: 'f4' },
  { icon: '⭐', key: 'f5' },
  { icon: '🧭', key: 'f6' },
  { icon: '🤖', key: 'f7' },
];

export default function Welcome() {
  const t = useT();
  return (
    <div className="welcome">
      <header className="welcome-hero">
        <LanguageSwitcher />
        <div className="logo">
          Auto<span>Schub</span>
        </div>
        <h1>{t('welcome.tagline')}</h1>
        <p>{t('welcome.intro')}</p>
        <div className="welcome-actions">
          <Link className="btn btn-primary" to="/inscription">
            {t('welcome.createAccount')}
          </Link>
          <Link className="btn btn-ghost-light" to="/connexion">
            {t('welcome.haveAccount')}
          </Link>
        </div>
      </header>

      <section className="welcome-features">
        {FEATURES.map((f) => (
          <article key={f.key} className="feature">
            <span className="feature-icon" aria-hidden="true">
              {f.icon}
            </span>
            <div>
              <h3>{t(`welcome.${f.key}_title`)}</h3>
              <p>{t(`welcome.${f.key}_text`)}</p>
            </div>
          </article>
        ))}
        <Link className="card card-link" to="/inscription?role=instructor">
          <strong>{t('welcome.instructorTitle')}</strong>
          <span className="muted">{t('welcome.instructorText')}</span>
        </Link>
      </section>
    </div>
  );
}
