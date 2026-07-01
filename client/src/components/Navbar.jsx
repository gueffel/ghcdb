import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import logoLight2 from '../assets/logo_light.svg';

export default function Navbar() {
  const { user, profile, logout, openBugCount } = useAuth();
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
          <NavLink to="/add" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>+ Add Single</NavLink>
          <NavLink to="/import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Import CSV</NavLink>
          <NavLink to="/help" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Help</NavLink>
          {profile?.is_admin ? <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'}>⚙ Admin{openBugCount > 0 && <span className="nav-bug-badge">{openBugCount}</span>}</NavLink> : null}
        </div>
        <div className="nav-user">
          <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} title="Account settings">
            <span className="nav-settings-icon">⚙</span>
            {profile?.first_name || user?.email?.split('@')[0]}
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
        <NavLink to="/add" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>+ Add Single</NavLink>
        <NavLink to="/import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Import CSV</NavLink>
        <NavLink to="/help" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Help</NavLink>
        {profile?.is_admin && <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'} onClick={close}>⚙ Admin{openBugCount > 0 && <span className="nav-bug-badge">{openBugCount}</span>}</NavLink>}
        <div className="nav-mobile-footer">
          <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} onClick={close}>
            <span className="nav-settings-icon">⚙</span>
            {profile?.first_name || user?.email?.split('@')[0]}
          </NavLink>
          <button className="btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
}
