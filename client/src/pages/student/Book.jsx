import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, formatPrice, LANGUAGE_LABELS } from '../../api.js';
import MapView from '../../components/MapView.jsx';
import { Chips, ErrorMessage, Stars } from '../../components/ui.jsx';
import { usePolling, usePosition } from '../../hooks.js';
import { getLocale, translate, useT } from '../../i18n.jsx';

// Les libellés sont traduits au rendu (la langue peut changer à tout moment).
const DURATIONS = [
  { value: 60, key: 'duration60' },
  { value: 90, key: 'duration90' },
  { value: 120, key: 'duration120' },
];

const TRANSMISSIONS = ['manuelle', 'automatique'];

// Boîte de vitesses envoyée par le serveur (« manuelle », « automatique », « les deux »).
const transmissionLabel = (value) => {
  const key = `book.transmission_${String(value).replace(/\s+/g, '_')}`;
  const label = translate(key);
  return label === key ? value : label;
};
const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Les 14 prochains jours, pour choisir une date de leçon.
function nextDays(count = 14) {
  const weekdayFmt = new Intl.DateTimeFormat(getLocale(), { weekday: 'short' });
  const dayFmt = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' });
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: isoDay(d), weekday: i === 0 ? translate('book.today') : i === 1 ? translate('book.tomorrow') : weekdayFmt.format(d), day: dayFmt.format(d) };
  });
}

// Créneaux libres du moniteur (selon ses disponibilités et ses leçons déjà prévues).
function SlotPicker({ instructorId, durationMin, value, onChange }) {
  const t = useT();
  const days = useMemo(() => nextDays(), [t]); // eslint-disable-line react-hooks/exhaustive-deps
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
      <div className="label">{t('book.date')}</div>
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
      <div className="label">{t('book.startTime')}</div>
      <ErrorMessage error={error} />
      {!slots && !error && <p className="muted small">{t('book.searchingSlots')}</p>}
      {slots && !slots.length && <p className="muted small">{t('book.noSlots')}</p>}
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
  const t = useT();
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
            ? t('book.nearCentre', { centre: params.get('centre') })
            : located
              ? t('book.positionDetected')
              : t('book.positionDefault')}{' '}
          {t('book.tapMap')}
        </span>
        <label className="switch">
          <input type="checkbox" checked={showCenters} onChange={(e) => setShowCenters(e.target.checked)} />
          {t('book.centresToggle')}
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
              <Chips
                options={TRANSMISSIONS.map((value) => ({ value, label: transmissionLabel(value) }))}
                value={transmission}
                onChange={setTransmission}
                allowEmpty
              />
              <label className="switch">
                <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
                {t('book.availableNow')}
              </label>
            </div>
            <ErrorMessage error={error} />
            {data && !instructors.length && (
              <p className="empty">{t('book.noInstructors', { category })}</p>
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
                        <Stars value={i.rating} count={i.ratingCount} /> · {i.distanceKm} km · {transmissionLabel(i.transmission)}
                      </div>
                      <div className="small">
                        {i.isOnline ? (
                          <span className="online">{t('book.onlineEta', { min: i.etaMin })}</span>
                        ) : (
                          <span className="muted">{t('book.byAppointment')}</span>
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
  const t = useT();
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
        {t('book.allInstructors')}
      </button>
      <div className="row">
        <div className="avatar avatar-lg">{instructor.firstName[0]}</div>
        <div>
          <h2>
            {instructor.firstName} {instructor.lastName}
          </h2>
          <div className="muted small">
            <Stars value={instructor.rating} count={instructor.ratingCount} /> · {instructor.schoolName || t('book.independent')}
          </div>
          <div className="small">{t('book.approval', { number: instructor.approvalNumber })}</div>
        </div>
      </div>
      <p>{instructor.bio}</p>
      <ul className="facts">
        <li>🚘 {instructor.vehicle || t('book.schoolVehicle')}</li>
        <li>⚙️ {t('book.gearbox', { transmission: transmissionLabel(instructor.transmission) })}</li>
        <li>🗣️ {instructor.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(', ')}</li>
        <li>🪪 {t('book.licences', { categories: instructor.categories.join(', ') })}</li>
      </ul>

      <form className="form" onSubmit={submit}>
        <Chips
          options={[
            ...(instructor.isOnline ? [{ value: 'now', label: t('book.whenNow', { min: instructor.etaMin }) }] : []),
            { value: 'later', label: t('book.whenLater') },
          ]}
          value={when}
          onChange={setWhen}
        />
        <div className="label">{t('book.duration')}</div>
        <Chips options={DURATIONS.map((d) => ({ value: d.value, label: t(`book.${d.key}`) }))} value={durationMin} onChange={setDurationMin} />
        {when === 'later' && (
          <SlotPicker instructorId={instructor.id} durationMin={durationMin} value={startAt} onChange={setStartAt} />
        )}
        <label>
          {t('book.pickupAddress')}
          <input
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder={t('book.pickupPlaceholder')}
            required
          />
        </label>
        {quote?.withPack ? (
          <p className="pack-note small">
            🎟️ {quote.coveredMinutes > 0 ? t('book.packCovered', { min: quote.coveredMinutes }) : t('book.packExhausted')}
            {quote.studentPrice < quote.lessonPrice && <> · {t('book.insteadOf', { price: formatPrice(quote.lessonPrice) })}</>}
          </p>
        ) : (
          <p className="muted small">
            <Link to="/pack">{t('book.withPackLink')}</Link>{t('book.withPackRest')}
          </p>
        )}
        <ErrorMessage error={error} />
        <button className="btn btn-primary btn-block" disabled={busy || (when === 'later' && !startAt)}>
          {busy ? t('book.sending') : t('book.submit', { category, price: total === 0 ? t('book.included') : formatPrice(total) })}
        </button>
        <p className="muted small center">{t('book.paymentNote')}</p>
      </form>

      {reviews.length > 0 && (
        <div className="reviews">
          <h3>{t('book.reviews')}</h3>
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
