import '../../styles/book.css';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, formatPrice, LANGUAGE_LABELS } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import MapView from '../../components/MapView.jsx';
import { EmptyState, ErrorMessage, PageHeader, SectionHead, Stars, Stepper } from '../../components/ui.jsx';
import { usePolling, usePosition } from '../../hooks.js';
import { getLocale, translate, useT } from '../../i18n.jsx';

// Les libellés sont traduits au rendu (la langue peut changer à tout moment).
const DURATIONS = [60, 90, 120];
const TRANSMISSIONS = ['manuelle', 'automatique'];
const MAX_KM = 60;

// Boîte de vitesses envoyée par le serveur (« manuelle », « automatique », « les deux »).
const transmissionLabel = (value) => {
  const key = `book.transmission_${String(value).replace(/\s+/g, '_')}`;
  const label = translate(key);
  return label === key ? value : label;
};
const durationLabel = (min) => translate(`book.duration${min}`);
const isTopRated = (i) => i.rating != null && i.rating >= 4.8 && (i.ratingCount ?? 0) >= 5;
const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function formatSlot(iso) {
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// Les 14 prochains jours, pour choisir une date de leçon.
function nextDays(count = 14) {
  const weekdayFmt = new Intl.DateTimeFormat(getLocale(), { weekday: 'short' });
  const dayFmt = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' });
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: isoDay(d),
      weekday: i === 0 ? translate('book.today') : i === 1 ? translate('book.tomorrow') : weekdayFmt.format(d),
      day: dayFmt.format(d),
    };
  });
}

// Petit groupe de puces à choix unique, accessible (aria-pressed).
function ChoiceChips({ options, value, onChange, label }) {
  return (
    <div className="chips bk-chips" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          className={`chip ${value === opt.value ? 'chip-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
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
    <div className="slot-picker bk-slots">
      <div className="bk-label" id="bk-date-label">
        {t('book.date')}
      </div>
      <div className="days chips-scroll bk-days" role="group" aria-labelledby="bk-date-label">
        {days.map((d) => (
          <button
            key={d.value}
            type="button"
            aria-pressed={d.value === date}
            className={`day ${d.value === date ? 'day-active' : ''}`}
            onClick={() => setDate(d.value)}
          >
            <span>{d.weekday}</span>
            <strong>{d.day}</strong>
          </button>
        ))}
      </div>
      <div className="bk-label" id="bk-time-label">
        {t('book.startTime')}
      </div>
      <ErrorMessage error={error} />
      {!slots && !error && (
        <div className="bk-slot-skeleton" aria-busy="true" aria-label={t('book.searchingSlots')}>
          {[0, 1, 2, 3, 4].map((k) => (
            <span key={k} className="skeleton" />
          ))}
        </div>
      )}
      {slots && !slots.length && <p className="bk-inline-empty">🗓️ {t('book.noSlots')}</p>}
      {slots && slots.length > 0 && (
        <div className="chips bk-slot-grid" role="group" aria-labelledby="bk-time-label">
          {slots.map((s) => (
            <button
              key={s.startAt}
              type="button"
              aria-pressed={value === s.startAt}
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

function Badges({ instructor }) {
  const t = useT();
  return (
    <div className="bk-badges">
      {instructor.isOnline && <span className="bk-badge bk-badge-now">⚡ {t('book.badgeNow')}</span>}
      {isTopRated(instructor) && <span className="bk-badge bk-badge-top">🏆 {t('book.badgeTop')}</span>}
    </div>
  );
}

// Carte moniteur riche (liste de l'étape 2).
function InstructorCard({ instructor: i, onSelect }) {
  const t = useT();
  return (
    <button type="button" className="bk-card" onClick={() => onSelect(i)}>
      <div className={`avatar bk-avatar ${i.isOnline ? 'is-online' : ''}`} aria-hidden="true">
        {i.firstName[0]}
      </div>
      <div className="grow bk-card-body">
        <div className="bk-card-top">
          <strong className="bk-name">
            {i.firstName} {i.lastName[0]}.
          </strong>
          <span className="bk-price">
            {formatPrice(i.hourlyRate)}
            <small>/h</small>
          </span>
        </div>
        <div className="bk-meta">
          <Stars value={i.rating} count={i.ratingCount} />
          {i.distanceKm != null && <span>· 📍 {t('book.km', { km: i.distanceKm })}</span>}
        </div>
        <div className="bk-meta">
          <span>⚙️ {transmissionLabel(i.transmission)}</span>
          {i.languages?.length > 0 && <span>· 🗣️ {i.languages.map((l) => l.toUpperCase()).join(' · ')}</span>}
        </div>
        <Badges instructor={i} />
        <div className="bk-card-foot">
          {i.isOnline ? (
            <span className="online">{t('book.onlineEta', { min: i.etaMin })}</span>
          ) : (
            <span className="muted">{t('book.byAppointment')}</span>
          )}
          <span className="bk-choose" aria-hidden="true">
            {t('book.choose')} →
          </span>
        </div>
      </div>
    </button>
  );
}

// Fiche du moniteur choisi : résumé + profil complet repliable (bio, infos, avis).
function ProfileCard({ instructor, reviews, onChange }) {
  const t = useT();
  return (
    <div className="bk-profile">
      <div className="bk-profile-head">
        <div className={`avatar avatar-lg bk-avatar ${instructor.isOnline ? 'is-online' : ''}`} aria-hidden="true">
          {instructor.firstName[0]}
        </div>
        <div className="grow">
          <h3>
            {instructor.firstName} {instructor.lastName}
          </h3>
          <div className="bk-meta">
            <Stars value={instructor.rating} count={instructor.ratingCount} />
          </div>
          <div className="bk-meta">
            <span>🏫 {instructor.schoolName || t('book.independent')}</span>
          </div>
          <div className="bk-meta">
            <span>
              {formatPrice(instructor.hourlyRate)}/h
              {instructor.distanceKm != null && <> · 📍 {t('book.km', { km: instructor.distanceKm })}</>}
            </span>
          </div>
        </div>
        <button type="button" className="bk-change" onClick={onChange}>
          {t('book.change')}
        </button>
      </div>
      <Badges instructor={instructor} />
      <details className="bk-details">
        <summary>{t('book.seeProfile')}</summary>
        <div className="bk-details-body">
          {instructor.bio && <p className="bk-bio">{instructor.bio}</p>}
          <ul className="bk-facts">
            <li>🚘 {instructor.vehicle || t('book.schoolVehicle')}</li>
            <li>⚙️ {t('book.gearbox', { transmission: transmissionLabel(instructor.transmission) })}</li>
            <li>🗣️ {instructor.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(', ')}</li>
            <li>🪪 {t('book.licences', { categories: instructor.categories.join(', ') })}</li>
            {instructor.approvalNumber && <li>✅ {t('book.approval', { number: instructor.approvalNumber })}</li>}
          </ul>
          <h4>{t('book.reviews')}</h4>
          {reviews == null && <span className="skeleton bk-review-skeleton" />}
          {reviews?.length === 0 && <p className="muted small">{t('book.noReviews')}</p>}
          {reviews?.map((r, idx) => (
            <div key={idx} className="bk-review">
              <div className="row-between small">
                <strong>{r.author}</strong>
                <span className="stars" aria-label={`${r.rating}/5`}>
                  {'★'.repeat(r.rating)}
                </span>
              </div>
              {r.comment && <p className="small">{r.comment}</p>}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function LockedStep({ text }) {
  return (
    <div className="bk-locked">
      <span aria-hidden="true">🔒</span> {text}
    </div>
  );
}

export default function Book() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initial = params.get('lat') && params.get('lng') ? { lat: Number(params.get('lat')), lng: Number(params.get('lng')) } : null;
  const { position, setPosition, located } = usePosition(initial);
  const [examCenters, setExamCenters] = useState([]);
  const [showCenters, setShowCenters] = useState(true);
  const [permits, setPermits] = useState([]);
  // « Réserver à nouveau » : /reserver?instructor=12&category=B présélectionne le moniteur.
  const [category, setCategory] = useState(params.get('category') || user?.goalCategory || 'B');
  const [transmission, setTransmission] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(Number(params.get('instructor')) || null);
  const [detail, setDetail] = useState(null); // { id, instructor, reviews }

  // Réservation
  const [when, setWhen] = useState(null); // null = choix par défaut selon la disponibilité
  const [startAt, setStartAt] = useState(null);
  const [durationMin, setDurationMin] = useState(60);
  const [pickupAddress, setPickupAddress] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const scrollPending = useRef(false);
  const permitRow = useRef(null);

  useEffect(() => {
    api('/permits', { auth: false }).then((d) => setPermits(d.permits)).catch(() => {});
    api('/exam-centers', { auth: false }).then((d) => setExamCenters(d.centers)).catch(() => {});
  }, []);

  const query = new URLSearchParams({
    lat: position.lat,
    lng: position.lng,
    category,
    maxKm: MAX_KM,
    ...(transmission ? { transmission } : {}),
    ...(onlineOnly ? { onlineOnly: '1' } : {}),
  });
  const { data, error: listError } = usePolling(`/instructors?${query}`, 10000);
  const instructors = useMemo(
    () => [...(data?.instructors ?? [])].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)),
    [data],
  );

  // Fiche détaillée (avis) du moniteur choisi ; sert aussi de repli s'il sort de la liste filtrée.
  useEffect(() => {
    if (!selectedId) return undefined;
    let alive = true;
    setDetail(null);
    api(`/instructors/${selectedId}?lat=${position.lat}&lng=${position.lng}`)
      .then((d) => alive && setDetail({ id: selectedId, instructor: d.instructor, reviews: d.reviews }))
      .catch(() => alive && setDetail({ id: selectedId, instructor: null, reviews: [] }));
    return () => {
      alive = false;
    };
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fromList = instructors.find((i) => i.id === selectedId);
  const fromDetail = detail?.id === selectedId ? detail.instructor : null;
  const selected = fromList ?? (fromDetail?.categories?.includes(category) ? fromDetail : null);
  const reviews = detail?.id === selectedId ? detail.reviews : null;

  // « Maintenant » n'est possible que si le moniteur est en ligne.
  const mode = selected?.isOnline ? (when ?? 'now') : 'later';

  useEffect(() => {
    if (!selected) return;
    const p = new URLSearchParams({ instructorId: selected.id, category, durationMin });
    api(`/bookings/quote?${p}`)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [selected?.id, category, durationMin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Défilement doux vers l'étape 3 après le choix d'un moniteur.
  useEffect(() => {
    if (!selected || !scrollPending.current) return;
    scrollPending.current = false;
    requestAnimationFrame(() =>
      document
        .getElementById('book-step-3')
        ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }),
    );
  }, [selected]);

  // Le permis actif reste visible dans la rangée horizontale.
  useLayoutEffect(() => {
    const row = permitRow.current;
    const active = row?.querySelector('[aria-pressed="true"]');
    if (!row || !active) return;
    row.scrollLeft += active.getBoundingClientRect().left - row.getBoundingClientRect().left - 16;
  }, [permits.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Après l'envoi : bref écran de réussite, puis direction « Leçons ».
  useEffect(() => {
    if (!sentTo) return undefined;
    const id = setTimeout(() => navigate('/lecons?booked=1'), 1600);
    return () => clearTimeout(id);
  }, [sentTo, navigate]);

  const chooseInstructor = (i) => {
    scrollPending.current = true;
    setSelectedId(i.id);
    setWhen(null);
    setStartAt(null);
    setError('');
  };
  const clearInstructor = () => {
    setSelectedId(null);
    setStartAt(null);
    setWhen(null);
    setQuote(null);
    requestAnimationFrame(() =>
      document.getElementById('book-step-2')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }),
    );
  };
  const chooseCategory = (code) => {
    setCategory(code);
    setSelectedId(null);
    setStartAt(null);
    setQuote(null);
  };

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
  const timeOk = Boolean(selected) && (mode === 'now' || Boolean(startAt));
  const addressOk = pickupAddress.trim().length > 0;
  const complete = timeOk && addressOk;
  const quoteFresh = quote && selected;
  const lessonPrice = quoteFresh ? quote.lessonPrice : selected ? (selected.hourlyRate * durationMin) / 60 : 0;
  const total = quoteFresh ? quote.studentPrice : lessonPrice;
  const priceText = total === 0 ? t('book.inPack') : formatPrice(total);
  const current = !selected ? 1 : !timeOk ? 2 : 3;
  const missing = !selected
    ? t('book.missingInstructor')
    : !timeOk
      ? t('book.missingSlot')
      : !addressOk
        ? t('book.missingAddress')
        : '';

  const steps = [
    { id: 'permit', label: t('book.stepPermit') },
    { id: 'instructor', label: t('book.stepInstructor') },
    { id: 'slot', label: t('book.stepSlot') },
    { id: 'confirm', label: t('book.stepConfirm') },
  ];
  const filtersActive = Boolean(transmission) || onlineOnly;

  const submit = async (e) => {
    e.preventDefault();
    if (!complete || busy) {
      if (selected && timeOk && !addressOk) document.getElementById('bk-pickup')?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/bookings', {
        method: 'POST',
        body: {
          instructorId: selected.id,
          category,
          durationMin,
          startAt: mode === 'now' ? null : startAt,
          pickupAddress,
          pickupLat: position.lat,
          pickupLng: position.lng,
        },
      });
      setSentTo(selected.firstName);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <div className="page bk-success" role="status" aria-live="polite">
        <div className="bk-success-icon" aria-hidden="true">
          ✅
        </div>
        <h1>{t('book.sentTitle', { name: sentTo })}</h1>
        <p>{t('book.sentText')}</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/lecons?booked=1')}>
          {t('book.seeLessons')}
        </button>
      </div>
    );
  }

  return (
    <form className="page book bk" onSubmit={submit} noValidate>
      <Stepper steps={steps} current={current} />
      <PageHeader eyebrow={`🚗 ${t('book.eyebrow')}`} title={t('book.title')} subtitle={t('book.subtitle')} />

      {/* 1 · Permis */}
      <section className="bk-section" id="book-step-1">
        <SectionHead step={1} done title={t('book.s1Title')} subtitle={t('book.s1Subtitle')} />
        <div className="bk-permits chips-scroll" ref={permitRow} role="group" aria-label={t('book.s1Title')}>
          {permits.length === 0 &&
            [0, 1, 2, 3].map((k) => <span key={k} className="skeleton bk-permit-skeleton" />)}
          {permits.map((p) => (
            <button
              key={p.code}
              type="button"
              aria-pressed={p.code === category}
              className={`bk-permit ${p.code === category ? 'is-active' : ''}`}
              onClick={() => chooseCategory(p.code)}
            >
              <strong>{p.code}</strong>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        {permit && (
          <p className="bk-permit-desc">
            <strong>
              {permit.code} · {permit.label}
            </strong>{' '}
            — {permit.description}
          </p>
        )}
      </section>

      {/* 2 · Moniteur */}
      <section className="bk-section" id="book-step-2">
        <SectionHead
          step={2}
          done={Boolean(selected)}
          title={t('book.s2Title')}
          subtitle={selected ? t('book.s2SubtitleDone') : t('book.s2Subtitle')}
        />
        <div className="bk-map">
          <MapView
            center={selected ? { lat: selected.lat, lng: selected.lng } : position}
            me={position}
            markers={markers}
            examCenters={showCenters ? examCenters : []}
            selectedId={selectedId}
            onSelect={(id) => {
              const i = instructors.find((x) => x.id === id);
              if (i) chooseInstructor(i);
            }}
            onMapClick={setPosition}
            height={selected ? '26vh' : '34vh'}
          />
        </div>
        <p className="bk-map-hint">
          {params.get('centre')
            ? t('book.nearCentre', { centre: params.get('centre') })
            : located
              ? t('book.positionDetected')
              : t('book.positionDefault')}{' '}
          {t('book.tapMap')}
        </p>

        {selected ? (
          <ProfileCard instructor={selected} reviews={reviews} onChange={clearInstructor} />
        ) : (
          <>
            <div className="bk-filters chips-scroll" role="group" aria-label={t('book.filters')}>
              {TRANSMISSIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={transmission === value}
                  className={`chip ${transmission === value ? 'chip-active' : ''}`}
                  onClick={() => setTransmission(transmission === value ? '' : value)}
                >
                  ⚙️ {transmissionLabel(value)}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={onlineOnly}
                className={`chip ${onlineOnly ? 'chip-active' : ''}`}
                onClick={() => setOnlineOnly(!onlineOnly)}
              >
                ⚡ {t('book.availableNow')}
              </button>
              <button
                type="button"
                aria-pressed={showCenters}
                className={`chip ${showCenters ? 'chip-active' : ''}`}
                onClick={() => setShowCenters(!showCenters)}
              >
                {t('book.centresToggle')}
              </button>
            </div>
            <ErrorMessage error={listError} />
            {!data && !listError && (
              <div aria-busy="true" aria-label={t('book.loadingInstructors')}>
                {[0, 1, 2].map((k) => (
                  <div key={k} className="skeleton bk-card-skeleton" />
                ))}
              </div>
            )}
            {data && instructors.length > 0 && (
              <p className="bk-count">{t('book.count', { n: instructors.length, km: MAX_KM })}</p>
            )}
            {data && !instructors.length && (
              <EmptyState
                icon="🔍"
                title={t('book.noInstructorsTitle', { category })}
                text={filtersActive ? t('book.noInstructorsFilters') : t('book.noInstructorsText')}
                action={
                  filtersActive ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setTransmission('');
                        setOnlineOnly(false);
                      }}
                    >
                      {t('book.clearFilters')}
                    </button>
                  ) : (
                    <Link className="btn btn-secondary" to="/centres">
                      {t('book.seeCentres')}
                    </Link>
                  )
                }
              />
            )}
            <ul className="list bk-list">
              {instructors.map((i) => (
                <li key={i.id}>
                  <InstructorCard instructor={i} onSelect={chooseInstructor} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* 3 · Créneau */}
      <section className="bk-section" id="book-step-3">
        <SectionHead
          step={3}
          done={timeOk}
          title={t('book.s3Title')}
          subtitle={selected ? t('book.s3Subtitle', { name: selected.firstName }) : t('book.s3SubtitleLocked')}
        />
        {!selected ? (
          <LockedStep text={t('book.lockedInstructor')} />
        ) : (
          <div className="bk-panel">
            <div className="bk-when" role="group" aria-label={t('book.whenLabel')}>
              <button
                type="button"
                aria-pressed={mode === 'now'}
                disabled={!selected.isOnline}
                className={`bk-when-option ${mode === 'now' ? 'is-active' : ''}`}
                onClick={() => setWhen('now')}
              >
                <span aria-hidden="true">⚡</span>
                <strong>{t('book.whenNowTitle')}</strong>
                <small>
                  {selected.isOnline ? t('book.whenNowText', { min: selected.etaMin }) : t('book.whenNowOff')}
                </small>
              </button>
              <button
                type="button"
                aria-pressed={mode === 'later'}
                className={`bk-when-option ${mode === 'later' ? 'is-active' : ''}`}
                onClick={() => setWhen('later')}
              >
                <span aria-hidden="true">📅</span>
                <strong>{t('book.whenLaterTitle')}</strong>
                <small>{t('book.whenLaterText')}</small>
              </button>
            </div>
            <div className="bk-label" id="bk-duration-label">
              {t('book.duration')}
            </div>
            <ChoiceChips
              label={t('book.duration')}
              options={DURATIONS.map((d) => ({ value: d, label: durationLabel(d) }))}
              value={durationMin}
              onChange={setDurationMin}
            />
            {mode === 'later' && (
              <SlotPicker instructorId={selected.id} durationMin={durationMin} value={startAt} onChange={setStartAt} />
            )}
          </div>
        )}
      </section>

      {/* 4 · Où et confirmation */}
      <section className="bk-section" id="book-step-4">
        <SectionHead step={4} done={complete} title={t('book.s4Title')} subtitle={t('book.s4Subtitle')} />
        {!timeOk ? (
          <LockedStep text={selected ? t('book.lockedSlot') : t('book.lockedInstructor')} />
        ) : (
          <div className="bk-panel">
            <label className="bk-field" htmlFor="bk-pickup">
              <span className="bk-label">📍 {t('book.pickupAddress')}</span>
              <input
                id="bk-pickup"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder={t('book.pickupPlaceholder')}
                autoComplete="street-address"
                required
                aria-required="true"
              />
              <small className="muted">{t('book.pickupHint')}</small>
            </label>

            {quote?.withPack ? (
              <p className="pack-note small">
                🎟️ {quote.coveredMinutes > 0 ? t('book.packCovered', { min: quote.coveredMinutes }) : t('book.packExhausted')}
              </p>
            ) : (
              <p className="bk-pack-upsell small">
                🎟️ <Link to="/pack">{t('book.withPackLink')}</Link>
                {t('book.withPackRest')}
              </p>
            )}

            <dl className="bk-breakdown">
              <div>
                <dt>{t('book.lineLesson', { category, duration: durationLabel(durationMin) })}</dt>
                <dd>{formatPrice(lessonPrice)}</dd>
              </div>
              {lessonPrice > total && (
                <div className="bk-discount">
                  <dt>{t('book.linePack')}</dt>
                  <dd>−{formatPrice(lessonPrice - total)}</dd>
                </div>
              )}
              <div className="bk-total">
                <dt>{t('book.lineTotal')}</dt>
                <dd>{priceText}</dd>
              </div>
            </dl>
            <p className="bk-payment small">🔒 {t('book.paymentNote')}</p>
          </div>
        )}
        <ErrorMessage error={error} />
      </section>

      {/* Barre récapitulative collée en bas */}
      <div className="sticky-cta bk-cta">
        <div className="grow bk-cta-summary" aria-live="polite">
          {selected ? (
            <>
              <strong>
                {selected.firstName} · {mode === 'now' ? t('book.now') : startAt ? formatSlot(startAt) : t('book.dateTbd')}
              </strong>
              <small>
                {durationLabel(durationMin)} · {total === 0 && quoteFresh ? t('book.inPack') : priceText}
              </small>
            </>
          ) : (
            <strong>{t('book.ctaEmpty')}</strong>
          )}
          {missing && (
            <small className="bk-cta-hint" id="bk-cta-hint">
              {missing}
            </small>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary bk-cta-btn"
          disabled={!complete || busy}
          aria-describedby={missing ? 'bk-cta-hint' : undefined}
        >
          {busy ? t('book.sending') : t('book.submit')}
        </button>
      </div>
    </form>
  );
}
