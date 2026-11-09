import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Trash2, Zap } from 'lucide-react';
import api, { errMsg, list } from '../api';
import GiftCard from '../components/GiftCard';
import GiftImage from '../components/GiftImage';
import { StarInput, Stars } from '../components/Stars';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { formatDate, money, recipientLabel } from '../utils';

export default function GiftDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { isFavorite, toggleFavorite, notify } = useApp();
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [gift, setGift] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const loadReviews = useCallback(async () => {
    const [g, r] = await Promise.all([api.get(`/gifts/${id}/`), api.get('/reviews/', { params: { gift: id } })]);
    setGift(g.data);
    setReviews(list(r));
    return g.data;
  }, [id]);

  useEffect(() => {
    setGift(null);
    setError('');
    setQty(1);
    loadReviews()
      .then((g) => api.get('/gifts/', { params: { category: g.category, page_size: 5 } }))
      .then((r) => setSimilar(list(r).filter((x) => String(x.id) !== String(id)).slice(0, 4)))
      .catch((e) => setError(e.response?.status === 404 ? 'Bunday sovg‘a topilmadi.' : errMsg(e)));
    window.scrollTo({ top: 0 });
  }, [id, loadReviews]);

  // Foydalanuvchining o'z sharhi bo'lsa — formaga joylaymiz
  useEffect(() => {
    const mine = reviews.find((r) => r.user === user?.id);
    if (mine) { setRating(mine.rating); setComment(mine.comment); }
  }, [reviews, user]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/reviews/', { gift: Number(id), rating, comment });
      await loadReviews();
      notify('Sharhingiz saqlandi');
    } catch (err) {
      notify(errMsg(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const removeReview = async (rid) => {
    if (!confirm('Sharhni o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/reviews/${rid}/`);
      setComment('');
      setRating(5);
      await loadReviews();
      notify('Sharh o‘chirildi', 'info');
    } catch (err) {
      notify(errMsg(err), 'error');
    }
  };

  if (error) return <div className="container page-section"><div className="error">{error}</div><Link to="/gifts" className="btn btn-light">← Katalogga qaytish</Link></div>;
  if (!gift) return <div className="container page-section"><div className="empty">Yuklanmoqda...</div></div>;

  const fav = isFavorite(gift.id);
  return (
    <div className="container page-section">
      <Link to="/gifts" className="back-link"><ArrowLeft size={16} /> Katalogga qaytish</Link>

      <div className="detail">
        <div className="detail-media"><GiftImage gift={gift} /></div>
        <div className="detail-info">
          <span className="eyebrow">{gift.category_emoji} {gift.category_name.toUpperCase()}</span>
          <h1>{gift.name}</h1>
          <div className="rating-row big">
            <Stars value={gift.avg_rating || 0} size={18} />
            <span>{gift.avg_rating ? `${gift.avg_rating} · ${gift.reviews_count} ta sharh` : 'Hali baholanmagan'}</span>
          </div>
          <div className="detail-price">{money(gift.price)}</div>
          <p className="detail-desc">{gift.description || 'Yaqinlaringiz uchun ajoyib sovg‘a tanlovi.'}</p>
          <div className="detail-tags">
            <span>🎂 {gift.min_age}–{gift.max_age} yosh</span>
            <span>👤 {recipientLabel(gift.recipient)}</span>
          </div>
          <div className="buy-box">
            <div className="qty">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kamaytirish"><Minus size={16} /></button>
              <b>{qty}</b>
              <button type="button" onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Ko‘paytirish"><Plus size={16} /></button>
            </div>
            <div className="buy-total">Jami: <b>{money(Number(gift.price) * qty)}</b></div>
          </div>
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={() => { add(gift, qty, { silent: true }); navigate('/checkout'); }}>
              <Zap size={17} /> Hoziroq buyurtma berish
            </button>
            <button className="btn btn-light" onClick={() => add(gift, qty)}>
              <ShoppingCart size={17} /> Savatga qo‘shish
            </button>
            <button className={'btn ' + (fav ? 'btn-danger-soft' : 'btn-ghost bordered')} onClick={() => toggleFavorite(gift.id)}>
              <Heart size={17} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga'}
            </button>
          </div>
        </div>
      </div>

      <section className="reviews">
        <div className="section-heading"><div><span className="eyebrow">FIKRLAR</span><h2>Sharhlar ({reviews.length})</h2></div></div>
        <div className="reviews-grid">
          <div className="review-list">
            {reviews.length === 0 && <div className="empty">Hozircha sharhlar yo‘q. Birinchi bo‘lib baho bering!</div>}
            {reviews.map((r) => (
              <div className="review" key={r.id}>
                <div className="review-head">
                  <span className="avatar">{r.user_name[0].toUpperCase()}</span>
                  <div><b>{r.user_name}</b><small>{formatDate(r.created_at)}</small></div>
                  <Stars value={r.rating} size={14} />
                  {(isAdmin || r.user === user?.id) && (
                    <button className="icon-btn danger" onClick={() => removeReview(r.id)} aria-label="O‘chirish"><Trash2 size={15} /></button>
                  )}
                </div>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>

          <div className="review-form-card">
            <h3>Fikringizni qoldiring</h3>
            {user ? (
              <form onSubmit={submitReview}>
                <StarInput value={rating} onChange={setRating} />
                <textarea rows="4" placeholder="Sovg‘a haqida fikringiz (ixtiyoriy)" value={comment} onChange={(e) => setComment(e.target.value)} />
                <button className="btn btn-primary" disabled={sending}>{sending ? 'Yuborilmoqda...' : 'Yuborish'}</button>
              </form>
            ) : (
              <p className="muted">Sharh qoldirish uchun <Link to="/login" state={{ from: `/gifts/${id}` }}>tizimga kiring</Link>.</p>
            )}
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section">
          <div className="section-heading"><div><span className="eyebrow">YANA</span><h2>O‘xshash sovg‘alar</h2></div></div>
          <div className="gift-grid four">{similar.map((g) => <GiftCard key={g.id} gift={g} />)}</div>
        </section>
      )}
    </div>
  );
}
