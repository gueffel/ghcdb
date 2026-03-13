import 'dotenv/config';
import express from 'express';

// Prevent unhandled async rejections from crashing the process in Express 4
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import authRoutes from './routes/auth.js';
import cardRoutes from './routes/cards.js';
import statsRoutes from './routes/stats.js';
import catalogRoutes from './routes/catalog.js';
import adminRoutes from './routes/admin.js';
import bugRoutes from './routes/bugs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// CORS — in production, ALLOWED_ORIGIN must be set to your frontend domain
const allowedOrigin = process.env.ALLOWED_ORIGIN;
if (process.env.NODE_ENV === 'production' && !allowedOrigin) {
  console.error('FATAL: ALLOWED_ORIGIN must be set in production to prevent open CORS.');
  process.exit(1);
}
app.use(cors(
  allowedOrigin
    ? { origin: allowedOrigin, credentials: true }
    : undefined  // unrestricted in local dev only
));

app.use(express.json({ limit: '10mb' }));

// Rate limit login/register: max 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
});
// Rate limit password reset: max 5 per hour per IP (prevents email bombing)
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', resetLimiter);
app.use('/api/auth/reset-password', resetLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bugs', bugRoutes);

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  app.get('*', (req, res) => res.sendFile(join(__dirname, '../client/dist/index.html')));
}

// Global error handler — catches errors passed via next(err) so the process doesn't crash
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
