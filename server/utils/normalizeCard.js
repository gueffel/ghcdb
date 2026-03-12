export function normalizeCard(raw) {
  const get = (...keys) => {
    for (const k of keys) {
      for (const rk of Object.keys(raw)) {
        if (rk.trim().toLowerCase() === k.toLowerCase()) return raw[rk];
      }
    }
    return null;
  };

  const toBool = (v, keywords = []) => {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return v ? 1 : 0;
    const s = String(v).trim().toLowerCase();
    if (['true', 'yes', 'y', '1', 'x'].includes(s)) return 1;
    if (keywords.some(k => s.includes(k.toLowerCase()))) return 1;
    return 0;
  };

  const toInt = (v) => {
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  };

  return {
    card_number: get('card #', 'card#', 'card number', 'cardnumber', 'card_number', 'card') || null,
    set_name:    get('set name', 'setname', 'set_name') || null,
    description: get('description', 'player', 'player name', 'name') || null,
    team_city:   get('team city', 'teamcity', 'team_city', 'city') || null,
    team_name:   get('team name', 'teamname', 'team_name', 'team') || null,
    rookie:      toBool(get('rookie', 'rc'), ['rookie']),
    auto:        toBool(get('auto', 'autograph', 'au'), ['auto']),
    mem:         get('mem', 'memorabilia', 'relic') || null,
    serial:      toInt(get('serial', 'serial number', 'serial#')),
    serial_of:   toInt(get('of', 'serial of', 'serial_of', 'numbered to', 'print run')),
    thickness:   get('thickness', 'thick') || null,
    year:        get('year', 'season') || null,
    product:     get('product', 'set', 'product name') || null,
    grade:       get('grade', 'graded') || null,
  };
}
