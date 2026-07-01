import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoLight2 from '../assets/logo_light.svg';

// ── Mini UI mockups ──────────────────────────────────────────

function MockCollection() {
  const rows = [
    { owned: true,  num: '201',  name: 'Elias Pettersson' },
    { owned: true,  num: '247',  name: 'Nils Hoglander' },
    { owned: false, num: 'A-CM', name: 'Connor McDavid' },
    { owned: true,  num: '312',  name: 'Nathan MacKinnon' },
    { owned: false, num: '88',   name: 'Patrick Kane ' },
    { owned: true,  num: '29',   name: 'Nikita Kucherov' },
    { owned: false, num: 'A-TD', name: 'Thatcher Demko' },
  ];
  return (
    <div className="lp-mini">
      <div className="lp-mini-hd">
        <span className="lp-mini-tag">2022-23 Series 1</span>
        <span className="lp-mini-meta">198 / 250</span>
      </div>
      <div className="lp-mini-prog"><div className="lp-mini-pb lp-mini-pb-anim" /></div>
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
    { owned: true,  name: 'Elias Pettersson Canvas',  set: 'Series 1' },
    { owned: false, name: 'Elias Pettersson Auto /99',   set: 'SP Authentic' },
    { owned: true,  name: 'Elias Pettersson Young Guns', set: 'Series 2' },
    { owned: false, name: 'Elias Pettersson Retro RC',   set: 'SP Game Used' },
  ];
  return (
    <div className="lp-mini">
      <div className="lp-mini-searchbar">
        <span>🔍</span><span className="lp-mini-sq">Pettersson</span><span className="lp-mini-cursor" aria-hidden="true">|</span>
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
    { name: 'McDavid Auto /25',      tag: 'Auto' },
    { name: 'Crosby Young Guns',     tag: 'RC' },
    { name: 'Ovechkin Gold /10',     tag: 'Numbered' },
    { name: 'Makar Rookie Auto /99', tag: 'Auto' },
    { name: 'Pettersson Black /5',   tag: 'Numbered' },
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
          <span className="lp-mini-heart" style={{ animationDelay: `${(i * 0.85).toFixed(2)}s` }}>♥</span>
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
      {teams.map(([t, v], i) => (
        <div key={t} className="lp-mini-bar-row">
          <span className="lp-mini-team">{t}</span>
          <div className="lp-mini-track"><div className="lp-mini-fill" style={{ width: `${v}%`, animationDelay: `${(i * 0.7).toFixed(1)}s` }} /></div>
          <span className="lp-mini-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

function MockMobile() {
  return (
    <div className="lp-mini lp-mini-mobile">
      <div className="lp-mini-mob-card">
        <div className="lp-mini-mob-name">Elias Pettersson</div>
        <div className="lp-mini-mob-sub">Young Guns · #248</div>
        <div className="lp-mini-mob-set">2018-19 Series 1</div>
      </div>
      <div className="lp-mini-mob-status">○ Not in your collection</div>
      <div className="lp-mini-mob-actions">
        <span className="lp-mini-mob-wl">♥ Wishlist</span>
        <span className="lp-mini-mob-own">✓ Mark owned</span>
      </div>
    </div>
  );
}

function MockCatalog() {
  const sets = [
    { name: '2023-24 Series 1',     n: 250 },
    { name: '2022-23 SP Authentic', n: 100 },
    { name: '2021-22 Clear Cut',    n: 120 },
    { name: '2020-21 Series 2',     n: 200 },
    { name: '2019-20 Extended',     n: 250 },
    { name: '2018-19 SP Authentic', n: 90  },
    { name: '2017-18 SP Game Used', n: 110 },
  ];
  return (
    <div className="lp-mini">
      {sets.map((s, i) => (
        <div key={i} className="lp-mini-row lp-mini-cat">
          <span className="lp-mini-nm">{s.name}</span>
          <span className="lp-mini-meta">{s.n} cards</span>
          <span className="lp-mini-add-btn" style={{ animationDelay: `${(i * 1.05).toFixed(2)}s` }}>+ Add</span>
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  { mock: <MockCollection />, eyebrow: 'Collection',  title: 'Full Set Checklists',          body: 'Every card in a set, listed in order. Tick off what you own, note grades and serial numbers, and watch your progress fill up.' },
  { mock: <MockSearch />,     eyebrow: 'Search',      title: 'Find Any Card Instantly',      body: 'Search by player name, card number, team, set, or product. Your whole collection, right at your fingertips.' },
  { mock: <MockWishlist />,   eyebrow: 'Wishlist',    title: "Know What You're Still After", body: "Save any card to your wishlist so you always know what you're still looking for." },
  { mock: <MockDashboard />,  eyebrow: 'Dashboard',   title: 'See Your Collection at a Glance', body: 'How many cards you own, how many are rookies or autos, and a quick breakdown by team.' },
  { mock: <MockMobile />,     eyebrow: 'Mobile',      title: 'Great at Card Shows',          body: 'Your whole collection fits in your pocket. Check what you own and mark new finds on the spot. Just open it in your browser.' },
  { mock: <MockCatalog />,    eyebrow: 'Catalog',     title: 'Pick a Set, Add the Whole Thing', body: 'Browse thousands of complete set checklists and add every card to your collection in one go.' },
];

const MOCK_CARDS = [
  { owned: true,  num: '201',  desc: 'Elias Pettersson',               product: '2018-19 Series 1',     set: 'Young Guns' },
  { owned: true,  num: 'C-32', desc: 'Connor McDavid',                 product: '2022-23 Series 2',     set: 'Canvas' },
  { owned: false, num: 'A-NM', desc: 'Nathan MacKinnon',               product: '2021-22 SP Authentic', set: 'Base Set' },
  { owned: true,  num: '249',  desc: 'Cale Makar',                     product: '2019-20 Artifacts',    set: 'Red Parallel' },
  { owned: false, num: '12',   desc: 'Sidney Crosby',                  product: '2020-21 Series 1',     set: 'Portraits' },
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
          <div className="lp-hero-badge">Built for collectors, by a collector</div>
          <h1 className="lp-hero-title">
            Your entire collection,<br />
            <span className="lp-hero-accent">organized &amp; searchable.</span>
          </h1>
          <p className="lp-hero-sub">
            Browse complete master checklists of products, mark what you own, and
            track your progress card by card. Organized by player, team, and year. Perfect
            for having your whole collection at a glance.
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
            <span>✓ Complete set checklists</span>
            <span>✓ Track owned vs. missing</span>
            <span>✓ Works great on (nearly) every device</span>
          </div>
        </div>

        {/* Mock app UI */}
        <div className="lp-hero-mock">
          <div className="lp-mock-titlebar">
            <span className="lp-mock-dot lp-mock-dot-r" />
            <span className="lp-mock-dot lp-mock-dot-y" />
            <span className="lp-mock-dot lp-mock-dot-g" />
            <span className="lp-mock-window-title">GHCdb · Collection</span>
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
                <span>✓</span><span>#</span><span>Player / Description</span><span>Set</span><span>Product</span>
              </div>
              {MOCK_CARDS.map((c, i) => (
                <div key={i} className={`lp-mock-row ${c.owned ? 'lp-mock-row-owned' : 'lp-mock-row-missing'}`}>
                  <span className="lp-mock-check">{c.owned ? '✓' : '○'}</span>
                  <span className="lp-mock-card-num">{c.num}</span>
                  <span className="lp-mock-desc">{c.desc}</span>
                  <span className="lp-mock-set">{c.set}</span>
                  <span className="lp-mock-set">{c.product}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-mock-shine" />
        </div>
      </section>

      {/* Section header */}
      <div className="lp-section-hd">
        <div className="lp-section-eyebrow">Everything in one place</div>
        <h2 className="lp-section-title">One home for your whole collection</h2>
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
        <div className="lp-banner-badge">Built for collectors, by a collector</div>
        <h2 className="lp-banner-title">Your cards deserve<br />a proper home.</h2>
        <p className="lp-banner-sub">You've spent years building your collection. <br className="lp-banner-br" />It's time to actually see it all in one place.</p>
        <Link to="/login?register=1" className="lp-cta-primary">
          Create Account
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </Link>
        <div className="lp-banner-perks">
          <span>✓ No app to download</span>
          <span>✓ Works on every device</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} GHCdb</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/login">Sign In</Link>
        </div>
      </footer>

    </div>
  );
}
