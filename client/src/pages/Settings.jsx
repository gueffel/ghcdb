import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Settings() {
  const { user, updateUser, login } = useAuth();

  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' });
  const [profileStatus, setProfileStatus] = useState(null); // { type: 'success'|'error', msg }

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordStatus, setPasswordStatus] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    api.me().then(u => setProfile({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
    }));
  }, []);

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
                <label>First Name</label>
                <input
                  value={profile.first_name}
                  onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                  autoComplete="given-name"
                  placeholder="First name"
                />
              </div>
              <div className="field">
                <label>Last Name</label>
                <input
                  value={profile.last_name}
                  onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                  autoComplete="family-name"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="field">
              <label>Email <span className="field-optional">(optional)</span></label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                placeholder="your@email.com"
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
    </div>
  );
}
