import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

export const BRUSSELS = { lat: 50.8467, lng: 4.3525 };

// Charge une ressource et la rafraîchit périodiquement (suivi « en direct »).
export function usePolling(path, intervalMs = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const pathRef = useRef(path);
  pathRef.current = path;

  const refresh = useCallback(async () => {
    if (!pathRef.current) return;
    try {
      setData(await api(pathRef.current));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!intervalMs) return undefined;
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [path, intervalMs, refresh]);

  return { data, error, refresh };
}

export function usePosition(initial = null) {
  const [position, setPosition] = useState(initial ?? BRUSSELS);
  const [located, setLocated] = useState(Boolean(initial));

  useEffect(() => {
    if (initial || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocated(true);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { position, setPosition, located };
}
