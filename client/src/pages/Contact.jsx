import React from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <div className="page page-narrow">
      <h1 className="page-title">Contact</h1>
      <div className="settings-card">
        <h2 className="settings-section-title">Get in Touch</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Have a question, suggestion, or just want to say hello? Feel free to reach out.
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 12 }}>
          <strong style={{ color: 'var(--text)' }}>Email:</strong>{' '}
          <a href="mailto:hi@ghcdb.ca" style={{ color: 'var(--accent)' }}>hi@ghcdb.ca</a>
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 8 }}>
          Found a bug or technical issue?{' '}
          <Link to="/report-bug" style={{ color: 'var(--accent)' }}>Submit a bug report</Link>{' '}
          and we'll look into it.
        </p>
      </div>
    </div>
  );
}
