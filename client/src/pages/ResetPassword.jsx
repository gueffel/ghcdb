import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">🏒</div>
          <h1 className="login-title">GHCdb</h1>
          <div className="alert error">Invalid reset link.</div>
          <Link to="/login" className="btn-ghost btn-full" style={{ marginTop: 10, display: 'block', textAlign: 'center' }}>Back to Sign In</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
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
        <p className="login-subtitle">Reset your password</p>

        {success ? (
          <div className="login-form">
            <div className="alert success">Password updated successfully!</div>
            <Link to="/login" className="btn-primary btn-full" style={{ marginTop: 10, display: 'block', textAlign: 'center' }}>Sign In</Link>
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
