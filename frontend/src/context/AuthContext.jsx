import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('gf_token'));

  // Sahifa ochilganda token bo'lsa — foydalanuvchini tiklaymiz
  useEffect(() => {
    if (!localStorage.getItem('gf_token')) return;
    api.get('/auth/me/')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('gf_token'))
      .finally(() => setLoading(false));
  }, []);

  // Token eskirganda interceptor shu hodisani yuboradi
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('gf-logout', onLogout);
    return () => window.removeEventListener('gf-logout', onLogout);
  }, []);

  const saveSession = ({ token, user: u }) => {
    localStorage.setItem('gf_token', token);
    setUser(u);
    return u;
  };

  const login = async (username, password) =>
    saveSession((await api.post('/auth/login/', { username, password })).data);

  const register = async (data) => saveSession((await api.post('/auth/register/', data)).data);

  const logout = async () => {
    try { await api.post('/auth/logout/'); } catch { /* token allaqachon yaroqsiz bo'lishi mumkin */ }
    localStorage.removeItem('gf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin: !!user?.is_staff, login, register, logout, setUser, saveSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
