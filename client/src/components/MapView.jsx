import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

const icon = (className, label = '') =>
  L.divIcon({ className: '', html: `<div class="pin ${className}">${label}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] });

const ICONS = {
  me: icon('pin-me', '●'),
  online: icon('pin-online', '🚗'),
  offline: icon('pin-offline', '🚗'),
  selected: icon('pin-selected', '🚗'),
};

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/**
 * Carte des moniteurs façon Uber.
 * markers : [{ id, lat, lng, online, label }]
 */
export default function MapView({ center, me, markers = [], selectedId, onSelect, onMapClick, zoom = 12, height = '42vh' }) {
  return (
    <div className="map-wrap" style={{ height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        <ClickHandler onClick={onMapClick} />
        {me && (
          <Marker position={[me.lat, me.lng]} icon={ICONS.me}>
            <Tooltip>Point de prise en charge</Tooltip>
          </Marker>
        )}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={m.id === selectedId ? ICONS.selected : m.online ? ICONS.online : ICONS.offline}
            eventHandlers={{ click: () => onSelect?.(m.id) }}
          >
            {m.label && <Tooltip>{m.label}</Tooltip>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
