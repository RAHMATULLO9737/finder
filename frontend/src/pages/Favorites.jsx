import { Link } from 'react-router-dom';
import GiftCard from '../components/GiftCard';
import { useApp } from '../context/AppContext';

export default function Favorites() {
  const { favorites } = useApp();
  return (
    <div className="container page-section">
      <div className="section-heading"><div><span className="eyebrow">SAQLANGANLAR</span><h2>Sevimli sovg‘alar ❤️</h2>
        <p>Keyinroq ko‘rish uchun saqlagan sovg‘alaringiz.</p></div></div>
      {favorites.length ? (
        <div className="gift-grid">{favorites.map((f) => <GiftCard key={f.id} gift={f.gift_details} />)}</div>
      ) : (
        <div className="empty">Hozircha sevimli sovg‘alar yo‘q. <Link to="/gifts">Katalogdan</Link> yurak belgisini bosing.</div>
      )}
    </div>
  );
}
