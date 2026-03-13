import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo_light.svg';

export default function Footer() {
  return (
    <footer className="app-footer">
      <span className="footer-copy">© {new Date().getFullYear()} GHCdb · Beta 0.1 ({__COMMIT_HASH__})</span>
      <div className="footer-logo-wrap">
        <img src={logo} alt="GHCdb" className="footer-logo" />
      </div>
      <div className="footer-links">
        <Link to="/about" className="footer-link">About</Link>
        <Link to="/report-bug" className="footer-link">Report a Bug</Link>
      </div>
    </footer>
  );
}
