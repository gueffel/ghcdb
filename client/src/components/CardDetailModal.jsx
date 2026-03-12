import React from 'react';
import TeamChip from './TeamChip.jsx';
import { getTeamMeta } from '../nhlTeams.js';

export default function CardDetailModal({ card, onClose, onEdit, onToggleOwned }) {
  const teamMeta = getTeamMeta(card.team_city, card.team_name);
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card-detail-modal" onClick={e => e.stopPropagation()} style={teamMeta ? { background: `linear-gradient(160deg, var(--bg2) 55%, ${teamMeta.color}1a 100%)` } : undefined}>
        <div className="modal-header">
          <div className="modal-header-left">
            {teamMeta && (
              <img
                className="modal-team-logo"
                src={`https://assets.nhle.com/logos/nhl/svg/${teamMeta.abbrev}_light.svg`}
                alt={`${card.team_city} ${card.team_name}`}
              />
            )}
            <div>
              <h2 className="modal-title">{card.description || 'Card Detail'}</h2>
              {card.card_number && <div className="card-detail-subtitle">#{card.card_number}</div>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
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
            {card.duplicates > 0 && field('Duplicates', card.duplicates)}
          </div>

          <div className="card-detail-footer-row">
            <div className="card-detail-badges">
              {!!card.rookie && <span className="badge badge-orange">RC</span>}
              {!!card.auto && <span className="badge badge-purple">AUTO</span>}
            </div>
            {onToggleOwned ? (
              <button
                className={`card-detail-owned-btn ${card.owned ? 'owned' : ''}`}
                onClick={() => onToggleOwned(card)}
              >
                {card.owned ? '✓ Owned' : '○ Not owned'}
              </button>
            ) : (
              <span className={`badge ${card.owned ? 'badge-green' : ''}`} style={!card.owned ? { color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' } : {}}>
                {card.owned ? '✓ Owned' : '○ Not owned'}
              </span>
            )}
          </div>
        </div>

        {onEdit && (
          <div className="modal-footer">
            <div />
            <div className="modal-footer-right">
              <button className="btn-ghost" onClick={onClose}>Close</button>
              <button className="btn-primary" onClick={() => onEdit(card)}>Edit Card</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
