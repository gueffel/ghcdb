import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticate, JWT_SECRET } from '../middleware/authenticate.js';

const router = Router();

function isAdminUsername(username) {
  const admins = (process.env.ADMIN_USERNAMES || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(username.trim().toLowerCase());
}

router.post('/register', async (req, res) => {
  const { username, password, first_name = null, last_name = null, email = null } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const is_admin = isAdminUsername(username) ? 1 : 0;
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, is_admin, first_name, last_name, email) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username, hash, is_admin, first_name, last_name, email);
    const id = Number(result.lastInsertRowid);
    const token = jwt.sign({ id, username, is_admin, first_name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username, is_admin, first_name });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // Keep DB in sync if ADMIN_USERNAMES changed since last registration
  const shouldBeAdmin = isAdminUsername(username) ? 1 : 0;
  if (user.is_admin !== shouldBeAdmin) {
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(shouldBeAdmin, user.id);
    user.is_admin = shouldBeAdmin;
  }

  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin, first_name: user.first_name || null }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username, is_admin: user.is_admin, first_name: user.first_name || null });
});

router.get('/me', authenticate, (req, res) => {
  const row = db.prepare('SELECT first_name, last_name, email FROM users WHERE id = ?').get(req.user.id);
  res.json({ id: req.user.id, username: req.user.username, is_admin: req.user.is_admin, ...row });
});

router.put('/profile', authenticate, async (req, res) => {
  const { first_name, last_name, email, current_password, new_password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // If changing password, validate current password first
  if (new_password) {
    if (!current_password) return res.status(400).json({ error: 'Current password is required to set a new password' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
  }

  db.prepare('UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?')
    .run(first_name || null, last_name || null, email || null, user.id);

  const updated = db.prepare('SELECT first_name, last_name, email FROM users WHERE id = ?').get(user.id);
  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin, first_name: updated.first_name || null }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ ok: true, token, first_name: updated.first_name, last_name: updated.last_name, email: updated.email });
});

export default router;
