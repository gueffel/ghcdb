import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/users — list all users with card counts
router.get('/users', async (req, res) => {
  const users = await db`
    SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.is_admin, u.created_at,
      COUNT(c.id) as card_count
    FROM users u
    LEFT JOIN cards c ON c.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at ASC
  `;
  res.json(users);
});

// PATCH /api/admin/users/:id/admin — toggle admin status
router.patch('/users/:id/admin', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot change your own admin status' });
  const [user] = await db`SELECT id, is_admin FROM users WHERE id = ${id}`;
  if (!user) return res.status(404).json({ error: 'User not found' });
  const newAdmin = user.is_admin ? 0 : 1;
  await db`UPDATE users SET is_admin = ${newAdmin} WHERE id = ${id}`;
  res.json({ id, is_admin: newAdmin });
});

// DELETE /api/admin/users/:id — delete a user and all their data
router.delete('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  const result = await db`DELETE FROM users WHERE id = ${id}`;
  if (result.count === '0') return res.status(404).json({ error: 'User not found' });
  res.json({ deleted: id });
});

export default router;
