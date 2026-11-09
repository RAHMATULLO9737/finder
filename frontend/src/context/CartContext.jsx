import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useApp } from './AppContext';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const KEY = 'gf_cart';
const MAX_QTY = 50;

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

export function CartProvider({ children }) {
  const { notify } = useApp();
  const [items, setItems] = useState(read);
  const [config, setConfig] = useState({ delivery_fee: 25000, free_delivery_from: 500000 });

  // Savat brauzerda saqlanadi (sahifa yangilansa ham yo'qolmaydi)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  // Yetkazib berish sozlamalari serverdan
  useEffect(() => { api.get('/shop-config/').then((r) => setConfig(r.data)).catch(() => {}); }, []);

  const add = useCallback((gift, qty = 1, { silent = false } = {}) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === gift.id);
      if (found) return prev.map((i) => (i.id === gift.id ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + qty) } : i));
      return [...prev, {
        id: gift.id, name: gift.name, price: Number(gift.price), image_src: gift.image_src || '',
        category_emoji: gift.category_emoji || '🎁', quantity: Math.min(MAX_QTY, qty),
      }];
    });
    if (!silent) notify(`“${gift.name}” savatga qo‘shildi 🛒`);
  }, [notify]);

  const setQty = useCallback((id, qty) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY, qty)) } : i)));
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price * i.quantity, 0), [items]);
  const deliveryFee = items.length === 0 || subtotal >= config.free_delivery_from ? 0 : config.delivery_fee;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider value={{ items, config, count, subtotal, deliveryFee, total, add, setQty, remove, clear, inCart: (id) => items.some((i) => i.id === id) }}>
      {children}
    </CartContext.Provider>
  );
}
