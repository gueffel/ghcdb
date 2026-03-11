import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const uid = req.user.id;

  const total = db.prepare('SELECT COUNT(*) as n FROM cards WHERE user_id = ?').get(uid).n;
  const owned = db.prepare('SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND owned = 1').get(uid).n;
  const rookies = db.prepare('SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND rookie = 1').get(uid).n;
  const ownedRookies = db.prepare('SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND rookie = 1 AND owned = 1').get(uid).n;
  const autos = db.prepare('SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND auto = 1').get(uid).n;
  const ownedAutos = db.prepare('SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND auto = 1 AND owned = 1').get(uid).n;
  const serialized = db.prepare('SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND serial_of IS NOT NULL').get(uid).n;
  const graded = db.prepare("SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND grade IS NOT NULL AND grade != ''").get(uid).n;
  const dupRow = db.prepare('SELECT SUM(duplicates) as n FROM cards WHERE user_id = ?').get(uid);
  const duplicates = dupRow.n || 0;

  const byTeam = db.prepare(`
    SELECT team_city || ' ' || team_name as team, COUNT(*) as total, SUM(owned) as owned
    FROM cards WHERE user_id = ? AND team_city IS NOT NULL AND team_city != ''
    GROUP BY team_city, team_name ORDER BY total DESC LIMIT 20
  `).all(uid);

  const byYear = db.prepare(`
    SELECT year, COUNT(*) as total, SUM(owned) as owned
    FROM cards WHERE user_id = ? AND year IS NOT NULL AND year != ''
    GROUP BY year ORDER BY year DESC
  `).all(uid);

  const byProduct = db.prepare(`
    SELECT year, product, COUNT(*) as total, SUM(owned) as owned
    FROM cards WHERE user_id = ?
    GROUP BY year, product ORDER BY year DESC, product
  `).all(uid);

  const recentlyOwned = db.prepare(`
    SELECT * FROM cards WHERE user_id = ? AND owned = 1
    ORDER BY created_at DESC LIMIT 10
  `).all(uid);

  const topPlayerRow = db.prepare(`
    SELECT description, COUNT(*) as n FROM cards
    WHERE user_id = ? AND owned = 1 AND description IS NOT NULL AND description != ''
    GROUP BY description ORDER BY n DESC LIMIT 1
  `).get(uid);

  const topSetRow = db.prepare(`
    SELECT product, COUNT(*) as n FROM cards
    WHERE user_id = ? AND owned = 1 AND product IS NOT NULL AND product != ''
    GROUP BY product ORDER BY n DESC LIMIT 1
  `).get(uid);

  res.json({
    totals: { total, owned, rookies, ownedRookies, autos, ownedAutos, serialized, graded, duplicates },
    byTeam,
    byYear,
    byProduct,
    recentlyOwned,
    topPlayer: topPlayerRow ? { name: topPlayerRow.description, count: topPlayerRow.n } : null,
    topSet: topSetRow ? { name: topSetRow.product, count: topSetRow.n } : null,
  });
});

export default router;
