import { exec } from 'child_process';
import { promisify } from 'util';
import { SystemStatus } from './types';

const execAsync = promisify(exec);

export class SystemService {
  async getSystemStatus(): Promise<SystemStatus> {
    const [node, python, vllm, huggingface] = await Promise.all([
      this.checkNode(),
      this.checkPython(),
      this.checkVLLM(),
      this.checkHuggingFace()
    ]);

    return { 
      node, 
      wsl: { installed: true, distribution: 'Running in WSL' },
      python, 
      vllm, 
      huggingface 
    };
  }

  private async checkNode() {
    try {
      const { stdout } = await execAsync('node -v');
      return {
        installed: true,
        version: stdout.trim()
      };
    } catch {
      return { installed: false };
    }
  }

  private async checkPython() {
    try {
      const { stdout } = await execAsync('python3 --version');
      return {
        installed: true,
        version: stdout.trim().replace('Python ', '')
      };
    } catch {
      return { installed: false };
    }
  }

  private async checkVLLM() {
    try {
      const { stdout } = await execAsync(
        'bash -c "source ~/torch-env/bin/activate && pip show vllm 2>/dev/null | grep Version"'
      );
      const versionMatch = stdout.match(/Version: (.+)/);
      return {
        installed: true,
        version: versionMatch ? versionMatch[1].trim() : undefined
      };
    } catch {
      return { installed: false };
    }
  }

  private async checkHuggingFace() {
    try {
      const { stdout } = await execAsync(
        'bash -c "source ~/torch-env/bin/activate 2>/dev/null && (hf auth whoami || huggingface-cli whoami) 2>&1"'
      );
      
      if (stdout.includes('Not logged in') || stdout.includes('command not found')) {
        return { authenticated: false };
      }
      
      const match = stdout.match(/username:\s*(.+)/);
      return {
        authenticated: true,
        username: match ? match[1].trim() : undefined
      };
    } catch {
      return { authenticated: false };
    }
  }

  async bootstrapVLLM(): Promise<{ success: boolean; message: string }> {
    try {
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        console.warn('[SystemService] Bootstrap not supported on Windows');
        return {
          success: false,
          message: 'Bootstrap requires Linux/Unix environment. Please use WSL or native Linux.'
        };
      }

      const { stdout, stderr } = await execAsync(
        'bash -c "cd ~/.config/llm-doctrine && ./initial-bootstrap.sh"',
        { timeout: 600000 }
      );
      
      console.log('[SystemService] Bootstrap stdout:', stdout);
      console.log('[SystemService] Bootstrap stderr:', stderr);
      
      return {
        success: !stderr.includes('ERROR'),
        message: stdout + (stderr || '')
      };
    } catch (error) {
      console.error('[SystemService] Bootstrap error:', error);
      return {
        success: false,
        message: `Bootstrap failed: ${error}`
      };
    }
  }
}
