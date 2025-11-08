import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { createServer as createSecureServer } from 'https';
import { createApp } from './app';
import { createWebSocketServer } from './ws/server';
import { ensureSelfSignedCerts } from './ssl/cert-generator';

const PORT = parseInt(process.env.PORT || '3000', 10);
const USE_HTTPS = process.env.USE_HTTPS !== 'false';

async function start() {
  try {
    const app = await createApp();
    
    let httpServer: any;
    let protocol = 'http';
    let wsProtocol = 'ws';

    if (USE_HTTPS) {
      const { cert, key } = ensureSelfSignedCerts();
      httpServer = createSecureServer({ key, cert }, app);
      protocol = 'https';
      wsProtocol = 'wss';
      console.log('[SSL] HTTPS enabled with self-signed certificate');
    } else {
      httpServer = createServer(app);
    }
    
    createWebSocketServer(httpServer);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Protocol: ${protocol.toUpperCase()}`);
      console.log(`Health check: ${protocol}://localhost:${PORT}/health`);
      console.log(`WebSocket: ${wsProtocol}://localhost:${PORT}`);
      console.log(`Admin panel: ${protocol}://localhost:3173`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
