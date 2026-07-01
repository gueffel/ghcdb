import React, { useState, useEffect } from 'react';
import TeamChip from './TeamChip.jsx';
import { getTeamMeta } from '../nhlTeams.js';

const rosterCache = {}; // keyed by "season::team" — one fetch per team/season

function toNhlSeason(year) {
  const m = year?.match(/^(\d{4})-(\d{2,4})$/);
  if (!m) return null;
  const start = m[1];
  const end = m[2].length === 2 ? start.slice(0, 2) + m[2] : m[2];
  return start + end;
}

async function getRoster(teamAbbrev, season) {
  const key = `${season}::${teamAbbrev}`;
  if (key in rosterCache) return rosterCache[key];
  rosterCache[key] = fetch(`/nhl-api/v1/roster/${teamAbbrev}/${season}`)
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then(data => [...(data.forwards || []), ...(data.defensemen || []), ...(data.goalies || [])])
    .catch(err => { console.warn('[headshot] roster fetch failed:', teamAbbrev, season, err.message); return []; });
  return rosterCache[key];
}

async function searchPlayerId(playerName) {
  try {
    const res = await fetch(`/nhl-search/api/v1/search/player?culture=en-us&limit=5&q=${encodeURIComponent(playerName)}`);
    if (!res.ok) throw new Error();
    const results = await res.json();
    if (!results?.length) return null;
    const input = playerName.toLowerCase().trim();
    const match = results.find(r => {
      const name = (r.name || '').toLowerCase();
      const parts = input.split(/\s+/).filter(Boolean);
      return parts.length > 0 && parts.every(part => name.includes(part));
    });
    return match?.playerId || null;
  } catch {
    return null;
  }
}

async function resolveHeadshot(teamAbbrev, season, playerName) {
  const players = await getRoster(teamAbbrev, season);
  const input = playerName.toLowerCase().trim();
  const rosterMatch = players.find(p => {
    const full = `${p.firstName.default} ${p.lastName.default}`.toLowerCase();
    if (full === input) return true;
    const parts = input.split(/\s+/).filter(Boolean);
    return parts.length > 0 && parts.every(part => full.includes(part));
  });
  if (rosterMatch?.headshot) return rosterMatch.headshot;

  // Player not on current roster (traded, offseason) — search by name for their ID
  const playerId = await searchPlayerId(playerName);
  if (!playerId) return null;
  return `https://assets.nhle.com/mugs/nhl/${season}/${teamAbbrev}/${playerId}.png`;
}

export default function CardDetailModal({ card, onClose, onEdit, onToggleOwned, onToggleWishlist }) {
  const teamMeta = getTeamMeta(card.team_city, card.team_name);
  const [justOwned, setJustOwned] = useState(false);
  const [closing, setClosing] = useState(false);
  const [headshot, setHeadshot] = useState(null);
  const [headshotLoading, setHeadshotLoading] = useState(false);
  const [headshotFailed, setHeadshotFailed] = useState(false);

  const willAttemptHeadshot = !!(teamMeta?.abbrev && toNhlSeason(card.year) && card.description);

  useEffect(() => {
    setHeadshot(null);
    setHeadshotFailed(false);
    const season = toNhlSeason(card.year);
    if (!teamMeta?.abbrev || !season || !card.description) return;
    setHeadshotLoading(true);
    resolveHeadshot(teamMeta.abbrev, season, card.description).then(url => {
      setHeadshotLoading(false);
      if (url) setHeadshot(url);
      else setHeadshotFailed(true);
    });
  }, [card.id]);
  const close = () => { setClosing(true); setTimeout(onClose, 180); };
  const serialDisplay = card.serial && card.serial_of
    ? `${card.serial}/${card.serial_of}`
    : card.serial_of ? `/${card.serial_of}` : null;

  const field = (label, value) => (
    <div className="card-detail-row" key={label}>
      <span className="card-detail-label">{label}</span>
      <span className="card-detail-value">{value}</span>
    </div>
  );

  return (
    <div className={`modal-overlay${closing ? ' closing' : ''}`} onClick={close}>
      <div className="modal card-detail-modal" onClick={e => e.stopPropagation()} style={teamMeta ? { background: `linear-gradient(160deg, var(--bg2) 55%, ${teamMeta.color}1a 100%)` } : undefined}>
        <div className="modal-header">
          <div className="modal-header-left">
            {willAttemptHeadshot ? (
              <div
                className="modal-player-headshot-wrap"
                style={{ background: headshot && !headshotFailed ? `linear-gradient(170deg, #ffffff18 0%, ${teamMeta.color}cc 100%)` : 'transparent' }}
              >
                {headshotLoading && <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />}
                {headshot && !headshotFailed && (
                  <img
                    className="modal-player-headshot"
                    src={headshot}
                    alt={card.description}
                    onError={() => setHeadshotFailed(true)}
                  />
                )}
                {(headshotFailed || (!headshotLoading && !headshot)) && teamMeta && (
                  <img
                    className="modal-team-logo"
                    src={`https://assets.nhle.com/logos/nhl/svg/${teamMeta.abbrev}_light.svg`}
                    alt={`${card.team_city} ${card.team_name}`}
                    style={{ width: 44, height: 44 }}
                  />
                )}
              </div>
            ) : teamMeta ? (
              <img
                className="modal-team-logo"
                src={`https://assets.nhle.com/logos/nhl/svg/${teamMeta.abbrev}_light.svg`}
                alt={`${card.team_city} ${card.team_name}`}
              />
            ) : null}
            <div>
              <h2 className="modal-title">{card.description || 'Card Detail'}</h2>
              {card.card_number && <div className="card-detail-subtitle">#{card.card_number}</div>}
            </div>
          </div>
          <button className="modal-close" onClick={close}>✕</button>
        </div>
        <div className="card-detail-body">
          <div className="card-detail-grid">
            {card.set_name && field('Set', card.set_name)}
            {(card.team_city || card.team_name) && field('Team', <TeamChip team_city={card.team_city} team_name={card.team_name} />)}
            {card.year && field('Year', card.year)}
            {card.product && field('Product', card.product)}
            {serialDisplay && field('Serial', serialDisplay)}
            {card.grade && field('Grade', card.grade)}
            {card.mem && field('Mem', card.mem)}
            {card.thickness && field('Thickness', `${card.thickness}pt`)}
            {card.duplicates > 0 && field('Duplicates', card.duplicates)}
          </div>

          <div className="card-detail-footer-row">
            <div className="card-detail-badges">
              {!!card.rookie && <span className="badge badge-orange">RC</span>}
              {!!card.auto && <span className="badge badge-purple">AUTO</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {onToggleWishlist && !card.owned && (
                <button
                  className={`card-detail-owned-btn${card.wishlisted ? ' wishlisted' : ''}`}
                  onClick={() => onToggleWishlist(card)}
                >
                  {card.wishlisted ? '♥ Wishlisted' : '♥ Add to wishlist'}
                </button>
              )}
              {onToggleOwned ? (
                <button
                  className={`card-detail-owned-btn ${card.owned ? 'owned' : ''} ${justOwned ? 'just-owned' : ''}`}
                  onClick={() => { if (!card.owned) setJustOwned(true); onToggleOwned(card); }}
                  onAnimationEnd={() => setJustOwned(false)}
                >
                  {card.owned ? '✓ Owned' : '○ Mark as owned'}
                </button>
              ) : (
                <span className={`badge ${card.owned ? 'badge-green' : ''}`} style={!card.owned ? { color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' } : {}}>
                  {card.owned ? '✓ Owned' : '○ Not owned'}
                </span>
              )}
            </div>
          </div>
        </div>

        {onEdit && (
          <div className="modal-footer">
            <div />
            <div className="modal-footer-right">
              <button className="btn-ghost" onClick={close}>Close</button>
              <button className="btn-primary" onClick={() => onEdit(card)}>Edit Card</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
