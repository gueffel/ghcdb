import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import { normalizeCard } from '../utils/normalizeCard.js';

const router = Router();
router.use(authenticate);

const CARD_ORDER = `(CASE WHEN card_number ~ '^[0-9]+$' THEN card_number::int ELSE NULL END) NULLS LAST, card_number`;

// GET /api/catalog — list all available sets with card counts
router.get('/', async (req, res) => {
  const sets = await db`
    SELECT year, product, COUNT(*) as total,
      SUM(rookie) as rookies, SUM(auto) as autos
    FROM catalog_cards
    GROUP BY year, product
    ORDER BY year DESC, product
  `;
  res.json(sets);
});

// GET /api/catalog/cards?year=&product= — all cards in a catalog set
router.get('/cards', async (req, res) => {
  const { year, product } = req.query;
  if (!year || !product) return res.status(400).json({ error: 'year and product required' });
  const cards = await db.unsafe(
    `SELECT * FROM catalog_cards WHERE year = $1 AND product = $2 ORDER BY ${CARD_ORDER}`,
    [year, product]
  );
  res.json(cards);
});

// POST /api/catalog/import — admin: import a set to the catalog
router.post('/import', requireAdmin, async (req, res) => {
  const { cards, replaceExisting } = req.body;
  if (!Array.isArray(cards) || cards.length === 0) return res.status(400).json({ error: 'No cards provided' });

  const first = normalizeCard(cards[0]);
  if (!first.year || !first.product) return res.status(400).json({ error: 'Cards must have year and product columns' });

  try {
    await db.begin(async sql => {
      if (replaceExisting) {
        await sql`DELETE FROM catalog_cards WHERE year = ${first.year} AND product = ${first.product}`;
      }
      for (const raw of cards) {
        const c = normalizeCard(raw);
        await sql`
          INSERT INTO catalog_cards (card_number, set_name, description, team_city, team_name,
            rookie, auto, mem, serial, serial_of, thickness, year, product, grade)
          VALUES (${c.card_number}, ${c.set_name}, ${c.description}, ${c.team_city}, ${c.team_name},
            ${c.rookie}, ${c.auto}, ${c.mem}, ${c.serial}, ${c.serial_of},
            ${c.thickness}, ${c.year}, ${c.product}, ${c.grade})
        `;
      }
    });
    res.json({ imported: cards.length, year: first.year, product: first.product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/catalog/card/:id — admin: update a single catalog card
router.put('/card/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const c = normalizeCard(req.body);
  const result = await db`
    UPDATE catalog_cards SET card_number=${c.card_number}, set_name=${c.set_name},
      description=${c.description}, team_city=${c.team_city}, team_name=${c.team_name},
      rookie=${c.rookie}, auto=${c.auto}, mem=${c.mem}, serial=${c.serial},
      serial_of=${c.serial_of}, thickness=${c.thickness}, year=${c.year},
      product=${c.product}, grade=${c.grade}
    WHERE id=${id}
  `;
  if (result.count === '0') return res.status(404).json({ error: 'Card not found' });
  res.json({ ok: true });
});

// DELETE /api/catalog/set — admin: remove a set from the catalog
router.delete('/set', requireAdmin, async (req, res) => {
  const { year, product } = req.body;
  const result = await db`DELETE FROM catalog_cards WHERE year = ${year} AND product = ${product}`;
  res.json({ deleted: Number(result.count) });
});

// POST /api/catalog/add-to-collection — user: copy a catalog set into their cards
router.post('/add-to-collection', async (req, res) => {
  const { year, product, mode = 'add' } = req.body;
  const uid = req.user.id;

  const catalogCards = await db`SELECT * FROM catalog_cards WHERE year = ${year} AND product = ${product}`;
  if (catalogCards.length === 0) return res.status(404).json({ error: 'Set not found in catalog' });

  const [countRow] = await db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND year = ${year} AND product = ${product}`;
  if (Number(countRow.n) > 0 && mode === 'add') {
    return res.status(409).json({ error: 'already_exists', count: Number(countRow.n) });
  }

  try {
    await db.begin(async sql => {
      if (mode === 'replace') {
        await sql`DELETE FROM cards WHERE user_id = ${uid} AND year = ${year} AND product = ${product}`;
      }
      for (const c of catalogCards) {
        await sql`
          INSERT INTO cards (user_id, owned, card_number, set_name, description, team_city, team_name,
            rookie, auto, mem, serial, serial_of, thickness, year, product, grade, duplicates)
          VALUES (${uid}, 0, ${c.card_number}, ${c.set_name}, ${c.description}, ${c.team_city},
            ${c.team_name}, ${c.rookie}, ${c.auto}, ${c.mem}, ${c.serial}, ${c.serial_of},
            ${c.thickness}, ${c.year}, ${c.product}, ${c.grade}, 0)
        `;
      }
    });
    res.json({ added: catalogCards.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
