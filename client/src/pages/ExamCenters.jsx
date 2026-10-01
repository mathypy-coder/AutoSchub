import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import MapView from '../components/MapView.jsx';
import { Chips, ErrorMessage } from '../components/ui.jsx';
import { usePosition } from '../hooks.js';

const BELGIUM_CENTER = { lat: 50.64, lng: 4.67 };

export default function ExamCenters() {
  const { user } = useAuth();
  const { position, located } = usePosition();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [nearMe, setNearMe] = useState(true);
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({
      ...(query.trim() ? { q: query.trim() } : {}),
      ...(region ? { region } : {}),
      ...(nearMe ? { lat: position.lat, lng: position.lng } : {}),
    });
    const timer = setTimeout(() => {
      api(`/exam-centers?${params}`)
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
    <div className="page">
      <h1>Centres d’examen</h1>
      <p className="muted small">
        Les {data?.total ?? 32} centres agréés en Belgique pour l’examen théorique et pratique. Depuis 2026, théorie et
        pratique se passent dans la même Région.
      </p>

      <input
        type="search"
        className="search"
        placeholder="Ville, code postal, centre ou opérateur…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher un centre d’examen"
      />
      <div className="row-between centers-filters">
        <Chips
          options={(data?.regions ?? []).map((r) => ({ value: r.id, label: r.label }))}
          value={region}
          onChange={setRegion}
          allowEmpty
        />
        <label className="switch">
          <input type="checkbox" checked={nearMe} onChange={(e) => setNearMe(e.target.checked)} />
          Près de moi
        </label>
      </div>

      <MapView
        height="34vh"
        zoom={selected || centers.length === 1 ? 12 : 8}
        center={mapCenter}
        me={nearMe ? position : null}
        examCenters={centers}
        selectedCenterId={selectedId}
        onSelectCenter={setSelectedId}
      />
      {nearMe && !located && (
        <p className="map-hint muted">📍 Position non partagée : distances calculées depuis Bruxelles.</p>
      )}

      <ErrorMessage error={error} />
      <p className="muted small">{centers.length} centre(s)</p>
      {data && !centers.length && <p className="empty">Aucun centre ne correspond à « {query} ».</p>}

      {centers.map((c) => (
        <article
          key={c.id}
          className={`card center-card ${c.id === selectedId ? 'center-card-selected' : ''}`}
          onClick={() => setSelectedId(c.id)}
        >
          <div className="row-between">
            <strong>🏁 {c.name}</strong>
            {c.distanceKm != null && <span className="muted small">{c.distanceKm} km</span>}
          </div>
          <span className="small">{c.address}</span>
          <span className="muted small">
            {c.operator} · {data.regions.find((r) => r.id === c.region)?.label}
            {c.phone && (
              <>
                {' · '}
                <a href={`tel:${c.phone.replace(/\s/g, '')}`} onClick={(e) => e.stopPropagation()}>
                  {c.phone}
                </a>
              </>
            )}
          </span>
          <div className="row wrap">
            <a className="btn btn-secondary" href={c.directionsUrl} target="_blank" rel="noreferrer">
              Itinéraire
            </a>
            {c.operatorWebsite && (
              <a className="btn btn-secondary" href={c.operatorWebsite} target="_blank" rel="noreferrer">
                Prendre rendez-vous
              </a>
            )}
            {user.role === 'student' && (
              <Link className="btn btn-primary" to={`/reserver?lat=${c.lat}&lng=${c.lng}&centre=${encodeURIComponent(c.name)}`}>
                Leçon près du centre
              </Link>
            )}
          </div>
        </article>
      ))}
      <p className="muted small">
        Adresses relevées en 2026 ; positions sur la carte approximatives. Vérifie les horaires et la prise de rendez-vous
        auprès de l’opérateur du centre.
      </p>
    </div>
  );
}

