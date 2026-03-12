import { useEffect, useState, useMemo } from 'react';
import CardDetailModal from '../components/CardDetailModal.jsx';
import TeamChip from '../components/TeamChip.jsx';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { NHL_TEAM_COLORS } from '../nhlTeams.js';



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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);


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

export default function Overview() {
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(user?.first_name || user?.username || 'there'), []);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardDetail, setCardDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    api.getStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner large" />Loading stats...</div>;
  if (!stats) return <div className="page-error">Failed to load stats.</div>;

  const { totals, byTeam, byYear, byProduct, recentlyOwned, topPlayer, topSet } = stats;
  const pct = totals.total ? Math.round((totals.owned / totals.total) * 100) : 0;

  const teamPieData = {
    labels: byTeam.map(t => t.team),
    datasets: [{
      data: byTeam.map(t => t.owned),
      backgroundColor: byTeam.map((t, i) => teamColor(t.team, i)),
      borderColor: '#1a1f2e',
      borderWidth: 2,
    }],
  };

  const yearBarData = {
    labels: byYear.map(y => y.year).reverse(),
    datasets: [
      {
        label: 'Owned',
        data: byYear.map(y => y.owned).reverse(),
        backgroundColor: '#4e79a7',
        borderRadius: 4,
      },
      {
        label: 'Not Owned',
        data: byYear.map(y => y.total - y.owned).reverse(),
        backgroundColor: '#2a3045',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: '#c8d0e0' } } },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { stacked: true, ticks: { color: '#8892a4' }, grid: { color: '#2a3045' } },
      y: { stacked: true, ticks: { color: '#8892a4' }, grid: { color: '#2a3045' } },
    },
  };

  return (
    <div className="page">
      <h1 className="page-title">{greeting}</h1>

      <div className="stat-grid">
        <StatCard label="Owned" value={totals.owned.toLocaleString()} sub={`${pct}% complete`} gradient="linear-gradient(135deg, #22c55e, #0d9488)" />
        <StatCard label="Rookies" value={totals.ownedRookies.toLocaleString()} sub={`of ${totals.rookies} total`} gradient="linear-gradient(135deg, #f97316, #eab308)" />
        <StatCard label="Autos" value={totals.ownedAutos.toLocaleString()} sub={`of ${totals.autos} total`} gradient="linear-gradient(135deg, #a855f7, #ec4899)" />
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
        {byYear.length > 0 && (
          <div className="chart-card">
            <h2 className="chart-title">Cards by Year</h2>
            <Bar data={yearBarData} options={barOptions} />
          </div>
        )}
      </div>

      {byProduct.length > 0 && (
        <div className="table-card">
          <h2 className="chart-title">Products</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Year</th><th>Product</th><th>Owned</th><th>Total</th><th>%</th></tr>
              </thead>
              <tbody>
                {byProduct.map((p, i) => (
                  <tr key={i}>
                    <td>{p.year}</td>
                    <td>{p.product}</td>
                    <td className="text-green">{p.owned}</td>
                    <td>{p.total}</td>
                    <td>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar" style={{ width: `${Math.round((p.owned / p.total) * 100)}%` }} />
                        <span>{Math.round((p.owned / p.total) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentlyOwned.length > 0 && (
        <div className="table-card">
          <h2 className="chart-title">Recently Added</h2>
          <div className="table-wrap">
            <table className="data-table recently-added-table" style={isMobile ? { tableLayout: 'fixed', width: '100%' } : undefined}>
              <thead>
                <tr>
                  <th className="ra-player-col" style={isMobile ? { width: '60%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}>
                    <span className="th-full">Player / Description</span><span className="th-short">Player</span>
                  </th>
                  <th className="ra-hide">Team</th>
                  <th className="ra-product-col" style={isMobile ? { width: '40%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}>Product</th>
                  <th className="ra-hide">Set</th>
                  <th className="ra-hide">Rookie</th>
                  <th className="ra-hide">Auto</th>
                </tr>
              </thead>
              <tbody>
                {recentlyOwned.map(c => (
                  <tr key={c.id} className="row-clickable" onClick={() => setCardDetail(c)} style={isMobile ? { borderBottom: '1px solid var(--border)' } : undefined}>
                    <td className="ra-player-col" style={isMobile ? { width: '60%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 'none' } : undefined}>{c.description}</td>
                    <td className="ra-hide"><TeamChip team_city={c.team_city} team_name={c.team_name} /></td>
                    <td className="ra-product-col text-muted" style={isMobile ? { width: '40%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 'none' } : undefined}>{[c.year, c.product].filter(Boolean).join(' ')}</td>
                    <td className="ra-hide text-muted">{c.set_name || ''}</td>
                    <td className="ra-hide">{c.rookie ? <span className="badge badge-orange">RC</span> : ''}</td>
                    <td className="ra-hide">{c.auto ? <span className="badge badge-purple">AUTO</span> : ''}</td>
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
          onToggleOwned={(card) => {
            const newOwned = !card.owned;
            setCardDetail(prev => prev ? { ...prev, owned: newOwned } : null);
            api.toggleOwned(card.id, newOwned, newOwned ? undefined : null).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
