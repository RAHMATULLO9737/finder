import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import GiftImage from './GiftImage';
import { Stars } from './Stars';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { money, recipientLabel } from '../utils';

export default function GiftCard({ gift }) {
  const { isFavorite, toggleFavorite } = useApp();
  const { add, inCart } = useCart();
  const fav = isFavorite(gift.id);
  return (
    <article className="gift-card">
      <Link to={`/gifts/${gift.id}`} className="gift-media">
        <GiftImage gift={gift} />
        <span className="category-tag">{gift.category_emoji} {gift.category_name}</span>
      </Link>
      <button
        className={'heart' + (fav ? ' active' : '')}
        onClick={() => toggleFavorite(gift.id)}
        aria-label={fav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'}
      >
        <Heart size={19} fill={fav ? 'currentColor' : 'none'} />
      </button>
      <div className="gift-info">
        <div className="gift-title-row">
          <h3><Link to={`/gifts/${gift.id}`}>{gift.name}</Link></h3>
          <strong>{money(gift.price)}</strong>
        </div>
        <p>{gift.description || 'Yaqinlaringiz uchun ajoyib sovg‘a tanlovi.'}</p>
        <div className="rating-row">
          <Stars value={gift.avg_rating || 0} size={14} />
          <small>{gift.avg_rating ? `${gift.avg_rating} (${gift.reviews_count})` : 'Hali baholanmagan'}</small>
        </div>
        <div className="gift-meta">
          <span>🎂 {gift.min_age}–{gift.max_age} yosh</span>
          <span>👤 {recipientLabel(gift.recipient)}</span>
        </div>
        <button className={'btn full add-cart ' + (inCart(gift.id) ? 'btn-light' : 'btn-primary')} onClick={() => add(gift)}>
          <ShoppingCart size={16} /> {inCart(gift.id) ? 'Savatda — yana qo‘shish' : 'Savatga qo‘shish'}
        </button>
      </div>
    </article>
  );
}
