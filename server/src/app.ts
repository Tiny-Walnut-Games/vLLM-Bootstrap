import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './auth/routes';
import proxyRoutes from './proxy/routes';
import adminRoutes from './admin/routes';
import { createRateLimiter } from './middleware/rateLimit';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(helmet());
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3000'];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', proxyRoutes);

  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}
