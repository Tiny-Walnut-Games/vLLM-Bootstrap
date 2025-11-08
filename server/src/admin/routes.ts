import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';
import { SystemService } from './system.service';
import { ModelService } from './model.service';
import { ModeService } from './mode.service';
import { OperationMode } from './types';
import { userStorage } from '../auth/storage';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('admin'));
const systemService = new SystemService();
const modelService = new ModelService();
const modeService = new ModeService();

const hfAuthLimiter = createRateLimiter(900000, 10);
const modelOpsLimiter = createRateLimiter(900000, 20);
const apiLimiter = createRateLimiter(900000, 60);

router.get('/health', (req, res) => {
  console.log('[Admin] Health check hit');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/system/status', async (req, res) => {
  console.log('[Admin] GET /system/status');
  try {
    const status = await systemService.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

router.get('/hf/auth/status', hfAuthLimiter, async (req, res) => {
  try {
    const status = await modelService.checkHFAuth();
    res.json(status);
  } catch (error) {
    console.error('[Admin] Error checking HF auth:', error);
    res.status(500).json({ error: 'Failed to check HF auth status' });
  }
});

router.post('/hf/auth/login', hfAuthLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'HF token required' });
    }
    const result = await modelService.authenticateHF(token);
    res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    console.error('[Admin] Error authenticating with HF:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ 
      success: false,
      error: 'Failed to authenticate with HuggingFace',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/models/download', async (req, res) => {
  console.log('[Admin] POST /models/download - model:', req.body?.modelName);
  try {
    const { modelName } = req.body;
    if (!modelName) {
      return res.status(400).json({ error: 'Model name required' });
    }
    const status = await modelService.downloadModel(modelName);
    res.json(status);
  } catch (error) {
    console.error('[Admin] Error downloading model');
    res.status(500).json({ error: 'Failed to download model' });
  }
});

router.post('/vllm/bootstrap', async (req, res) => {
  try {
    console.log('[Admin] POST /vllm/bootstrap - starting bootstrap process');
    res.status(202).json({
      status: 'started',
      message: 'Bootstrap process initiated'
    });

    const result = await systemService.bootstrapVLLM();
    console.log('[Admin] Bootstrap completed:', result);
  } catch (error) {
    console.error('[Admin] Bootstrap error:', error);
  }
});

router.get('/models/status', modelOpsLimiter, async (req, res) => {
  try {
    const models = await modelService.listModels();
    res.json(models);
  } catch (error) {
    console.error('[Admin] Error getting models:', error);
    res.status(500).json({ error: 'Failed to get model status' });
  }
});

router.post('/models/:role/start', modelOpsLimiter, async (req, res) => {
  try {
    const { role } = req.params;
    const { modelName } = req.body;
    
    const model = await modelService.startModel(role, modelName);
    res.json(model);
  } catch (error) {
    console.error('[Admin] Error starting model:', error);
    res.status(500).json({ error: `Failed to start model: ${error instanceof Error ? error.message : String(error)}` });
  }
});

router.post('/models/:role/stop', modelOpsLimiter, async (req, res) => {
  try {
    const { role } = req.params;
    const result = await modelService.stopModel(role);
    
    res.json({
      status: result.success ? 'stopped' : 'error',
      message: result.message
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to stop model: ${error instanceof Error ? error.message : String(error)}` });
  }
});

router.get('/logs/:model', async (req, res) => {
  try {
    const { model } = req.params;
    const lines = parseInt(req.query.lines as string) || 100;
    
    const logs = await modelService.getModelLogs(model, lines);
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

router.get('/mode', (req, res) => {
  console.log('[Admin] GET /mode');
  const currentMode = modeService.getCurrentMode();
  console.log('[Admin] Current mode:', currentMode);
  res.json({ mode: currentMode });
});

router.post('/mode/toggle', (req, res) => {
  const { mode } = req.body;
  
  if (mode && Object.values(OperationMode).includes(mode)) {
    modeService.setMode(mode as OperationMode);
  } else {
    modeService.toggleMode();
  }
  
  res.json({ mode: modeService.getCurrentMode() });
});

router.get('/models/available', async (req, res) => {
  try {
    const models = await require('./models-config.service').modelsConfigService.getAllAvailableModels();
    res.json(models);
  } catch (error) {
    console.error('[Admin] Error getting available models:', error);
    res.status(500).json({ error: 'Failed to get available models' });
  }
});

router.get('/models/config', async (req, res) => {
  try {
    const config = await require('./models-config.service').modelsConfigService.getRoleModelMapping();
    res.json(config);
  } catch (error) {
    console.error('[Admin] Error getting model config:', error);
    res.status(500).json({ error: 'Failed to get model config' });
  }
});

router.post('/models/config', async (req, res) => {
  try {
    const { role, tier, model, token } = req.body;
    
    if (!role || !model) {
      return res.status(400).json({ error: 'role and model are required' });
    }

    await require('./models-config.service').modelsConfigService.setModelForRole(role, tier || '', model, token);
    console.log(`[Admin] Model configuration updated for role: ${role} -> ${model}`);
    
    res.json({ success: true, message: `Model configured for role ${role}` });
  } catch (error) {
    console.error('[Admin] Error setting model config:', error);
    res.status(500).json({ error: 'Failed to set model config' });
  }
});

router.get('/users', async (req: AuthRequest, res) => {
  try {
    console.log('[Admin] GET /users');
    const users = await userStorage.listUsers();
    const sanitized = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.json(sanitized);
  } catch (error) {
    console.error('[Admin] Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.post('/users/:userId/role', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
    }

    const user = await userStorage.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await userStorage.updateUser(userId, { role });
    console.log(`[Admin] User ${user.username} role changed to ${role} by ${req.user?.username}`);
    
    res.json({
      success: true,
      message: `User ${user.username} is now ${role}`,
      user: {
        id: updated?.id,
        username: updated?.username,
        role: updated?.role
      }
    });
  } catch (error) {
    console.error('[Admin] Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.delete('/users/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user?.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await userStorage.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userStorage.deleteUser(userId);
    console.log(`[Admin] User ${user.username} deleted by ${req.user?.username}`);
    
    res.json({ success: true, message: `User ${user.username} has been deleted` });
  } catch (error) {
    console.error('[Admin] Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
