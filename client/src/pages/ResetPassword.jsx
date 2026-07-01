import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { api } from '../api.js';
import logoLight2 from '../assets/logo_light.svg';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase processes the recovery token before this component mounts and clears the
    // URL hash, so we can't detect the flow from the URL. Instead, check whether a
    // session already exists (recovery link establishes one) and listen for late events
    // (PKCE code exchange, which completes asynchronously after mount).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setReady(true);
      setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await api.resetPassword(password);
      if (err) throw err;
      setSuccess(true);
      setTimeout(async () => { await supabase.auth.signOut(); navigate('/login'); }, 1500);
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
        <p className="login-subtitle">Reset your password</p>

        {checking ? (
          <div className="login-form" style={{ alignItems: 'center' }}>
            <div className="spinner" />
          </div>
        ) : success ? (
          <div className="login-form">
            <div className="alert success">Password updated! Taking you to sign in…</div>
          </div>
        ) : !ready ? (
          <div className="login-form">
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
              This link has expired or is invalid. Please request a new reset link.
            </p>
            <Link to="/login" className="btn-ghost btn-full" style={{ marginTop: 12, display: 'block', textAlign: 'center' }}>Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="login-form">
            {error && <div className="alert error">{error}</div>}
            <div className="field">
              <label>New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus autoComplete="new-password" />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
