import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDateTime, formatPrice } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import MapView from '../../components/MapView.jsx';
import { ErrorMessage, Stars } from '../../components/ui.jsx';
import { usePolling } from '../../hooks.js';

export default function Dashboard() {
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
  useEffect(() => {
    if (!online || !navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        api('/instructors/me/profile', {
          method: 'PATCH',
          body: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }).catch(() => {}),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
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
        <h1>Bonjour {user.firstName}</h1>
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
        {online ? 'En ligne — toucher pour passer hors ligne' : 'GO — passer en ligne'}
      </button>
      <p className="muted small center">
        {online
          ? 'Les élèves proches peuvent vous réserver pour une leçon immédiate.'
          : 'Hors ligne : seules les réservations planifiées vous parviennent.'}
      </p>
      <ErrorMessage error={error} />

      <h2 className="section-title">Demandes ({requests.length})</h2>
      {!requests.length && <p className="empty">Aucune nouvelle demande.</p>}
      {requests.map((b) => (
        <article key={b.id} className="card request">
          <div className="row-between">
            <strong>
              {b.isInstant ? '⚡ Maintenant' : formatDateTime(b.startAt)} · {b.category}
            </strong>
            <strong>{formatPrice(b.price)}</strong>
          </div>
          <p className="small">
            🎓 {b.student.firstName} {b.student.lastName} · {b.durationMin} min
            <br />📍 {b.pickupAddress}
          </p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => answer(b.id, 'accepted')}>
              Accepter
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => answer(b.id, 'declined')}>
              Refuser
            </button>
          </div>
        </article>
      ))}

      {stats && (
        <>
          <h2 className="section-title">Mes gains</h2>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{formatPrice(stats.weekNet)}</span>
              <span className="muted small">7 derniers jours</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatPrice(stats.net)}</span>
              <span className="muted small">Total net</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.lessons}</span>
              <span className="muted small">Leçons</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.hours} h</span>
              <span className="muted small">Heures données</span>
            </div>
          </div>
          <p className="muted small">
            Commission AutoSchub : {Math.round(stats.commissionRate * 100)} % · <Link to="/moniteur/lecons">Voir toutes mes leçons</Link>
          </p>
        </>
      )}
    </div>
  );
}
