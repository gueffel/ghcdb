import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../database.js';
import { authenticate, JWT_SECRET } from '../middleware/authenticate.js';
import { sendAdminSignupNotification, sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js';

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
    const [row] = await db`
      INSERT INTO users (username, password_hash, is_admin, first_name, last_name, email)
      VALUES (${username}, ${hash}, ${is_admin}, ${first_name}, ${last_name}, ${email})
      RETURNING id
    `;
    const token = jwt.sign({ id: row.id, username, is_admin, first_name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username, is_admin, first_name });
    sendAdminSignupNotification({ username, email }).catch(() => {});
    sendWelcomeEmail({ username, email }).catch(() => {});
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const [user] = await db`SELECT * FROM users WHERE username = ${username}`;
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const shouldBeAdmin = isAdminUsername(username) ? 1 : 0;
  if (user.is_admin !== shouldBeAdmin) {
    await db`UPDATE users SET is_admin = ${shouldBeAdmin} WHERE id = ${user.id}`;
    user.is_admin = shouldBeAdmin;
  }

  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin, first_name: user.first_name || null }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username, is_admin: user.is_admin, first_name: user.first_name || null });
});

router.get('/me', authenticate, async (req, res) => {
  const [row] = await db`SELECT first_name, last_name, email FROM users WHERE id = ${req.user.id}`;
  res.json({ id: req.user.id, username: req.user.username, is_admin: req.user.is_admin, ...row });
});

router.put('/profile', authenticate, async (req, res) => {
  const { first_name, last_name, email, current_password, new_password } = req.body;

  const [user] = await db`SELECT * FROM users WHERE id = ${req.user.id}`;
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (new_password) {
    if (!current_password) return res.status(400).json({ error: 'Current password is required to set a new password' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(new_password, 10);
    await db`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`;
  }

  await db`UPDATE users SET first_name = ${first_name || null}, last_name = ${last_name || null}, email = ${email || null} WHERE id = ${user.id}`;

  const [updated] = await db`SELECT first_name, last_name, email FROM users WHERE id = ${user.id}`;
  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin, first_name: updated.first_name || null }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ ok: true, token, first_name: updated.first_name, last_name: updated.last_name, email: updated.email });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  res.json({ ok: true }); // always respond immediately — don't leak whether email exists
  if (!email) return;
  try {
    const [user] = await db`SELECT id FROM users WHERE email = ${email}`;
    if (!user) return;
    const token = crypto.randomBytes(32).toString('hex');
    await db`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, NOW() + interval '1 hour')
    `;
    sendPasswordResetEmail({ email, token }).catch(() => {});
  } catch (err) {
    console.error('forgot-password error:', err);
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const [row] = await db`
    SELECT * FROM password_reset_tokens
    WHERE token = ${token} AND used = 0 AND expires_at > NOW()
  `;
  if (!row) return res.status(400).json({ error: 'Invalid or expired reset link' });

  const hash = await bcrypt.hash(password, 10);
  await db`UPDATE users SET password_hash = ${hash} WHERE id = ${row.user_id}`;
  await db`UPDATE password_reset_tokens SET used = 1 WHERE id = ${row.id}`;
  res.json({ ok: true });
});

export default router;
