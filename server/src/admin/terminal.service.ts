import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export interface TerminalOutput {
  data: string;
  timestamp: number;
}

const SENSITIVE_PATTERNS = [
  /hf_[a-zA-Z0-9]{39}/gi,
  /token["\s=]*[:\s]*['""]?([a-zA-Z0-9_-]{20,})['""]?/gi,
  /api[_-]?key["\s=]*[:\s]*['""]?([a-zA-Z0-9_-]{20,})['""]?/gi,
  /password["\s=]*[:\s]*['""]?([^\s'""\n,}]{8,})['""]?/gi,
  /Bearer\s+([a-zA-Z0-9_-]+)/gi,
  /Authorization["\s=]*[:\s]*['""]?([a-zA-Z0-9_-]{20,})['""]?/gi,
];

const isTmuxAvailable = async (): Promise<boolean> => {
  try {
    await execAsync('tmux -V', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
};

export class TerminalService {
  private tmuxSession = 'vllm-bootstrap-server';
  private tmuxWindow = '0';
  private lastLogRead = 0;
  private logFile = process.env.SERVER_LOG_FILE || './server.log';
  private isWindows = process.platform === 'win32';

  sanitizeOutput(text: string): string {
    let sanitized = text;

    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  async capturePane(): Promise<TerminalOutput> {
    try {
      if (this.isWindows) {
        return await this.captureLogFile();
      }

      const { stdout } = await execAsync(
        `tmux capture-pane -t ${this.tmuxSession}:${this.tmuxWindow} -p`,
        { maxBuffer: 1024 * 1024 * 10 }
      );

      const sanitized = this.sanitizeOutput(stdout);

      return {
        data: sanitized,
        timestamp: Date.now()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to capture pane: ${message}`);
    }
  }

  private async captureLogFile(): Promise<TerminalOutput> {
    try {
      const content = await readFile(this.logFile, 'utf-8');
      const lines = content.split('\n').slice(-500);
      const data = lines.join('\n');
      const sanitized = this.sanitizeOutput(data);

      return {
        data: sanitized,
        timestamp: Date.now()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read log file: ${message}`);
    }
  }

  async streamPane(
    onData: (output: TerminalOutput) => void,
    onError: (error: Error) => void,
    intervalMs: number = 500
  ): Promise<() => void> {
    let lastOutput = '';

    const interval = setInterval(async () => {
      try {
        const output = await this.capturePane();

        if (output.data !== lastOutput) {
          lastOutput = output.data;
          onData(output);
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }

  async sendCommand(command: string): Promise<void> {
    try {
      if (this.isWindows) {
        throw new Error('Command sending not supported on Windows. Terminal is read-only.');
      }

      await execAsync(
        `tmux send-keys -t ${this.tmuxSession}:${this.tmuxWindow} "${command}" Enter`,
        { shell: '/bin/bash' }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send command: ${message}`);
    }
  }

  getStatus(): { session: string; window: string } {
    return {
      session: this.tmuxSession,
      window: this.tmuxWindow
    };
  }
}

export const terminalService = new TerminalService();
