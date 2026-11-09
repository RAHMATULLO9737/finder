import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import api, { errMsg, list } from '../api';
import { StatusBadge } from '../components/OrderStatus';
import { formatDateTime, money, orderNo } from '../utils';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders/').then((r) => setOrders(list(r))).catch((e) => setError(errMsg(e)));
  }, []);

  return (
    <div className="container page-section narrow">
      <div className="section-heading"><div><span className="eyebrow">BUYURTMALAR</span><h2>Buyurtmalarim</h2></div></div>
      {error && <div className="error">{error}</div>}
      {!orders && !error && <div className="empty">Yuklanmoqda...</div>}
      {orders && orders.length === 0 && (
        <div className="empty big-empty">
          <span className="big-emoji">📦</span>
          <h2>Hali buyurtma bermagansiz</h2>
          <p>Birinchi sovg‘angizni tanlang — biz yetkazib beramiz.</p>
          <Link className="btn btn-primary" to="/gifts">Sovg‘alarni ko‘rish</Link>
        </div>
      )}
      <div className="order-cards">
        {orders?.map((o) => (
          <Link to={`/orders/${o.id}`} className="order-card" key={o.id}>
            <span className="order-icon"><Package size={20} /></span>
            <div className="order-main">
              <div className="order-top"><b>Buyurtma {orderNo(o)}</b><StatusBadge status={o.status} /></div>
              <small className="muted">{formatDateTime(o.created_at)} · {o.items_count} ta sovg‘a</small>
              <small className="order-names">{o.items.map((i) => i.name).join(', ')}</small>
            </div>
            <strong>{money(o.total)}</strong>
            <ChevronRight size={18} className="muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
