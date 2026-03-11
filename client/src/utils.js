export function formatTeam(team_city, team_name) {
  const cities = (team_city || '').split('/').map(s => s.trim());
  const names = (team_name || '').split('/').map(s => s.trim());
  const seen = new Set();
  const teams = [];
  const len = Math.max(cities.length, names.length);
  for (let i = 0; i < len; i++) {
    const city = cities[i] || '';
    const name = names[i] || '';
    const team = [city, name].filter(Boolean).join(' ');
    if (team && !seen.has(team)) {
      seen.add(team);
      teams.push(team);
    }
  }
  return teams.join(', ');
}
