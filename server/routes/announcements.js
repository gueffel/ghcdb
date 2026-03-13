import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

// GET /api/announcements — any authenticated user: get current announcement
router.get('/', authenticate, async (_req, res) => {
  const [ann] = await db`SELECT id, title, message, created_at, updated_at FROM announcements ORDER BY id DESC LIMIT 1`;
  res.json(ann || null);
});

// PUT /api/announcements — admin only: create or replace the single announcement
router.put('/', authenticate, requireAdmin, async (req, res) => {
  const { title = '', message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });
  await db`DELETE FROM announcements`;
  const [ann] = await db`INSERT INTO announcements (title, message) VALUES (${title.trim()}, ${message.trim()}) RETURNING *`;
  res.json(ann);
});

// DELETE /api/announcements — admin only: remove the current announcement
router.delete('/', authenticate, requireAdmin, async (_req, res) => {
  await db`DELETE FROM announcements`;
  res.json({ deleted: true });
});

export default router;
