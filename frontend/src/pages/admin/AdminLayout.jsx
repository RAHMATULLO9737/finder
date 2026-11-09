import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FolderTree, Gift, LayoutDashboard, MessageSquare, ShoppingBag, Users } from 'lucide-react';
import api from '../../api';
import { useApp } from '../../context/AppContext';

const LINKS = [
  ['/admin', 'Boshqaruv', LayoutDashboard, true],
  ['/admin/orders', 'Buyurtmalar', ShoppingBag],
  ['/admin/gifts', 'Sovg‘alar', Gift],
  ['/admin/categories', 'Kategoriyalar', FolderTree],
  ['/admin/users', 'Foydalanuvchilar', Users],
  ['/admin/reviews', 'Sharhlar', MessageSquare],
];

export default function AdminLayout() {
  const { notify } = useApp();
  const location = useLocation();
  const [newCount, setNewCount] = useState(0);
  const prev = useRef(null);

  // Yangi buyurtmalar sonini har 20 soniyada tekshiramiz va yangisi kelsa xabar beramiz
  useEffect(() => {
    let alive = true;
    const check = () => api.get('/admin/orders/counts/').then((r) => {
      if (!alive) return;
      const n = r.data.new || 0;
      if (prev.current !== null && n > prev.current) notify(`🛎️ Yangi buyurtma keldi! (${n - prev.current})`, 'info');
      prev.current = n;
      setNewCount(n);
    }).catch(() => {});
    check();
    const t = setInterval(check, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [notify, location.pathname]);

  return (
    <div className="container admin-shell">
      <aside className="admin-side">
        <div className="admin-side-title">Admin panel</div>
        {LINKS.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={17} /> {label}
            {to === '/admin/orders' && newCount > 0 && <b className="side-badge">{newCount}</b>}
          </NavLink>
        ))}
      </aside>
      <section className="admin-main"><Outlet /></section>
    </div>
  );
}
