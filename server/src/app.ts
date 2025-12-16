import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './auth/routes';
import proxyRoutes from './proxy/routes';
import adminRoutes from './admin/routes';
import { authLimiter, apiLimiter } from './middleware/rateLimit';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"]
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
  }));
  
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', apiLimiter, adminRoutes);
  app.use('/api', apiLimiter, proxyRoutes);

  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}
