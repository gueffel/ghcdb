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

// Numeric-aware ORDER BY for card_number (safe for PostgreSQL)
const CARD_ORDER = `year DESC, product, (CASE WHEN card_number ~ '^[0-9]+$' THEN card_number::int ELSE NULL END) NULLS LAST, card_number`;

// GET /api/cards - list with optional filters
router.get('/', async (req, res) => {
  const { year, product, owned, search, page = 1, limit = 200 } = req.query;
  let i = 1;
  const where = [`user_id = $${i++}`];
  const params = [req.user.id];

  if (year) { where.push(`year = $${i++}`); params.push(year); }
  if (product) { where.push(`product = $${i++}`); params.push(product); }
  if (owned !== undefined && owned !== '') {
    where.push(`owned = $${i++}`);
    params.push(owned === 'true' || owned === '1' ? 1 : 0);
  }
  if (search) {
    where.push(`(description ILIKE $${i} OR team_city ILIKE $${i+1} OR team_name ILIKE $${i+2} OR card_number ILIKE $${i+3} OR set_name ILIKE $${i+4})`);
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
    i += 5;
  }

  const whereSQL = where.join(' AND ');
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [countRow] = await db.unsafe(`SELECT COUNT(*) as n FROM cards WHERE ${whereSQL}`, params);
  const cards = await db.unsafe(
    `SELECT * FROM cards WHERE ${whereSQL} ORDER BY ${CARD_ORDER} LIMIT $${i} OFFSET $${i+1}`,
    [...params, parseInt(limit), offset]
  );

  res.json({ cards, total: Number(countRow.n), page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/cards/products - distinct year/product combos
router.get('/products', async (req, res) => {
  const rows = await db`
    SELECT DISTINCT year, product, COUNT(*) as total, SUM(owned) as owned
    FROM cards WHERE user_id = ${req.user.id}
    GROUP BY year, product ORDER BY year DESC, product
  `;
  res.json(rows);
});

// GET /api/cards/:id
router.get('/:id', async (req, res) => {
  const [card] = await db`SELECT * FROM cards WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

// POST /api/cards - add single card (upsert: mark owned or increment duplicates if card exists)
router.post('/', async (req, res) => {
  const card = normalizeCard(req.body, req.user.id);

  if (card.card_number) {
    const [existing] = await db`
      SELECT id, owned FROM cards
      WHERE user_id = ${req.user.id} AND year = ${card.year} AND product = ${card.product}
        AND card_number = ${card.card_number}
        AND COALESCE(set_name, '') = COALESCE(${card.set_name}, '')
      LIMIT 1
    `;
    if (existing) {
      if (!existing.owned) {
        await db`UPDATE cards SET owned = 1 WHERE id = ${existing.id}`;
        return res.json({ id: existing.id, action: 'marked_owned' });
      } else {
        await db`UPDATE cards SET duplicates = duplicates + 1 WHERE id = ${existing.id}`;
        return res.json({ id: existing.id, action: 'duplicated' });
      }
    }
  }

  const [row] = await db`
    INSERT INTO cards (user_id, owned, card_number, set_name, description, team_city, team_name,
      rookie, auto, mem, serial, serial_of, thickness, year, product, grade, duplicates)
    VALUES (${card.user_id}, ${card.owned}, ${card.card_number}, ${card.set_name}, ${card.description},
      ${card.team_city}, ${card.team_name}, ${card.rookie}, ${card.auto}, ${card.mem},
      ${card.serial}, ${card.serial_of}, ${card.thickness}, ${card.year}, ${card.product},
      ${card.grade}, ${card.duplicates})
    RETURNING id
  `;
  res.json({ id: row.id, action: 'inserted', ...card });
});

// POST /api/cards/import - bulk import array of cards
router.post('/import', async (req, res) => {
  const { cards } = req.body;
  if (!Array.isArray(cards) || cards.length === 0) return res.status(400).json({ error: 'No cards provided' });

  try {
    await db.begin(async sql => {
      for (const raw of cards) {
        const c = normalizeCard(raw, req.user.id);
        await sql`
          INSERT INTO cards (user_id, owned, card_number, set_name, description, team_city, team_name,
            rookie, auto, mem, serial, serial_of, thickness, year, product, grade, duplicates)
          VALUES (${c.user_id}, ${c.owned}, ${c.card_number}, ${c.set_name}, ${c.description},
            ${c.team_city}, ${c.team_name}, ${c.rookie}, ${c.auto}, ${c.mem},
            ${c.serial}, ${c.serial_of}, ${c.thickness}, ${c.year}, ${c.product},
            ${c.grade}, ${c.duplicates})
        `;
      }
    });
    res.json({ imported: cards.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cards/:id/owned - quick toggle owned, optionally update serial
router.patch('/:id/owned', async (req, res) => {
  const { owned, serial } = req.body;
  if ('serial' in req.body) {
    const serialVal = serial !== null && serial !== '' ? Number(serial) : null;
    await db`UPDATE cards SET owned = ${owned ? 1 : 0}, serial = ${serialVal} WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
  } else {
    await db`UPDATE cards SET owned = ${owned ? 1 : 0} WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
  }
  res.json({ ok: true });
});

// PUT /api/cards/:id - full update
router.put('/:id', async (req, res) => {
  const c = { ...normalizeCard(req.body, req.user.id), id: Number(req.params.id) };
  const result = await db`
    UPDATE cards SET owned=${c.owned}, card_number=${c.card_number}, set_name=${c.set_name},
      description=${c.description}, team_city=${c.team_city}, team_name=${c.team_name},
      rookie=${c.rookie}, auto=${c.auto}, mem=${c.mem}, serial=${c.serial},
      serial_of=${c.serial_of}, thickness=${c.thickness}, year=${c.year},
      product=${c.product}, grade=${c.grade}, duplicates=${c.duplicates}
    WHERE id=${c.id} AND user_id=${req.user.id}
  `;
  if (result.count === '0') return res.status(404).json({ error: 'Card not found' });
  res.json({ ok: true });
});

// DELETE /api/cards/:id
router.delete('/:id', async (req, res) => {
  const result = await db`DELETE FROM cards WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
  if (result.count === '0') return res.status(404).json({ error: 'Card not found' });
  res.json({ ok: true });
});

// DELETE /api/cards/product/all - delete all cards in a product
router.delete('/product/all', async (req, res) => {
  const { year, product } = req.body;
  const result = await db`DELETE FROM cards WHERE user_id = ${req.user.id} AND year = ${year} AND product = ${product}`;
  res.json({ deleted: Number(result.count) });
});

export default router;
