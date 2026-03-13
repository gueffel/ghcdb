import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <span className="footer-copy">© 2024 GHCdb. All rights reserved.</span>
      <div className="footer-links">
        <Link to="/contact" className="footer-link">Contact</Link>
        <Link to="/report-bug" className="footer-link">Report a Bug</Link>
      </div>
    </footer>
  );
}
