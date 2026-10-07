import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDateTime, formatPrice } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import MapView from '../../components/MapView.jsx';
import { ErrorMessage, Stars } from '../../components/ui.jsx';
import { usePolling } from '../../hooks.js';
import { useT } from '../../i18n.jsx';

const POSITION_INTERVAL_MS = 20000;

export default function Dashboard() {
  const t = useT();
  const { user } = useAuth();
  const { data: profileData, refresh: refreshProfile } = usePolling('/instructors/me/profile', 0);
  const { data: stats } = usePolling('/instructors/me/stats', 10000);
  const { data: bookingsData, refresh: refreshBookings } = usePolling('/bookings', 5000);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const profile = profileData?.instructor;
  const online = profile?.isOnline ?? false;
  const requests = (bookingsData?.bookings ?? []).filter((b) => b.status === 'pending');

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
    try {
      await api(`/bookings/${id}/status`, { method: 'POST', body: { status } });
      await refreshBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="row-between">
        <h1>{t('dashboard.hello', { name: user.firstName })}</h1>
        {stats && <Stars value={stats.rating} count={stats.ratingCount} />}
      </div>

      {profile?.lat != null && (
        <MapView
          height="200px"
          zoom={13}
          center={{ lat: profile.lat, lng: profile.lng }}
          markers={[{ id: profile.id, lat: profile.lat, lng: profile.lng, online }]}
        />
      )}

      <button
        type="button"
        className={`go-button ${online ? 'go-online' : ''}`}
        onClick={toggleOnline}
        disabled={busy || !profile}
      >
        {online ? t('dashboard.goOffline') : t('dashboard.goOnline')}
      </button>
      <p className="muted small center">
        {online
          ? t('dashboard.onlineHint')
          : t('dashboard.offlineHint')}
      </p>
      <ErrorMessage error={error} />

      <h2 className="section-title">{t('dashboard.requests', { count: requests.length })}</h2>
      {!requests.length && <p className="empty">{t('dashboard.noRequests')}</p>}
      {requests.map((b) => (
        <article key={b.id} className="card request">
          <div className="row-between">
            <strong>
              {b.isInstant ? t('dashboard.now') : formatDateTime(b.startAt)} · {b.category}
            </strong>
            <strong>{formatPrice(b.price)}</strong>
          </div>
          <p className="small">
            🎓 {b.student.firstName} {b.student.lastName} · {b.durationMin} min
            <br />📍 {b.pickupAddress}
          </p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => answer(b.id, 'accepted')}>
              {t('dashboard.accept')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => answer(b.id, 'declined')}>
              {t('dashboard.decline')}
            </button>
          </div>
        </article>
      ))}

      {stats && (
        <>
          <h2 className="section-title">{t('dashboard.earnings')}</h2>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{formatPrice(stats.weekNet)}</span>
              <span className="muted small">{t('dashboard.last7Days')}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatPrice(stats.net)}</span>
              <span className="muted small">{t('dashboard.totalNet')}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.lessons}</span>
              <span className="muted small">{t('dashboard.lessons')}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{t('dashboard.hoursValue', { hours: stats.hours })}</span>
              <span className="muted small">{t('dashboard.hoursGiven')}</span>
            </div>
          </div>
          <p className="muted small">
            {t('dashboard.commission', { rate: Math.round(stats.commissionRate * 100) })} ·{' '}
            <Link to="/moniteur/lecons">{t('dashboard.allLessons')}</Link>
          </p>
        </>
      )}
    </div>
  );
}
