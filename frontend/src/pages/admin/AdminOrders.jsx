import { useCallback, useEffect, useState } from 'react';
import { Download, Eye, Search, Trash2 } from 'lucide-react';
import api, { errMsg, list } from '../../api';
import Modal from '../../components/Modal';
import OrderItemsList from '../../components/OrderItemsList';
import Pagination from '../../components/Pagination';
import { OrderTimeline, StatusBadge } from '../../components/OrderStatus';
import { useApp } from '../../context/AppContext';
import { ORDER_STATUSES, formatDateTime, money, orderNo } from '../../utils';

const PAGE_SIZE = 10;

export default function AdminOrders() {
  const { notify } = useApp();
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  // Qidiruvni har tugma bosilganda emas, yozib bo'lgach yuboramiz
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const [res, c] = await Promise.all([
        api.get('/admin/orders/', { params: { status: status || undefined, search: query || undefined, page, page_size: PAGE_SIZE } }),
        api.get('/admin/orders/counts/'),
      ]);
      setOrders(list(res));
      setTotalPages(res.data.total_pages || 1);
      setCounts(c.data);
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [status, query, page]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const changeStatus = async (order, newStatus) => {
    if (order.status === newStatus) return;
    try {
      const res = await api.patch(`/admin/orders/${order.id}/`, { status: newStatus });
      setSelected((s) => (s && s.id === order.id ? res.data : s));
      notify(`Buyurtma ${orderNo(order)}: ${res.data.status_label}`);
      load();
    } catch (e) { notify(errMsg(e), 'error'); }
  };

  const remove = async (order) => {
    if (!confirm(`Buyurtma ${orderNo(order)} butunlay o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.`)) return;
    try {
      await api.delete(`/admin/orders/${order.id}/`);
      setSelected(null);
      notify('Buyurtma o‘chirildi', 'info');
      load();
    } catch (e) { notify(errMsg(e), 'error'); }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get('/admin/orders/export/', { params: { status: status || undefined, search: query || undefined }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'buyurtmalar.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { notify(errMsg(e), 'error'); }
  };

  const tabs = [['', 'Hammasi', counts.all], ...ORDER_STATUSES.map(([code, label]) => [code, label, counts[code]])];

  return (
    <>
      <div className="admin-title row">
        <div><h2>Buyurtmalar</h2><p className="muted">Mijozlar buyurtmalarini ko‘ring va holatini boshqaring.</p></div>
        <button className="btn btn-light" onClick={exportCsv}><Download size={16} /> Excel (CSV)</button>
      </div>

      <div className="tabs">
        {tabs.map(([code, label, n]) => (
          <button key={code} className={'tab' + (status === code ? ' active' : '')} onClick={() => { setStatus(code); setPage(1); }}>
            {label} <span>{n ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="search-box wide">
        <Search size={16} />
        <input placeholder="Ism, telefon, manzil yoki #raqam bo‘yicha qidirish" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>№</th><th>Mijoz</th><th>Sovg‘alar</th><th>Jami</th><th>Holat</th><th>Sana</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="center muted">Yuklanmoqda...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan="7" className="center muted">Buyurtmalar topilmadi.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className={o.status === 'new' ? 'row-new' : ''}>
                <td><b>{orderNo(o)}</b></td>
                <td><b>{o.full_name}</b><br /><small className="muted">{o.phone}</small></td>
                <td className="muted">{o.items_count} ta · {o.items.slice(0, 2).map((i) => i.name).join(', ')}{o.items.length > 2 ? '…' : ''}</td>
                <td><b>{money(o.total)}</b></td>
                <td>
                  <select className={'status-select ' + ORDER_STATUSES.find((s) => s[0] === o.status)[2]} value={o.status} onChange={(e) => changeStatus(o, e.target.value)}>
                    {ORDER_STATUSES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </td>
                <td className="muted">{formatDateTime(o.created_at)}</td>
                <td className="actions">
                  <button className="icon-btn" onClick={() => setSelected(o)} aria-label="Batafsil"><Eye size={16} /></button>
                  <button className="icon-btn danger" onClick={() => remove(o)} aria-label="O‘chirish"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {selected && (
        <Modal title={`Buyurtma ${orderNo(selected)}`} wide onClose={() => setSelected(null)}>
          <div className="order-head"><small className="muted">{formatDateTime(selected.created_at)} · @{selected.user_name}</small><StatusBadge status={selected.status} /></div>
          <OrderTimeline status={selected.status} />

          <div className="status-actions">
            {ORDER_STATUSES.map(([code, label, tone, emoji]) => (
              <button key={code} className={`chip ${tone}` + (selected.status === code ? ' on' : '')} onClick={() => changeStatus(selected, code)}>{emoji} {label}</button>
            ))}
          </div>

          <h4 className="modal-sub">Sovg‘alar</h4>
          <OrderItemsList items={selected.items} />
          <div className="sum-rows">
            <div className="sum-row"><span>Sovg‘alar</span><b>{money(selected.subtotal)}</b></div>
            <div className="sum-row"><span>Yetkazib berish</span><b>{Number(selected.delivery_fee) === 0 ? 'Bepul' : money(selected.delivery_fee)}</b></div>
            <div className="sum-row total"><span>Jami</span><b>{money(selected.total)}</b></div>
          </div>

          <h4 className="modal-sub">Mijoz va yetkazib berish</h4>
          <dl className="info-list">
            <div><dt>Ism</dt><dd>{selected.full_name}</dd></div>
            <div><dt>Telefon</dt><dd><a href={`tel:${selected.phone.replace(/\s/g, '')}`}>{selected.phone}</a></dd></div>
            <div><dt>Manzil</dt><dd>{selected.city}, {selected.address}</dd></div>
            <div><dt>To‘lov</dt><dd>{selected.payment_label}</dd></div>
            {selected.gift_message && <div><dt>Tabrik matni</dt><dd>💌 {selected.gift_message}</dd></div>}
            {selected.note && <div><dt>Izoh</dt><dd>{selected.note}</dd></div>}
          </dl>
        </Modal>
      )}
    </>
  );
}
