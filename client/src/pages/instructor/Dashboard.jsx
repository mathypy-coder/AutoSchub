import '../../styles/instructor.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDateTime, formatPrice, statusLabel } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import MapView from '../../components/MapView.jsx';
import { EmptyState, ErrorMessage, PageHeader } from '../../components/ui.jsx';
import { usePolling } from '../../hooks.js';
import { getLocale, useT } from '../../i18n.jsx';

const POSITION_INTERVAL_MS = 20000;
const LIVE_STATUSES = ['en_route', 'in_progress'];
const TODAY_STATUSES = ['accepted', 'en_route', 'in_progress', 'completed'];

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();
const formatTime = (iso) => new Intl.DateTimeFormat(getLocale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

// Titre de section avec sous-titre et compteur (même style que SectionHead).
function Section({ title, subtitle, count, children, id }) {
  return (
    <section className="ins-section" aria-labelledby={id}>
      <div className="section-head">
        <div className="grow">
          <h2 id={id}>
            {title}
            {count > 0 && <span className="ins-count">{count}</span>}
          </h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const t = useT();
  const { user } = useAuth();
  const { data: profileData, error: profileError, refresh: refreshProfile } = usePolling('/instructors/me/profile', 0);
  const { data: stats } = usePolling('/instructors/me/stats', 10000);
  const { data: bookingsData, refresh: refreshBookings } = usePolling('/bookings', 5000);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [answering, setAnswering] = useState(null);

  const profile = profileData?.instructor;
  const online = profile?.isOnline ?? false;
  const bookings = bookingsData?.bookings ?? [];
  const requests = bookings.filter((b) => b.status === 'pending');
  const live = bookings.filter((b) => LIVE_STATUSES.includes(b.status));
  const upcoming = bookings
    .filter((b) => b.status === 'accepted')
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const today = bookings.filter((b) => TODAY_STATUSES.includes(b.status) && isToday(b.startAt));
  const todayNet = stats
    ? today.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.price, 0) * (1 - stats.commissionRate)
    : 0;

  // Comme un chauffeur Uber : quand on est en ligne, la position est partagée.
  // Au plus un envoi toutes les 20 s (chaque envoi réveille la fonction serverless, facturée).
  useEffect(() => {
    if (!online || !navigator.geolocation) return undefined;
    let lastSent = 0;
    let latest = null;
    let timer;
    const send = () => {
      timer = undefined;
      lastSent = Date.now();
      api('/instructors/me/profile', { method: 'PATCH', body: latest }).catch(() => {});
    };
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        latest = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const wait = POSITION_INTERVAL_MS - (Date.now() - lastSent);
        if (wait <= 0) send();
        else timer ??= setTimeout(send, wait);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 },
    );
    return () => {
      navigator.geolocation.clearWatch(id);
      clearTimeout(timer);
    };
  }, [online]);

  const toggleOnline = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/instructors/me/profile', { method: 'PATCH', body: { isOnline: !online } });
      await refreshProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const answer = async (id, status) => {
    setAnswering(id);
    try {
      await api(`/bookings/${id}/status`, { method: 'POST', body: { status } });
      await refreshBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnswering(null);
    }
  };

  const header = (
    <PageHeader
      eyebrow={<>🚗 {t('dashboard.eyebrow')}</>}
      title={t('dashboard.hello', { name: user.firstName })}
      subtitle={!profile ? t('dashboard.subtitleLoading') : online ? t('dashboard.subtitleOnline') : t('dashboard.subtitleOffline')}
    />
  );

  if (!profile) {
    return (
      <div className="page ins-dashboard">
        {header}
        <ErrorMessage error={error || profileError} />
        <div className="skeleton" style={{ minHeight: 120 }} />
        <div className="skeleton" style={{ minHeight: 84 }} />
        <div className="skeleton" style={{ minHeight: 160 }} />
      </div>
    );
  }

  return (
    <div className="page ins-dashboard">
      {header}

      {/* Le grand interrupteur, façon chauffeur Uber */}
      <button
        type="button"
        role="switch"
        aria-checked={online}
        className={`ins-go ${online ? 'on' : ''}`}
        onClick={toggleOnline}
        disabled={busy}
      >
        <span className="ins-go-text">
          <span className="ins-go-state">
            <span className="ins-dot" aria-hidden="true" />
            {online ? t('dashboard.stateOnline') : t('dashboard.stateOffline')}
          </span>
          <strong>{online ? t('dashboard.onlineTitle') : t('dashboard.offlineTitle')}</strong>
          <span className="ins-go-hint">{online ? t('dashboard.onlineHint') : t('dashboard.offlineHint')}</span>
        </span>
        <span className="ins-go-switch" aria-hidden="true">
          <span className="ins-go-knob">{online ? 'GO' : ''}</span>
        </span>
        <span className="ins-go-cta">{busy ? t('common.loading') : online ? t('dashboard.goOffline') : t('dashboard.goOnline')}</span>
      </button>
      <ErrorMessage error={error} />

      {profile.lat != null && (
        <div className="ins-map">
          <MapView
            height="170px"
            zoom={13}
            center={{ lat: profile.lat, lng: profile.lng }}
            markers={[{ id: profile.id, lat: profile.lat, lng: profile.lng, online }]}
          />
        </div>
      )}

      {/* Aujourd'hui */}
      <Section id="ins-today" title={t('dashboard.todayTitle')} subtitle={t('dashboard.todaySubtitle')}>
        <div className="ins-stats">
          <div className="stat-card ins-stat">
            <span className="ins-stat-icon" aria-hidden="true">💶</span>
            <strong>{stats ? formatPrice(todayNet) : '—'}</strong>
            <small>{t('dashboard.statEarnings')}</small>
          </div>
          <div className="stat-card ins-stat">
            <span className="ins-stat-icon" aria-hidden="true">📅</span>
            <strong>{today.length}</strong>
            <small>{t('dashboard.statLessons')}</small>
          </div>
          <div className="stat-card ins-stat">
            <span className="ins-stat-icon" aria-hidden="true">⭐</span>
            <strong>{stats?.rating != null ? stats.rating.toFixed(1) : t('dashboard.ratingNew')}</strong>
            <small>{stats ? t('dashboard.statRating', { count: stats.ratingCount }) : '—'}</small>
          </div>
        </div>
      </Section>

      {/* Demandes en attente : accepter / refuser en un geste */}
      <Section
        id="ins-requests"
        title={t('dashboard.requestsTitle')}
        subtitle={t('dashboard.requestsSubtitle')}
        count={requests.length}
      >
        {!requests.length &&
          (online ? (
            <EmptyState icon="📡" title={t('dashboard.noRequestsOnline')} text={t('dashboard.noRequestsOnlineText')} />
          ) : (
            <EmptyState
              icon="😴"
              title={t('dashboard.noRequestsOffline')}
              text={t('dashboard.noRequestsOfflineText')}
              action={
                <button type="button" className="btn btn-primary ins-empty-btn" onClick={toggleOnline} disabled={busy}>
                  {t('dashboard.goOnline')}
                </button>
              }
            />
          ))}
        {requests.map((b) => (
          <article key={b.id} className={`card ins-request ${b.isInstant ? 'instant' : ''}`}>
            <div className="ins-request-top">
              <span className={`ins-tag ${b.isInstant ? 'ins-tag-instant' : ''}`}>
                {b.isInstant ? t('dashboard.now') : t('dashboard.planned')}
              </span>
              <strong className="ins-price">{formatPrice(b.price)}</strong>
            </div>
            <strong className="ins-request-when">
              {b.isInstant ? t('dashboard.asap') : formatDateTime(b.startAt)}
            </strong>
            <ul className="ins-facts">
              <li>
                <span aria-hidden="true">🎓</span> {b.student.firstName} {b.student.lastName}
              </li>
              <li>
                <span aria-hidden="true">🚗</span> {t('dashboard.categoryDuration', { category: b.category, duration: b.durationMin })}
              </li>
              <li>
                <span aria-hidden="true">📍</span> {b.pickupAddress}
              </li>
            </ul>
            <div className="ins-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => answer(b.id, 'declined')}
                disabled={answering === b.id}
              >
                {t('dashboard.decline')}
              </button>
              <button
                type="button"
                className="btn btn-primary ins-accept"
                onClick={() => answer(b.id, 'accepted')}
                disabled={answering === b.id}
              >
                ✓ {t('dashboard.accept')}
              </button>
            </div>
          </article>
        ))}
      </Section>

      {/* Leçon en cours */}
      {live.length > 0 && (
        <Section id="ins-live" title={t('dashboard.liveTitle')} subtitle={t('dashboard.liveSubtitle')}>
          {live.map((b) => (
            <Link key={b.id} to="/moniteur/lecons" className="card card-link ins-live">
              <div className="row-between">
                <span className={`badge badge-${b.status}`}>{statusLabel(b.status)}</span>
                <span className="ins-time">{formatTime(b.startAt)}</span>
              </div>
              <strong>
                {b.student.firstName} {b.student.lastName}
              </strong>
              <span className="small muted">
                📍 {b.pickupAddress} · {b.durationMin} min
              </span>
              <span className="ins-link">{t('dashboard.openLesson')} →</span>
            </Link>
          ))}
        </Section>
      )}

      {/* À venir */}
      <Section id="ins-upcoming" title={t('dashboard.upcomingTitle')} subtitle={t('dashboard.upcomingSubtitle')}>
        {!upcoming.length ? (
          <EmptyState
            icon="🗓️"
            title={t('dashboard.noUpcoming')}
            text={t('dashboard.noUpcomingText')}
            action={
              <Link to="/moniteur/profil" className="btn btn-secondary ins-empty-btn">
                {t('dashboard.editAvailability')}
              </Link>
            }
          />
        ) : (
          <ul className="ins-upcoming">
            {upcoming.slice(0, 5).map((b) => (
              <li key={b.id}>
                <Link to="/moniteur/lecons" className="ins-upcoming-item">
                  <span className="ins-upcoming-date">{formatDateTime(b.startAt)}</span>
                  <span className="grow">
                    <strong>
                      {b.student.firstName} {b.student.lastName}
                    </strong>
                    <small>
                      {b.category} · {b.durationMin} min · {b.pickupAddress}
                    </small>
                  </span>
                  {b.unreadMessages > 0 && (
                    <span className="ins-unread" aria-label={t('dashboard.unread', { count: b.unreadMessages })}>
                      💬 {b.unreadMessages}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/moniteur/lecons" className="ins-all-link">
          {t('dashboard.allLessons')} →
        </Link>
      </Section>

      {/* Gains cumulés */}
      {stats && (
        <Section id="ins-earnings" title={t('dashboard.earnings')} subtitle={t('dashboard.earningsSubtitle')}>
          <div className="ins-earnings card">
            <div>
              <span className="ins-earn-value">{formatPrice(stats.weekNet)}</span>
              <small>{t('dashboard.last7Days')}</small>
            </div>
            <div>
              <span className="ins-earn-value">{formatPrice(stats.net)}</span>
              <small>{t('dashboard.totalNet')}</small>
            </div>
            <div>
              <span className="ins-earn-value">{stats.lessons}</span>
              <small>{t('dashboard.lessons')}</small>
            </div>
            <div>
              <span className="ins-earn-value">{t('dashboard.hoursValue', { hours: stats.hours })}</span>
              <small>{t('dashboard.hoursGiven')}</small>
            </div>
          </div>
          <p className="muted small">{t('dashboard.commission', { rate: Math.round(stats.commissionRate * 100) })}</p>
        </Section>
      )}
    </div>
  );
}
