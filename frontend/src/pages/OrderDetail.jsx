import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, PartyPopper } from 'lucide-react';
import api, { errMsg } from '../api';
import OrderItemsList from '../components/OrderItemsList';
import { OrderTimeline, StatusBadge } from '../components/OrderStatus';
import { useApp } from '../context/AppContext';
import { formatDateTime, money, orderNo } from '../utils';

export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const { notify } = useApp();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setOrder(null);
    api.get(`/orders/${id}/`).then((r) => setOrder(r.data))
      .catch((e) => setError(e.response?.status === 404 ? 'Buyurtma topilmadi.' : errMsg(e)));
  }, [id]);

  const cancel = async () => {
    if (!confirm('Buyurtmani bekor qilmoqchimisiz?')) return;
    try {
      setOrder((await api.post(`/orders/${id}/cancel/`)).data);
      notify('Buyurtma bekor qilindi', 'info');
    } catch (e) { notify(errMsg(e), 'error'); }
  };

  if (error) return <div className="container page-section narrow"><div className="error">{error}</div><Link to="/orders" className="btn btn-light">← Buyurtmalarim</Link></div>;
  if (!order) return <div className="container page-section narrow"><div className="empty">Yuklanmoqda...</div></div>;

  return (
    <div className="container page-section narrow">
      <Link to="/orders" className="back-link"><ArrowLeft size={16} /> Barcha buyurtmalar</Link>

      {state?.success && (
        <div className="success-banner">
          <PartyPopper size={28} />
          <div>
            <h3>Rahmat! Buyurtmangiz qabul qilindi</h3>
            <p>Tez orada operatorimiz siz bilan <b>{order.phone}</b> raqami orqali bog‘lanadi.</p>
          </div>
        </div>
      )}

      <div className="form-card">
        <div className="order-head">
          <div><h2>Buyurtma {orderNo(order)}</h2><small className="muted">{formatDateTime(order.created_at)}</small></div>
          <StatusBadge status={order.status} />
        </div>
        <OrderTimeline status={order.status} />
      </div>

      <div className="form-card">
        <h3>Sovg‘alar</h3>
        <OrderItemsList items={order.items} />
        <div className="sum-rows">
          <div className="sum-row"><span>Sovg‘alar</span><b>{money(order.subtotal)}</b></div>
          <div className="sum-row"><span>Yetkazib berish</span><b>{Number(order.delivery_fee) === 0 ? 'Bepul' : money(order.delivery_fee)}</b></div>
          <div className="sum-row total"><span>Jami</span><b>{money(order.total)}</b></div>
        </div>
      </div>

      <div className="form-card">
        <h3>Yetkazib berish</h3>
        <dl className="info-list">
          <div><dt>Qabul qiluvchi</dt><dd>{order.full_name}</dd></div>
          <div><dt>Telefon</dt><dd>{order.phone}</dd></div>
          <div><dt>Manzil</dt><dd>{order.city}, {order.address}</dd></div>
          <div><dt>To‘lov</dt><dd>{order.payment_label}</dd></div>
          {order.gift_message && <div><dt>Tabrik matni</dt><dd>💌 {order.gift_message}</dd></div>}
          {order.note && <div><dt>Izoh</dt><dd>{order.note}</dd></div>}
        </dl>
        {order.status === 'new' && (
          <div className="form-buttons"><button className="btn btn-danger-soft" onClick={cancel}>Buyurtmani bekor qilish</button></div>
        )}
      </div>
    </div>
  );
}
