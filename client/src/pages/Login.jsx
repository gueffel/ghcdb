import React, { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api.login(username, password);
      } else {
        data = await api.register(username, password, firstName || null, lastName || null, email || null);
      }
      login(data.token, data.username, data.is_admin, data.first_name || null);
      navigate('/overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏒</div>
        <h1 className="login-title">GHCdb</h1>
        <p className="login-subtitle">Track your collection</p>

        <div className="tab-row">
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Register</button>
        </div>

        <form onSubmit={submit} className="login-form">
          {error && <div className="alert error">{error}</div>}
          {mode === 'register' && (
            <div className="field-row">
              <div className="field">
                <label>First Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
              </div>
              <div className="field">
                <label>Last Name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
              </div>
            </div>
          )}
          {mode === 'register' && (
            <div className="field">
              <label>Email <span className="field-optional">(optional)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
          )}
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} autoFocus required autoComplete="username" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
