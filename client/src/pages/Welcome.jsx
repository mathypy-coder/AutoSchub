import { Link } from 'react-router-dom';
import { LanguageSwitcher, useT } from '../i18n.jsx';
import '../styles/welcome.css';

// Les textes sont traduits au rendu : on ne garde ici que les icônes et les clés.
const ROUTE = [
  { key: 'r1', icon: '🎯' },
  { key: 'r2', icon: '📝' },
  { key: 'r3', icon: '🪪' },
  { key: 'r4', icon: '🚗', branches: ['r4_school', 'r4_free'] },
  { key: 'r5', icon: '🏁' },
  { key: 'r6', icon: '🎉' },
];
const HOW = [
  { key: 'h1', icon: '🎯' },
  { key: 'h2', icon: '📍' },
  { key: 'h3', icon: '📈' },
];
const LICENCES = [
  { key: 'lic_moto', icon: '🏍️', codes: ['AM', 'A1', 'A2', 'A'] },
  { key: 'lic_car', icon: '🚗', codes: ['B', 'BE'] },
  { key: 'lic_truck', icon: '🚚', codes: ['C1', 'C1E', 'C', 'CE'] },
  { key: 'lic_bus', icon: '🚌', codes: ['D1', 'D1E', 'D', 'DE'] },
  { key: 'lic_agri', icon: '🚜', codes: ['G'] },
];
const WAYS = [
  { key: 'waySchool', icon: '🧑‍🏫', featured: true },
  { key: 'wayFree', icon: '🧭' },
];
const FEATURES = [
  { key: 'ft1', icon: '🤖' },
  { key: 'ft2', icon: '🏢' },
  { key: 'ft3', icon: '🎟️' },
  { key: 'ft4', icon: '💬' },
  { key: 'ft5', icon: '🌍' },
];
const TRUST = [
  { key: 'trust1', icon: '✅' },
  { key: 'trust2', icon: '⭐' },
  { key: 'trust3', icon: '🇧🇪' },
];

function Logo() {
  return (
    <div className="wl-logo">
      Auto<span>Schub</span>
    </div>
  );
}

function SectionTitle({ id, eyebrow, title, subtitle }) {
  return (
    <div className="wl-section-title">
      <span className="wl-eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export default function Welcome() {
  const t = useT();
  return (
    <div className="wl">
      <header className="wl-hero">
        <div className="wl-hero-inner">
          <div className="wl-topbar">
            <Logo />
            <div className="wl-topbar-actions">
              <Link className="wl-toplink" to="/connexion">
                {t('welcome.login')}
              </Link>
              <LanguageSwitcher className="wl-lang" />
            </div>
          </div>

          <div className="wl-hero-grid">
            <div className="wl-hero-copy">
              <span className="wl-pill">{t('welcome.heroEyebrow')}</span>
              <h1>{t('welcome.heroTitle')}</h1>
              <p className="wl-hero-sub">{t('welcome.heroSubtitle')}</p>
              <div className="wl-actions">
                <Link className="btn wl-btn-light" to="/inscription">
                  {t('welcome.ctaStart')} <span aria-hidden="true">→</span>
                </Link>
                <Link className="btn wl-btn-outline" to="/connexion">
                  {t('welcome.ctaLogin')}
                </Link>
              </div>
              <ul className="wl-hero-points">
                <li>✓ {t('welcome.heroPoint1')}</li>
                <li>✓ {t('welcome.heroPoint2')}</li>
                <li>✓ {t('welcome.heroPoint3')}</li>
              </ul>
            </div>

            {/* Aperçu décoratif de l'app, en CSS uniquement */}
            <div className="wl-mock" aria-hidden="true">
              <div className="wl-mock-head">
                <span className="wl-mock-label">{t('welcome.mockLabel')}</span>
                <span className="wl-mock-status">{t('welcome.mockStatus')}</span>
              </div>
              <div className="wl-mock-row">
                <span className="wl-mock-avatar">🚗</span>
                <div>
                  <strong>{t('welcome.mockTitle')}</strong>
                  <small>{t('welcome.mockText')}</small>
                </div>
              </div>
              <div className="wl-mock-bar">
                <span />
              </div>
              <small className="wl-mock-progress">{t('welcome.mockProgress')}</small>
            </div>
          </div>
        </div>
      </header>

      <main className="wl-main">
        <section className="wl-section" aria-labelledby="wl-route">
          <SectionTitle
            id="wl-route"
            eyebrow={t('welcome.routeEyebrow')}
            title={t('welcome.routeTitle')}
            subtitle={t('welcome.routeSubtitle')}
          />
          <ol className="wl-road">
            {ROUTE.map((s, i) => (
              <li key={s.key} className={`wl-road-stop ${i === ROUTE.length - 1 ? 'wl-road-finish' : ''}`}>
                <span className="wl-road-marker" aria-hidden="true">
                  {s.icon}
                </span>
                <div className="wl-road-card">
                  <span className="wl-road-num">{i + 1}</span>
                  <h3>{t(`welcome.${s.key}_title`)}</h3>
                  <p>{t(`welcome.${s.key}_text`)}</p>
                  {s.branches && (
                    <div className="wl-road-branches">
                      {s.branches.map((b) => (
                        <span key={b}>{t(`welcome.${b}`)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="wl-section" aria-labelledby="wl-how">
          <SectionTitle
            id="wl-how"
            eyebrow={t('welcome.howEyebrow')}
            title={t('welcome.howTitle')}
            subtitle={t('welcome.howSubtitle')}
          />
          <ol className="wl-how">
            {HOW.map((s, i) => (
              <li key={s.key} className="wl-card wl-how-step">
                <span className="wl-how-num">{i + 1}</span>
                <div>
                  <h3>
                    <span aria-hidden="true">{s.icon}</span> {t(`welcome.${s.key}_title`)}
                  </h3>
                  <p>{t(`welcome.${s.key}_text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="wl-section" aria-labelledby="wl-lic">
          <SectionTitle
            id="wl-lic"
            eyebrow={t('welcome.licEyebrow')}
            title={t('welcome.licTitle')}
            subtitle={t('welcome.licSubtitle')}
          />
          <div className="wl-lic-grid">
            {LICENCES.map((l) => (
              <article key={l.key} className="wl-card wl-lic">
                <span className="wl-lic-icon" aria-hidden="true">
                  {l.icon}
                </span>
                <h3>{t(`welcome.${l.key}`)}</h3>
                <p>{t(`welcome.${l.key}_text`)}</p>
                <div className="wl-lic-codes">
                  {l.codes.map((c) => (
                    <span key={c} className="wl-code">
                      {c}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="wl-section" aria-labelledby="wl-ways">
          <SectionTitle
            id="wl-ways"
            eyebrow={t('welcome.waysEyebrow')}
            title={t('welcome.waysTitle')}
            subtitle={t('welcome.waysSubtitle')}
          />
          <div className="wl-ways">
            {WAYS.map((w) => (
              <article key={w.key} className={`wl-card wl-way ${w.featured ? 'wl-way-featured' : ''}`}>
                <div className="wl-way-head">
                  <span className="wl-way-icon" aria-hidden="true">
                    {w.icon}
                  </span>
                  <span className="wl-tag">{t(`welcome.${w.key}_tag`)}</span>
                </div>
                <h3>{t(`welcome.${w.key}_title`)}</h3>
                <p>{t(`welcome.${w.key}_text`)}</p>
                <ul className="wl-checks">
                  {['p1', 'p2', 'p3'].map((p) => (
                    <li key={p}>{t(`welcome.${w.key}_${p}`)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="wl-section" aria-labelledby="wl-feat">
          <SectionTitle
            id="wl-feat"
            eyebrow={t('welcome.featEyebrow')}
            title={t('welcome.featTitle')}
            subtitle={t('welcome.featSubtitle')}
          />
          <div className="wl-feat-grid">
            {FEATURES.map((f) => (
              <article key={f.key} className="wl-card wl-feat">
                <span className="wl-feat-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <div>
                  <h3>{t(`welcome.${f.key}_title`)}</h3>
                  <p>{t(`welcome.${f.key}_text`)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <ul className="wl-trust">
          {TRUST.map((x) => (
            <li key={x.key}>
              <span aria-hidden="true">{x.icon}</span>
              <div>
                <strong>{t(`welcome.${x.key}_title`)}</strong>
                <small>{t(`welcome.${x.key}_text`)}</small>
              </div>
            </li>
          ))}
        </ul>

        <section className="wl-final" aria-labelledby="wl-final">
          <h2 id="wl-final">{t('welcome.finalTitle')}</h2>
          <p>{t('welcome.finalText')}</p>
          <Link className="btn wl-btn-light" to="/inscription">
            {t('welcome.finalCta')} <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer className="wl-footer">
        <Link className="wl-card wl-instructor" to="/inscription?role=instructor">
          <span className="wl-feat-icon" aria-hidden="true">
            🧑‍🏫
          </span>
          <div>
            <strong>{t('welcome.footerInstructor')}</strong>
            <small>{t('welcome.footerInstructorText')}</small>
          </div>
          <span className="wl-instructor-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        <div className="wl-footer-bottom">
          <Logo />
          <p>{t('welcome.footerTagline')}</p>
          <p className="wl-footer-links">
            <Link to="/connexion">{t('welcome.login')}</Link>
            <span aria-hidden="true">·</span>
            <Link to="/inscription">{t('welcome.ctaStart')}</Link>
          </p>
          <small>© {new Date().getFullYear()} AutoSchub</small>
        </div>
      </footer>
    </div>
  );
}
