import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import GiftImage from '../components/GiftImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { money } from '../utils';

export default function Cart() {
  const { items, config, subtotal, deliveryFee, total, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goCheckout = () => navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } });

  if (items.length === 0) {
    return (
      <div className="container page-section">
        <div className="empty big-empty">
          <span className="big-emoji">🛒</span>
          <h2>Savatingiz bo‘sh</h2>
          <p>Hali hech narsa tanlamadingiz. Eng yaxshi sovg‘ani topishga ko‘maklashamiz!</p>
          <div className="empty-actions">
            <Link className="btn btn-primary" to="/gifts">Sovg‘alar katalogi</Link>
            <Link className="btn btn-light" to="/finder">Sovg‘a topuvchi</Link>
          </div>
        </div>
      </div>
    );
  }

  const left = Math.max(0, config.free_delivery_from - subtotal);
  const progress = Math.min(100, (subtotal / config.free_delivery_from) * 100);

  return (
    <div className="container page-section">
      <div className="section-heading">
        <div><span className="eyebrow">SAVAT</span><h2>Savatingiz ({items.length})</h2></div>
        <button className="btn btn-ghost" onClick={() => confirm('Savatni tozalaymi?') && clear()}><Trash2 size={15} /> Tozalash</button>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {items.map((i) => (
            <div className="cart-item" key={i.id}>
              <Link to={`/gifts/${i.id}`} className="cart-thumb"><GiftImage gift={i} /></Link>
              <div className="cart-info">
                <Link to={`/gifts/${i.id}`}><h3>{i.name}</h3></Link>
                <small className="muted">{money(i.price)} / dona</small>
                <div className="qty small">
                  <button onClick={() => setQty(i.id, i.quantity - 1)} aria-label="Kamaytirish"><Minus size={14} /></button>
                  <b>{i.quantity}</b>
                  <button onClick={() => setQty(i.id, i.quantity + 1)} aria-label="Ko‘paytirish"><Plus size={14} /></button>
                </div>
              </div>
              <div className="cart-sum">
                <strong>{money(i.price * i.quantity)}</strong>
                <button className="icon-btn danger" onClick={() => remove(i.id)} aria-label="O‘chirish"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <aside className="summary-card">
          <h3>Buyurtma xulosasi</h3>
          <div className="free-ship">
            <Truck size={16} />
            {left > 0 ? <span>Yana <b>{money(left)}</b> xarid qiling — yetkazib berish <b>bepul</b>!</span> : <span><b>Yetkazib berish bepul!</b> 🎉</span>}
            <div className="bar"><i style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="sum-row"><span>Sovg‘alar</span><b>{money(subtotal)}</b></div>
          <div className="sum-row"><span>Yetkazib berish</span><b>{deliveryFee === 0 ? 'Bepul' : money(deliveryFee)}</b></div>
          <div className="sum-row total"><span>Jami</span><b>{money(total)}</b></div>
          <button className="btn btn-primary full" onClick={goCheckout}><ShoppingBag size={17} /> Buyurtma berish</button>
          {!user && <p className="muted tiny">Buyurtma berish uchun tizimga kirasiz — savatingiz saqlanib qoladi.</p>}
          <Link to="/gifts" className="back-link center-link">← Xaridni davom ettirish</Link>
        </aside>
      </div>
    </div>
  );
}
