import React, { useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { api } from '../api.js';
import { formatTeam } from '../utils.js';
import { useAuth } from '../App.jsx';

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

const TEAM_COLORS = [
  '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f',
  '#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac',
  '#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd',
  '#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf',
];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
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

  useEffect(() => {
    api.getStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading stats...</div>;
  if (!stats) return <div className="page-error">Failed to load stats.</div>;

  const { totals, byTeam, byYear, byProduct, recentlyOwned, topPlayer, topSet } = stats;
  const pct = totals.total ? Math.round((totals.owned / totals.total) * 100) : 0;

  const teamPieData = {
    labels: byTeam.map(t => t.team),
    datasets: [{
      data: byTeam.map(t => t.owned),
      backgroundColor: TEAM_COLORS,
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
        <StatCard label="Owned" value={totals.owned.toLocaleString()} sub={`${pct}% complete`} color="#59a14f" />
        <StatCard label="Rookies" value={totals.ownedRookies.toLocaleString()} sub={`of ${totals.rookies} total`} color="#f28e2b" />
        <StatCard label="Autos" value={totals.ownedAutos.toLocaleString()} sub={`of ${totals.autos} total`} color="#b07aa1" />
        <StatCard label="Graded" value={totals.graded.toLocaleString()} color="#edc948" />
        <StatCard label="Duplicates" value={totals.duplicates.toLocaleString()} color="#9c755f" />
        {topPlayer && <StatCard label="Most Owned Player" value={topPlayer.name} sub={`${topPlayer.count} cards`} color="#76b7b2" />}
        {topSet && <StatCard label="Most Owned Set" value={topSet.name} sub={`${topSet.count} cards`} color="#e15759" />}
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
          <h2 className="chart-title">Recently Added (Owned)</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Player / Description</th><th>Team</th><th>Year</th><th>Product</th><th>Rookie</th><th>Auto</th></tr>
              </thead>
              <tbody>
                {recentlyOwned.map(c => (
                  <tr key={c.id}>
                    <td className="text-muted">{c.card_number}</td>
                    <td>{c.description}</td>
                    <td>{formatTeam(c.team_city, c.team_name)}</td>
                    <td>{c.year}</td>
                    <td>{c.product}</td>
                    <td>{c.rookie ? <span className="badge badge-orange">RC</span> : ''}</td>
                    <td>{c.auto ? <span className="badge badge-purple">AUTO</span> : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
