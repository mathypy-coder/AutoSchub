import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

export const BRUSSELS = { lat: 50.8467, lng: 4.3525 };

// Charge une ressource et la rafraîchit périodiquement (suivi « en direct »).
export function usePolling(path, intervalMs = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const pathRef = useRef(path);
  pathRef.current = path;
  const lastRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requested = pathRef.current;
    if (!requested) return;
    // Seule la réponse de la dernière requête compte : une réponse plus ancienne
    // (autre position, autre filtre) arrivée en retard n'écrase pas la nouvelle.
    const id = ++lastRequest.current;
    try {
      const result = await api(requested);
      if (id !== lastRequest.current) return;
      setData(result);
      setError('');
    } catch (err) {
      if (id !== lastRequest.current) return;
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!intervalMs) return undefined;
    // Pas de rafraîchissement quand l'onglet est caché : moins d'appels à l'API
    // (et donc moins d'invocations facturées). Rattrapage immédiat au retour.
    const tick = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
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
