import React, { useState } from 'react';
import { api } from '../api';
import ErrorMessage from '../components/ErrorMessage';

export default function LoginPage({ onLogin, onRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const data = await api.login(form); localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); onLogin(data.user); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  return <div className="auth-page"><form className="auth-card" onSubmit={submit}>
    <div className="brand big"><span className="brand-dot" /> PulseQ</div><p className="muted">Real-time outpatient queue management</p>
    <h1>Sign in</h1><label>Email</label><input type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@example.com" />
    <label>Password</label><input type="password" required value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="••••••••" />
    <ErrorMessage message={error} /><button className="primary wide" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
    <button type="button" className="link-btn" onClick={onRegister}>Create a new account</button>
    <div className="demo-box"><b>Demo accounts</b><br/>Admin: admin@pulseq.com / Password@123<br/>Reception: reception@pulseq.com / Password@123<br/>Doctor: doctor1@pulseq.com / Password@123</div>
  </form></div>;
}
