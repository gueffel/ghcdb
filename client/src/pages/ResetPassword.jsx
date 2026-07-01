import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { api } from '../api.js';

export default function ResetPassword() {
  // Read the hash immediately during initial render — before Supabase clears it.
  // The PASSWORD_RECOVERY auth event fires synchronously when Supabase parses the
  // hash, which can happen before our useEffect listener is registered (race condition).
  // Checking the hash here (in the useState initializer) is always early enough.
  const [ready, setReady] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      return params.get('type') === 'recovery';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Secondary path: catch PASSWORD_RECOVERY if it fires after mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
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
      setTimeout(() => navigate('/overview'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo" style={{ fontSize: 48, marginBottom: 12 }}>🏒</div>
        <h1 className="login-title">GHCdb</h1>
        <p className="login-subtitle">Reset your password</p>

        {success ? (
          <div className="login-form">
            <div className="alert success">Password updated! Redirecting…</div>
          </div>
        ) : !ready ? (
          <div className="login-form">
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
              Waiting for reset link… if you arrived here directly, please use the link from your email.
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
