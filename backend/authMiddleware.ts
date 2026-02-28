/**
 * JWT authentication middleware for owner-protected routes.
 *
 * Customer-facing endpoints (GET /menu, POST /orders) are NOT protected —
 * customers access the app via QR deep-links without accounts.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '../src/shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'ardine-dev-secret-change-in-production';
const JWT_EXPIRY = '24h';

/** Extend Express Request to carry the verified user payload. */
declare global {
  namespace Express {
    interface Request {
      authUser?: AuthTokenPayload;
    }
  }
}

/** Sign a JWT for the given user. */
export const signToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

/** Verify and decode a JWT. Returns null if invalid. */
export const verifyToken = (token: string): AuthTokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Express middleware: requires a valid `Authorization: Bearer <token>` header.
 * On success, attaches `req.authUser` with { userId, email }.
 * On failure, responds with 401.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Verify the token user matches the route userId param (if present)
  const routeUserId = req.params.userId;
  if (routeUserId && routeUserId !== payload.userId) {
    res.status(403).json({ error: 'Forbidden: token does not match resource owner' });
    return;
  }

  req.authUser = payload;
  next();
};
