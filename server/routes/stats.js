import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const uid = req.user.id;

  const [
    [{ n: total }],
    [{ n: owned }],
    [{ n: rookies }],
    [{ n: ownedRookies }],
    [{ n: autos }],
    [{ n: ownedAutos }],
    [{ n: serialized }],
    [{ n: graded }],
    [{ n: dupSum }],
    byTeam,
    byYear,
    byProduct,
    recentlyOwned,
    [topPlayerRow],
    [topSetRow],
  ] = await Promise.all([
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid}`,
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND owned = 1`,
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND rookie = 1`,
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND rookie = 1 AND owned = 1`,
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND auto = 1`,
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND auto = 1 AND owned = 1`,
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND serial_of IS NOT NULL`,
    db`SELECT COUNT(*) as n FROM cards WHERE user_id = ${uid} AND grade IS NOT NULL AND grade != ''`,
    db`SELECT COALESCE(SUM(duplicates), 0) as n FROM cards WHERE user_id = ${uid}`,
    db`
      SELECT team_city || ' ' || team_name as team, COUNT(*) as total, SUM(owned) as owned
      FROM cards WHERE user_id = ${uid} AND team_city IS NOT NULL AND team_city != ''
      GROUP BY team_city, team_name ORDER BY total DESC LIMIT 20
    `,
    db`
      SELECT year, COUNT(*) as total, SUM(owned) as owned
      FROM cards WHERE user_id = ${uid} AND year IS NOT NULL AND year != ''
      GROUP BY year ORDER BY year DESC
    `,
    db`
      SELECT year, product, COUNT(*) as total, SUM(owned) as owned
      FROM cards WHERE user_id = ${uid}
      GROUP BY year, product ORDER BY year DESC, product
    `,
    db`SELECT * FROM cards WHERE user_id = ${uid} AND owned = 1 ORDER BY COALESCE(owned_at, created_at) DESC LIMIT 10`,
    db`
      SELECT description, COUNT(*) as n FROM cards
      WHERE user_id = ${uid} AND owned = 1 AND description IS NOT NULL AND description != ''
      GROUP BY description ORDER BY n DESC LIMIT 1
    `,
    db`
      SELECT product, COUNT(*) as n FROM cards
      WHERE user_id = ${uid} AND owned = 1 AND product IS NOT NULL AND product != ''
      GROUP BY product ORDER BY n DESC LIMIT 1
    `,
  ]);

  res.json({
    totals: {
      total: Number(total), owned: Number(owned),
      rookies: Number(rookies), ownedRookies: Number(ownedRookies),
      autos: Number(autos), ownedAutos: Number(ownedAutos),
      serialized: Number(serialized), graded: Number(graded),
      duplicates: Number(dupSum),
    },
    byTeam,
    byYear,
    byProduct,
    recentlyOwned,
    topPlayer: topPlayerRow ? { name: topPlayerRow.description, count: Number(topPlayerRow.n) } : null,
    topSet: topSetRow ? { name: topSetRow.product, count: Number(topSetRow.n) } : null,
  });
});

export default router;
