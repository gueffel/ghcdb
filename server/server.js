import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import authRoutes from './routes/auth.js';
import cardRoutes from './routes/cards.js';
import statsRoutes from './routes/stats.js';
import catalogRoutes from './routes/catalog.js';
import adminRoutes from './routes/admin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS — in production restrict to your actual domain via ALLOWED_ORIGIN in .env
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(
  allowedOrigin
    ? { origin: allowedOrigin, credentials: true }
    : undefined  // unrestricted in dev when ALLOWED_ORIGIN is not set
));

app.use(express.json({ limit: '50mb' }));

// Rate limit login/register: max 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/admin', adminRoutes);

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  app.get('*', (req, res) => res.sendFile(join(__dirname, '../client/dist/index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
