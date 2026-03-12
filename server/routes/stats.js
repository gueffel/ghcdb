import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const uid = req.user.id;

  const [[totalsRow], byTeam, byYear, byProduct, recentlyOwned, [topPlayerRow], [topSetRow]] = await Promise.all([
    db`
      SELECT
        COUNT(*)                                                             AS total,
        SUM(CASE WHEN owned = 1 THEN 1 ELSE 0 END)                          AS owned,
        SUM(CASE WHEN rookie = 1 THEN 1 ELSE 0 END)                         AS rookies,
        SUM(CASE WHEN rookie = 1 AND owned = 1 THEN 1 ELSE 0 END)           AS owned_rookies,
        SUM(CASE WHEN auto = 1 THEN 1 ELSE 0 END)                           AS autos,
        SUM(CASE WHEN auto = 1 AND owned = 1 THEN 1 ELSE 0 END)             AS owned_autos,
        SUM(CASE WHEN serial_of IS NOT NULL THEN 1 ELSE 0 END)              AS serialized,
        SUM(CASE WHEN grade IS NOT NULL AND grade != '' THEN 1 ELSE 0 END)  AS graded,
        COALESCE(SUM(duplicates), 0)                                        AS dup_sum
      FROM cards WHERE user_id = ${uid}
    `,
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

  const { total, owned, rookies, owned_rookies, autos, owned_autos, serialized, graded, dup_sum } = totalsRow;

  res.json({
    totals: {
      total: Number(total), owned: Number(owned),
      rookies: Number(rookies), ownedRookies: Number(owned_rookies),
      autos: Number(autos), ownedAutos: Number(owned_autos),
      serialized: Number(serialized), graded: Number(graded),
      duplicates: Number(dup_sum),
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
