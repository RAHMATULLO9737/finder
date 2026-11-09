import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Gift as GiftIcon, LogIn } from 'lucide-react';
import { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { user, login } = useAuth();
  const { notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.is_staff ? '/admin' : '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.username, form.password);
      notify(`Xush kelibsiz, ${u.first_name || u.username}!`);
      navigate(location.state?.from || (u.is_staff ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <span className="brand-icon big"><GiftIcon size={28} /></span>
        <h2>Tizimga kirish</h2>
        <p className="muted">Admin ham, oddiy foydalanuvchi ham shu yerdan kiradi.</p>
        {error && <div className="error">{error}</div>}
        <label>Login<input required autoFocus autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Foydalanuvchi nomi" /></label>
        <label>Parol<input required type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" /></label>
        <button className="btn btn-primary full" disabled={busy}><LogIn size={17} /> {busy ? 'Kirilmoqda...' : 'Kirish'}</button>
        <p className="auth-foot">Akkauntingiz yo‘qmi? <Link to="/register" state={location.state}>Ro‘yxatdan o‘ting</Link></p>
      </form>
    </div>
  );
}
