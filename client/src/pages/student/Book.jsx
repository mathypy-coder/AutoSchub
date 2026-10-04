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

const WEEKDAY = new Intl.DateTimeFormat('fr-BE', { weekday: 'short' });
const DAY = new Intl.DateTimeFormat('fr-BE', { day: 'numeric', month: 'short' });
const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Les 14 prochains jours, pour choisir une date de leçon.
function nextDays(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: isoDay(d), weekday: i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : WEEKDAY.format(d), day: DAY.format(d) };
  });
}

// Créneaux libres du moniteur (selon ses disponibilités et ses leçons déjà prévues).
function SlotPicker({ instructorId, durationMin, value, onChange }) {
  const days = useMemo(() => nextDays(), []);
  const [date, setDate] = useState(days[1].value);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setSlots(null);
    setError('');
    onChange(null);
    api(`/instructors/${instructorId}/slots?date=${date}&durationMin=${durationMin}`)
      .then((d) => alive && setSlots(d.slots))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [instructorId, date, durationMin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="slot-picker">
      <div className="label">Date</div>
      <div className="days chips-scroll">
        {days.map((d) => (
          <button
            key={d.value}
            type="button"
            className={`day ${d.value === date ? 'day-active' : ''}`}
            onClick={() => setDate(d.value)}
          >
            <span>{d.weekday}</span>
            <strong>{d.day}</strong>
          </button>
        ))}
      </div>
      <div className="label">Heure de début</div>
      <ErrorMessage error={error} />
      {!slots && !error && <p className="muted small">Recherche des créneaux…</p>}
      {slots && !slots.length && <p className="muted small">Aucun créneau libre ce jour-là. Essaie une autre date.</p>}
      {slots && slots.length > 0 && (
        <div className="chips">
          {slots.map((s) => (
            <button
              key={s.startAt}
              type="button"
              className={`chip ${value === s.startAt ? 'chip-active' : ''}`}
              onClick={() => onChange(s.startAt)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Book() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get('lat') && params.get('lng') ? { lat: Number(params.get('lat')), lng: Number(params.get('lng')) } : null;
  const { position, setPosition, located } = usePosition(initial);
  const [examCenters, setExamCenters] = useState([]);
  const [showCenters, setShowCenters] = useState(true);
  const [permits, setPermits] = useState([]);
  // « Réserver à nouveau » : /reserver?instructor=12&category=B présélectionne le moniteur.
  const [category, setCategory] = useState(params.get('category') || 'B');
  const [transmission, setTransmission] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(Number(params.get('instructor')) || null);

  useEffect(() => {
    api('/permits', { auth: false }).then((d) => setPermits(d.permits)).catch(() => {});
    api('/exam-centers', { auth: false }).then((d) => setExamCenters(d.centers)).catch(() => {});
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
  const [startAt, setStartAt] = useState(null);
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
          startAt: when === 'now' ? null : startAt,
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
        <div className="label">Durée</div>
        <Chips options={DURATIONS} value={durationMin} onChange={setDurationMin} />
        {when === 'later' && (
          <SlotPicker instructorId={instructor.id} durationMin={durationMin} value={startAt} onChange={setStartAt} />
        )}
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
        <button className="btn btn-primary btn-block" disabled={busy || (when === 'later' && !startAt)}>
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
