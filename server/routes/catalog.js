import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import { normalizeCard } from '../utils/normalizeCard.js';

const router = Router();
router.use(authenticate);

const CATALOG_INSERT = `
  INSERT INTO catalog_cards (card_number, set_name, description, team_city, team_name,
    rookie, auto, mem, serial, serial_of, thickness, year, product, grade)
  VALUES (@card_number, @set_name, @description, @team_city, @team_name,
    @rookie, @auto, @mem, @serial, @serial_of, @thickness, @year, @product, @grade)
`;

// GET /api/catalog — list all available sets with card counts
router.get('/', (req, res) => {
  const sets = db.prepare(`
    SELECT year, product, COUNT(*) as total,
      SUM(rookie) as rookies, SUM(auto) as autos
    FROM catalog_cards
    GROUP BY year, product
    ORDER BY year DESC, product
  `).all();
  res.json(sets);
});

// GET /api/catalog/cards?year=&product= — all cards in a catalog set
router.get('/cards', (req, res) => {
  const { year, product } = req.query;
  if (!year || !product) return res.status(400).json({ error: 'year and product required' });
  const cards = db.prepare(
    'SELECT * FROM catalog_cards WHERE year = ? AND product = ? ORDER BY CAST(card_number AS INTEGER), card_number'
  ).all(year, product);
  res.json(cards);
});

// POST /api/catalog/import — admin: import a set to the catalog
router.post('/import', requireAdmin, (req, res) => {
  const { cards, replaceExisting } = req.body;
  if (!Array.isArray(cards) || cards.length === 0) return res.status(400).json({ error: 'No cards provided' });

  const first = normalizeCard(cards[0]);
  if (!first.year || !first.product) return res.status(400).json({ error: 'Cards must have year and product columns' });

  const insert = db.prepare(CATALOG_INSERT);
  db.exec('BEGIN');
  try {
    if (replaceExisting) {
      db.prepare('DELETE FROM catalog_cards WHERE year = ? AND product = ?').run(first.year, first.product);
    }
    for (const raw of cards) {
      insert.run(normalizeCard(raw));
    }
    db.exec('COMMIT');
    res.json({ imported: cards.length, year: first.year, product: first.product });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/catalog/card/:id — admin: update a single catalog card
router.put('/card/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const card = normalizeCard(req.body);
  const result = db.prepare(`
    UPDATE catalog_cards SET card_number=@card_number, set_name=@set_name, description=@description,
      team_city=@team_city, team_name=@team_name, rookie=@rookie, auto=@auto, mem=@mem,
      serial=@serial, serial_of=@serial_of, thickness=@thickness, year=@year, product=@product, grade=@grade
    WHERE id=@id
  `).run({ ...card, id });
  if (result.changes === 0) return res.status(404).json({ error: 'Card not found' });
  res.json({ ok: true });
});

// DELETE /api/catalog/set — admin: remove a set from the catalog
router.delete('/set', requireAdmin, (req, res) => {
  const { year, product } = req.body;
  const result = db.prepare('DELETE FROM catalog_cards WHERE year = ? AND product = ?').run(year, product);
  res.json({ deleted: result.changes });
});

// POST /api/catalog/add-to-collection — user: copy a catalog set into their cards
router.post('/add-to-collection', (req, res) => {
  const { year, product, mode = 'add' } = req.body; // mode: 'add' | 'replace'
  const uid = req.user.id;

  const catalogCards = db.prepare(
    'SELECT * FROM catalog_cards WHERE year = ? AND product = ?'
  ).all(year, product);

  if (catalogCards.length === 0) return res.status(404).json({ error: 'Set not found in catalog' });

  const existingCount = db.prepare(
    'SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND year = ? AND product = ?'
  ).get(uid, year, product).n;

  if (existingCount > 0 && mode === 'add') {
    return res.status(409).json({ error: 'already_exists', count: existingCount });
  }

  const insert = db.prepare(`
    INSERT INTO cards (user_id, owned, card_number, set_name, description, team_city, team_name,
      rookie, auto, mem, serial, serial_of, thickness, year, product, grade, duplicates)
    VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);

  db.exec('BEGIN');
  try {
    if (mode === 'replace') {
      db.prepare('DELETE FROM cards WHERE user_id = ? AND year = ? AND product = ?').run(uid, year, product);
    }
    for (const c of catalogCards) {
      insert.run(uid, c.card_number, c.set_name, c.description, c.team_city, c.team_name,
        c.rookie, c.auto, c.mem, c.serial, c.serial_of, c.thickness, c.year, c.product, c.grade);
    }
    db.exec('COMMIT');
    res.json({ added: catalogCards.length });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

export default router;
