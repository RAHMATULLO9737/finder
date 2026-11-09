import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Sparkles, Heart, Star } from 'lucide-react';
import api, { errMsg, list } from '../api';
import GiftCard from '../components/GiftCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [f, c, all] = await Promise.all([
          api.get('/gifts/', { params: { featured: 1, page_size: 6 } }),
          api.get('/categories/'),
          api.get('/gifts/', { params: { page_size: 1 } }),
        ]);
        let items = list(f);
        if (!items.length) items = list(await api.get('/gifts/', { params: { page_size: 6 } }));
        setFeatured(items);
        setCategories(list(c));
        setTotal(all.data.count);
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow light"><Sparkles size={15} /> SOVG‘A TANLASHNI OSONLASHTIRING</span>
          <h1>Har bir inson uchun<br /><em>mukammal sovg‘a.</em></h1>
          <p>Kim uchun, qaysi yoshda va qancha byudjet bilan — bir necha qadamda eng mos sovg‘ani toping.</p>
          <div className="hero-actions">
            <Link className="btn-white" to="/finder">Sovg‘a topish <ArrowRight size={16} /></Link>
            <Link className="hero-link" to="/gifts">Katalogni ko‘rish</Link>
          </div>
          <div className="hero-stats">
            <div><b>{total}+</b><span>Sovg‘a g‘oyalari</span></div>
            <div><b>{categories.length}</b><span>Kategoriyalar</span></div>
            <div><b>5 ★</b><span>Sharh va baholar</span></div>
          </div>
        </div>
        <div className="hero-art">
          <div className="orb"></div>
          <div className="gift-emoji">🎁</div>
          <div className="floating-note note-one">✨ Eng yaxshi tanlov</div>
          <div className="floating-note note-two">💜 Mehr bilan tanlang</div>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      {categories.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div><span className="eyebrow">KATEGORIYALAR</span><h2>Nimani qidiryapsiz?</h2></div>
            <Link className="see-all" to="/gifts">Barchasi →</Link>
          </div>
          <div className="category-grid">
            {categories.map((c) => (
              <Link key={c.id} to={`/gifts?category=${c.id}`} className="category-card">
                <span className="cat-emoji">{c.emoji}</span>
                <b>{c.name}</b>
                <small>{c.gifts_count} ta sovg‘a</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-heading">
          <div><span className="eyebrow">SIZ UCHUN</span><h2>Ommabop sovg‘alar</h2><p>Eng yaxshi sovg‘a g‘oyalari bir joyda.</p></div>
          <Link className="see-all" to="/gifts">Barchasini ko‘rish →</Link>
        </div>
        {loading ? <div className="empty">Yuklanmoqda...</div> : featured.length ? (
          <div className="gift-grid">{featured.map((g) => <GiftCard key={g.id} gift={g} />)}</div>
        ) : <div className="empty">Hozircha sovg‘alar yo‘q.</div>}
      </section>

      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">QANDAY ISHLAYDI</span><h2>3 qadamda sovg‘a toping</h2></div></div>
        <div className="steps">
          <div className="step"><span className="step-icon"><Search size={22} /></span><b>1. Tanlang</b><p>Kim uchun, yoshi va byudjetni ko‘rsating.</p></div>
          <div className="step"><span className="step-icon"><Star size={22} /></span><b>2. Solishtiring</b><p>Reyting va sharhlarga qarab eng yaxshisini tanlang.</p></div>
          <div className="step"><span className="step-icon"><Heart size={22} /></span><b>3. Saqlang</b><p>Yoqqanlarini sevimlilarga qo‘shib, keyin qaytib keling.</p></div>
        </div>
      </section>

      <section className="cta-banner">
        <div><h2>Qaysi sovg‘ani tanlashni bilmayapsizmi?</h2><p>Bizning “Sovg‘a topuvchi” sizga bir necha savol berib, eng mosini tavsiya qiladi.</p></div>
        <Link className="btn-white" to="/finder">Boshlash <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
