import React, { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { useNavigate, Link } from 'react-router-dom';
import logoLight2 from '../assets/logo_light.svg';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const switchMode = (m) => { setMode(m); setError(''); setForgotSent(false); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await api.forgotPassword(forgotEmail);
        setForgotSent(true);
      } else {
        let data;
        if (mode === 'login') {
          data = await api.login(username, password);
        } else {
          data = await api.register(username, password, firstName || null, lastName || null, email);
        }
        login(data.token, data.username, data.is_admin, data.first_name || null);
        navigate('/overview');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logoLight2} alt="GHCdb" className="login-logo" />
        <p className="login-subtitle">Track your collection</p>
        <p className="login-desc">Log every card in your hockey card collection, track what you own vs. what you're still hunting for, and see stats on your progress — by team, year, and set.</p>

        <Link to="/how-it-works" className="hiw-login-link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" />
          </svg>
          See how it works
        </Link>

        {mode !== 'forgot' && (
          <div className="tab-row">
            <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
            <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Register</button>
          </div>
        )}

        {mode === 'forgot' ? (
          <div className="login-form">
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Enter your email address and we'll send you a reset link.</p>
            {forgotSent ? (
              <div className="alert success">If that email is registered, a reset link has been sent.</div>
            ) : (
              <form onSubmit={submit}>
                {error && <div className="alert error">{error}</div>}
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus autoComplete="email" />
                </div>
                <button type="submit" className="btn-primary btn-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
            <button type="button" className="btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => switchMode('login')}>Back to Sign In</button>
          </div>
        ) : (
          <form onSubmit={submit} className="login-form">
            {error && <div className="alert error">{error}</div>}
            {mode === 'register' && (
              <div className="field-row">
                <div className="field">
                  <label>First Name <span className="field-optional">(optional)</span></label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div className="field">
                  <label>Last Name <span className="field-optional">(optional)</span></label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>
            )}
            {mode === 'register' && (
              <div className="field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
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
            {mode === 'login' && (
              <button type="button" className="btn-ghost btn-full" style={{ marginTop: 6 }} onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
