import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errMsg, list } from '../../api';
import Modal from '../../components/Modal';
import { useApp } from '../../context/AppContext';

function CategoryModal({ category, onClose, onSaved }) {
  const { notify } = useApp();
  const [form, setForm] = useState({ name: category?.name || '', emoji: category?.emoji || '🎁', description: category?.description || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (category) await api.patch(`/categories/${category.id}/`, form);
      else await api.post('/categories/', form);
      notify(category ? 'Kategoriya yangilandi' : 'Kategoriya qo‘shildi');
      onSaved();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <div className="form-grid single">
          <label>Nomi *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Emoji<input maxLength="4" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></label>
          <label>Tavsif<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        </div>
        <div className="form-buttons">
          <button type="button" className="btn btn-light" onClick={onClose}>Bekor qilish</button>
          <button className="btn btn-primary" disabled={busy}>Saqlash</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const { notify } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | category

  const load = useCallback(() => {
    api.get('/categories/')
      .then((r) => { setItems(list(r)); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (c) => {
    if (!confirm(`“${c.name}” kategoriyasini o‘chirmoqchimisiz?`)) return;
    try { await api.delete(`/categories/${c.id}/`); notify('Kategoriya o‘chirildi', 'info'); load(); }
    catch (e) { notify(errMsg(e), 'error'); }
  };

  return (
    <>
      <div className="admin-title row">
        <div><h2>Kategoriyalar</h2><p className="muted">Jami: {items.length}</p></div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> Yangi kategoriya</button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Kategoriya</th><th>Tavsif</th><th>Sovg‘alar</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="4" className="center muted">Yuklanmoqda...</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan="4" className="center muted">Kategoriyalar yo‘q.</td></tr>}
            {items.map((c) => (
              <tr key={c.id}>
                <td><b>{c.emoji} {c.name}</b></td>
                <td className="muted">{c.description || '—'}</td>
                <td>{c.gifts_count}</td>
                <td className="actions">
                  <button className="icon-btn" onClick={() => setEditing(c)} aria-label="Tahrirlash"><Pencil size={15} /></button>
                  <button className="icon-btn danger" onClick={() => remove(c)} aria-label="O‘chirish"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <CategoryModal
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
}
