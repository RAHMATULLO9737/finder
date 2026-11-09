import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Gift as GiftIcon, Heart, LayoutDashboard, LogOut, Menu, Moon, Package, ShoppingCart, Sparkles, Sun, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, favorites, notify } = useApp();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    notify('Tizimdan chiqdingiz', 'info');
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand" onClick={() => setMenu(false)}>
          <span className="brand-icon"><GiftIcon size={22} /></span> gift<span>finder</span>
        </Link>

        <nav className={'nav' + (menu ? ' open' : '')} onClick={() => setMenu(false)}>
          <NavLink to="/" end>Bosh sahifa</NavLink>
          <NavLink to="/gifts">Sovg‘alar</NavLink>
          <NavLink to="/finder"><Sparkles size={14} /> Sovg‘a topuvchi</NavLink>
          {user && <NavLink to="/favorites">Sevimlilar <b className="count">{favorites.length}</b></NavLink>}
        </nav>

        <div className="header-actions">
          <Link to="/cart" className="icon-btn cart-btn" aria-label="Savat">
            <ShoppingCart size={18} />
            {count > 0 && <b className="cart-count">{count}</b>}
          </Link>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="user-menu" ref={box}>
              <button className="user-btn" onClick={() => setOpen(!open)}>
                <span className="avatar">{user.username[0].toUpperCase()}</span>
                <span className="user-name">{user.first_name || user.username}</span>
                {isAdmin && <span className="badge admin">Admin</span>}
              </button>
              {open && (
                <div className="dropdown" onClick={() => setOpen(false)}>
                  <Link to="/profile"><User size={16} /> Profilim</Link>
                  <Link to="/orders"><Package size={16} /> Buyurtmalarim</Link>
                  <Link to="/favorites"><Heart size={16} /> Sevimlilar</Link>
                  {isAdmin && <Link to="/admin"><LayoutDashboard size={16} /> Admin panel</Link>}
                  <button onClick={handleLogout}><LogOut size={16} /> Chiqish</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link className="btn btn-ghost" to="/login">Kirish</Link>
              <Link className="btn btn-primary" to="/register">Ro‘yxatdan o‘tish</Link>
            </div>
          )}

          <button className="icon-btn burger" onClick={() => setMenu(!menu)} aria-label="Menyu">
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
