import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function BugReport() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.submitBug(form.title, form.description);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Report a Bug</h1>
        <div className="settings-card">
          <div className="import-success" style={{ padding: 0 }}>
            <div className="success-icon">✓</div>
            <h2>Bug Report Submitted</h2>
            <p>Thanks for the report! We'll investigate and get back to you.</p>
            <div className="form-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
              <button className="btn-primary" onClick={() => { setDone(false); setForm({ title: '', description: '' }); }}>
                Submit Another
              </button>
              <button className="btn-ghost" onClick={() => navigate('/overview')}>Back to Overview</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Report a Bug</h1>
      <div className="settings-card">
        <h2 className="settings-section-title">Submit a Bug Report</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Found something broken? Describe the issue and we'll get it fixed.
        </p>
        <form onSubmit={submit} className="settings-form" style={{ marginTop: 8 }}>
          <div className="field">
            <label>Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Short summary of the issue"
              required
              maxLength={200}
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what happened, what you expected, and steps to reproduce…"
              rows={6}
              required
              maxLength={5000}
            />
          </div>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Bug Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
