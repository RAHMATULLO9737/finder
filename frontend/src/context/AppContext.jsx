import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg, list } from '../api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.id;

  // ----- Tema (yorug' / qorong'i) -----
  const [theme, setTheme] = useState(
    () => localStorage.getItem('gf_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('gf_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // ----- Bildirishnomalar (toast) -----
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // ----- Sevimlilar (har bir foydalanuvchiga alohida) -----
  const [favorites, setFavorites] = useState([]);
  const loadFavorites = useCallback(async () => {
    if (!uid) { setFavorites([]); return; }
    try { setFavorites(list(await api.get('/favorites/'))); } catch { /* jim */ }
  }, [uid]);
  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const favIds = useMemo(() => new Set(favorites.map((f) => f.gift)), [favorites]);
  const isFavorite = (giftId) => favIds.has(giftId);

  const toggleFavorite = async (giftId) => {
    if (!uid) {
      notify('Sevimlilarga qo‘shish uchun avval tizimga kiring', 'info');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/favorites/toggle/', { gift: giftId });
      await loadFavorites();
      notify(res.data.favorite ? 'Sevimlilarga qo‘shildi ❤️' : 'Sevimlilardan olib tashlandi');
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{ theme, toggleTheme, toasts, notify, favorites, isFavorite, toggleFavorite, loadFavorites }}
    >
      {children}
    </AppContext.Provider>
  );
}
