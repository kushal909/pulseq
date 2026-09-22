import React, { useState } from 'react';
import { api } from '../api';
import ErrorMessage from '../components/ErrorMessage';

export default function RegisterPage({ onLogin, onBack }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'receptionist', hospitalName:'', address:'', hospitalId:'' });
  const [error, setError] = useState(''); const [loading,setLoading]=useState(false);
  const update = e => setForm({...form,[e.target.name]:e.target.value});
  const submit = async e => { e.preventDefault(); setError(''); setLoading(true); try { const d=await api.register(form); localStorage.setItem('token',d.token); localStorage.setItem('user',JSON.stringify(d.user)); onLogin(d.user); } catch(err){setError(err.message)} finally{setLoading(false)} };
  return <div className="auth-page"><form className="auth-card" onSubmit={submit}><div className="brand big"><span className="brand-dot"/> PulseQ</div><h1>Create account</h1>
    <label>Name</label><input name="name" required value={form.name} onChange={update}/><label>Email</label><input name="email" type="email" required value={form.email} onChange={update}/><label>Password</label><input name="password" type="password" minLength="6" required value={form.password} onChange={update}/>
    <label>Role</label><select name="role" value={form.role} onChange={update}><option value="receptionist">Receptionist</option><option value="admin">Admin</option></select>
    {form.role==='admin' ? <><label>Hospital name</label><input name="hospitalName" required value={form.hospitalName} onChange={update}/><label>Address</label><input name="address" value={form.address} onChange={update}/></> : <><label>Hospital ID</label><input name="hospitalId" required value={form.hospitalId} onChange={update} placeholder="Paste hospital ObjectId"/></>}
    <ErrorMessage message={error}/><button className="primary wide" disabled={loading}>{loading?'Creating...':'Create account'}</button><button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
  </form></div>;
}
