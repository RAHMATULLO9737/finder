import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const TOKEN_KEY = 'gf_token';

const api = axios.create({ baseURL: API_URL });

// Har bir so'rovga token qo'shamiz (login/register bundan mustasno)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const isAuthCall = /\/auth\/(login|register)\//.test(config.url || '');
  if (token && !isAuthCall) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Token eskirgan bo'lsa: chiqib ketamiz va so'rovni tokensiz qayta yuboramiz
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY) && config && !config._retry) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('gf-logout'));
      config._retry = true;
      config.headers.delete('Authorization');
      return api(config);
    }
    return Promise.reject(error);
  }
);

// Sahifalangan ({results: []}) va oddiy javoblarni bir xil o'qish
export const list = (res) => res.data.results ?? res.data;

// Backend xatosini foydalanuvchiga tushunarli matnga aylantirish
export function errMsg(error, fallback = 'Xatolik yuz berdi. Qayta urinib ko‘ring.') {
  if (!error?.response) return 'Serverga ulanib bo‘lmadi. Django server ishlayotganini tekshiring.';
  const data = error.response.data;
  if (typeof data === 'string') return fallback;
  if (data?.detail) return data.detail;
  // Ichma-ich xatolarni ham topamiz (masalan {items: [{quantity: ["..."]}]})
  const dig = (v) => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) { for (const x of v) { const r = dig(x); if (r) return r; } return ''; }
    if (v && typeof v === 'object') { for (const x of Object.values(v)) { const r = dig(x); if (r) return r; } }
    return '';
  };
  if (data && typeof data === 'object') {
    const text = dig(data);
    if (text) return text;
  }
  return fallback;
}

export default api;
