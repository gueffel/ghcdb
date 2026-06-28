import React from 'react';
import { Link } from 'react-router-dom';
import logoLight2 from '../assets/logo_light.svg';

function ScreenshotPlaceholder({ label }) {
  return (
    <div className="lp-screenshot">
      <div className="lp-screenshot-inner">
        <div className="lp-screenshot-label">{label}</div>
      </div>
    </div>
  );
}

function Feature({ eyebrow, title, body, screenshot, reverse }) {
  return (
    <div className={`lp-feature ${reverse ? 'lp-feature-reverse' : ''}`}>
      <div className="lp-feature-text">
        <div className="lp-eyebrow">{eyebrow}</div>
        <h2 className="lp-feature-title">{title}</h2>
        <p className="lp-feature-body">{body}</p>
      </div>
      <ScreenshotPlaceholder label={screenshot} />
    </div>
  );
}

export default function Landing() {
  return (
    <div className="lp">

      {/* Nav */}
      <header className="lp-header">
        <img src={logoLight2} alt="GHCdb" className="lp-logo" />
        <div className="lp-header-actions">
          <Link to="/login" className="btn-ghost">Sign In</Link>
          <Link to="/login?register=1" className="btn-primary">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-text">
          <h1 className="lp-hero-title">
            Your entire hockey card collection,<br />
            <span className="lp-hero-accent">organized and searchable.</span>
          </h1>
          <p className="lp-hero-sub">
            GHCdb lets you track every card you own and every card you're still hunting for —
            organized by set, player, and team. Import your spreadsheet, check off cards as you
            pull them, and see your collection stats at a glance.
          </p>
          <div className="lp-hero-actions">
            <Link to="/login?register=1" className="btn-primary lp-cta">Create Free Account</Link>
            <Link to="/login" className="btn-ghost lp-cta">Sign In</Link>
          </div>
        </div>
        <ScreenshotPlaceholder label="Overview / Dashboard" />
      </section>

      {/* Features */}
      <section className="lp-features">

        <Feature
          eyebrow="Collection Management"
          title="Track every card across every set you collect"
          body="Your cards are organized by year and product. Within each set you can see the full checklist, mark individual cards as owned or missing, record serial numbers for numbered cards, track duplicates, and add grades. A search bar and filters let you find any card instantly."
          screenshot="Collection view — set checklist with owned/missing filters"
        />

        <Feature
          reverse
          eyebrow="Stats & Overview"
          title="See your collection progress at a glance"
          body="The dashboard shows your overall totals — cards owned, rookies, autos, graded cards, and duplicates. A team breakdown chart shows where your collection is concentrated, and per-set completion stats show which sets you're close to finishing."
          screenshot="Overview dashboard with stats and team breakdown chart"
        />

        <Feature
          eyebrow="CSV Import"
          title="Already tracking in a spreadsheet? Import it in seconds"
          body="GHCdb accepts CSV exports from any spreadsheet. It handles flexible column names, boolean fields like Rookie and Auto, and can either add to or fully replace an existing set. You can also export any view back to CSV at any time."
          screenshot="CSV import screen with column mapping preview"
        />

        <Feature
          reverse
          eyebrow="Catalog"
          title="Add a full set checklist to your collection in one click"
          body="Admins can import master checklists scraped directly from Upper Deck's website. Once a set is in the catalog, any user can add all its cards to their collection in one click — pre-populated and ready to start checking off as you pull cards."
          screenshot="Catalog browser with set list and card preview"
        />

        <Feature
          eyebrow="Global Search"
          title="Find any card in your entire collection instantly"
          body="Search across your whole collection by player name, card number, team, set name, or product. Results show key card details at a glance and let you mark cards as owned directly from the results table — no need to navigate to the set first."
          screenshot="Search results table with inline owned toggle"
        />

        <Feature
          reverse
          eyebrow="Wishlist"
          title="Keep track of cards you're still hunting for"
          body="Mark any card in your collection as wishlisted to flag it as something you're actively looking for. Your wishlist lives on the Overview page for quick reference, and you can search and filter within it just like the rest of your collection."
          screenshot="Wishlist section on Overview with search and filters"
        />

      </section>

      {/* CTA Banner */}
      <section className="lp-banner">
        <h2 className="lp-banner-title">Ready to get your collection organized?</h2>
        <p className="lp-banner-sub">Free to use. No credit card required.</p>
        <Link to="/login?register=1" className="btn-primary lp-cta">Create Free Account</Link>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} GHCdb</span>
        <Link to="/login">Sign In</Link>
      </footer>

    </div>
  );
}
