import { useState } from 'react';
import { api, formatDateTime, formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';
import MapView from '../components/MapView.jsx';
import { ErrorMessage, StatusBadge } from '../components/ui.jsx';
import { usePolling } from '../hooks.js';

const ACTIVE = ['pending', 'accepted', 'en_route', 'in_progress'];

const INSTRUCTOR_ACTIONS = {
  pending: [
    { status: 'accepted', label: 'Accepter', kind: 'primary' },
    { status: 'declined', label: 'Refuser', kind: 'secondary' },
  ],
  accepted: [
    { status: 'en_route', label: 'Je suis en route', kind: 'primary' },
    { status: 'in_progress', label: 'Démarrer la leçon', kind: 'secondary' },
    { status: 'cancelled', label: 'Annuler', kind: 'danger' },
  ],
  en_route: [
    { status: 'in_progress', label: 'Élève à bord — démarrer', kind: 'primary' },
    { status: 'cancelled', label: 'Annuler', kind: 'danger' },
  ],
  in_progress: [{ status: 'completed', label: 'Terminer la leçon', kind: 'primary' }],
};

const STUDENT_ACTIONS = {
  pending: [{ status: 'cancelled', label: 'Annuler la demande', kind: 'danger' }],
  accepted: [{ status: 'cancelled', label: 'Annuler', kind: 'danger' }],
  en_route: [{ status: 'cancelled', label: 'Annuler', kind: 'danger' }],
};

export default function Lessons() {
  const { user } = useAuth();
  const { data, error, refresh } = usePolling('/bookings', 5000);
  const bookings = data?.bookings ?? [];
  const active = bookings.filter((b) => ACTIVE.includes(b.status)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = bookings.filter((b) => !ACTIVE.includes(b.status));

  return (
    <div className="page">
      <h1>{user.role === 'instructor' ? 'Mes leçons' : 'Mes leçons de conduite'}</h1>
      <ErrorMessage error={error} />
      {data && !bookings.length && (
        <p className="empty">
          {user.role === 'instructor'
            ? 'Aucune leçon pour le moment. Passez en ligne pour recevoir des demandes.'
            : 'Aucune leçon réservée. Trouvez un moniteur dans l’onglet Réserver.'}
        </p>
      )}
      {active.length > 0 && <h2 className="section-title">À venir</h2>}
      {active.map((b) => (
        <BookingCard key={b.id} booking={b} role={user.role} onChange={refresh} />
      ))}
      {past.length > 0 && <h2 className="section-title">Historique</h2>}
      {past.map((b) => (
        <BookingCard key={b.id} booking={b} role={user.role} onChange={refresh} />
      ))}
    </div>
  );
}

function BookingCard({ booking: b, role, onChange }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const other = role === 'student' ? b.instructor : b.student;
  const actions = (role === 'student' ? STUDENT_ACTIONS : INSTRUCTOR_ACTIONS)[b.status] ?? [];

  const run = async (path, body) => {
    setBusy(true);
    setError('');
    try {
      await api(path, { method: 'POST', body });
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const showMap = ['accepted', 'en_route'].includes(b.status) && b.pickupLat != null;

  return (
    <article className={`card booking booking-${b.status}`}>
      <div className="row-between">
        <StatusBadge status={b.status} />
        <strong>{formatPrice(role === 'student' ? b.studentPrice : b.price)}</strong>
      </div>
      <h3>
        Permis {b.category} · {b.durationMin} min
      </h3>
      {role === 'student' && b.coveredMinutes > 0 && (
        <p className="pack-note small">🎟️ {b.coveredMinutes} min couvertes par ton pack</p>
      )}
      <p className="small">
        {b.isInstant ? '⚡ Leçon immédiate — ' : '📅 '}
        {formatDateTime(b.startAt)}
        <br />📍 {b.pickupAddress}
        <br />
        {role === 'student' ? '🧑‍🏫' : '🎓'} {other.firstName} {other.lastName}
        {other.phone && (
          <>
            {' · '}
            <a href={`tel:${other.phone.replace(/\s/g, '')}`}>{other.phone}</a>
          </>
        )}
        {role === 'student' && b.instructor.vehicle && <><br />🚘 {b.instructor.vehicle}</>}
      </p>

      {role === 'student' && b.status === 'en_route' && b.instructor.etaMin != null && (
        <p className="eta">Votre moniteur arrive dans ~{b.instructor.etaMin} min</p>
      )}

      {showMap && (
        <MapView
          height="180px"
          zoom={13}
          center={{ lat: b.pickupLat, lng: b.pickupLng }}
          me={{ lat: b.pickupLat, lng: b.pickupLng }}
          markers={
            role === 'student' && b.instructor.lat != null
              ? [{ id: b.instructor.id, lat: b.instructor.lat, lng: b.instructor.lng, online: true }]
              : []
          }
        />
      )}

      {actions.length > 0 && (
        <div className="row wrap">
          {actions.map((a) => (
            <button
              key={a.status}
              type="button"
              className={`btn btn-${a.kind}`}
              disabled={busy}
              onClick={() => run(`/bookings/${b.id}/status`, { status: a.status })}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {b.status === 'completed' && role === 'student' && b.studentRating == null && (
        <ReviewForm busy={busy} onSubmit={(body) => run(`/bookings/${b.id}/review`, body)} />
      )}
      {b.studentRating != null && (
        <p className="small">
          Note de l’élève : <span className="stars">{'★'.repeat(b.studentRating)}</span>
          {b.studentComment && <> — « {b.studentComment} »</>}
        </p>
      )}

      {b.status === 'completed' && role === 'instructor' && !b.instructorFeedback && (
        <FeedbackForm busy={busy} onSubmit={(feedback) => run(`/bookings/${b.id}/feedback`, { feedback })} />
      )}
      {b.instructorFeedback && (
        <div className="feedback">
          <strong className="small">Retour du moniteur</strong>
          <p className="small">{b.instructorFeedback}</p>
        </div>
      )}
      <ErrorMessage error={error} />
    </article>
  );
}

function ReviewForm({ busy, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  return (
    <form
      className="form compact"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ rating, comment });
      }}
    >
      <div className="label">Notez votre moniteur</div>
      <div className="rating-input" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            className={n <= rating ? 'on' : ''}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un commentaire ? (facultatif)" />
      <button className="btn btn-primary" disabled={busy}>
        Envoyer
      </button>
    </form>
  );
}

function FeedbackForm({ busy, onSubmit }) {
  const [feedback, setFeedback] = useState('');
  return (
    <form
      className="form compact"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(feedback);
      }}
    >
      <label>
        Retour pédagogique pour l’élève
        <textarea
          rows={2}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Points forts, points à travailler…"
          required
        />
      </label>
      <button className="btn btn-secondary" disabled={busy}>
        Envoyer le retour
      </button>
    </form>
  );
}
