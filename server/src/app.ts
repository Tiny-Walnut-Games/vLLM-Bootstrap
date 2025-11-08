import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './auth/routes';
import proxyRoutes from './proxy/routes';
import adminRoutes from './admin/routes';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
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
