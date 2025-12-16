import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[AUTH] No token provided');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    console.log('[AUTH] Verifying token with secret:', secret.substring(0, 10) + '...');
    console.log('[AUTH] Token:', token.substring(0, 50) + '...');
    const payload = jwt.verify(token, secret) as TokenPayload;
    console.log('[AUTH] Token verified successfully for user:', payload.username);
    req.user = payload;
    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error instanceof Error ? error.message : error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (role: 'admin' | 'user') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
