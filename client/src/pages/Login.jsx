import React, { useState } from 'react';
import { api } from '../api.js';
import { useNavigate } from 'react-router-dom';
import logoLight2 from '../assets/logo_light.svg';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [registerSent, setRegisterSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const switchMode = (m) => { setMode(m); setError(''); setForgotSent(false); setRegisterSent(false); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await api.forgotPassword(email);
        setForgotSent(true);
      } else if (mode === 'register') {
        const { error: err } = await api.register(email, password, username, firstName || null, lastName || null);
        if (err) throw err;
        setRegisterSent(true);
      } else {
        const { error: err } = await api.login(email, password);
        if (err) throw err;
        navigate('/overview');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
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

        {mode !== 'forgot' && !registerSent && (
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
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus autoComplete="email" />
                </div>
                <button type="submit" className="btn-primary btn-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
            <button type="button" className="btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => switchMode('login')}>Back to Sign In</button>
          </div>
        ) : registerSent ? (
          <div className="login-form">
            <div className="alert success">Account created! Check your email to confirm your address, then sign in.</div>
            <button type="button" className="btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => switchMode('login')}>Back to Sign In</button>
          </div>
        ) : (
          <form onSubmit={submit} className="login-form">
            {error && <div className="alert error">{error}</div>}
            {mode === 'register' && (
              <>
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
                <div className="field">
                  <label>Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
                </div>
              </>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus={mode === 'login'} autoComplete="email" />
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
