import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import { sendBugReportNotification, sendBugReply, sendBugStatusUpdate } from '../utils/email.js';

const router = Router();
router.use(authenticate);

// POST /api/bugs — submit a bug report
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }
  const [bug] = await db`
    INSERT INTO bug_reports (user_id, title, description)
    VALUES (${req.user.id}, ${title.trim()}, ${description.trim()})
    RETURNING *
  `;
  const [user] = await db`SELECT username, email FROM users WHERE id = ${req.user.id}`;
  sendBugReportNotification({ username: user.username, email: user.email, title: bug.title, bugId: bug.id }).catch(console.error);
  res.json(bug);
});

// GET /api/bugs/mine — user's own bug reports
router.get('/mine', async (req, res) => {
  const bugs = await db`
    SELECT b.*, (SELECT COUNT(*) FROM bug_replies WHERE bug_id = b.id)::int as reply_count
    FROM bug_reports b
    WHERE b.user_id = ${req.user.id}
    ORDER BY b.created_at DESC
  `;
  res.json(bugs);
});

// GET /api/bugs/:id — single bug with replies (user sees own; admin sees any)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [bug] = await db`SELECT * FROM bug_reports WHERE id = ${id}`;
  if (!bug) return res.status(404).json({ error: 'Not found' });
  if (bug.user_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const replies = await db`
    SELECT r.*, u.username as admin_username
    FROM bug_replies r
    JOIN users u ON u.id = r.admin_id
    WHERE r.bug_id = ${id}
    ORDER BY r.created_at ASC
  `;
  res.json({ ...bug, replies });
});

// POST /api/bugs/:id/reply — admin: reply to a bug report
router.post('/:id/reply', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });
  const [bug] = await db`
    SELECT b.title, b.user_id, u.username, u.email
    FROM bug_reports b
    JOIN users u ON u.id = b.user_id
    WHERE b.id = ${id}
  `;
  if (!bug) return res.status(404).json({ error: 'Not found' });
  const [reply] = await db`
    INSERT INTO bug_replies (bug_id, admin_id, message)
    VALUES (${id}, ${req.user.id}, ${message.trim()})
    RETURNING *
  `;
  sendBugReply({ to: bug.email, username: bug.username, title: bug.title, message: message.trim() }).catch(console.error);
  res.json({ ...reply, admin_username: req.user.username });
});

// PATCH /api/bugs/:id/status — admin: update status
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!['open', 'fixed', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const [bug] = await db`
    UPDATE bug_reports SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING *
  `;
  if (!bug) return res.status(404).json({ error: 'Not found' });
  if (status === 'fixed' || status === 'closed') {
    const [user] = await db`SELECT username, email FROM users WHERE id = ${bug.user_id}`;
    if (user) sendBugStatusUpdate({ to: user.email, username: user.username, title: bug.title, status }).catch(console.error);
  }
  res.json({ ok: true, status });
});

// DELETE /api/bugs/:id — admin: delete a fixed or closed bug
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [bug] = await db`SELECT * FROM bug_reports WHERE id = ${id}`;
  if (!bug) return res.status(404).json({ error: 'Not found' });
  if (bug.status === 'open') return res.status(400).json({ error: 'Can only delete fixed or closed reports.' });
  await db`DELETE FROM bug_reports WHERE id = ${id}`;
  res.json({ ok: true });
});

export default router;
