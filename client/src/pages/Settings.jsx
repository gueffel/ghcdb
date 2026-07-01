import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { supabase } from '../lib/supabase.js';
import { useHints } from '../context/HintsContext.jsx';

function BugStatusBadge({ status }) {
  return <span className={`bug-status bug-status--${status}`}>{status}</span>;
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
  const { user, profile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const isOAuthUser = user?.app_metadata?.provider && user.app_metadata.provider !== 'email';
  const hintsCtx = useHints();

  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '' });
  const [profileStatus, setProfileStatus] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteModalClosing, setDeleteModalClosing] = useState(false);

  const openDeleteModal = () => { setDeleteConfirm(''); setDeleteError(null); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setDeleteModalClosing(true); setTimeout(() => { setShowDeleteModal(false); setDeleteModalClosing(false); }, 180); };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'delete') return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const { error } = await api.deleteAccount();
      if (error) throw error;
      await logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong. Please try again.');
      setDeleteLoading(false);
    }
  };

  const [bugs, setBugs] = useState([]);
  const [bugsLoading, setBugsLoading] = useState(true);
  const [expandedBugId, setExpandedBugId] = useState(null);
  const [bugDetails, setBugDetails] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  useEffect(() => {
    if (profile) {
      setProfileForm({ first_name: profile.first_name || '', last_name: profile.last_name || '' });
    }
    api.getMyBugs().then(setBugs).finally(() => setBugsLoading(false));
  }, [profile]);

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
      await api.updateProfile({ first_name: profileForm.first_name || null, last_name: profileForm.last_name || null });
      updateProfile({ first_name: profileForm.first_name || null, last_name: profileForm.last_name || null });
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
    <>
    <div className="page page-mid">
      <h1 className="page-title">Settings</h1>

      <div className="settings-stack">
        <div className="settings-top-row">
          <div className="settings-section">
            <div className="settings-eyebrow">Your account</div>
            <h2 className="settings-section-h2">Profile</h2>
            <div className="settings-card">
              <p className="settings-section-sub" style={{ marginTop: 0 }}>{user?.email}</p>
              <form onSubmit={saveProfile} className="settings-form">
                <div className="field-row">
                  <div className="field">
                    <label>First Name <span className="field-optional">(optional)</span></label>
                    <input value={profileForm.first_name} onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))} autoComplete="given-name" placeholder="First name" />
                  </div>
                  <div className="field">
                    <label>Last Name <span className="field-optional">(optional)</span></label>
                    <input value={profileForm.last_name} onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))} autoComplete="family-name" placeholder="Last name" />
                  </div>
                </div>
                {profileStatus && <div className={`alert ${profileStatus.type}`}>{profileStatus.msg}</div>}
                <button type="submit" className="btn-primary" disabled={profileLoading}>
                  {profileLoading ? 'Saving…' : 'Save Profile'}
                </button>
              </form>
            </div>
          </div>

          {!isOAuthUser && (
            <div className="settings-section">
              <div className="settings-eyebrow">Security</div>
              <h2 className="settings-section-h2">Change Password</h2>
              <div className="settings-card">
                <form onSubmit={savePassword} className="settings-form">
                  <div className="field">
                    <label>Current Password</label>
                    <input type="password" value={passwords.current_password} onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))} autoComplete="current-password" required />
                  </div>
                  <div className="field">
                    <label>New Password</label>
                    <input type="password" value={passwords.new_password} onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))} autoComplete="new-password" required minLength={6} />
                  </div>
                  <div className="field">
                    <label>Confirm New Password</label>
                    <input type="password" value={passwords.confirm_password} onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))} autoComplete="new-password" required />
                  </div>
                  {passwordStatus && <div className={`alert ${passwordStatus.type}`}>{passwordStatus.msg}</div>}
                  <button type="submit" className="btn-primary" disabled={passwordLoading}>
                    {passwordLoading ? 'Saving…' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {hintsCtx?.loaded && (
          <div className="settings-section">
          <div className="settings-eyebrow">Preferences</div>
          <h2 className="settings-section-h2">Feature Tips</h2>
          <div className="settings-section-body">
            <p className="settings-section-sub" style={{ marginTop: 0 }}>Guided tip bubbles that appear the first time you visit each section. They explain key features without getting in the way.</p>
            <div className="settings-row">
              {hintsCtx.hintsEnabled ? (
                <>
                  <span className="settings-status">Tips are active.</span>
                  <button className="btn-ghost" onClick={() => hintsCtx.setEnabled(false)}>Turn off tips</button>
                </>
              ) : (
                <>
                  <span className="settings-status">Tips are turned off.</span>
                  <button className="btn-primary" onClick={() => hintsCtx.reset()}>Restart the tour</button>
                </>
              )}
            </div>
          </div>
          </div>
        )}

        <div className="settings-section">
          <div className="settings-eyebrow">Support</div>
          <div className="settings-section-h2-row">
            <h2 className="settings-section-h2">Bug Reports</h2>
            <Link to="/report-bug" className="btn-primary" style={{ textDecoration: 'none', fontSize: 13, padding: '7px 14px' }}>+ New Report</Link>
          </div>
          <div className="settings-section-body">
          {bugsLoading ? (
            <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : bugs.length === 0 ? (
            <p className="settings-section-sub" style={{ marginTop: 0 }}>
              No bug reports yet. <Link to="/report-bug" style={{ color: 'var(--accent)' }}>Submit one</Link> if you find something broken.
            </p>
          ) : (
            <div className="bug-list" style={{ maxWidth: 'none' }}>
              {bugs.map(bug => (
                <BugItem key={bug.id} bug={bug} expanded={expandedBugId === bug.id} detail={bugDetails[bug.id]} loadingDetail={loadingDetailId === bug.id} onExpand={toggleBug} />
              ))}
            </div>
          )}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-eyebrow">Danger zone</div>
          <h2 className="settings-section-h2">Delete Account</h2>
          <div className="settings-section-body">
            <p className="settings-section-sub" style={{ marginTop: 0 }}>Permanently remove your account and all collection data. This cannot be undone.</p>
            <button className="btn-danger" style={{ alignSelf: 'flex-start' }} onClick={openDeleteModal}>Delete my account</button>
          </div>
        </div>
      </div>
    </div>

    {showDeleteModal && (
      <div className={`modal-overlay${deleteModalClosing ? ' closing' : ''}`} onClick={closeDeleteModal}>
        <div className="modal serial-prompt-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ color: 'var(--red)' }}>Delete Account</h2>
            <button className="modal-close" onClick={closeDeleteModal}>✕</button>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              This will <strong style={{ color: 'var(--text)' }}>permanently delete your account and all your card data</strong>. There is no way to recover it.
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              If you want to keep a copy of your collection, go to the <strong style={{ color: 'var(--text)' }}>Collection page</strong> first and use <strong style={{ color: 'var(--text)' }}>Export CSV</strong> to download your data.
            </p>
            <div className="field" style={{ margin: 0 }}>
              <label>Type <strong>delete</strong> to confirm</label>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder="delete"
              />
            </div>
            {deleteError && <div className="alert error">{deleteError}</div>}
          </div>
          <div className="modal-footer" style={{ padding: '0 20px 20px', borderTop: 'none', marginTop: 0 }}>
            <button className="btn-ghost" onClick={closeDeleteModal} disabled={deleteLoading}>Cancel</button>
            <button
              className="btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'delete' || deleteLoading}
            >
              {deleteLoading ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
