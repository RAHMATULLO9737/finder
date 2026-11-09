import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Gift as GiftIcon, UserPlus } from 'lucide-react';
import { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Register() {
  const { user, register } = useAuth();
  const { notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ first_name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Parollar bir xil emas.'); return; }
    setBusy(true);
    setError('');
    try {
      const { confirm, ...data } = form;
      const u = await register(data);
      notify(`Xush kelibsiz, ${u.first_name || u.username}! 🎉`);
      navigate(location.state?.from || '/', { replace: true });
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
        <h2>Ro‘yxatdan o‘tish</h2>
        <p className="muted">Sevimlilar va sharhlar uchun akkaunt yarating.</p>
        {error && <div className="error">{error}</div>}
        <label>Ismingiz<input name="first_name" value={form.first_name} onChange={change} placeholder="Masalan, Ali" /></label>
        <label>Login *<input required name="username" autoComplete="username" value={form.username} onChange={change} placeholder="Foydalanuvchi nomi" /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={change} placeholder="ali@example.com" /></label>
        <label>Parol * (kamida 6 belgi)<input required minLength="6" name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} /></label>
        <label>Parolni takrorlang *<input required name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={change} /></label>
        <button className="btn btn-primary full" disabled={busy}><UserPlus size={17} /> {busy ? 'Yaratilmoqda...' : 'Ro‘yxatdan o‘tish'}</button>
        <p className="auth-foot">Akkauntingiz bormi? <Link to="/login" state={location.state}>Kirish</Link></p>
      </form>
    </div>
  );
}
