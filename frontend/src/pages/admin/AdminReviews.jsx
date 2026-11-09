import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import api, { errMsg, list } from '../../api';
import { Stars } from '../../components/Stars';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils';

export default function AdminReviews() {
  const { notify } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get('/reviews/')
      .then((r) => { setItems(list(r)); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (r) => {
    if (!confirm('Bu sharhni o‘chirmoqchimisiz?')) return;
    try { await api.delete(`/reviews/${r.id}/`); notify('Sharh o‘chirildi', 'info'); load(); }
    catch (e) { notify(errMsg(e), 'error'); }
  };

  return (
    <>
      <div className="admin-title"><h2>Sharhlar</h2><p className="muted">Nomaqbul sharhlarni o‘chirib turing. Jami: {items.length}</p></div>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Sovg‘a</th><th>Foydalanuvchi</th><th>Baho</th><th>Sharh</th><th>Sana</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="center muted">Yuklanmoqda...</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan="6" className="center muted">Hozircha sharhlar yo‘q.</td></tr>}
            {items.map((r) => (
              <tr key={r.id}>
                <td><Link to={`/gifts/${r.gift}`}><b>{r.gift_name}</b></Link></td>
                <td>{r.user_name}</td>
                <td><Stars value={r.rating} size={13} /></td>
                <td className="muted">{r.comment || '—'}</td>
                <td>{formatDate(r.created_at)}</td>
                <td className="actions"><button className="icon-btn danger" onClick={() => remove(r)} aria-label="O‘chirish"><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
