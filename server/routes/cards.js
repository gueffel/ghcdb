import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/authenticate.js';
import { normalizeCard as _normalizeCard } from '../utils/normalizeCard.js';
import { invalidateStatsCache } from './stats.js';

const router = Router();
router.use(authenticate);

// Wrap async route handlers so unhandled rejections become 500s instead of crashing the process
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

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
router.get('/', wrap(async (req, res) => {
  const { year, product, owned, wishlisted, rookie, auto, search, page = 1, limit = 200 } = req.query;
  let i = 1;
  const where = [`user_id = $${i++}`];
  const params = [req.user.id];

  if (year) { where.push(`year = $${i++}`); params.push(year); }
  if (product) { where.push(`product = $${i++}`); params.push(product); }
  if (owned !== undefined && owned !== '') {
    where.push(`owned = $${i++}`);
    params.push(owned === 'true' || owned === '1' ? 1 : 0);
  }
  if (wishlisted !== undefined && wishlisted !== '') {
    where.push(`wishlisted = $${i++}`);
    params.push(wishlisted === 'true' || wishlisted === '1' ? 1 : 0);
  }
  if (rookie !== undefined && rookie !== '') {
    where.push(`rookie = $${i++}`);
    params.push(rookie === '1' ? 1 : 0);
  }
  if (auto !== undefined && auto !== '') {
    where.push(`auto = $${i++}`);
    params.push(auto === '1' ? 1 : 0);
  }
  if (search) {
    // Cap tokens at 3 — each token generates 7 ILIKE conditions; more than 3 terms would
    // hit 21+ conditions per query and is rarely useful vs. a more specific search.
    const tokens = search.trim().split(/\s+/).filter(Boolean).slice(0, 3);
    const fields = ['description', 'team_city', 'team_name', 'card_number', 'set_name', 'product', 'year'];
    for (const token of tokens) {
      const s = `%${token}%`;
      const parts = fields.map(f => { params.push(s); return `${f} ILIKE $${i++}`; });
      where.push(`(${parts.join(' OR ')})`);
    }
  }

  const whereSQL = where.join(' AND ');
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(10000, Math.max(1, parseInt(limit) || 200));
  const offset = (parsedPage - 1) * parsedLimit;

  const [countRow] = await db.unsafe(`SELECT COUNT(*) as n FROM cards WHERE ${whereSQL}`, params);
  const cards = await db.unsafe(
    `SELECT * FROM cards WHERE ${whereSQL} ORDER BY ${CARD_ORDER} LIMIT $${i} OFFSET $${i+1}`,
    [...params, parsedLimit, offset]
  );

  res.json({ cards, total: Number(countRow.n), page: parsedPage, limit: parsedLimit });
}));

// GET /api/cards/products - distinct year/product combos
router.get('/products', wrap(async (req, res) => {
  const rows = await db`
    SELECT DISTINCT year, product, COUNT(*) as total, SUM(owned) as owned
    FROM cards WHERE user_id = ${req.user.id}
    GROUP BY year, product ORDER BY year DESC, product
  `;
  res.json(rows);
}));

// GET /api/cards/set-names?year=&product= - distinct set names for autocomplete
router.get('/set-names', wrap(async (req, res) => {
  const { year, product } = req.query;
  let rows;
  if (year && product) {
    rows = await db`
      SELECT DISTINCT set_name FROM cards
      WHERE user_id = ${req.user.id} AND set_name IS NOT NULL AND set_name != ''
        AND year = ${year} AND product = ${product}
      ORDER BY set_name LIMIT 500
    `;
  } else if (year) {
    rows = await db`
      SELECT DISTINCT set_name FROM cards
      WHERE user_id = ${req.user.id} AND set_name IS NOT NULL AND set_name != ''
        AND year = ${year}
      ORDER BY set_name LIMIT 500
    `;
  } else {
    rows = await db`
      SELECT DISTINCT set_name FROM cards
      WHERE user_id = ${req.user.id} AND set_name IS NOT NULL AND set_name != ''
      ORDER BY set_name LIMIT 500
    `;
  }
  res.json(rows.map(r => r.set_name));
}));

// GET /api/cards/:id
router.get('/:id', wrap(async (req, res) => {
  const [card] = await db`SELECT * FROM cards WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
}));

// POST /api/cards - add single card (upsert: mark owned or increment duplicates if card exists)
router.post('/', wrap(async (req, res) => {
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
        await db`UPDATE cards SET owned = 1, owned_at = NOW() WHERE id = ${existing.id}`;
        return res.json({ id: existing.id, action: 'marked_owned' });
      } else {
        await db`UPDATE cards SET duplicates = duplicates + 1 WHERE id = ${existing.id}`;
        return res.json({ id: existing.id, action: 'duplicated' });
      }
    }
  }

  const [row] = await db`
    INSERT INTO cards (user_id, owned, card_number, set_name, description, team_city, team_name,
      rookie, auto, mem, serial, serial_of, thickness, year, product, grade, duplicates, owned_at)
    VALUES (${card.user_id}, ${card.owned}, ${card.card_number}, ${card.set_name}, ${card.description},
      ${card.team_city}, ${card.team_name}, ${card.rookie}, ${card.auto}, ${card.mem},
      ${card.serial}, ${card.serial_of}, ${card.thickness}, ${card.year}, ${card.product},
      ${card.grade}, ${card.duplicates}, ${card.owned ? new Date() : null})
    RETURNING id
  `;
  res.json({ id: row.id, action: 'inserted', ...card });
}));

// POST /api/cards/import - bulk import array of cards
const IMPORT_COLS = ['user_id', 'owned', 'card_number', 'set_name', 'description', 'team_city', 'team_name', 'rookie', 'auto', 'mem', 'serial', 'serial_of', 'thickness', 'year', 'product', 'grade', 'duplicates'];
const IMPORT_CHUNK = Math.floor(65534 / IMPORT_COLS.length); // ~3855
router.post('/import', async (req, res) => {
  const { cards } = req.body;
  if (!Array.isArray(cards) || cards.length === 0) return res.status(400).json({ error: 'No cards provided' });
  if (cards.length > 10000) return res.status(400).json({ error: 'Import limit is 10,000 cards per request' });

  try {
    const normalized = cards.map(raw => normalizeCard(raw, req.user.id));
    await db.begin(async sql => {
      for (let i = 0; i < normalized.length; i += IMPORT_CHUNK) {
        await sql`INSERT INTO cards ${sql(normalized.slice(i, i + IMPORT_CHUNK), ...IMPORT_COLS)}`;
      }
    });
    res.json({ imported: cards.length });
  } catch (err) {
    console.error('Card import error:', err);
    res.status(500).json({ error: 'Import failed. Check your data and try again.' });
  }
});

// PATCH /api/cards/:id/owned - quick toggle owned, optionally update serial
router.patch('/:id/owned', wrap(async (req, res) => {
  const { owned, serial } = req.body;
  const id = req.params.id;
  const uid = req.user.id;
  const serialVal = 'serial' in req.body ? (serial !== null && serial !== '' ? Number(serial) : null) : undefined;
  if (owned) {
    if (serialVal !== undefined) {
      await db`UPDATE cards SET owned = 1, wishlisted = 0, serial = ${serialVal}, owned_at = COALESCE(owned_at, NOW()) WHERE id = ${id} AND user_id = ${uid}`;
    } else {
      await db`UPDATE cards SET owned = 1, wishlisted = 0, owned_at = COALESCE(owned_at, NOW()) WHERE id = ${id} AND user_id = ${uid}`;
    }
    invalidateStatsCache(uid);
  } else {
    if (serialVal !== undefined) {
      await db`UPDATE cards SET owned = 0, serial = ${serialVal}, owned_at = NULL WHERE id = ${id} AND user_id = ${uid}`;
    } else {
      await db`UPDATE cards SET owned = 0, owned_at = NULL WHERE id = ${id} AND user_id = ${uid}`;
    }
  }
  res.json({ ok: true });
}));

// PATCH /api/cards/:id/wishlist - toggle wishlisted
router.patch('/:id/wishlist', wrap(async (req, res) => {
  const { wishlisted } = req.body;
  await db`UPDATE cards SET wishlisted = ${wishlisted ? 1 : 0} WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
  res.json({ ok: true });
}));

// PUT /api/cards/:id - full update
router.put('/:id', wrap(async (req, res) => {
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
}));

// DELETE /api/cards/:id
router.delete('/:id', wrap(async (req, res) => {
  const result = await db`DELETE FROM cards WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
  if (result.count === '0') return res.status(404).json({ error: 'Card not found' });
  res.json({ ok: true });
}));

// DELETE /api/cards/product/all - delete all cards in a product
router.delete('/product/all', wrap(async (req, res) => {
  const { year, product } = req.body;
  const result = await db`DELETE FROM cards WHERE user_id = ${req.user.id} AND year = ${year} AND product = ${product}`;
  res.json({ deleted: Number(result.count) });
}));

export default router;
