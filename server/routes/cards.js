import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/authenticate.js';
import { normalizeCard as _normalizeCard } from '../utils/normalizeCard.js';

const router = Router();
router.use(authenticate);

function normalizeCard(raw, userId) {
  const base = _normalizeCard(raw);
  const toBool = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return v ? 1 : 0;
    return ['true', 'yes', 'y', '1', 'x'].includes(String(v).trim().toLowerCase()) ? 1 : 0;
  };
  const toInt = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };
  const get = (...keys) => {
    for (const k of keys)
      for (const rk of Object.keys(raw))
        if (rk.trim().toLowerCase() === k.toLowerCase()) return raw[rk];
    return null;
  };
  return { ...base, user_id: userId, owned: toBool(get('owned')), duplicates: toInt(get('duplicates', 'dups', 'duplicate')) || 0 };
}

const INSERT_SQL = `
  INSERT INTO cards (user_id, owned, card_number, set_name, description, team_city, team_name,
    rookie, auto, mem, serial, serial_of, thickness, year, product, grade, duplicates)
  VALUES (@user_id, @owned, @card_number, @set_name, @description, @team_city, @team_name,
    @rookie, @auto, @mem, @serial, @serial_of, @thickness, @year, @product, @grade, @duplicates)
`;

const UPDATE_SQL = `
  UPDATE cards SET owned=@owned, card_number=@card_number, set_name=@set_name,
    description=@description, team_city=@team_city, team_name=@team_name,
    rookie=@rookie, auto=@auto, mem=@mem, serial=@serial, serial_of=@serial_of,
    thickness=@thickness, year=@year, product=@product, grade=@grade, duplicates=@duplicates
  WHERE id=@id AND user_id=@user_id
`;

// GET /api/cards - list with optional filters
router.get('/', (req, res) => {
  const { year, product, owned, search, page = 1, limit = 200 } = req.query;
  let where = ['user_id = ?'];
  let params = [req.user.id];

  if (year) { where.push('year = ?'); params.push(year); }
  if (product) { where.push('product = ?'); params.push(product); }
  if (owned !== undefined && owned !== '') { where.push('owned = ?'); params.push(owned === 'true' || owned === '1' ? 1 : 0); }
  if (search) {
    where.push('(description LIKE ? OR team_city LIKE ? OR team_name LIKE ? OR card_number LIKE ? OR set_name LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  const whereClause = where.join(' AND ');
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as n FROM cards WHERE ${whereClause}`).get(...params).n;
  const cards = db.prepare(
    `SELECT * FROM cards WHERE ${whereClause} ORDER BY year DESC, product, CAST(card_number AS INTEGER), card_number LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ cards, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/cards/products - distinct year/product combos
router.get('/products', (req, res) => {
  const rows = db.prepare(
    'SELECT DISTINCT year, product, COUNT(*) as total, SUM(owned) as owned FROM cards WHERE user_id = ? GROUP BY year, product ORDER BY year DESC, product'
  ).all(req.user.id);
  res.json(rows);
});

// GET /api/cards/:id
router.get('/:id', (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

// POST /api/cards - add single card (upsert: mark owned or increment duplicates if card exists)
router.post('/', (req, res) => {
  const card = normalizeCard(req.body, req.user.id);

  if (card.card_number) {
    const existing = db.prepare(
      'SELECT id, owned FROM cards WHERE user_id = ? AND year = ? AND product = ? AND card_number = ? AND COALESCE(set_name, \'\') = COALESCE(?, \'\') LIMIT 1'
    ).get(req.user.id, card.year, card.product, card.card_number, card.set_name);

    if (existing) {
      if (!existing.owned) {
        db.prepare('UPDATE cards SET owned = 1 WHERE id = ?').run(existing.id);
        return res.json({ id: existing.id, action: 'marked_owned' });
      } else {
        db.prepare('UPDATE cards SET duplicates = duplicates + 1 WHERE id = ?').run(existing.id);
        return res.json({ id: existing.id, action: 'duplicated' });
      }
    }
  }

  const result = db.prepare(INSERT_SQL).run(card);
  res.json({ id: Number(result.lastInsertRowid), action: 'inserted', ...card });
});

// POST /api/cards/import - bulk import array of cards
router.post('/import', (req, res) => {
  const { cards } = req.body;
  if (!Array.isArray(cards) || cards.length === 0) return res.status(400).json({ error: 'No cards provided' });

  const insert = db.prepare(INSERT_SQL);
  db.exec('BEGIN');
  try {
    for (const raw of cards) {
      insert.run(normalizeCard(raw, req.user.id));
    }
    db.exec('COMMIT');
    res.json({ imported: cards.length });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cards/:id/owned - quick toggle owned, optionally update serial
router.patch('/:id/owned', (req, res) => {
  const { owned, serial } = req.body;
  if ('serial' in req.body) {
    const serialVal = serial !== null && serial !== '' ? Number(serial) : null;
    db.prepare('UPDATE cards SET owned = ?, serial = ? WHERE id = ? AND user_id = ?')
      .run(owned ? 1 : 0, serialVal, req.params.id, req.user.id);
  } else {
    db.prepare('UPDATE cards SET owned = ? WHERE id = ? AND user_id = ?').run(owned ? 1 : 0, req.params.id, req.user.id);
  }
  res.json({ ok: true });
});

// PUT /api/cards/:id - full update
router.put('/:id', (req, res) => {
  const card = { ...normalizeCard(req.body, req.user.id), id: Number(req.params.id), user_id: req.user.id };
  const result = db.prepare(UPDATE_SQL).run(card);
  if (result.changes === 0) return res.status(404).json({ error: 'Card not found' });
  res.json({ ok: true });
});

// DELETE /api/cards/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM cards WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Card not found' });
  res.json({ ok: true });
});

// DELETE /api/cards/product/all - delete all cards in a product
router.delete('/product/all', (req, res) => {
  const { year, product } = req.body;
  const result = db.prepare('DELETE FROM cards WHERE user_id = ? AND year = ? AND product = ?').run(req.user.id, year, product);
  res.json({ deleted: result.changes });
});

export default router;
