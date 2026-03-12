import React from 'react';
import { getTeamMeta } from '../nhlTeams.js';
import { formatTeam } from '../utils.js';

const CDN = 'https://assets.nhle.com/logos/nhl/svg';

export default function TeamChip({ team_city, team_name }) {
  if (!team_city && !team_name) return null;
  const meta = getTeamMeta(team_city, team_name);
  const label = formatTeam(team_city, team_name);
  return (
    <span className="team-chip-wrap">
      {meta && (
        <img
          className="team-logo"
          src={`${CDN}/${meta.abbrev}_light.svg`}
          alt=""
          loading="lazy"
        />
      )}
      {label}
    </span>
  );
}
