import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import api, { errMsg, list } from '../../api';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import GiftImage from '../../components/GiftImage';
import { useApp } from '../../context/AppContext';
import { money, RECIPIENTS } from '../../utils';

const EMPTY = { name: '', description: '', price: '', category: '', min_age: 0, max_age: 100, recipient: 'any', image: '', is_featured: false };

function GiftFormModal({ gift, categories, onClose, onSaved }) {
  const { notify } = useApp();
  const [form, setForm] = useState(
    gift ? { ...EMPTY, ...gift, category: gift.category } : { ...EMPTY, category: categories[0]?.id || '' }
  );
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : form.image || gift?.image_src || ''), [file, form.image, gift]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData();
    ['name', 'description', 'price', 'category', 'min_age', 'max_age', 'recipient', 'image'].forEach((k) => fd.append(k, form[k] ?? ''));
    fd.append('is_featured', form.is_featured ? 'true' : 'false');
    if (file) fd.append('image_file', file);
    try {
      if (gift) await api.patch(`/gifts/${gift.id}/`, fd);
      else await api.post('/gifts/', fd);
      notify(gift ? 'Sovg‘a yangilandi' : 'Sovg‘a qo‘shildi');
      onSaved();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={gift ? 'Sovg‘ani tahrirlash' : 'Yangi sovg‘a qo‘shish'} onClose={onClose} wide>
      {categories.length === 0 ? (
        <div className="error">Avval kamida bitta kategoriya yarating.</div>
      ) : (
        <form onSubmit={submit}>
          {error && <div className="error">{error}</div>}
          <div className="form-grid">
            <label>Sovg‘a nomi *<input required name="name" value={form.name} onChange={change} placeholder="Masalan, Aqlli soat" /></label>
            <label>Narxi (so‘m) *<input required min="0" type="number" name="price" value={form.price} onChange={change} placeholder="250000" /></label>
            <label>Kategoriya *<select required name="category" value={form.category} onChange={change}>{categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></label>
            <label>Kim uchun?<select name="recipient" value={form.recipient} onChange={change}>{RECIPIENTS.map((r) => <option key={r[0]} value={r[0]}>{r[1]}</option>)}</select></label>
            <label>Minimal yosh<input type="number" min="0" name="min_age" value={form.min_age} onChange={change} /></label>
            <label>Maksimal yosh<input type="number" min="0" name="max_age" value={form.max_age} onChange={change} /></label>
            <label className="full">Rasm havolasi (URL)<input name="image" value={form.image} onChange={change} placeholder="https://..." /></label>
            <label className="full">Yoki rasm yuklang<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} /></label>
            {preview && <div className="full"><img className="form-preview" src={preview} alt="" /></div>}
            <label className="full">Tavsif<textarea name="description" rows="3" value={form.description} onChange={change} placeholder="Sovg‘a haqida qisqacha..." /></label>
            <label className="check full"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Bosh sahifada “Ommabop” sifatida ko‘rsatish</label>
          </div>
          <div className="form-buttons">
            <button type="button" className="btn btn-light" onClick={onClose}>Bekor qilish</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saqlanmoqda...' : 'Saqlash'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function AdminGifts() {
  const { notify } = useApp();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ count: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | gift

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { api.get('/categories/').then((r) => setCategories(list(r))).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/gifts/', { params: { page, page_size: 10, ...(debounced ? { search: debounced } : {}) } })
      .then((r) => { setItems(r.data.results); setMeta({ count: r.data.count, total_pages: r.data.total_pages }); setError(''); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [page, debounced]);
  useEffect(() => { load(); }, [load]);

  const remove = async (g) => {
    if (!confirm(`“${g.name}” sovg‘asini o‘chirmoqchimisiz?`)) return;
    try { await api.delete(`/gifts/${g.id}/`); notify('Sovg‘a o‘chirildi', 'info'); load(); }
    catch (e) { notify(errMsg(e), 'error'); }
  };

  return (
    <>
      <div className="admin-title row">
        <div><h2>Sovg‘alar</h2><p className="muted">Jami: {meta.count}</p></div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> Yangi sovg‘a</button>
      </div>
      <label className="search-box wide"><Search size={18} /><input placeholder="Nomi bo‘yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Sovg‘a</th><th>Kategoriya</th><th>Narx</th><th>Yosh</th><th>Reyting</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="center muted">Yuklanmoqda...</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan="6" className="center muted">Sovg‘alar topilmadi.</td></tr>}
            {!loading && items.map((g) => (
              <tr key={g.id}>
                <td><div className="cell-gift"><div className="thumb"><GiftImage gift={g} /></div><b>{g.name}</b>{g.is_featured && <span className="badge">Ommabop</span>}</div></td>
                <td>{g.category_emoji} {g.category_name}</td>
                <td>{money(g.price)}</td>
                <td>{g.min_age}–{g.max_age}</td>
                <td>{g.avg_rating ? <span className="inline-rate"><Star size={14} fill="currentColor" /> {g.avg_rating} ({g.reviews_count})</span> : '—'}</td>
                <td className="actions">
                  <button className="icon-btn" onClick={() => setEditing(g)} aria-label="Tahrirlash"><Pencil size={15} /></button>
                  <button className="icon-btn danger" onClick={() => remove(g)} aria-label="O‘chirish"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={meta.total_pages} onChange={setPage} />

      {editing && (
        <GiftFormModal
          gift={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
}
