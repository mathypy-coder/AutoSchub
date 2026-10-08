import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useT } from '../i18n.jsx';
import MapView from '../components/MapView.jsx';
import { Chips, EmptyState, ErrorMessage, PageHeader } from '../components/ui.jsx';
import { usePosition } from '../hooks.js';
import '../styles/pages.css';

const BELGIUM_CENTER = { lat: 50.64, lng: 4.67 };

export default function ExamCenters() {
  const t = useT();
  const { user } = useAuth();
  const { position, located } = usePosition();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [nearMe, setNearMe] = useState(true);
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const showOnMap = (id) => {
    setSelectedId(id);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    const params = new URLSearchParams({
      ...(query.trim() ? { q: query.trim() } : {}),
      ...(region ? { region } : {}),
      ...(nearMe ? { lat: position.lat, lng: position.lng } : {}),
    });
    const timer = setTimeout(() => {
      api(`/exam-centers?${params}`, { auth: false })
        .then((d) => {
          setData(d);
          setError('');
        })
        .catch((err) => setError(err.message));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, region, nearMe, position.lat, position.lng]);

  const centers = data?.centers ?? [];
  const selected = centers.find((c) => c.id === selectedId);
  const mapCenter = selected ?? (centers.length === 1 ? centers[0] : nearMe && located ? position : BELGIUM_CENTER);

  return (
    <div className="page pg">
      <PageHeader
        eyebrow={t('centers.eyebrow')}
        title={t('centers.title')}
        subtitle={t('centers.intro', { total: data?.total ?? 32 })}
      />

      <div className="pg-search">
        <span aria-hidden="true">🔍</span>
        <input
          type="search"
          placeholder={t('centers.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('centers.searchLabel')}
        />
      </div>
      <div className="row-between centers-filters">
        <Chips
          options={(data?.regions ?? []).map((r) => ({ value: r.id, label: r.label }))}
          value={region}
          onChange={setRegion}
          allowEmpty
        />
        <label className="switch">
          <input type="checkbox" checked={nearMe} onChange={(e) => setNearMe(e.target.checked)} />
          {t('centers.nearMe')}
        </label>
      </div>

      <div ref={mapRef} className="pg-map">
        <MapView
          height="34vh"
          zoom={selected || centers.length === 1 ? 12 : 8}
          center={mapCenter}
          me={nearMe ? position : null}
          examCenters={centers}
          selectedCenterId={selectedId}
          onSelectCenter={setSelectedId}
        />
      </div>
      {nearMe && !located && <p className="map-hint muted">{t('centers.positionHint')}</p>}

      <ErrorMessage error={error} />
      {!data && !error && (
        <>
          <div className="skeleton" style={{ minHeight: 150 }} />
          <div className="skeleton" style={{ minHeight: 150 }} />
        </>
      )}
      {data && (
        <p className="pg-count">
          <strong>{t('centers.count', { count: centers.length })}</strong>
          <span className="muted small"> · {nearMe ? t('centers.sortedByDistance') : t('centers.sortedByName')}</span>
        </p>
      )}
      {data && !centers.length && (
        <EmptyState
          icon="🔎"
          title={t('centers.emptyTitle')}
          text={t('centers.empty', { query })}
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setQuery('');
                setRegion('');
              }}
            >
              {t('centers.reset')}
            </button>
          }
        />
      )}

      {centers.map((c) => (
        <article
          key={c.id}
          className={`card center-card pg-center ${c.id === selectedId ? 'center-card-selected' : ''}`}
          onClick={() => setSelectedId(c.id)}
        >
          <div className="pg-center-head">
            <span className="pg-center-icon" aria-hidden="true">🏁</span>
            <span className="grow">
              <strong className="pg-center-name">{c.name}</strong>
              <span className="small">{c.address}</span>
            </span>
            {c.distanceKm != null && <span className="pg-distance">{c.distanceKm} km</span>}
          </div>
          <div className="pg-meta">
            <span className="pg-tag">{c.operator}</span>
            <span className="pg-tag">{data.regions.find((r) => r.id === c.region)?.label}</span>
            {c.phone && (
              <a className="pg-tag" href={`tel:${c.phone.replace(/\s/g, '')}`} onClick={(e) => e.stopPropagation()}>
                📞 {c.phone}
              </a>
            )}
          </div>
          {user.role === 'student' && (
            <Link className="btn btn-primary btn-block" to={`/reserver?lat=${c.lat}&lng=${c.lng}&centre=${encodeURIComponent(c.name)}`}>
              🚗 {t('centers.lessonNear')}
            </Link>
          )}
          <div className="card-tools">
            <button
              type="button"
              className="tool"
              onClick={(e) => {
                e.stopPropagation();
                showOnMap(c.id);
              }}
            >
              📍 {t('centers.showOnMap')}
            </button>
            <a className="tool" href={c.directionsUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              🧭 {t('centers.directions')}
            </a>
            {c.operatorWebsite && (
              <a className="tool" href={c.operatorWebsite} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                📅 {t('centers.appointment')}
              </a>
            )}
            {user.role === 'student' && (
              <Link className="tool" to={`/libre?tab=routes&center=${c.id}`} onClick={(e) => e.stopPropagation()}>
                {t('centers.practiceRoutes')}
              </Link>
            )}
          </div>
        </article>
      ))}
      <p className="muted small">{t('centers.disclaimer')}</p>
    </div>
  );
}
