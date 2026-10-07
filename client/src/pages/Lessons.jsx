import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDateTime, formatPrice } from '../api.js';
import { downloadLessonIcs } from '../calendar.js';
import MessageThread from '../components/MessageThread.jsx';
import SkillsSheet from '../components/SkillsSheet.jsx';
import { useAuth } from '../auth.jsx';
import MapView from '../components/MapView.jsx';
import { ErrorMessage, StatusBadge } from '../components/ui.jsx';
import { usePolling } from '../hooks.js';
import { useT } from '../i18n.jsx';

const ACTIVE = ['pending', 'accepted', 'en_route', 'in_progress'];

// `label` est une clé de traduction (namespace `lessons`), traduite au rendu.
const INSTRUCTOR_ACTIONS = {
  pending: [
    { status: 'accepted', label: 'action_accept', kind: 'primary' },
    { status: 'declined', label: 'action_decline', kind: 'secondary' },
  ],
  accepted: [
    { status: 'en_route', label: 'action_enRoute', kind: 'primary' },
    { status: 'in_progress', label: 'action_start', kind: 'secondary' },
    { status: 'cancelled', label: 'action_cancel', kind: 'danger' },
  ],
  en_route: [
    { status: 'in_progress', label: 'action_startOnBoard', kind: 'primary' },
    { status: 'cancelled', label: 'action_cancel', kind: 'danger' },
  ],
  in_progress: [{ status: 'completed', label: 'action_finish', kind: 'primary' }],
};

const STUDENT_ACTIONS = {
  pending: [{ status: 'cancelled', label: 'action_cancelRequest', kind: 'danger' }],
  accepted: [{ status: 'cancelled', label: 'action_cancel', kind: 'danger' }],
  en_route: [{ status: 'cancelled', label: 'action_cancel', kind: 'danger' }],
};

export default function Lessons() {
  const t = useT();
  const { user } = useAuth();
  const { data, error, refresh } = usePolling('/bookings', 5000);
  const bookings = data?.bookings ?? [];
  const active = bookings.filter((b) => ACTIVE.includes(b.status)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = bookings.filter((b) => !ACTIVE.includes(b.status));

  return (
    <div className="page">
      <h1>{user.role === 'instructor' ? t('lessons.titleInstructor') : t('lessons.titleStudent')}</h1>
      <ErrorMessage error={error} />
      {data && !bookings.length && (
        <p className="empty">
          {user.role === 'instructor'
            ? t('lessons.emptyInstructor')
            : t('lessons.emptyStudent')}
        </p>
      )}
      {active.length > 0 && <h2 className="section-title">{t('lessons.upcoming')}</h2>}
      {active.map((b) => (
        <BookingCard key={b.id} booking={b} role={user.role} onChange={refresh} />
      ))}
      {past.length > 0 && <h2 className="section-title">{t('lessons.history')}</h2>}
      {past.map((b) => (
        <BookingCard key={b.id} booking={b} role={user.role} onChange={refresh} />
      ))}
    </div>
  );
}

function BookingCard({ booking: b, role, onChange }) {
  const t = useT();
  const [panel, setPanel] = useState(null);
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
        {t('lessons.cardTitle', { category: b.category, min: b.durationMin })}
      </h3>
      {role === 'student' && b.coveredMinutes > 0 && (
        <p className="pack-note small">🎟️ {t('lessons.packCovered', { min: b.coveredMinutes })}</p>
      )}
      <p className="small">
        {b.isInstant ? t('lessons.instant') : '📅 '}
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
        <p className="eta">{t('lessons.eta', { min: b.instructor.etaMin })}</p>
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
              {t(`lessons.${a.label}`)}
            </button>
          ))}
        </div>
      )}

      <div className="card-tools">
        {!['declined', 'expired'].includes(b.status) && (
          <button
            type="button"
            className={`tool ${panel === 'messages' ? 'tool-active' : ''}`}
            onClick={() => setPanel(panel === 'messages' ? null : 'messages')}
          >
            💬 {t('lessons.messages')}
            {panel !== 'messages' && b.unreadMessages > 0 && <span className="dot">{b.unreadMessages}</span>}
          </button>
        )}
        {(role === 'instructor' ? ['in_progress', 'completed'] : ['completed']).includes(b.status) && (
          <button
            type="button"
            className={`tool ${panel === 'skills' ? 'tool-active' : ''}`}
            onClick={() => setPanel(panel === 'skills' ? null : 'skills')}
          >
            📋 {role === 'instructor' ? t('lessons.fillSheet') : t('lessons.mySheet')}
          </button>
        )}
        {['accepted', 'en_route'].includes(b.status) && new Date(b.startAt) > new Date() && (
          <button type="button" className="tool" onClick={() => downloadLessonIcs(b, `${other.firstName} ${other.lastName}`)}>
            📆 {t('lessons.calendar')}
          </button>
        )}
        {role === 'student' && ['completed', 'cancelled', 'declined', 'expired'].includes(b.status) && (
          <Link className="tool" to={`/reserver?instructor=${b.instructor.id}&category=${b.category}`}>
            🔁 {t('lessons.bookAgain')}
          </Link>
        )}
      </div>
      {panel === 'messages' && <MessageThread bookingId={b.id} onRead={onChange} />}
      {panel === 'skills' && <SkillsSheet bookingId={b.id} editable={role === 'instructor'} />}

      {b.status === 'completed' && role === 'student' && b.studentRating == null && (
        <ReviewForm busy={busy} onSubmit={(body) => run(`/bookings/${b.id}/review`, body)} />
      )}
      {b.studentRating != null && (
        <p className="small">
          {t('lessons.studentRating')} <span className="stars">{'★'.repeat(b.studentRating)}</span>
          {b.studentComment && <> — {t('lessons.quote', { text: b.studentComment })}</>}
        </p>
      )}

      {b.status === 'completed' && role === 'instructor' && !b.instructorFeedback && (
        <FeedbackForm busy={busy} onSubmit={(feedback) => run(`/bookings/${b.id}/feedback`, { feedback })} />
      )}
      {b.instructorFeedback && (
        <div className="feedback">
          <strong className="small">{t('lessons.instructorFeedback')}</strong>
          <p className="small">{b.instructorFeedback}</p>
        </div>
      )}
      <ErrorMessage error={error} />
    </article>
  );
}

function ReviewForm({ busy, onSubmit }) {
  const t = useT();
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
      <div className="label">{t('lessons.rateInstructor')}</div>
      <div className="rating-input" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={t('lessons.stars', { count: n })}
            className={n <= rating ? 'on' : ''}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('lessons.commentPlaceholder')} />
      <button className="btn btn-primary" disabled={busy}>
        {t('lessons.send')}
      </button>
    </form>
  );
}

function FeedbackForm({ busy, onSubmit }) {
  const t = useT();
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
        {t('lessons.feedbackLabel')}
        <textarea
          rows={2}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t('lessons.feedbackPlaceholder')}
          required
        />
      </label>
      <button className="btn btn-secondary" disabled={busy}>
        {t('lessons.sendFeedback')}
      </button>
    </form>
  );
}
