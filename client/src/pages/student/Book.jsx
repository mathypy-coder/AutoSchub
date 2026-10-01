import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, formatPrice, LANGUAGE_LABELS } from '../../api.js';
import MapView from '../../components/MapView.jsx';
import { Chips, ErrorMessage, Stars } from '../../components/ui.jsx';
import { usePolling, usePosition } from '../../hooks.js';

const DURATIONS = [
  { value: 60, label: '1 h' },
  { value: 90, label: '1 h 30' },
  { value: 120, label: '2 h' },
];

const TRANSMISSIONS = [
  { value: 'manuelle', label: 'Manuelle' },
  { value: 'automatique', label: 'Automatique' },
];

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSlot() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return toLocalInput(d);
}

export default function Book() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get('lat') && params.get('lng') ? { lat: Number(params.get('lat')), lng: Number(params.get('lng')) } : null;
  const { position, setPosition, located } = usePosition(initial);
  const [examCenters, setExamCenters] = useState([]);
  const [showCenters, setShowCenters] = useState(true);
  const [permits, setPermits] = useState([]);
  const [category, setCategory] = useState('B');
  const [transmission, setTransmission] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    api('/permits').then((d) => setPermits(d.permits)).catch(() => {});
    api('/exam-centers').then((d) => setExamCenters(d.centers)).catch(() => {});
  }, []);

  const query = new URLSearchParams({
    lat: position.lat,
    lng: position.lng,
    category,
    maxKm: 60,
    ...(transmission ? { transmission } : {}),
    ...(onlineOnly ? { onlineOnly: '1' } : {}),
  });
  const { data, error } = usePolling(`/instructors?${query}`, 10000);
  const instructors = data?.instructors ?? [];
  const selected = instructors.find((i) => i.id === selectedId);

  const markers = useMemo(
    () =>
      instructors.map((i) => ({
        id: i.id,
        lat: i.lat,
        lng: i.lng,
        online: i.isOnline,
        label: `${i.firstName} · ${formatPrice(i.hourlyRate)}/h`,
      })),
    [instructors],
  );

  const permit = permits.find((p) => p.code === category);

  return (
    <div className="book">
      <div className="book-top">
        <div className="chips chips-scroll">
          {permits.map((p) => (
            <button
              key={p.code}
              type="button"
              className={`chip ${p.code === category ? 'chip-active' : ''}`}
              onClick={() => {
                setCategory(p.code);
                setSelectedId(null);
              }}
            >
              {p.code}
            </button>
          ))}
        </div>
        {permit && (
          <p className="permit-hint">
            <strong>{permit.label}</strong> — {permit.description}
          </p>
        )}
      </div>

      <MapView
        center={selected ? { lat: selected.lat, lng: selected.lng } : position}
        me={position}
        markers={markers}
        examCenters={showCenters ? examCenters : []}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onMapClick={setPosition}
      />
      <div className="map-hint muted row-between">
        <span>
          {params.get('centre')
            ? `🏁 Près du centre d’examen ${params.get('centre')}.`
            : located
              ? '📍 Position détectée.'
              : '📍 Position par défaut : Bruxelles.'}{' '}
          Touchez la carte pour changer le point
          de prise en charge.
        </span>
        <label className="switch">
          <input type="checkbox" checked={showCenters} onChange={(e) => setShowCenters(e.target.checked)} />
          🏁 Centres
        </label>
      </div>

      <section className="sheet">
        {selected ? (
          <BookingPanel
            instructor={selected}
            category={category}
            pickup={position}
            onBack={() => setSelectedId(null)}
            onBooked={() => navigate('/lecons')}
          />
        ) : (
          <>
            <div className="sheet-filters">
              <Chips options={TRANSMISSIONS} value={transmission} onChange={setTransmission} allowEmpty />
              <label className="switch">
                <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
                Dispo maintenant
              </label>
            </div>
            <ErrorMessage error={error} />
            {data && !instructors.length && (
              <p className="empty">Aucun moniteur {category} à proximité. Essayez une autre catégorie.</p>
            )}
            <ul className="list">
              {instructors.map((i) => (
                <li key={i.id}>
                  <button type="button" className="instructor-card" onClick={() => setSelectedId(i.id)}>
                    <div className="avatar">{i.firstName[0]}</div>
                    <div className="grow">
                      <div className="row-between">
                        <strong>
                          {i.firstName} {i.lastName[0]}.
                        </strong>
                        <strong>{formatPrice(i.hourlyRate)}/h</strong>
                      </div>
                      <div className="muted small">
                        <Stars value={i.rating} count={i.ratingCount} /> · {i.distanceKm} km · {i.transmission}
                      </div>
                      <div className="small">
                        {i.isOnline ? (
                          <span className="online">● Disponible · arrive en ~{i.etaMin} min</span>
                        ) : (
                          <span className="muted">Sur rendez-vous</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function BookingPanel({ instructor, category, pickup, onBack, onBooked }) {
  const [when, setWhen] = useState(instructor.isOnline ? 'now' : 'later');
  const [startAt, setStartAt] = useState(defaultSlot);
  const [durationMin, setDurationMin] = useState(60);
  const [pickupAddress, setPickupAddress] = useState('');
  const [reviews, setReviews] = useState([]);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/instructors/${instructor.id}`)
      .then((d) => setReviews(d.reviews))
      .catch(() => {});
  }, [instructor.id]);

  useEffect(() => {
    const params = new URLSearchParams({ instructorId: instructor.id, category, durationMin });
    api(`/bookings/quote?${params}`)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [instructor.id, category, durationMin]);

  const total = quote ? quote.studentPrice : (instructor.hourlyRate * durationMin) / 60;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/bookings', {
        method: 'POST',
        body: {
          instructorId: instructor.id,
          category,
          durationMin,
          startAt: when === 'now' ? null : new Date(startAt).toISOString(),
          pickupAddress,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
        },
      });
      onBooked();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="booking-panel">
      <button type="button" className="back" onClick={onBack}>
        ← Tous les moniteurs
      </button>
      <div className="row">
        <div className="avatar avatar-lg">{instructor.firstName[0]}</div>
        <div>
          <h2>
            {instructor.firstName} {instructor.lastName}
          </h2>
          <div className="muted small">
            <Stars value={instructor.rating} count={instructor.ratingCount} /> · {instructor.schoolName || 'Indépendant'}
          </div>
          <div className="small">Agrément {instructor.approvalNumber}</div>
        </div>
      </div>
      <p>{instructor.bio}</p>
      <ul className="facts">
        <li>🚘 {instructor.vehicle || 'Véhicule école'}</li>
        <li>⚙️ Boîte {instructor.transmission}</li>
        <li>🗣️ {instructor.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(', ')}</li>
        <li>🪪 Permis : {instructor.categories.join(', ')}</li>
      </ul>

      <form className="form" onSubmit={submit}>
        <Chips
          options={[
            ...(instructor.isOnline ? [{ value: 'now', label: `⚡ Maintenant (~${instructor.etaMin} min)` }] : []),
            { value: 'later', label: '📅 Planifier' },
          ]}
          value={when}
          onChange={setWhen}
        />
        {when === 'later' && (
          <label>
            Date et heure
            <input
              type="datetime-local"
              value={startAt}
              min={toLocalInput(new Date())}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </label>
        )}
        <div className="label">Durée</div>
        <Chips options={DURATIONS} value={durationMin} onChange={setDurationMin} />
        <label>
          Adresse de prise en charge
          <input
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="Rue, numéro, commune"
            required
          />
        </label>
        {quote?.withPack ? (
          <p className="pack-note small">
            🎟️ {quote.coveredMinutes > 0 ? `${quote.coveredMinutes} min incluses dans ton pack` : 'Heures incluses épuisées ce mois-ci'}
            {quote.studentPrice < quote.lessonPrice && <> · au lieu de {formatPrice(quote.lessonPrice)}</>}
          </p>
        ) : (
          <p className="muted small">
            <Link to="/pack">Avec un pack</Link>, des heures de conduite sont incluses chaque mois.
          </p>
        )}
        <ErrorMessage error={error} />
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Envoi…' : `Réserver ${category} · ${total === 0 ? 'inclus' : formatPrice(total)}`}
        </button>
        <p className="muted small center">Paiement à la fin de la leçon. Annulation gratuite tant que le moniteur n’a pas accepté.</p>
      </form>

      {reviews.length > 0 && (
        <div className="reviews">
          <h3>Avis des élèves</h3>
          {reviews.map((r, idx) => (
            <div key={idx} className="review">
              <div className="row-between small">
                <strong>{r.author}</strong>
                <span className="stars">{'★'.repeat(r.rating)}</span>
              </div>
              {r.comment && <p className="small">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
