import React, { useState } from 'react';
import { api } from '../api.js';
import { supabase } from '../lib/supabase.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logoLight2 from '../assets/logo_light.svg';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('register') ? 'register' : 'login');
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

  const signInWithProvider = async (provider) => {
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
  };

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
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <div className="login-form">
            <div className="oauth-buttons">
              <button type="button" className="btn-oauth" onClick={() => signInWithProvider('google')}>
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
              <button type="button" className="btn-oauth" onClick={() => signInWithProvider('discord')}>
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2"/></svg>
                Continue with Discord
              </button>
            </div>

            <div className="oauth-divider"><span>or</span></div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
