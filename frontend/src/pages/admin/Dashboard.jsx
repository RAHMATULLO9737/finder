import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, FolderTree, Gift, Heart, MessageSquare, ShoppingBag, Users } from 'lucide-react';
import api, { errMsg } from '../../api';
import { StatusBadge } from '../../components/OrderStatus';
import { ORDER_STATUSES, formatDate, formatDateTime, money, orderNo } from '../../utils';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats/').then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div className="empty">Yuklanmoqda...</div>;

  const cards = [
    ['Daromad', money(stats.revenue), Banknote, true],
    ['Buyurtmalar', stats.orders, ShoppingBag],
    ['Yangi buyurtmalar', stats.new_orders, ShoppingBag],
    ['Sovg‘alar', stats.gifts, Gift],
    ['Kategoriyalar', stats.categories, FolderTree],
    ['Foydalanuvchilar', stats.users, Users],
    ['Sharhlar', stats.reviews, MessageSquare],
    ['Sevimlilar', stats.favorites, Heart],
  ];
  const max = Math.max(1, ...stats.by_category.map((c) => c.total));
  const maxRev = Math.max(1, ...stats.sales_week.map((d) => d.revenue));
  const weekday = (iso) => new Date(iso).toLocaleDateString('uz-UZ', { weekday: 'short' });

  return (
    <>
      <div className="admin-title"><h2>Boshqaruv paneli</h2><p className="muted">Saytning umumiy holati.</p></div>
      <div className="stat-grid">
        {cards.map(([label, value, Icon, wide]) => (
          <div className={'stat-card' + (wide ? ' wide' : '')} key={label}>
            <span className="stat-icon"><Icon size={20} /></span>
            <b>{value}</b><small>{label}</small>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>So‘nggi 7 kunlik savdo</h3>
          <div className="week-chart">
            {stats.sales_week.map((d) => (
              <div className="week-col" key={d.date} title={`${d.orders} ta buyurtma · ${money(d.revenue)}`}>
                <small>{d.orders}</small>
                <div className="week-bar"><i style={{ height: `${Math.max(4, (d.revenue / maxRev) * 100)}%` }} /></div>
                <span>{weekday(d.date)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Buyurtmalar holati</h3>
          {ORDER_STATUSES.map(([code, label, tone]) => (
            <div className="bar-row" key={code}>
              <span><span className={`dot ${tone}`} /> {label}</span>
              <div className="bar"><i className={tone} style={{ width: `${(stats.orders_by_status[code] / Math.max(1, stats.orders)) * 100}%` }} /></div>
              <b>{stats.orders_by_status[code]}</b>
            </div>
          ))}
          <h3 style={{ marginTop: 24 }}>Eng ko‘p sotilgan</h3>
          {stats.best_sellers.length === 0 && <p className="muted">Hozircha sotuvlar yo‘q.</p>}
          <ol className="top-list">
            {stats.best_sellers.map((g) => <li key={g.id}><span>{g.name}</span><b>{g.sold} dona</b></li>)}
          </ol>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 22 }}>
        <div className="panel-head"><h3>So‘nggi buyurtmalar</h3><Link to="/admin/orders" className="see-all">Hammasi →</Link></div>
        {stats.recent_orders.length === 0 && <p className="muted">Hozircha buyurtmalar yo‘q.</p>}
        <ul className="plain-list">
          {stats.recent_orders.map((o) => (
            <li key={o.id}>
              <span><b>{orderNo(o)}</b> · {o.full_name} <small className="muted">· {formatDateTime(o.created_at)}</small></span>
              <span className="row-end"><b>{money(o.total)}</b> <StatusBadge status={o.status} /></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>Kategoriyalar bo‘yicha sovg‘alar</h3>
          {stats.by_category.length === 0 && <p className="muted">Ma’lumot yo‘q.</p>}
          {stats.by_category.map((c) => (
            <div className="bar-row" key={c.id}>
              <span>{c.emoji} {c.name}</span>
              <div className="bar"><i style={{ width: `${(c.total / max) * 100}%` }} /></div>
              <b>{c.total}</b>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Eng ko‘p sevimlilarga qo‘shilganlar</h3>
          {stats.top_gifts.length === 0 && <p className="muted">Hozircha sevimlilar yo‘q.</p>}
          <ol className="top-list">
            {stats.top_gifts.map((g) => <li key={g.id}><span>{g.name}</span><b>❤ {g.favorites}</b></li>)}
          </ol>
          <h3 style={{ marginTop: 24 }}>Yangi foydalanuvchilar</h3>
          <ul className="plain-list">
            {stats.recent_users.map((u) => (
              <li key={u.id}><span>{u.username}{u.is_staff && <span className="badge admin">Admin</span>}</span><small>{formatDate(u.date_joined)}</small></li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
