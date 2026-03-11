import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);
  const handleLogout = () => { close(); logout(); navigate('/login'); };

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-icon">🏒</span>
          <span className="nav-title">GHCdb</span>
        </div>
        <div className="nav-links">
          <NavLink to="/overview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Overview</NavLink>
          <NavLink to="/collection" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Collection</NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Search</NavLink>
          <NavLink to="/add" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>+ Add Card</NavLink>
          <NavLink to="/import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Import CSV</NavLink>
          {user?.is_admin ? <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'}>⚙ Admin</NavLink> : null}
        </div>
        <div className="nav-user">
          <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} title="Account settings">
            {user?.first_name || user?.username}
          </NavLink>
          <button className="btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {menuOpen && (
        <>
          <div className="nav-backdrop" onClick={close} />
          <div className="nav-mobile-menu">
            <NavLink to="/overview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Overview</NavLink>
            <NavLink to="/collection" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Collection</NavLink>
            <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Search</NavLink>
            <NavLink to="/add" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>+ Add Card</NavLink>
            <NavLink to="/import" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={close}>Import CSV</NavLink>
            {user?.is_admin && <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'} onClick={close}>⚙ Admin</NavLink>}
            <div className="nav-mobile-footer">
              <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} onClick={close}>
                {user?.first_name || user?.username}
              </NavLink>
              <button className="btn-ghost" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
