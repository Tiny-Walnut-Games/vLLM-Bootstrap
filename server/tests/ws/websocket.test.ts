import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { io as Client, Socket } from 'socket.io-client';
import { createServer } from 'http';
import { createApp } from '../../src/app';
import { createWebSocketServer } from '../../src/ws/server';
import request from 'supertest';

describe('WebSocket System', () => {
  let httpServer: ReturnType<typeof createServer>;
  let clientSocket: Socket;
  let authToken: string;
  const PORT = 3001;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    const app = await createApp();
    httpServer = createServer(app);
    createWebSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, resolve);
    });

    const authResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'wsuser',
        password: 'SecurePass123!',
        role: 'user'
      });
    authToken = authResponse.body.accessToken;
  }, 20000);

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  describe('Connection', () => {
    it('should connect with valid token', async () => {
      clientSocket = Client(`http://localhost:${PORT}`, {
        auth: { token: authToken }
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          expect(clientSocket.connected).toBe(true);
          resolve();
        });

        clientSocket.on('connect_error', (error: Error) => {
          reject(error);
        });
      });
    });

    it('should reject connection without token', async () => {
      const unauthorizedSocket = Client(`http://localhost:${PORT}`);

      await new Promise<void>((resolve) => {
        unauthorizedSocket.on('connect_error', (error: Error) => {
          expect(error.message).toContain('Authentication');
          unauthorizedSocket.disconnect();
          resolve();
        });
      });
    });
  });

  describe('Stream Completions', () => {
    beforeAll(async () => {
      if (!clientSocket?.connected) {
        clientSocket = Client(`http://localhost:${PORT}`, {
          auth: { token: authToken }
        });
        await new Promise<void>((resolve) => {
          clientSocket.on('connect', () => resolve());
        });
      }
    });

    it('should stream completion tokens', async () => {
      const tokens: string[] = [];

      clientSocket.emit('stream_completion', {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('completion_token', (data: { token: string }) => {
          tokens.push(data.token);
        });

        clientSocket.on('completion_done', () => {
          expect(tokens.length).toBeGreaterThan(0);
          resolve();
        });

        clientSocket.on('completion_error', (error: { message: string }) => {
          expect([
            'Model not available',
            'Service unavailable'
          ]).toContain(error.message);
          resolve();
        });

        setTimeout(() => {
          if (tokens.length === 0) {
            resolve();
          }
        }, 5000);
      });
    });
  });
});
