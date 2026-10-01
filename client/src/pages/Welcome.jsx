import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '📍', title: 'Ton moniteur en 2 clics', text: 'Vois les moniteurs autour de toi sur la carte et réserve maintenant ou plus tard.' },
  { icon: '🏍️', title: 'Tous les permis', text: 'AM, A1, A2, A, B, BE, C, CE, D, DE, G : voiture, moto, camion, bus et tracteur.' },
  { icon: '📝', title: 'Théorie incluse', text: 'Examens blancs au barème belge (41/50, faute grave = 5 points).' },
  { icon: '🎟️', title: 'Des packs qui te suivent', text: 'Abonnement mensuel avec heures incluses et suivi de chaque étape, de la théorie au permis.' },
  { icon: '⭐', title: 'Moniteurs notés', text: 'Moniteurs agréés, notés par les élèves après chaque leçon.' },
];

export default function Welcome() {
  return (
    <div className="welcome">
      <header className="welcome-hero">
        <div className="logo">
          Auto<span>Schub</span>
        </div>
        <h1>Le Uber de l’auto-école en Belgique.</h1>
        <p>Réserve ton moniteur comme une course. Révise ta théorie dans la même app.</p>
        <div className="welcome-actions">
          <Link className="btn btn-primary" to="/inscription">
            Créer un compte
          </Link>
          <Link className="btn btn-ghost-light" to="/connexion">
            J’ai déjà un compte
          </Link>
        </div>
      </header>

      <section className="welcome-features">
        {FEATURES.map((f) => (
          <article key={f.title} className="feature">
            <span className="feature-icon" aria-hidden="true">
              {f.icon}
            </span>
            <div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          </article>
        ))}
        <Link className="card card-link" to="/inscription?role=instructor">
          <strong>Tu es moniteur agréé ?</strong>
          <span className="muted">Passe en ligne quand tu veux et reçois des demandes de leçons près de toi →</span>
        </Link>
      </section>
    </div>
  );
}
