import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import logoLight2 from '../assets/logo_light.svg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);
  const handleLogout = () => { close(); logout(); navigate('/login'); };

  return (
    <>
      <nav className="navbar">
        <NavLink to="/overview" className="nav-brand">
          <img src={logoLight2} alt="GHCdb" className="nav-logo" />
        </NavLink>
        <div className="nav-links">
          <NavLink to="/overview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Overview</NavLink>
          <NavLink to="/collection" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Collection</NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Search</NavLink>
          <NavLink to="/add" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>+ Add Card</NavLink>
          <NavLink to="/import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Import CSV</NavLink>
          <NavLink to="/help" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Help</NavLink>
          {user?.is_admin ? <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'}>⚙ Admin</NavLink> : null}
        </div>
        <div className="nav-user">
          <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} title="Account settings">
            {user?.first_name || user?.username}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </NavLink>
          <button className="btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
        <button className={`nav-hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className="ham-bar" />
          <span className="ham-bar" />
          <span className="ham-bar" />
        </button>
      </nav>

      <div className={`nav-backdrop${menuOpen ? ' open' : ''}`} onClick={close} />
      <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
        <NavLink to="/overview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Overview</NavLink>
        <NavLink to="/collection" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Collection</NavLink>
        <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Search</NavLink>
        <NavLink to="/add" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>+ Add Card</NavLink>
        <NavLink to="/import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Import CSV</NavLink>
        <NavLink to="/help" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Help</NavLink>
        {user?.is_admin && <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'} onClick={close}>⚙ Admin</NavLink>}
        <div className="nav-mobile-footer">
          <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} onClick={close}>
            {user?.first_name || user?.username}
          </NavLink>
          <button className="btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
}
