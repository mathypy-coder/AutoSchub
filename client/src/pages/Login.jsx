import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ErrorMessage } from '../components/ui.jsx';
import { useServerConfig } from '../hooks.js';
import { LanguageSwitcher, useT } from '../i18n.jsx';
import '../styles/welcome.css';

const DEMO_ACCOUNTS = [
  { labelKey: 'login.demoStudent', textKey: 'login.demoStudent_text', icon: '🎓', email: 'eleve@autoschub.be' },
  { labelKey: 'login.demoStudentPack', textKey: 'login.demoStudentPack_text', icon: '🎟️', email: 'eleve.pack@autoschub.be' },
  { labelKey: 'login.demoFreeTrack', textKey: 'login.demoFreeTrack_text', icon: '🧭', email: 'eleve.libre@autoschub.be' },
  { labelKey: 'login.demoInstructor', textKey: 'login.demoInstructor_text', icon: '🧑‍🏫', email: 'moniteur@autoschub.be' },
];

// Champ mot de passe avec bouton afficher / masquer (réutilisé par l'inscription).
export function PasswordField({ label, hint, showLabel, hideLabel, value, onChange, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="auth-eye"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((v) => !v)}
        >
          <span aria-hidden="true">{visible ? '🙈' : '👁️'}</span>
        </button>
      </div>
      {hint && (
        <small id={`${id}-hint`} className="auth-hint">
          {hint}
        </small>
      )}
    </div>
  );
}

// En-tête des écrans d'authentification : retour, logo, langue.
export function AuthTopbar({ backTo = '/', onBack }) {
  const t = useT();
  return (
    <div className="auth-topbar">
      {onBack ? (
        <button type="button" className="auth-back" onClick={onBack}>
          {t('common.back')}
        </button>
      ) : (
        <Link to={backTo} className="auth-back">
          {t('common.back')}
        </Link>
      )}
      <Link to="/" className="wl-logo auth-logo" aria-label="AutoSchub">
        Auto<span>Schub</span>
      </Link>
      <LanguageSwitcher className="wl-lang" />
    </div>
  );
}

export default function Login() {
  const t = useT();
  const { login, notice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Comptes de démo proposés seulement s'ils existent sur ce serveur.
  const config = useServerConfig();
  const demo = Boolean(config?.demo);
  const temporary = config?.persistent === false;

  const submit = async (e, creds = { email, password }) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(creds.email, creds.password);
    } catch (err) {
      // Base temporaire : un compte créé avant un redémarrage n'existe plus. On le dit clairement.
      setError(
        err.status === 401 && temporary
          ? t('login.temporaryAccountError')
          : err.message,
      );
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-band" aria-hidden="true" />
      <div className="auth-inner">
        <AuthTopbar />

        <section className="auth-card" aria-labelledby="login-title">
          <span className="wl-eyebrow">{t('login.eyebrow')}</span>
          <h1 id="login-title">{t('login.title')}</h1>
          <p className="auth-sub">{t('login.subtitle')}</p>

          {notice && <p className="auth-notice">{notice}</p>}
          {temporary && <p className="auth-notice">{t('login.demoMode')}</p>}

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">{t('login.email')}</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>
            <PasswordField
              label={t('login.password')}
              showLabel={t('login.showPassword')}
              hideLabel={t('login.hidePassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <ErrorMessage error={error} />
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? t('login.submitting') : t('login.submit')}
            </button>
          </form>
        </section>

        {demo && (
          <section className="auth-demo" aria-labelledby="login-demo">
            <h2 id="login-demo">{t('login.demoTitle')}</h2>
            <p className="auth-sub">{t('login.tryDemo')}</p>
            <ul className="auth-demo-list">
              {DEMO_ACCOUNTS.map((d) => (
                <li key={d.email}>
                  <button
                    type="button"
                    className="auth-demo-card"
                    disabled={busy}
                    onClick={() => submit(null, { email: d.email, password: 'demo1234' })}
                  >
                    <span className="auth-demo-icon" aria-hidden="true">
                      {d.icon}
                    </span>
                    <span className="auth-demo-body">
                      <strong>{t(d.labelKey)}</strong>
                      <small>{t(d.textKey)}</small>
                      <small className="auth-demo-email">{d.email}</small>
                    </span>
                    <span className="auth-demo-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="auth-switch">
          {t('login.noAccount')} <Link to="/inscription">{t('login.register')}</Link>
        </p>
      </div>
    </div>
  );
}
