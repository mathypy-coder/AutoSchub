import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ErrorMessage } from '../components/ui.jsx';
import { useServerConfig } from '../hooks.js';

const DEMO_ACCOUNTS = [
  { label: 'Démo élève', email: 'eleve@autoschub.be' },
  { label: 'Démo élève avec pack', email: 'eleve.pack@autoschub.be' },
  { label: 'Démo moniteur', email: 'moniteur@autoschub.be' },
];

export default function Login() {
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
          ? 'Compte introuvable ou mot de passe incorrect. Sur ce serveur de démonstration, les comptes créés sont temporaires : réinscris-toi ou utilise un compte de démo ci-dessous.'
          : err.message,
      );
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <Link to="/" className="back">
        ← Retour
      </Link>
      <h1>Connexion</h1>
      {notice && <p className="notice">{notice}</p>}
      {temporary && (
        <p className="notice">
          Mode démonstration : les comptes et réservations créés sont temporaires et peuvent disparaître.
        </p>
      )}
      <form onSubmit={submit} className="form">
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Mot de passe
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
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {demo && (
        <div className="demo-box">
          <p className="muted">Essayer avec un compte de démonstration :</p>
          <div className="row wrap">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => submit(null, { email: d.email, password: 'demo1234' })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="muted center">
        Pas encore de compte ? <Link to="/inscription">Inscription</Link>
      </p>
    </div>
  );
}
