import request from 'supertest';
import express from 'express';

describe('Admin API Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('GET /api/admin/system/status', () => {
    it('should return system installation status', async () => {
      const response = await request(app).get('/api/admin/system/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('node');
      expect(response.body).toHaveProperty('wsl');
      expect(response.body).toHaveProperty('python');
      expect(response.body).toHaveProperty('vllm');
    });
  });

  describe('POST /api/admin/wsl/install', () => {
    it('should initiate WSL installation', async () => {
      const response = await request(app).post('/api/admin/wsl/install');
      
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('progress');
    });
  });

  describe('POST /api/admin/vllm/bootstrap', () => {
    it('should run initial-bootstrap.sh in WSL', async () => {
      const response = await request(app).post('/api/admin/vllm/bootstrap');
      
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('status', 'started');
    });
  });

  describe('POST /api/admin/models/:role/start', () => {
    it('should start a vLLM model', async () => {
      const response = await request(app)
        .post('/api/admin/models/qa/start')
        .send({ modelName: 'mistral-7b' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('port');
      expect(response.body).toHaveProperty('status', 'starting');
    });
  });

  describe('POST /api/admin/models/:role/stop', () => {
    it('should stop a running model', async () => {
      const response = await request(app).post('/api/admin/models/qa/stop');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'stopped');
    });
  });

  describe('GET /api/admin/models/status', () => {
    it('should return status of all models', async () => {
      const response = await request(app).get('/api/admin/models/status');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/admin/logs/:model', () => {
    it('should stream model logs', async () => {
      const response = await request(app).get('/api/admin/logs/mistral-7b');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('POST /api/admin/mode/toggle', () => {
    it('should toggle between IDE and GUI mode', async () => {
      const response = await request(app)
        .post('/api/admin/mode/toggle')
        .send({ mode: 'GUI_CHAT' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mode', 'GUI_CHAT');
    });
  });
});
