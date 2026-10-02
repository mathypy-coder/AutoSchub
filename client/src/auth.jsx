import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const expire = () => {
      setToken(null);
      setUser(null);
      setNotice('Ta session a expiré. Reconnecte-toi pour continuer.');
    };
    window.addEventListener('autoschub:session-expired', expire);
    return () => window.removeEventListener('autoschub:session-expired', expire);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(({ user: me }) => setUser(me))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
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
    notice,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (payload) => authenticate('/auth/register', payload),
    logout: () => {
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
