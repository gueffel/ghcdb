export const NHL_TEAMS = [
  { city: 'Anaheim',      name: 'Ducks',          abbrev: 'ANA', color: '#F47A38' },
  { city: 'Arizona',      name: 'Coyotes',        abbrev: 'ARI', color: '#8C2633' },
  { city: 'Boston',       name: 'Bruins',         abbrev: 'BOS', color: '#FFB81C' },
  { city: 'Buffalo',      name: 'Sabres',         abbrev: 'BUF', color: '#003087' },
  { city: 'Calgary',      name: 'Flames',         abbrev: 'CGY', color: '#C8102E' },
  { city: 'Carolina',     name: 'Hurricanes',     abbrev: 'CAR', color: '#CC0000' },
  { city: 'Chicago',      name: 'Blackhawks',     abbrev: 'CHI', color: '#CF0A2C' },
  { city: 'Colorado',     name: 'Avalanche',      abbrev: 'COL', color: '#6F263D' },
  { city: 'Columbus',     name: 'Blue Jackets',   abbrev: 'CBJ', color: '#002654' },
  { city: 'Dallas',       name: 'Stars',          abbrev: 'DAL', color: '#006847' },
  { city: 'Detroit',      name: 'Red Wings',      abbrev: 'DET', color: '#CE1126' },
  { city: 'Edmonton',     name: 'Oilers',         abbrev: 'EDM', color: '#FF4C00' },
  { city: 'Florida',      name: 'Panthers',       abbrev: 'FLA', color: '#041E42' },
  { city: 'Los Angeles',  name: 'Kings',          abbrev: 'LAK', color: '#A2AAAD' },
  { city: 'Minnesota',    name: 'Wild',           abbrev: 'MIN', color: '#154734' },
  { city: 'Montreal',     name: 'Canadiens',      abbrev: 'MTL', color: '#AF1E2D' },
  { city: 'Nashville',    name: 'Predators',      abbrev: 'NSH', color: '#FFB81C' },
  { city: 'New Jersey',   name: 'Devils',         abbrev: 'NJD', color: '#CE1126' },
  { city: 'New York',     name: 'Islanders',      abbrev: 'NYI', color: '#F47D30' },
  { city: 'New York',     name: 'Rangers',        abbrev: 'NYR', color: '#0038A8' },
  { city: 'Ottawa',       name: 'Senators',       abbrev: 'OTT', color: '#C2912C' },
  { city: 'Philadelphia', name: 'Flyers',         abbrev: 'PHI', color: '#F74902' },
  { city: 'Phoenix',      name: 'Coyotes',        abbrev: 'PHX', color: '#8C2633' },
  { city: 'Pittsburgh',   name: 'Penguins',       abbrev: 'PIT', color: '#FCB514' },
  { city: 'San Jose',     name: 'Sharks',         abbrev: 'SJS', color: '#006D75' },
  { city: 'Seattle',      name: 'Kraken',         abbrev: 'SEA', color: '#68A2B9' },
  { city: 'St. Louis',    name: 'Blues',          abbrev: 'STL', color: '#002F87' },
  { city: 'Tampa Bay',    name: 'Lightning',      abbrev: 'TBL', color: '#002868' },
  { city: 'Toronto',      name: 'Maple Leafs',    abbrev: 'TOR', color: '#00205B' },
  { city: 'Utah',         name: 'Hockey Club',    abbrev: 'UTA', color: '#6F263D' },
  { city: 'Vancouver',    name: 'Canucks',        abbrev: 'VAN', color: '#00843D' },
  { city: 'Vegas',        name: 'Golden Knights', abbrev: 'VGK', color: '#B4975A' },
  { city: 'Washington',   name: 'Capitals',       abbrev: 'WSH', color: '#C8102E' },
  { city: 'Winnipeg',     name: 'Jets',           abbrev: 'WPG', color: '#004C97' },
];

export const NHL_CITIES = [...new Set(NHL_TEAMS.map(t => t.city))];
export const NHL_NAMES  = [...new Set(NHL_TEAMS.map(t => t.name))];

export function getTeamMeta(city, name) {
  const c = (city || '').toLowerCase();
  const n = (name || '').toLowerCase();
  return NHL_TEAMS.find(t => t.city.toLowerCase() === c && t.name.toLowerCase() === n) || null;
}

// Keyed by "City Name" — used by Overview.jsx pie chart
export const NHL_TEAM_COLORS = Object.fromEntries(
  NHL_TEAMS.map(t => [`${t.city} ${t.name}`, t.color])
);

export function autoFillTeam(field, value, setForm) {
  if (field === 'team_city') {
    const matches = NHL_TEAMS.filter(t => t.city.toLowerCase() === value.toLowerCase());
    if (matches.length === 1) setForm(f => ({ ...f, team_city: value, team_name: matches[0].name }));
    else setForm(f => ({ ...f, team_city: value }));
  } else {
    const matches = NHL_TEAMS.filter(t => t.name.toLowerCase() === value.toLowerCase());
    if (matches.length === 1) setForm(f => ({ ...f, team_name: value, team_city: matches[0].city }));
    else setForm(f => ({ ...f, team_name: value }));
  }
}
