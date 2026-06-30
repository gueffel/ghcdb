import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoLight2 from '../assets/logo_light.svg';

// ── Mini UI mockups ──────────────────────────────────────────

function MockCollection() {
  const rows = [
    { owned: true,  num: '201',  name: 'E. Pettersson YG' },
    { owned: true,  num: '247',  name: 'M. Tkachuk RC' },
    { owned: false, num: 'A-CM', name: 'C. McDavid Auto' },
    { owned: true,  num: '312',  name: 'N. MacKinnon' },
    { owned: false, num: '88',   name: 'P. Kane Canvas' },
    { owned: true,  num: '29',   name: 'N. Kucherov RC' },
    { owned: false, num: 'A-BP', name: 'B. Point Auto' },
  ];
  return (
    <div className="lp-mini">
      <div className="lp-mini-hd">
        <span className="lp-mini-tag">2022-23 UD Series 1</span>
        <span className="lp-mini-meta">198 / 250</span>
      </div>
      <div className="lp-mini-prog"><div className="lp-mini-pb" style={{ width: '79%' }} /></div>
      {rows.map((c, i) => (
        <div key={i} className={`lp-mini-row ${c.owned ? 'lp-mini-owned' : 'lp-mini-miss'}`}>
          <span className="lp-mini-chk">{c.owned ? '✓' : '○'}</span>
          <span className="lp-mini-cn">{c.num}</span>
          <span className="lp-mini-nm">{c.name}</span>
        </div>
      ))}
    </div>
  );
}

function MockSearch() {
  const rows = [
    { owned: true,  name: 'E. Pettersson Canvas',     set: 'UD 2023' },
    { owned: false, name: 'E. Pettersson Auto /99',   set: 'SP Auth.' },
    { owned: true,  name: 'E. Pettersson Young Guns', set: 'UD 2018' },
    { owned: false, name: 'E. Pettersson Retro RC',   set: 'UD 2019' },
  ];
  return (
    <div className="lp-mini">
      <div className="lp-mini-searchbar">
        <span>🔍</span><span className="lp-mini-sq">Pettersson</span>
      </div>
      <div className="lp-mini-count-sm">42 results</div>
      {rows.map((r, i) => (
        <div key={i} className={`lp-mini-row ${r.owned ? 'lp-mini-owned' : 'lp-mini-miss'}`}>
          <span className="lp-mini-chk">{r.owned ? '✓' : '○'}</span>
          <span className="lp-mini-nm">{r.name}</span>
          <span className="lp-mini-set-s">{r.set}</span>
        </div>
      ))}
    </div>
  );
}

function MockWishlist() {
  const items = [
    { name: 'McDavid Acetate /25',   tag: 'Short print' },
    { name: 'Crosby Young Guns RC',  tag: '2005-06' },
    { name: 'Ovechkin Gold /10',     tag: 'Rare' },
    { name: 'Makar Rookie Auto /99', tag: 'Auto' },
    { name: 'Pettersson Black /5',   tag: 'SSP' },
    { name: 'Draisaitl Canvas',      tag: 'Canvas' },
    { name: 'Stamkos Auto /50',      tag: 'Numbered' },
  ];
  return (
    <div className="lp-mini">
      <div className="lp-mini-hd">
        <span className="lp-mini-tag lp-mini-tag-pink">♥ Wishlist · 8 cards</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="lp-mini-row">
          <span className="lp-mini-heart">♥</span>
          <span className="lp-mini-nm">{item.name}</span>
          <span className="lp-mini-pill">{item.tag}</span>
        </div>
      ))}
    </div>
  );
}

function MockDashboard() {
  const teams = [['VAN', 72], ['EDM', 58], ['TOR', 44], ['COL', 38]];
  return (
    <div className="lp-mini">
      <div className="lp-mini-stats-row">
        <div className="lp-mini-sc"><span className="lp-mini-sn">1,284</span><span className="lp-mini-sl">Owned</span></div>
        <div className="lp-mini-sc"><span className="lp-mini-sn">43</span><span className="lp-mini-sl">RC</span></div>
        <div className="lp-mini-sc"><span className="lp-mini-sn">12</span><span className="lp-mini-sl">Auto</span></div>
        <div className="lp-mini-sc"><span className="lp-mini-sn">5</span><span className="lp-mini-sl">Graded</span></div>
      </div>
      <div className="lp-mini-div" />
      {teams.map(([t, v]) => (
        <div key={t} className="lp-mini-bar-row">
          <span className="lp-mini-team">{t}</span>
          <div className="lp-mini-track"><div className="lp-mini-fill" style={{ width: `${v}%` }} /></div>
          <span className="lp-mini-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

function MockImport() {
  return (
    <div className="lp-mini lp-mini-csv">
      <div className="lp-mini-csv-hd">year · product · player · owned</div>
      {[
        '2023 · UD Series 1 · Pettersson · TRUE',
        '2023 · UD Series 1 · McDavid · TRUE',
        '2023 · UD Series 1 · MacKinnon · FALSE',
        '2023 · UD Series 1 · Matthews · TRUE',
        '2023 · UD Series 1 · Point · FALSE',
        '2023 · UD Series 1 · Draisaitl · TRUE',
        '2023 · UD Series 1 · Kucherov · TRUE',
      ].map((r, i) => <div key={i} className="lp-mini-csv-row">{r}</div>)}
    </div>
  );
}

function MockCatalog() {
  const sets = [
    { name: '2023-24 UD Series 1',  n: 250 },
    { name: '2022-23 SP Authentic', n: 100 },
    { name: '2021-22 UD Canvas',    n: 120 },
    { name: '2020-21 UD Series 2',  n: 200 },
    { name: '2019-20 UD Series 1',  n: 250 },
    { name: '2018-19 SP Authentic', n: 90  },
    { name: '2017-18 UD Canvas',    n: 110 },
  ];
  return (
    <div className="lp-mini">
      {sets.map((s, i) => (
        <div key={i} className="lp-mini-row lp-mini-cat">
          <span className="lp-mini-nm">{s.name}</span>
          <span className="lp-mini-meta">{s.n} cards</span>
          <span className="lp-mini-add-btn">+ Add</span>
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  { mock: <MockCollection />, eyebrow: 'Collection',     title: 'Full Set Checklists',       body: 'Browse every card. Mark owned, record serial numbers, add grades, and track duplicates.' },
  { mock: <MockSearch />,     eyebrow: 'Search',         title: 'Find Any Card Instantly',    body: 'Search your entire collection by player, number, team, set, or product.' },
  { mock: <MockWishlist />,   eyebrow: 'Wishlist',       title: "Track What You're Hunting",  body: 'Flag any card as wishlisted so you never lose track of what you still need.' },
  { mock: <MockDashboard />,  eyebrow: 'Dashboard',      title: 'Stats at a Glance',          body: 'Owned totals, rookies, autos, graded cards, and a team breakdown chart.' },
  { mock: <MockImport />,     eyebrow: 'Import / Export', title: 'CSV In and Out',            body: 'Bring your spreadsheet — any column names work. Export any view back to CSV.' },
  { mock: <MockCatalog />,    eyebrow: 'Catalog',        title: 'One-Click Set Import',       body: 'Browse master checklists and add an entire set to your collection instantly.' },
];

const MOCK_CARDS = [
  { owned: true,  num: '201',  desc: 'Elias Pettersson Young Guns',  set: '2018-19 UD Series 1' },
  { owned: true,  num: 'C-32', desc: 'Connor McDavid Canvas',         set: '2022-23 UD Series 2' },
  { owned: false, num: 'A-NM', desc: 'Nathan MacKinnon Auto',          set: '2021-22 SP Authentic' },
  { owned: true,  num: '249',  desc: 'Cale Makar Rookie',              set: '2019-20 Upper Deck' },
  { owned: false, num: '12',   desc: 'Sidney Crosby Portrait',         set: '2020-21 UD Series 1' },
];

// ── Component ────────────────────────────────────────────────

export default function Landing() {
  useEffect(() => {
    const wraps = Array.from(document.querySelectorAll('.lp-float-wrap'));
    if (!wraps.length) return;

    let targetMx = 0, targetMy = 0, currMx = 0, currMy = 0, scrollY = 0, raf;
    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      currMx = lerp(currMx, targetMx, 0.06);
      currMy = lerp(currMy, targetMy, 0.06);
      wraps.forEach((el, i) => {
        const mf = (i + 1) * 7;
        const sf = ((i % 3) + 1) * 0.045 * (i % 2 === 0 ? -1 : 1);
        el.style.transform = `translate(${currMx * mf}px, ${currMy * mf + scrollY * sf}px)`;
      });
      raf = requestAnimationFrame(tick);
    };

    const onMouse  = e => { targetMx = (e.clientX / window.innerWidth - 0.5) * 2; targetMy = (e.clientY / window.innerHeight - 0.5) * 2; };
    const onScroll = () => { scrollY = window.scrollY; };

    window.addEventListener('mousemove', onMouse);
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="lp">

      {/* Ambient orbs + floating card shapes */}
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`lp-float-wrap lp-float-wrap-${i}`}>
            <div className={`lp-float-card lp-float-card-${i}`} />
          </div>
        ))}
      </div>

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
        <div className="lp-hero-content">
          <div className="lp-hero-badge">🏒 Built for Hockey Card Collectors</div>
          <h1 className="lp-hero-title">
            Your entire collection,<br />
            <span className="lp-hero-accent">organized &amp; searchable.</span>
          </h1>
          <p className="lp-hero-sub">
            Track every card you own and every card you're still hunting — organized by set,
            player, and team. Import your spreadsheet, check off cards as you pull them, and
            see your progress at a glance.
          </p>
          <div className="lp-hero-actions">
            <Link to="/login?register=1" className="lp-cta-primary">
              Create Account
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </Link>
            <Link to="/login" className="btn-ghost lp-cta-ghost">Sign In</Link>
          </div>
          <div className="lp-hero-perks">
            <span>✓ Import from CSV</span>
            <span>✓ Export any view</span>
            <span>✓ Track every set</span>
          </div>
        </div>

        {/* Mock app UI */}
        <div className="lp-hero-mock">
          <div className="lp-mock-titlebar">
            <span className="lp-mock-dot lp-mock-dot-r" />
            <span className="lp-mock-dot lp-mock-dot-y" />
            <span className="lp-mock-dot lp-mock-dot-g" />
            <span className="lp-mock-window-title">GHCdb — Collection</span>
          </div>
          <div className="lp-mock-body">
            <div className="lp-mock-stats">
              <div className="lp-mock-stat"><span className="lp-mock-num">1,284</span><span className="lp-mock-label">Owned</span></div>
              <div className="lp-mock-stat"><span className="lp-mock-num">43</span><span className="lp-mock-label">Rookies</span></div>
              <div className="lp-mock-stat"><span className="lp-mock-num">12</span><span className="lp-mock-label">Autos</span></div>
              <div className="lp-mock-stat"><span className="lp-mock-num">86%</span><span className="lp-mock-label">Complete</span></div>
            </div>
            <div className="lp-mock-progress">
              <div className="lp-mock-progress-bar" style={{ width: '86%' }} />
            </div>
            <div className="lp-mock-table">
              <div className="lp-mock-th">
                <span>✓</span><span>#</span><span>Player / Description</span><span>Set</span>
              </div>
              {MOCK_CARDS.map((c, i) => (
                <div key={i} className={`lp-mock-row ${c.owned ? 'lp-mock-row-owned' : 'lp-mock-row-missing'}`}>
                  <span className="lp-mock-check">{c.owned ? '✓' : '○'}</span>
                  <span className="lp-mock-card-num">{c.num}</span>
                  <span className="lp-mock-desc">{c.desc}</span>
                  <span className="lp-mock-set">{c.set}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-mock-shine" />
        </div>
      </section>

      {/* Section header */}
      <div className="lp-section-hd">
        <div className="lp-section-eyebrow">Everything you need</div>
        <h2 className="lp-section-title">One app for your entire collection</h2>
      </div>

      {/* Feature bento grid */}
      <section className="lp-features-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="lp-feat-card">
            <div className="lp-feat-mock">{f.mock}</div>
            <div className="lp-feat-eyebrow">{f.eyebrow}</div>
            <h3 className="lp-feat-title">{f.title}</h3>
            <p className="lp-feat-body">{f.body}</p>
            <div className="lp-feat-glow" />
          </div>
        ))}
      </section>

      {/* CTA Banner */}
      <section className="lp-banner">
        <div className="lp-banner-glow" />
        <h2 className="lp-banner-title">Ready to get organized?</h2>
        <p className="lp-banner-sub">Everything you need to manage your hockey card collection.</p>
        <Link to="/login?register=1" className="lp-cta-primary">
          Create Account
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} GHCdb</span>
        <Link to="/login">Sign In</Link>
      </footer>

    </div>
  );
}
