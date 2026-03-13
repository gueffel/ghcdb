import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

function BugStatusBadge({ status }) {
  return <span className={`bug-status ${status}`}>{status}</span>;
}

function BugItem({ bug, onExpand, expanded, detail, loadingDetail }) {
  const date = new Date(bug.created_at).toLocaleDateString();
  return (
    <div className="bug-item">
      <div className="bug-item-header" onClick={() => onExpand(bug.id)}>
        <BugStatusBadge status={bug.status} />
        <span className="bug-item-title">{bug.title}</span>
        <span className="bug-item-meta">
          {bug.reply_count > 0 && <span style={{ marginRight: 10, color: 'var(--accent)' }}>💬 {bug.reply_count}</span>}
          {date}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="bug-item-body">
          {loadingDetail ? (
            <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : detail ? (
            <>
              <p className="bug-item-desc">{detail.description}</p>
              {detail.replies?.length > 0 && (
                <div className="bug-replies">
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Admin Replies</div>
                  {detail.replies.map(r => (
                    <div key={r.id} className="bug-reply">
                      <div className="bug-reply-header">
                        <span className="bug-reply-admin">{r.admin_username}</span>
                        <span className="bug-reply-date">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <p className="bug-reply-text">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
              {(!detail.replies || detail.replies.length === 0) && (
                <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>No replies yet.</p>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' });
  const [profileStatus, setProfileStatus] = useState(null); // { type: 'success'|'error', msg }

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordStatus, setPasswordStatus] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Bug reports
  const [bugs, setBugs] = useState([]);
  const [bugsLoading, setBugsLoading] = useState(true);
  const [expandedBugId, setExpandedBugId] = useState(null);
  const [bugDetails, setBugDetails] = useState({}); // id → full detail object
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  useEffect(() => {
    api.me().then(u => setProfile({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
    }));
    api.getMyBugs().then(setBugs).finally(() => setBugsLoading(false));
  }, []);

  const toggleBug = async (id) => {
    if (expandedBugId === id) { setExpandedBugId(null); return; }
    setExpandedBugId(id);
    if (bugDetails[id]) return;
    setLoadingDetailId(id);
    try {
      const detail = await api.getBug(id);
      setBugDetails(prev => ({ ...prev, [id]: detail }));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileStatus(null);
    setProfileLoading(true);
    try {
      const res = await api.updateProfile({
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        email: profile.email || null,
      });
      // Update token so greeting refreshes on next load
      if (res.token) localStorage.setItem('token', res.token);
      updateUser({ first_name: res.first_name || null });
      setProfileStatus({ type: 'success', msg: 'Profile updated.' });
    } catch (err) {
      setProfileStatus({ type: 'error', msg: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    setPasswordLoading(true);
    try {
      await api.updateProfile({
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        email: profile.email || null,
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordStatus({ type: 'success', msg: 'Password changed successfully.' });
    } catch (err) {
      setPasswordStatus({ type: 'error', msg: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Account Settings</h1>

      <div className="settings-grid">
        {/* Profile section */}
        <div className="settings-card">
          <h2 className="settings-section-title">Profile</h2>
          <p className="settings-section-sub">Logged in as <strong>{user?.username}</strong></p>
          <form onSubmit={saveProfile} className="settings-form">
            <div className="field-row">
              <div className="field">
                <label>First Name <span className="field-optional">(optional)</span></label>
                <input
                  value={profile.first_name}
                  onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                  autoComplete="given-name"
                  placeholder="First name"
                />
              </div>
              <div className="field">
                <label>Last Name <span className="field-optional">(optional)</span></label>
                <input
                  value={profile.last_name}
                  onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                  autoComplete="family-name"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                placeholder="your@email.com"
                required
              />
            </div>
            {profileStatus && (
              <div className={`alert ${profileStatus.type}`}>{profileStatus.msg}</div>
            )}
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Password section */}
        <div className="settings-card">
          <h2 className="settings-section-title">Change Password</h2>
          <p className="settings-section-sub">Leave blank if you don't want to change your password.</p>
          <form onSubmit={savePassword} className="settings-form">
            <div className="field">
              <label>Current Password</label>
              <input
                type="password"
                value={passwords.current_password}
                onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.new_password}
                onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm_password}
                onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))}
                autoComplete="new-password"
                required
              />
            </div>
            {passwordStatus && (
              <div className={`alert ${passwordStatus.type}`}>{passwordStatus.msg}</div>
            )}
            <button type="submit" className="btn-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* My Bug Reports */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>My Bug Reports</h2>
          <Link to="/report-bug" className="btn-primary" style={{ textDecoration: 'none', padding: '7px 16px', fontSize: 13 }}>
            + New Report
          </Link>
        </div>
        {bugsLoading ? (
          <div className="page-loading">Loading…</div>
        ) : bugs.length === 0 ? (
          <div className="bug-empty">
            No bug reports yet.{' '}
            <Link to="/report-bug" style={{ color: 'var(--accent)' }}>Submit one</Link> if you find something broken.
          </div>
        ) : (
          <div className="bug-list">
            {bugs.map(bug => (
              <BugItem
                key={bug.id}
                bug={bug}
                expanded={expandedBugId === bug.id}
                detail={bugDetails[bug.id]}
                loadingDetail={loadingDetailId === bug.id}
                onExpand={toggleBug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
