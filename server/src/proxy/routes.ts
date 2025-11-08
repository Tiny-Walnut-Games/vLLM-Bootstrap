import { Router, Response } from 'express';
import { z } from 'zod';
import { proxyService } from './service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';

const router = Router();
const getApiLimiter = () => createRateLimiter(900000, 100);

const completionSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string()
  })),
  stream: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional()
});

router.get('/models', authenticateToken, getApiLimiter(), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const models = await proxyService.listModels();
    res.status(200).json({ models });
  } catch (error) {
    console.error('Models listing error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

router.post('/chat/completions', authenticateToken, getApiLimiter(), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = completionSchema.parse(req.body);

    if (request.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await proxyService.streamCompletion(request);
        
        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        res.end();
      }
    } else {
      const result = await proxyService.createCompletion(request);
      res.status(200).json(result);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
      return;
    }
    console.error('Completion error:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

router.get('/health', async (req, res): Promise<void> => {
  const healthy = await proxyService.healthCheck();
  res.status(healthy ? 200 : 503).json({ 
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
