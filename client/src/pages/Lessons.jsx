import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { downloadLessonIcs } from '../calendar.js';
import MessageThread from '../components/MessageThread.jsx';
import SkillsSheet from '../components/SkillsSheet.jsx';
import { useAuth } from '../auth.jsx';
import MapView from '../components/MapView.jsx';
import { EmptyState, ErrorMessage, PageHeader, SectionHead, StatusBadge } from '../components/ui.jsx';
import { usePolling } from '../hooks.js';
import { getLocale, useT } from '../i18n.jsx';
import '../styles/pages.css';

const fmt = (iso, opts) => new Intl.DateTimeFormat(getLocale(), opts).format(new Date(iso));

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
  const [params, setParams] = useSearchParams();
  const { data, error, refresh } = usePolling('/bookings', 5000);
  const isInstructor = user.role === 'instructor';
  const bookings = data?.bookings ?? [];
  const active = bookings.filter((b) => ACTIVE.includes(b.status)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = bookings.filter((b) => !ACTIVE.includes(b.status));
  const booked = !isInstructor && params.get('booked') === '1';
  const dismissBanner = () => {
    const next = new URLSearchParams(params);
    next.delete('booked');
    setParams(next, { replace: true });
  };

  return (
    <div className="page pg">
      <PageHeader
        eyebrow={isInstructor ? t('lessons.eyebrowInstructor') : t('lessons.eyebrowStudent')}
        title={isInstructor ? t('lessons.titleInstructor') : t('lessons.titleStudent')}
        subtitle={isInstructor ? t('lessons.subtitleInstructor') : t('lessons.subtitleStudent')}
        action={
          !isInstructor && bookings.length > 0 ? (
            <Link to="/reserver" className="btn btn-primary pg-header-btn">
              + {t('lessons.bookCta')}
            </Link>
          ) : null
        }
      />

      {booked && (
        <div className="pg-banner" role="status">
          <span className="grow">
            <strong>{t('lessons.bookedTitle')}</strong>
            <small>{t('lessons.bookedText')}</small>
          </span>
          <button type="button" className="pg-banner-close" onClick={dismissBanner} aria-label={t('lessons.close')}>
            ✕
          </button>
        </div>
      )}

      <ErrorMessage error={error} />

      {!data && !error && (
        <>
          <div className="skeleton" style={{ minHeight: 140 }} />
          <div className="skeleton" style={{ minHeight: 140 }} />
        </>
      )}

      {data && !bookings.length && (
        <EmptyState
          icon={isInstructor ? '📭' : '🚗'}
          title={isInstructor ? t('lessons.emptyInstructorTitle') : t('lessons.emptyStudentTitle')}
          text={isInstructor ? t('lessons.emptyInstructor') : t('lessons.emptyStudent')}
          action={
            !isInstructor && (
              <Link to="/reserver" className="btn btn-primary pg-empty-btn">
                {t('lessons.emptyCta')}
              </Link>
            )
          }
        />
      )}

      {data && bookings.length > 0 && (
        <section aria-label={t('lessons.upcoming')}>
          <SectionHead
            title={`${t('lessons.upcoming')} (${active.length})`}
            subtitle={isInstructor ? t('lessons.upcomingSubInstructor') : t('lessons.upcomingSub')}
          />
          {active.length === 0 && (
            <div className="pg-inline-empty">
              <span>{isInstructor ? t('lessons.noUpcomingInstructor') : t('lessons.noUpcoming')}</span>
              {!isInstructor && (
                <Link to="/reserver" className="btn btn-secondary">
                  {t('lessons.bookCta')}
                </Link>
              )}
            </div>
          )}
          {active.map((b) => (
            <BookingCard key={b.id} booking={b} role={user.role} onChange={refresh} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section aria-label={t('lessons.history')}>
          <SectionHead title={`${t('lessons.history')} (${past.length})`} subtitle={isInstructor ? t('lessons.historySubInstructor') : t('lessons.historySub')} />
          {past.map((b) => (
            <BookingCard key={b.id} booking={b} role={user.role} onChange={refresh} />
          ))}
        </section>
      )}
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
    <article className={`card booking pg-lesson booking-${b.status}`}>
      <div className="pg-lesson-head">
        <div className="pg-date" aria-hidden="true">
          <span>{fmt(b.startAt, { weekday: 'short' })}</span>
          <strong>{fmt(b.startAt, { day: 'numeric' })}</strong>
          <span>{fmt(b.startAt, { month: 'short' })}</span>
        </div>
        <div className="grow pg-lesson-main">
          <div className="row-between pg-lesson-top">
            <StatusBadge status={b.status} />
            <strong className="pg-price">{formatPrice(role === 'student' ? b.studentPrice : b.price)}</strong>
          </div>
          <h3>{t('lessons.cardTitle', { category: b.category, min: b.durationMin })}</h3>
          <p className="small pg-when">
            {b.isInstant && t('lessons.instant')}
            {fmt(b.startAt, { weekday: 'long', day: 'numeric', month: 'long' })} · {fmt(b.startAt, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="pg-person">
        <span className="pg-avatar" aria-hidden="true">
          {(other.firstName?.[0] ?? '?').toUpperCase()}
        </span>
        <span className="grow">
          <small className="muted">{role === 'student' ? t('lessons.withInstructor') : t('lessons.withStudent')}</small>
          <strong>
            {other.firstName} {other.lastName}
          </strong>
          {role === 'student' && b.instructor.vehicle && <small className="muted">🚘 {b.instructor.vehicle}</small>}
        </span>
        {other.phone && (
          <a className="pg-call" href={`tel:${other.phone.replace(/\s/g, '')}`} aria-label={t('lessons.call', { phone: other.phone })}>
            📞
          </a>
        )}
      </div>

      <p className="small pg-where">📍 {b.pickupAddress}</p>
      {role === 'student' && b.coveredMinutes > 0 && (
        <p className="pack-note small">🎟️ {t('lessons.packCovered', { min: b.coveredMinutes })}</p>
      )}

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
        <div className="row wrap pg-actions">
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
