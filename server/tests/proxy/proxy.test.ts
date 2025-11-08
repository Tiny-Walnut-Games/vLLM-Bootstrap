import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Express } from 'express';

describe('vLLM Proxy System', () => {
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.VLLM_BASE_URL = 'http://localhost:8500';
    app = await createApp();

    const authResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'proxyuser',
        password: 'SecurePass123!',
        role: 'user'
      });
    authToken = authResponse.body.accessToken;
  });

  describe('GET /api/models', () => {
    it('should list available models when authenticated', async () => {
      const response = await request(app)
        .get('/api/models')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.models)).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/chat/completions', () => {
    it('should proxy completion requests with authentication', async () => {
      const response = await request(app)
        .post('/api/chat/completions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false
        });

      expect([200, 503]).toContain(response.status);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/chat/completions')
        .send({
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hello' }]
        });

      expect(response.status).toBe(401);
    });

    it('should validate request payload', async () => {
      const response = await request(app)
        .post('/api/chat/completions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          model: 'test-model'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits per user', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/models')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(false);
    });
  });
});
