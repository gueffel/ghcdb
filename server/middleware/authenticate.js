import jwt from 'jsonwebtoken';

const INSECURE_DEFAULT = 'hockey-cards-secret-change-in-production';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === INSECURE_DEFAULT) {
  console.error('FATAL: JWT_SECRET is not set or is using the insecure default value. Set a strong random secret in your .env (e.g. run: openssl rand -hex 64).');
  process.exit(1);
}
export const JWT_SECRET = process.env.JWT_SECRET;

export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

export function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
