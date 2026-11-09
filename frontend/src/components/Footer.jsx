import { Link } from 'react-router-dom';
import { Gift as GiftIcon } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="brand"><span className="brand-icon"><GiftIcon size={20} /></span> gift<span>finder</span></Link>
        <p>Yaxshi sovg‘a — unutilmas taassurot. 💜</p>
        <small>© {new Date().getFullYear()} Gift Finder</small>
      </div>
    </footer>
  );
}
