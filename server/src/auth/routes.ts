import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from './service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';

const router = Router();
const getAuthLimiter = () => createRateLimiter(15 * 60 * 1000, 10);

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).optional().default('user')
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

router.post('/register', getAuthLimiter(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role } = registerSchema.parse(req.body);
    const tokens = await authService.register(username, password, role);
    res.status(201).json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
      return;
    }
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', getAuthLimiter(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const tokens = await authService.login(username, password);
    res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data' });
      return;
    }
    if (error instanceof Error && error.message.includes('Invalid credentials')) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await authService.refreshToken(refreshToken);
    res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data' });
      return;
    }
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.get('/verify', authenticateToken, (req: AuthRequest, res: Response): void => {
  res.status(200).json({
    userId: req.user?.userId,
    username: req.user?.username,
    role: req.user?.role
  });
});

export default router;
