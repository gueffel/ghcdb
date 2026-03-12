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
