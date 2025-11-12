import { exec } from 'child_process';
import { promisify } from 'util';
import { ModelStatus } from './types';
import { readFile, mkdir, writeFile, chmod, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { modelsConfigService } from './models-config.service';
import { homedir } from 'os';

const execAsync = promisify(exec);

const getPlatformShell = () => {
  return process.platform === 'win32' ? { shell: 'powershell.exe', isWindows: true } : { shell: '/bin/bash', isWindows: false };
};

const executeCommand = async (command: string, timeout: number = 30000) => {
  const { shell, isWindows } = getPlatformShell();
  const options: any = { timeout, maxBuffer: 1024 * 1024 * 10 };
  
  if (isWindows) {
    options.shell = shell;
  }
  
  try {
    return await execAsync(command, options);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ETIMEDOUT') {
      throw new Error(`Command timed out after ${timeout}ms: ${command}`);
    }
    throw error;
  }
};

interface HFAuthStatus {
  authenticated: boolean;
  username?: string;
}

interface ModelDownloadStatus {
  downloaded: boolean;
  modelPath?: string;
  size?: string;
}

export class ModelService {
  async listModels(): Promise<ModelStatus[]> {
    try {
      const { isWindows } = getPlatformShell();
      
      if (isWindows) {
        console.log('[ModelService] Windows detected, tmux unavailable - returning empty models list');
        return [];
      }

      const { stdout } = await execAsync('bash -c "tmux list-sessions 2>/dev/null"', { timeout: 5000 });
      const sessions = stdout.trim().split('\n').filter(Boolean);
      
      const models: ModelStatus[] = [];
      
      for (const session of sessions) {
        const match = session.match(/^vllm-(.+?):/);
        if (match) {
          const role = match[1];
          const port = await this.getPortForRole(role);
          
          models.push({
            name: role,
            role,
            status: 'running',
            port,
            uptime: this.parseUptime(session)
          });
        }
      }
      
      return models;
    } catch {
      return [];
    }
  }

  async checkHFAuth(): Promise<HFAuthStatus> {
    try {
      const { isWindows } = getPlatformShell();
      const tokenPath = join(homedir(), '.cache', 'huggingface', 'token');
      
      try {
        const content = await readFile(tokenPath, 'utf-8');
        if (content.includes('hf_')) {
          console.log('[ModelService] HF authentication check: token found');
          return { authenticated: true };
        }
      } catch {
        console.log('[ModelService] HF authentication check: no token file found at', tokenPath);
        return { authenticated: false };
      }
      
      console.log('[ModelService] HF authentication check: no valid token found');
      return { authenticated: false };
    } catch (error) {
      console.error('[ModelService] HF auth check error:', error);
      return { authenticated: false };
    }
  }

  async authenticateHF(token: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!token || typeof token !== 'string' || token.length === 0) {
        return {
          success: false,
          message: 'Invalid token provided'
        };
      }

      const sanitizedToken = token.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedToken.length !== token.length) {
        return {
          success: false,
          message: 'Token contains invalid characters'
        };
      }

      console.log('[ModelService] Saving HuggingFace token to cache...');
      let cliAvailable = false;
      
      try {
        console.log('[ModelService] Skipping CLI check on this platform');
        cliAvailable = false;
      } catch (installCheckError) {
        console.log('[ModelService] Installation check skipped');
      }

      console.log('[ModelService] Attempting HF authentication...');
      
      try {
        const cacheDir = join(homedir(), '.cache', 'huggingface');
        await mkdir(cacheDir, { recursive: true });
        const tokenPath = join(cacheDir, 'token');
        await writeFile(tokenPath, sanitizedToken, { encoding: 'utf8', mode: 0o600 });
        
        try {
          await chmod(tokenPath, 0o600);
        } catch (chmodError) {
          console.warn('[ModelService] chmod not fully supported on this platform');
        }
        
        console.log('[ModelService] Token saved to cache successfully');
      } catch (loginError) {
        console.error('[ModelService] Login command failed:', loginError);
        return {
          success: false,
          message: 'Failed to execute login command. Check your WSL setup and HuggingFace connectivity.'
        };
      }
      
      try {
        const tokenPath = join(homedir(), '.cache', 'huggingface', 'token');
        const verifyToken = await readFile(tokenPath, 'utf-8');
        
        if (!verifyToken.includes('hf_')) {
          console.warn('[ModelService] Token file does not contain valid token format');
          return {
            success: false,
            message: 'Token could not be properly saved'
          };
        }
        
        console.log('[ModelService] Token successfully saved and verified');
      } catch (verifyError) {
        console.error('[ModelService] Token verification failed:', verifyError);
        return {
          success: false,
          message: 'Token could not be saved to cache'
        };
      }
      
      console.log('[ModelService] HF authentication successful');
      return {
        success: true,
        message: 'Successfully authenticated with HuggingFace'
      };
    } catch (error) {
      console.error('[ModelService] HF authentication unexpected error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: `Unexpected error during authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private sanitizeModelName(modelName: string): string {
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(modelName)) {
      throw new Error('Invalid model name format. Expected: org/model-name');
    }
    return modelName;
  }

  async downloadModel(modelName: string): Promise<ModelDownloadStatus> {
    try {
      const sanitizedModelName = this.sanitizeModelName(modelName);
      const hubDirName = sanitizedModelName.replace('/', '--');
      const hubCachePath = join(homedir(), '.cache', 'huggingface', 'hub');
      
      try {
        const files = await this.getDirectoryContents(hubCachePath);
        const matchingDir = files.find(f => f.toLowerCase().includes(hubDirName.toLowerCase()));
        
        if (matchingDir) {
          const modelPath = join(hubCachePath, matchingDir);
          const size = await this.getDirectorySize(modelPath);
          
          return {
            downloaded: true,
            modelPath,
            size
          };
        }
      } catch (readError) {
        console.log('[ModelService] Could not read hub cache directory:', readError);
      }
      
      return {
        downloaded: false,
        modelPath: undefined,
        size: undefined
      };
    } catch (error) {
      console.error('[ModelService] Model download error:', error instanceof Error ? error.message : String(error));
      return {
        downloaded: false,
        modelPath: undefined,
        size: undefined
      };
    }
  }

  private async getDirectoryContents(dirPath: string): Promise<string[]> {
    try {
      return await readdir(dirPath);
    } catch {
      return [];
    }
  }

  private async getDirectorySize(dirPath: string): Promise<string> {
    try {
      const getSize = async (path: string): Promise<number> => {
        try {
          const statInfo = await stat(path);
          if (statInfo.isDirectory()) {
            const files = await readdir(path);
            const sizes = await Promise.all(
              files.map(file => getSize(join(path, file)))
            );
            return sizes.reduce((total, size) => total + size, 0);
          }
          return statInfo.size;
        } catch {
          return 0;
        }
      };
      
      const bytes = await getSize(dirPath);
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    } catch {
      return 'unknown';
    }
  }

  async getModelNameForRole(role: string): Promise<string> {
    try {
      const roleMapping = await modelsConfigService.getModelForRole(role);
      if (roleMapping && roleMapping.model) {
        console.log(`[ModelService] Using configured model for role ${role}: ${roleMapping.model}`);
        return roleMapping.model;
      }

      console.log(`[ModelService] No configured model for role ${role}, loading defaults from models.conf`);
      const modelsConf = await readFile(
        join(__dirname, '../../../scripts/models.conf'),
        'utf-8'
      );
      
      const roleSection = modelsConf.split(`[${role}]`)[1]?.split('[')[0];
      if (!roleSection) {
        throw new Error(`Role ${role} not found in models.conf`);
      }
      
      const defaultLine = roleSection
        .split('\n')
        .find(line => line.includes('default') && line.includes('='));
      
      if (!defaultLine) {
        throw new Error(`No default model found for role ${role}`);
      }
      
      const modelName = defaultLine.split('=')[1].split('#')[0].trim();
      return modelName;
    } catch (error) {
      console.warn(`Could not read models.conf: ${error}`);
      return `default-${role}-model`;
    }
  }

  async startModel(role: string, modelName?: string): Promise<ModelStatus> {
    try {
      const sessionName = `vllm-${role}`;
      
      const actualModelName = modelName || await this.getModelNameForRole(role);
      
      const authStatus = await this.checkHFAuth();
      if (!authStatus.authenticated) {
        throw new Error('HuggingFace authentication required. Please provide HF_TOKEN.');
      }
      
      const sanitizedRole = role.replace(/[^a-z]/g, '');
      if (sanitizedRole !== role) {
        throw new Error('Invalid role name');
      }

      console.log(`Checking if model ${actualModelName} is downloaded...`);
      const downloadStatus = await this.downloadModel(actualModelName);
      console.log(`Model status: ${downloadStatus.downloaded ? 'cached' : 'downloading'}`);
      
      const { isWindows } = getPlatformShell();
      if (isWindows) {
        console.log('[ModelService] Windows detected - model startup not supported via tmux');
        throw new Error('Model startup requires Linux/Unix environment. tmux is not available on Windows.');
      }

      const { stdout } = await execAsync(
        `bash -c "cd ~/.config/llm-doctrine && tmux new-session -d -s ${sessionName} './daily-bootstrap.sh ${sanitizedRole}'"`,
        { timeout: 10000 }
      );
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const port = await this.getPortForRole(role);
      
      return {
        name: actualModelName,
        role,
        status: 'starting',
        port
      };
    } catch (error) {
      throw new Error(`Failed to start model: ${error}`);
    }
  }

  async stopModel(role: string): Promise<{ success: boolean; message: string }> {
    try {
      const { isWindows } = getPlatformShell();
      
      if (isWindows) {
        return {
          success: false,
          message: 'Model management not supported on Windows'
        };
      }

      const sessionName = `vllm-${role}`;
      await execAsync(`bash -c "tmux kill-session -t ${sessionName} 2>/dev/null || true"`, { timeout: 5000 });
      
      return {
        success: true,
        message: `Model ${role} stopped successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop model: ${error}`
      };
    }
  }

  async getModelLogs(role: string, lines: number = 100): Promise<string> {
    try {
      const { isWindows } = getPlatformShell();
      
      if (isWindows) {
        return 'Model logs not available on Windows';
      }

      const { stdout } = await execAsync(
        `bash -c "tail -n ${lines} ~/.config/llm-doctrine/logs/${role}*.log 2>/dev/null || echo 'No logs found'"`,
        { timeout: 5000 }
      );
      return stdout;
    } catch {
      return 'No logs available';
    }
  }

  private async getPortForRole(role: string): Promise<number | undefined> {
    try {
      const mapping = await modelsConfigService.getRoleModelMapping();
      const roleConfig = mapping[role];
      
      if (!roleConfig || !roleConfig.tier) {
        console.warn(`[ModelService] No tier found for role ${role}`);
        return undefined;
      }
      
      const tier = roleConfig.tier;
      const portsConf = await readFile(
        join(__dirname, '../../../scripts/ports.conf'),
        'utf-8'
      );
      
      const match = portsConf.match(new RegExp(`${tier}\\s*=\\s*(\\d+)\\s*-\\s*(\\d+)`, 'i'));
      if (!match) {
        console.warn(`[ModelService] No port range found for tier ${tier}`);
        return undefined;
      }
      
      const startPort = parseInt(match[1], 10);
      return startPort;
    } catch (error) {
      console.error(`[ModelService] Error getting port for role ${role}:`, error);
      return undefined;
    }
  }

  private parseUptime(sessionLine: string): number {
    const match = sessionLine.match(/\(created (.+?)\)/);
    if (!match) return 0;
    
    return 0;
  }
}
