import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user, isAdmin, setUser, saveSession } = useAuth();
  const { notify, favorites } = useApp();
  const [info, setInfo] = useState({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '' });
  const [pw, setPw] = useState({ old_password: '', new_password: '' });

  const saveInfo = async (e) => {
    e.preventDefault();
    try {
      setUser((await api.patch('/auth/me/', info)).data);
      notify('Ma’lumotlar saqlandi');
    } catch (err) { notify(errMsg(err), 'error'); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      saveSession((await api.post('/auth/password/', pw)).data);
      setPw({ old_password: '', new_password: '' });
      notify('Parol o‘zgartirildi');
    } catch (err) { notify(errMsg(err), 'error'); }
  };

  return (
    <div className="container page-section narrow">
      <div className="profile-head">
        <span className="avatar big">{user.username[0].toUpperCase()}</span>
        <div>
          <h2>{user.first_name || user.username} {isAdmin && <span className="badge admin">Admin</span>}</h2>
          <p className="muted">@{user.username} · Sevimlilar: {favorites.length}</p>
        </div>
        {isAdmin && <Link className="btn btn-primary" to="/admin">Admin panel</Link>}
      </div>

      <form className="form-card" onSubmit={saveInfo}>
        <h3>Shaxsiy ma’lumotlar</h3>
        <div className="form-grid">
          <label>Ism<input value={info.first_name} onChange={(e) => setInfo({ ...info, first_name: e.target.value })} /></label>
          <label>Familiya<input value={info.last_name} onChange={(e) => setInfo({ ...info, last_name: e.target.value })} /></label>
          <label className="full">Email<input type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} /></label>
        </div>
        <div className="form-buttons"><button className="btn btn-primary">Saqlash</button></div>
      </form>

      <form className="form-card" onSubmit={savePassword}>
        <h3>Parolni o‘zgartirish</h3>
        <div className="form-grid">
          <label>Eski parol<input required type="password" value={pw.old_password} onChange={(e) => setPw({ ...pw, old_password: e.target.value })} /></label>
          <label>Yangi parol<input required minLength="6" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></label>
        </div>
        <div className="form-buttons"><button className="btn btn-primary">O‘zgartirish</button></div>
      </form>
    </div>
  );
}
