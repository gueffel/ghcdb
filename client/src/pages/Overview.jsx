import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import CardDetailModal from '../components/CardDetailModal.jsx';
import TeamChip from '../components/TeamChip.jsx';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { NHL_TEAM_COLORS, getTeamMeta } from '../nhlTeams.js';



function getGreeting(name) {
  const hour = new Date().getHours();
  const pools =
    hour < 12  ? ['Good morning', 'Rise and shine', 'Morning', 'Top of the morning']
    : hour < 17 ? ['Good afternoon', 'Afternoon', 'Welcome back', 'Hey there']
    : hour < 21 ? ['Good evening', 'Evening', 'Hope you had a great day', 'Welcome back']
    :             ['Burning the midnight oil', 'Up late', 'Night owl mode', 'Good evening'];
  const phrase = pools[Math.floor(Math.random() * pools.length)];
  return `${phrase}, ${name}`;
}

ChartJS.register(ArcElement, Tooltip, Legend);


const FALLBACK_COLORS = [
  '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f',
  '#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac',
  '#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd',
];

function teamColor(name, idx) {
  if (NHL_TEAM_COLORS[name]) return NHL_TEAM_COLORS[name];
  // fuzzy: check if any known key is a substring of (or contained in) the team string
  const lower = name.toLowerCase();
  const match = Object.keys(NHL_TEAM_COLORS).find(k => lower.includes(k.toLowerCase().split(' ').slice(-1)[0]));
  return match ? NHL_TEAM_COLORS[match] : FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function StatCard({ label, value, sub, gradient }) {
  return (
    <div className="stat-card" style={{ '--card-grad': gradient }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const WISHLIST_PAGE_SIZE = 5;

export default function Overview() {
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(user?.first_name || user?.username || 'there'), []);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardDetail, setCardDetail] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [bannerClosing, setBannerClosing] = useState(false);
  const [wishlistCards, setWishlistCards] = useState([]);
  const [wishlistTotal, setWishlistTotal] = useState(0);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const wishlistDebounce = useRef(null);

  useEffect(() => {
    api.getStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
    api.getAnnouncement().then(ann => {
      if (!ann) return;
      const dismissedId = localStorage.getItem('dismissedAnnouncementId');
      if (String(ann.id) !== dismissedId) setAnnouncement(ann);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(wishlistDebounce.current);
    wishlistDebounce.current = setTimeout(() => {
      setWishlistLoading(true);
      api.getCards({ wishlisted: 1, search: wishlistSearch, page: wishlistPage, limit: WISHLIST_PAGE_SIZE })
        .then(data => { setWishlistCards(data.cards); setWishlistTotal(data.total); })
        .catch(() => {})
        .finally(() => setWishlistLoading(false));
    }, wishlistSearch ? 300 : 0); // debounce typing, but don't delay page changes
  }, [wishlistPage, wishlistSearch]);

  const dismissBanner = () => {
    setBannerClosing(true);
    setTimeout(() => {
      localStorage.setItem('dismissedAnnouncementId', String(announcement.id));
      setAnnouncement(null);
      setBannerClosing(false);
    }, 320);
  };

  if (loading) return <div className="page-loading"><div className="spinner large" />Loading stats...</div>;
  if (!stats) return <div className="page-error">Failed to load stats.</div>;

  const { totals, byTeam, byProduct, recentlyOwned, topPlayer, topSet } = stats;
  const teamPieData = {
    labels: byTeam.map(t => t.team),
    datasets: [{
      data: byTeam.map(t => t.owned),
      backgroundColor: byTeam.map((t, i) => teamColor(t.team, i)),
      borderColor: '#1a1f2e',
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: '#c8d0e0' } } },
  };

  return (
    <div className="page">
      {announcement && (
        <div className={`announcement-banner${bannerClosing ? ' closing' : ''}`}>
          <div className="announcement-icon">📣</div>
          <div className="announcement-body">
            {announcement.title && <div className="announcement-title">{announcement.title}</div>}
            <span className="announcement-text">{announcement.message}</span>
          </div>
          <button
            className="announcement-close"
            onClick={dismissBanner}
            title="Do not show this announcement again"
            aria-label="Dismiss announcement"
          >✕</button>
        </div>
      )}
      <h1 className="page-title">{greeting}</h1>

      <div className="stat-grid">
        <StatCard label="Owned" value={totals.owned.toLocaleString()} gradient="linear-gradient(135deg, #22c55e, #0d9488)" />
        <StatCard label="Rookies" value={totals.ownedRookies.toLocaleString()} gradient="linear-gradient(135deg, #f97316, #eab308)" />
        <StatCard label="Autos" value={totals.ownedAutos.toLocaleString()} gradient="linear-gradient(135deg, #a855f7, #ec4899)" />
        <StatCard label="Graded" value={totals.graded.toLocaleString()} gradient="linear-gradient(135deg, #eab308, #f59e0b)" />
        <StatCard label="Duplicates" value={totals.duplicates.toLocaleString()} gradient="linear-gradient(135deg, #78716c, #ef4444)" />
        {topPlayer && <StatCard label="Most Owned Player" value={topPlayer.name} sub={`${topPlayer.count} cards`} gradient="linear-gradient(135deg, #0d9488, #3b82f6)" />}
        {topSet && <StatCard label="Most Owned Product" value={topSet.name} sub={`${topSet.count} cards`} gradient="linear-gradient(135deg, #ef4444, #ec4899)" />}
      </div>

      <div className="chart-grid">
        {byTeam.length > 0 && (
          <div className="chart-card">
            <h2 className="chart-title">Owned Cards by Team</h2>
            <div className="pie-wrap">
              <Pie data={teamPieData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'right', labels: { color: '#c8d0e0', boxWidth: 14, padding: 8 } } } }} />
            </div>
          </div>
        )}
        <div className="chart-card wishlist-panel">
          <div className="wishlist-panel-header">
            <h2 className="chart-title">My Wishlist</h2>
            <div className="search-input-wrap" style={{ maxWidth: 260, marginLeft: 'auto' }}>
              <input
                className="collection-search"
                placeholder="Search wishlist…"
                value={wishlistSearch}
                onChange={e => { setWishlistSearch(e.target.value); setWishlistPage(1); }}
              />
              {wishlistSearch && (
                <button className="search-clear-btn" onClick={() => { setWishlistSearch(''); setWishlistPage(1); }}>✕</button>
              )}
            </div>
          </div>
          {wishlistLoading ? (
            <div style={{ padding: '24px', textAlign: 'center' }}><div className="spinner" /></div>
          ) : wishlistCards.length === 0 ? (
            <div className="sidebar-empty" style={{ padding: '24px 16px' }}>
              {wishlistSearch ? 'No matches.' : 'No wishlisted cards yet. Click ♡ on any card to add it.'}
            </div>
          ) : (
            <>
              <div className="table-wrap" style={{ flex: 1 }}>
                <table className="data-table wishlist-table">
                  <thead>
                    <tr>
                      <th>Player / Description</th>
                      <th className="ra-hide">Team</th>
                      <th>Product</th>
                      <th className="ra-hide">RC</th>
                      <th className="ra-hide">AUTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlistCards.map(c => {
                      const wMeta = getTeamMeta(c.team_city, c.team_name);
                      return (
                      <tr key={c.id} className="row-clickable" onClick={() => setCardDetail(c)}>
                        <td>
                          <div className="wishlist-desc">
                            {wMeta && <img className="team-logo ra-show" src={`https://assets.nhle.com/logos/nhl/svg/${wMeta.abbrev}_light.svg`} alt="" />}
                            {c.description}
                          </div>
                          {c.set_name && <div className="wishlist-sub">{c.set_name}</div>}
                        </td>
                        <td className="ra-hide"><TeamChip team_city={c.team_city} team_name={c.team_name} /></td>
                        <td className="text-muted">{[c.year, c.product].filter(Boolean).join(' ')}</td>
                        <td className="ra-hide">{c.rookie ? <span className="badge badge-orange">RC</span> : ''}</td>
                        <td className="ra-hide">{c.auto ? <span className="badge badge-purple">AUTO</span> : ''}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {wishlistTotal > WISHLIST_PAGE_SIZE && (
                <div className="pagination" style={{ padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn-ghost" disabled={wishlistPage === 1} onClick={() => setWishlistPage(p => p - 1)}>← Prev</button>
                  <span>Page {wishlistPage} of {Math.ceil(wishlistTotal / WISHLIST_PAGE_SIZE)}</span>
                  <button className="btn-ghost" disabled={wishlistPage >= Math.ceil(wishlistTotal / WISHLIST_PAGE_SIZE)} onClick={() => setWishlistPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {recentlyOwned.length > 0 && (
        <div className="table-card">
          <h2 className="chart-title">Last 10 cards added</h2>
          <div className="table-wrap">
            <table className="data-table recently-added-table">
              <thead>
                <tr>
                  <th className="ra-player-col">
                    <span className="th-full">Player / Description</span><span className="th-short">Player</span>
                  </th>
                  <th className="ra-hide">Team</th>
                  <th className="ra-product-col">Product</th>
                  <th className="ra-hide">Set</th>
                  <th className="ra-hide">Rookie</th>
                  <th className="ra-hide">Auto</th>
                </tr>
              </thead>
              <tbody>
                {recentlyOwned.map(c => {
                  const raMeta = getTeamMeta(c.team_city, c.team_name);
                  return (
                  <tr key={c.id} className="row-clickable" onClick={() => setCardDetail(c)}>
                    <td className="ra-player-col">
                      <div className="wishlist-desc">
                        {raMeta && <img className="team-logo ra-show" src={`https://assets.nhle.com/logos/nhl/svg/${raMeta.abbrev}_light.svg`} alt="" />}
                        {c.description}
                      </div>
                      {c.set_name && <div className="wishlist-sub ra-show-block">{c.set_name}</div>}
                    </td>
                    <td className="ra-hide"><TeamChip team_city={c.team_city} team_name={c.team_name} /></td>
                    <td className="ra-product-col text-muted">{[c.year, c.product].filter(Boolean).join(' ')}</td>
                    <td className="ra-hide text-muted">{c.set_name || ''}</td>
                    <td className="ra-hide">{c.rookie ? <span className="badge badge-orange">RC</span> : ''}</td>
                    <td className="ra-hide">{c.auto ? <span className="badge badge-purple">AUTO</span> : ''}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {byProduct.length > 0 && (
        <div className="table-card">
          <div className="chart-title-row">
            <h2 className="chart-title">My Products</h2>
            <Link to="/collection" className="btn-ghost" style={{ fontSize: 13 }}>Full Collection →</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Year</th><th>Product</th><th>Owned</th><th>Total</th></tr>
              </thead>
              <tbody>
                {byProduct.map((p, i) => (
                  <tr key={i}>
                    <td>{p.year}</td>
                    <td>{p.product}</td>
                    <td className="text-green">{p.owned}</td>
                    <td>{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cardDetail && (
        <CardDetailModal
          card={cardDetail}
          onClose={() => setCardDetail(null)}
          onToggleWishlist={(card) => {
            const newVal = card.wishlisted ? 0 : 1;
            setCardDetail(prev => prev ? { ...prev, wishlisted: newVal } : null);
            setWishlistCards(prev => newVal ? prev : prev.filter(c => c.id !== card.id));
            api.toggleWishlist(card.id, newVal).catch(() => {});
          }}
          onToggleOwned={(card) => {
            const newOwned = !card.owned;
            setCardDetail(prev => prev ? { ...prev, owned: newOwned, ...(newOwned ? { wishlisted: 0 } : {}) } : null);
            if (newOwned) setWishlistCards(prev => prev.filter(c => c.id !== card.id));
            api.toggleOwned(card.id, newOwned, newOwned ? undefined : null).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
