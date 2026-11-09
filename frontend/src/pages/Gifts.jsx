import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api, { errMsg, list } from '../api';
import GiftCard from '../components/GiftCard';
import Pagination from '../components/Pagination';
import { RECIPIENTS, SORTS } from '../utils';

export default function Gifts() {
  const [sp, setSp] = useSearchParams();
  const get = (k) => sp.get(k) || '';
  const [q, setQ] = useState(get('search'));
  const [gifts, setGifts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ count: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const setParam = (key, value) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSp(next, { replace: true });
  };

  // Qidiruv — yozishni to'xtatgandan keyin
  useEffect(() => {
    const t = setTimeout(() => { if (q !== get('search')) setParam('search', q); }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get('/categories/').then((r) => setCategories(list(r))).catch(() => {});
  }, []);

  const query = sp.toString();
  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/gifts/', { params: Object.fromEntries(new URLSearchParams(query)) })
      .then((r) => { setGifts(r.data.results); setMeta({ count: r.data.count, total_pages: r.data.total_pages }); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [query]);

  const hasFilters = ['search', 'category', 'min_price', 'max_price', 'age', 'recipient', 'ordering'].some(get);
  const reset = () => { setQ(''); setSp({}, { replace: true }); };

  return (
    <div className="container page-section">
      <div className="section-heading">
        <div><span className="eyebrow">KATALOG</span><h2>Barcha sovg‘alar</h2>
          <p>O‘zingizga mos sovg‘ani topish uchun filtrlardan foydalaning. Topildi: <b>{meta.count}</b></p></div>
      </div>

      <div className="filter-panel">
        <div className="filter-title"><SlidersHorizontal size={18} /> Filtrlash</div>
        <label className="search-box"><Search size={18} />
          <input placeholder="Sovg‘a qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select value={get('category')} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
        <input type="number" min="0" placeholder="Narxdan" value={get('min_price')} onChange={(e) => setParam('min_price', e.target.value)} />
        <input type="number" min="0" placeholder="Narxgacha" value={get('max_price')} onChange={(e) => setParam('max_price', e.target.value)} />
        <input type="number" min="0" placeholder="Yosh" value={get('age')} onChange={(e) => setParam('age', e.target.value)} />
        <select value={get('recipient') || 'any'} onChange={(e) => setParam('recipient', e.target.value === 'any' ? '' : e.target.value)}>
          {RECIPIENTS.map((r) => <option key={r[0]} value={r[0]}>{r[0] === 'any' ? 'Kim uchun?' : r[1]}</option>)}
        </select>
        <select value={get('ordering')} onChange={(e) => setParam('ordering', e.target.value)}>
          {SORTS.map((s) => <option key={s[0]} value={s[0]}>{s[1]}</option>)}
        </select>
        {hasFilters && <button className="btn btn-light" onClick={reset}><X size={15} /> Tozalash</button>}
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? <div className="empty">Yuklanmoqda...</div> : gifts.length ? (
        <>
          <div className="gift-grid">{gifts.map((g) => <GiftCard key={g.id} gift={g} />)}</div>
          <Pagination page={Number(get('page')) || 1} totalPages={meta.total_pages} onChange={(p) => { setParam('page', String(p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      ) : <div className="empty">Mos sovg‘a topilmadi. Filtrlarni o‘zgartirib ko‘ring.</div>}
    </div>
  );
}
