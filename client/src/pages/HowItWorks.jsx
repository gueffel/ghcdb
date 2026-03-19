import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import logo from '../assets/logo_light.svg';

const features = [
  {
    title: 'Getting Started',
    description:
      'Creating an account takes about 30 seconds — just a username, email, and password. Once you\'re in, the navigation bar at the top gives you access to everything: your Overview, Collection, Search, and Import pages. Your account settings — including your display name, email, and password — are always one click away from your name in the top right corner.',
    videoLabel: 'Registration & navigation overview',
  },
  {
    title: 'Dashboard & Stats',
    description:
      'Get an instant overview of your entire collection. See how many cards you own vs. your total, track your rookie count, autos, serials, and graded cards at a glance. Charts break down your collection by team, year, and set.',
    videoLabel: 'Dashboard walkthrough',
  },
  {
    title: 'Collection Tracking',
    description:
      'Browse every card in your collection in a searchable, filterable table. Mark cards as owned, flag duplicates, record serial numbers and grades, and build your wishlist — all in one place.',
    videoLabel: 'Collection management demo',
  },
  {
    title: 'Set Catalog',
    description:
      'The catalog is a master list of every card in a set. Browse sets by year and product, see how many cards are in each set, and track your completion percentage — at a glance for every set you follow.',
    videoLabel: 'Set catalog walkthrough',
  },
  {
    title: 'CSV Import',
    description:
      'Import any set into your catalog from a standard CSV file. Map your columns once and GHCdb pulls in all the card data — player names, teams, rookie flags, autos, serial numbers, and more.',
    videoLabel: 'Importing a set from CSV',
  },
  {
    title: 'Search',
    description:
      "Search across every card in your collection or the entire catalog. Filter by player, team, year, set, rookie status, auto, serial number, grade, and more to quickly find exactly what you're looking for.",
    videoLabel: 'Search & filter demo',
  },
];

function VideoPlaceholder({ label }) {
  return (
    <div className="hiw-video">
      <div className="hiw-video-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" />
          <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="rgba(99,102,241,0.7)" />
        </svg>
      </div>
      <p className="hiw-video-label">{label}</p>
      <span className="hiw-video-badge">Video coming soon</span>
    </div>
  );
}

const JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GHCdb',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  url: 'https://ghcdb.ca',
  description: 'Track your hockey card collection. Log what you own, find what you\'re missing, and see stats by player, team, year, and set.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
};

export default function HowItWorks() {
  const { user } = useAuth();

  return (
    <div className={`hiw-page${user ? ' hiw-page--logged-in' : ''}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      {/* Self-contained header for logged-out users only */}
      {!user && (
        <header className="hiw-header">
          <Link to="/login" className="hiw-logo-link">
            <img src={logo} alt="GHCdb" className="hiw-logo" />
          </Link>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </header>
      )}

      {/* Hero — logged-out only */}
      {!user && (
        <section className="hiw-hero">
          <h1 className="hiw-hero-title">Your Hockey Card Collection,<br />Finally Organized</h1>
          <p className="hiw-hero-sub">
            GHCdb lets you import sets, track what you own, and see stats on your entire collection — by player, team, year, and set.
          </p>
          <Link to="/login" className="btn-primary">Get Started</Link>
        </section>
      )}

      {/* Feature sections */}
      <section className="hiw-features">
        {features.map((f, i) => (
          <div key={f.title} className={`hiw-feature ${i % 2 === 1 ? 'hiw-feature--reverse' : ''}`}>
            <div className="hiw-feature-text">
              <span className="hiw-feature-number">0{i + 1}</span>
              <h2 className="hiw-feature-title">{f.title}</h2>
              <p className="hiw-feature-desc">{f.description}</p>
            </div>
            <VideoPlaceholder label={f.videoLabel} />
          </div>
        ))}
      </section>

      {/* Bottom CTA — logged-out only */}
      {!user && (
        <section className="hiw-bottom-cta">
          <h2>Ready to get started?</h2>
          <p>Create your account and start tracking your collection today.</p>
          <Link to="/login" className="btn-primary">Create Account</Link>
        </section>
      )}

      {!user && (
        <footer className="hiw-footer">
          © {new Date().getFullYear()} GHCdb &nbsp;·&nbsp;
          <Link to="/login" className="hiw-footer-link">Sign In</Link>
        </footer>
      )}
    </div>
  );
}
