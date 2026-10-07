import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ErrorMessage } from '../components/ui.jsx';
import { useServerConfig } from '../hooks.js';
import { LanguageSwitcher, useT } from '../i18n.jsx';

const DEMO_ACCOUNTS = [
  { labelKey: 'login.demoStudent', email: 'eleve@autoschub.be' },
  { labelKey: 'login.demoStudentPack', email: 'eleve.pack@autoschub.be' },
  { labelKey: 'login.demoInstructor', email: 'moniteur@autoschub.be' },
];

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
    <div className="page page-narrow">
      <div className="row-between">
        <Link to="/" className="back">
          {t('common.back')}
        </Link>
        <LanguageSwitcher />
      </div>
      <h1>{t('login.title')}</h1>
      {notice && <p className="notice">{notice}</p>}
      {temporary && (
        <p className="notice">
          {t('login.demoMode')}
        </p>
      )}
      <form onSubmit={submit} className="form">
        <label>
          {t('login.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          {t('login.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <ErrorMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>
          {busy ? t('login.submitting') : t('login.submit')}
        </button>
      </form>

      {demo && (
        <div className="demo-box">
          <p className="muted">{t('login.tryDemo')}</p>
          <div className="row wrap">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => submit(null, { email: d.email, password: 'demo1234' })}
              >
                {t(d.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="muted center">
        {t('login.noAccount')} <Link to="/inscription">{t('login.register')}</Link>
      </p>
    </div>
  );
}
