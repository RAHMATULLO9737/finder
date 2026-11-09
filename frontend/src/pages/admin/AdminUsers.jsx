import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX } from 'lucide-react';
import api, { errMsg, list } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { notify } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    api.get('/admin/users/')
      .then((r) => { setItems(list(r)); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = async (u, data, message) => {
    try { await api.patch(`/admin/users/${u.id}/`, data); notify(message); load(); }
    catch (e) { notify(errMsg(e), 'error'); }
  };

  const remove = async (u) => {
    if (!confirm(`“${u.username}” foydalanuvchisini o‘chirmoqchimisiz?`)) return;
    try { await api.delete(`/admin/users/${u.id}/`); notify('Foydalanuvchi o‘chirildi', 'info'); load(); }
    catch (e) { notify(errMsg(e), 'error'); }
  };

  const q = search.trim().toLowerCase();
  const shown = items.filter((u) => !q || u.username.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));

  return (
    <>
      <div className="admin-title"><h2>Foydalanuvchilar</h2><p className="muted">Jami: {items.length}</p></div>
      <label className="search-box wide"><Search size={18} /><input placeholder="Login yoki email bo‘yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Foydalanuvchi</th><th>Rol</th><th>Holat</th><th>Sevimli / Sharh</th><th>Qo‘shilgan</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="center muted">Yuklanmoqda...</td></tr>}
            {shown.map((u) => {
              const self = u.id === me.id;
              return (
                <tr key={u.id}>
                  <td><b>{u.username}</b>{self && <span className="badge">Siz</span>}<br /><small className="muted">{u.email || '—'}</small></td>
                  <td>{u.is_staff ? <span className="badge admin">Admin</span> : <span className="badge soft">Foydalanuvchi</span>}</td>
                  <td>{u.is_active ? <span className="badge ok">Faol</span> : <span className="badge bad">Bloklangan</span>}</td>
                  <td>{u.favorites_count} / {u.reviews_count}</td>
                  <td>{formatDate(u.date_joined)}</td>
                  <td className="actions">
                    {!self && (
                      <>
                        <button className="icon-btn" title={u.is_staff ? 'Adminlikni olib tashlash' : 'Admin qilish'}
                          onClick={() => patch(u, { is_staff: !u.is_staff }, u.is_staff ? 'Adminlik olib tashlandi' : 'Admin qilindi')}>
                          {u.is_staff ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                        </button>
                        <button className="icon-btn" title={u.is_active ? 'Bloklash' : 'Blokdan chiqarish'}
                          onClick={() => patch(u, { is_active: !u.is_active }, u.is_active ? 'Bloklandi' : 'Blokdan chiqarildi')}>
                          {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                        <button className="icon-btn danger" title="O‘chirish" onClick={() => remove(u)}><Trash2 size={15} /></button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
