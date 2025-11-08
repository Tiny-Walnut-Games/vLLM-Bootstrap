import { exec, spawn, execFile } from 'child_process';
import { promisify } from 'util';
import { ModelStatus } from './types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { modelsConfigService } from './models-config.service';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

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
      const { stdout } = await execAsync('bash -c "tmux list-sessions 2>/dev/null"');
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
      const { stdout } = await execAsync(
        'bash -c "test -f ~/.cache/huggingface/token && cat ~/.cache/huggingface/token"',
        { timeout: 5000 }
      );
      
      if (stdout.includes('hf_')) {
        console.log('[ModelService] HF authentication check: token found');
        return { authenticated: true };
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

      if (!token.startsWith('hf_') || token.length < 20) {
        return {
          success: false,
          message: 'Invalid HuggingFace token format. Tokens must start with "hf_" and be at least 20 characters.'
        };
      }

      const sanitizedToken = token.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedToken.length !== token.length) {
        return {
          success: false,
          message: 'Token contains invalid characters'
        };
      }

      let cliAvailable = false;
      
      try {
        await execAsync('bash -c "(hf --version || huggingface-cli --version) 2>/dev/null"', { timeout: 5000 });
        cliAvailable = true;
      } catch {
        try {
          await execAsync(
            'bash -c "source ~/torch-env/bin/activate && python -m pip install huggingface-hub --upgrade --quiet"',
            { timeout: 60000 }
          );
          await new Promise(resolve => setTimeout(resolve, 1000));
          cliAvailable = true;
        } catch {
          return {
            success: false,
            message: 'Failed to install huggingface-hub. Ensure pip and virtual environment are working.'
          };
        }
      }
      
      try {
        await execAsync('bash -c "mkdir -p ~/.cache/huggingface"', { timeout: 5000 });
        
        const { home } = require('os').userInfo();
        const tokenPath = join(home, '.cache/huggingface/token');
        const fs = require('fs').promises;
        await fs.writeFile(tokenPath, sanitizedToken);
        await fs.chmod(tokenPath, 0o600);
        
        const savedToken = await fs.readFile(tokenPath, 'utf-8');
        if (!savedToken.includes('hf_')) {
          return {
            success: false,
            message: 'Token could not be properly saved'
          };
        }
      } catch (error) {
        console.error('[ModelService] Token save error:', error);
        return {
          success: false,
          message: 'Failed to save token. Check file permissions and disk space.'
        };
      }
      
      return {
        success: true,
        message: 'Successfully authenticated with HuggingFace'
      };
    } catch (error) {
      console.error('[ModelService] HF authentication error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: 'Unexpected error during authentication'
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
      
      const { stdout: checkOutput } = await execAsync(
        `bash -c "ls ~/.cache/huggingface/hub/ 2>/dev/null | grep -i '${hubDirName}' || echo ''"`
      );
      
      if (checkOutput.trim()) {
        const dirName = checkOutput.trim().replace(/[^a-zA-Z0-9_.-]/g, '');
        const { stdout: sizeOutput } = await execAsync(
          `bash -c "du -sh ~/.cache/huggingface/hub/${dirName} 2>/dev/null | cut -f1"`
        );
        
        return {
          downloaded: true,
          modelPath: `~/.cache/huggingface/hub/${dirName}`,
          size: sizeOutput.trim()
        };
      }
      
      console.log(`Downloading model: ${sanitizedModelName}`);
      await execAsync(
        `bash -c "source ~/torch-env/bin/activate && python3 -c 'from huggingface_hub import snapshot_download; snapshot_download(\\\"${sanitizedModelName}\\\", local_dir_use_symlinks=True)'"`,
        { timeout: 300000 }
      );
      
      return await this.downloadModel(sanitizedModelName);
    } catch (error) {
      console.error('[ModelService] Model download error:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to download model');
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
      const roleRegex = /^[a-z]+$/;
      if (!roleRegex.test(role)) {
        throw new Error('Invalid role name. Must contain only lowercase letters.');
      }

      const sessionName = `vllm-${role}`;
      
      const actualModelName = modelName || await this.getModelNameForRole(role);
      
      const authStatus = await this.checkHFAuth();
      if (!authStatus.authenticated) {
        throw new Error('HuggingFace authentication required. Please provide HF_TOKEN.');
      }

      const downloadStatus = await this.downloadModel(actualModelName);
      
      await execAsync(`bash -c "cd ~/.config/llm-doctrine && tmux new-session -d -s ${role.replace(/[^a-z]/g, '')} ./daily-bootstrap.sh ${role.replace(/[^a-z]/g, '')}"`, {
        timeout: 10000
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const port = await this.getPortForRole(role);
      
      return {
        name: actualModelName,
        role,
        status: 'starting',
        port
      };
    } catch (error) {
      throw new Error(`Failed to start model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async stopModel(role: string): Promise<{ success: boolean; message: string }> {
    try {
      const roleRegex = /^[a-z]+$/;
      if (!roleRegex.test(role)) {
        return {
          success: false,
          message: 'Invalid role name'
        };
      }

      const sanitizedRole = role.replace(/[^a-z]/g, '');
      await execAsync(`bash -c "tmux kill-session -t vllm-${sanitizedRole}"`, { timeout: 5000 });
      
      return {
        success: true,
        message: `Model ${role} stopped successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop model: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async getModelLogs(role: string, lines: number = 100): Promise<string> {
    try {
      const roleRegex = /^[a-z]+$/;
      if (!roleRegex.test(role)) {
        throw new Error('Invalid role name');
      }

      if (lines < 1 || lines > 1000) {
        lines = 100;
      }

      const sanitizedRole = role.replace(/[^a-z]/g, '');
      const { stdout } = await execAsync(
        `bash -c "tail -n ${lines} ~/.config/llm-doctrine/logs/${sanitizedRole}*.log 2>/dev/null || echo 'No logs found'"`,
        { timeout: 5000 }
      );
      return stdout;
    } catch (error) {
      console.error('[ModelService] Error getting logs:', error);
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
