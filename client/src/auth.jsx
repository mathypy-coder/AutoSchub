import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { useT } from './i18n.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const t = useT();
  // Clé de traduction du message affiché (traduit au rendu, suit la langue choisie).
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const expire = () => {
      setToken(null);
      setUser(null);
      setNotice('auth.sessionExpired');
    };
    window.addEventListener('autoschub:session-expired', expire);
    return () => window.removeEventListener('autoschub:session-expired', expire);
  }, []);

  // Session refusée (401) : on oublie le jeton. Autre erreur (réseau, 503 au démarrage
  // à froid…) : la session est sans doute valide, on réessaie au lieu de déconnecter.
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    let timer;
    const load = () =>
      api('/auth/me')
        .then(({ user: me }) => {
          if (cancelled) return;
          setUser(me);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          if (err.status === 401 || !getToken()) {
            setToken(null);
            setLoading(false);
          } else {
            timer = setTimeout(load, 3000);
          }
        });
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const authenticate = useCallback(async (path, body) => {
    const { token, user: me } = await api(path, { method: 'POST', body });
    setToken(token);
    setUser(me);
    setNotice('');
    return me;
  }, []);

  const value = {
    user,
    loading,
    notice: notice ? t(notice) : '',
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (payload) => authenticate('/auth/register', payload),
    // Objectif de l'élève (permis visé, parcours) choisi à l'accueil guidé.
    updateMe: async (body) => {
      const { user: me } = await api('/auth/me', { method: 'PATCH', body });
      setUser(me);
      return me;
    },
    logout: () => {
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
