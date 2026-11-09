import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { PAYMENTS, money } from '../utils';

const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Farg‘ona', 'Namangan', 'Qarshi', 'Nukus', 'Urganch', 'Termiz', 'Jizzax', 'Guliston', 'Navoiy'];

export default function Checkout() {
  const { user } = useAuth();
  const { notify } = useApp();
  const { items, subtotal, deliveryFee, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: [user?.first_name, user?.last_name].filter(Boolean).join(' '),
    phone: '+998 ', city: 'Toshkent', address: '', note: '', gift_message: '', payment_method: 'cash',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/orders/', {
        ...form,
        items: items.map((i) => ({ gift: i.id, quantity: i.quantity })),
      });
      notify('Buyurtmangiz qabul qilindi! 🎉');
      navigate(`/orders/${res.data.id}`, { state: { success: true }, replace: true });
      clear();
    } catch (err) {
      setError(errMsg(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page-section">
      <div className="section-heading"><div><span className="eyebrow">RASMIYLASHTIRISH</span><h2>Buyurtmani rasmiylashtirish</h2></div></div>
      {error && <div className="error">{error}</div>}

      <form className="cart-layout" onSubmit={submit}>
        <div>
          <div className="form-card">
            <h3>1. Yetkazib berish ma’lumotlari</h3>
            <div className="form-grid">
              <label>Ism va familiya *<input required value={form.full_name} onChange={set('full_name')} placeholder="Masalan: Aziza Karimova" /></label>
              <label>Telefon raqam *<input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+998 90 123 45 67" /></label>
              <label>Shahar *
                <select value={form.city} onChange={set('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label>Manzil *<input required value={form.address} onChange={set('address')} placeholder="Ko‘cha, uy, xonadon" /></label>
              <label className="full">Kuryer uchun izoh<textarea rows="2" maxLength="500" value={form.note} onChange={set('note')} placeholder="Masalan: Kirishdan oldin qo‘ng‘iroq qiling" /></label>
            </div>
          </div>

          <div className="form-card">
            <h3>2. Tabrik matni 💌 <small className="muted">(ixtiyoriy)</small></h3>
            <div className="form-grid single">
              <label>Sovg‘a bilan birga ketadigan ochiqcha<textarea rows="3" maxLength="300" value={form.gift_message} onChange={set('gift_message')} placeholder="Tug‘ilgan kuning bilan! Doim baxtli bo‘l ✨" /></label>
            </div>
          </div>

          <div className="form-card">
            <h3>3. To‘lov usuli</h3>
            <div className="pay-grid">
              {PAYMENTS.map(([code, title, desc, emoji]) => (
                <label key={code} className={'pay-option' + (form.payment_method === code ? ' selected' : '')}>
                  <input type="radio" name="pay" checked={form.payment_method === code} onChange={() => setForm({ ...form, payment_method: code })} />
                  <span className="pay-emoji">{emoji}</span>
                  <span><b>{title}</b><small>{desc}</small></span>
                  {form.payment_method === code && <CheckCircle2 size={20} className="pay-check" />}
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="summary-card">
          <h3>Sizning buyurtmangiz</h3>
          <ul className="mini-items">
            {items.map((i) => (
              <li key={i.id}><span>{i.name} <small className="muted">× {i.quantity}</small></span><b>{money(i.price * i.quantity)}</b></li>
            ))}
          </ul>
          <div className="sum-row"><span>Sovg‘alar</span><b>{money(subtotal)}</b></div>
          <div className="sum-row"><span>Yetkazib berish</span><b>{deliveryFee === 0 ? 'Bepul' : money(deliveryFee)}</b></div>
          <div className="sum-row total"><span>Jami</span><b>{money(total)}</b></div>
          <button className="btn btn-primary full" disabled={busy}><Lock size={16} /> {busy ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}</button>
          <Link to="/cart" className="back-link center-link">← Savatga qaytish</Link>
        </aside>
      </form>
    </div>
  );
}
