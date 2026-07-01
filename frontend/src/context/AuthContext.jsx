import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';
import { setUnauthorizedHandler } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.session();
      setUser(response.data.data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    role: user?.role || null,
    loading,
    login,
    logout,
    refreshSession,
    isAuthenticated: Boolean(user)
  }), [user, loading, login, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) return { user: null, role: null, loading: false, login: () => {}, logout: () => {}, refreshSession: () => {}, isAuthenticated: false };
  return value;
}
