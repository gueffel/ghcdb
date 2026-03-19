import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import logoLight2 from '../assets/logo_light.svg';

const I = ({ children }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.75 }}>
    {children}
  </svg>
);

const icons = {
  overview:    <I><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></I>,
  collection:  <I><path d="M2 6h20M2 12h20M2 18h20"/><rect x="2" y="3" width="4" height="18" rx="1"/></I>,
  search:      <I><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></I>,
  add:         <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></I>,
  import:      <I><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></I>,
  howitworks:  <I><circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5V8.5z"/></I>,
  admin:       <I><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></I>,
};

const GearIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);
  const handleLogout = () => { close(); logout(); navigate('/login'); };

  const nl = (to, icon, label, extra = '') => (
    <NavLink to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${extra ? ' ' + extra : ''}`}>
      {icon}{label}
    </NavLink>
  );
  const nlM = (to, icon, label, extra = '') => (
    <NavLink to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${extra ? ' ' + extra : ''}`} onClick={close}>
      {icon}{label}
    </NavLink>
  );

  return (
    <>
      <nav className="navbar">
        <NavLink to="/overview" className="nav-brand">
          <img src={logoLight2} alt="GHCdb" className="nav-logo" />
        </NavLink>
        <div className="nav-links">
          {nl('/overview',    icons.overview,   'Overview')}
          {nl('/collection',  icons.collection, 'Collection')}
          {nl('/search',      icons.search,     'Search')}
          {nl('/add',         icons.add,        'Add Card')}
          {nl('/import',      icons.import,     'Import CSV')}
          {nl('/how-it-works',icons.howitworks, 'How It Works')}
          {user?.is_admin && nl('/admin', icons.admin, 'Admin', 'nav-link-admin')}
        </div>
        <div className="nav-user">
          <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} title="Account settings">
            {user?.first_name || user?.username}
            {GearIcon}
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
        {nlM('/overview',    icons.overview,   'Overview')}
        {nlM('/collection',  icons.collection, 'Collection')}
        {nlM('/search',      icons.search,     'Search')}
        {nlM('/add',         icons.add,        'Add Card')}
        {nlM('/import',      icons.import,     'Import CSV')}
        {nlM('/how-it-works',icons.howitworks, 'How It Works')}
        {user?.is_admin && nlM('/admin', icons.admin, 'Admin', 'nav-link-admin')}
        <div className="nav-mobile-footer">
          <NavLink to="/settings" className={({ isActive }) => `nav-username ${isActive ? 'active' : ''}`} onClick={close}>
            {GearIcon}
            {user?.first_name || user?.username}
          </NavLink>
          <button className="btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
}
