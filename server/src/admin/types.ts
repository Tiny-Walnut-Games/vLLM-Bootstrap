export interface SystemStatus {
  node: {
    installed: boolean;
    version?: string;
  };
  wsl: {
    installed: boolean;
    distribution?: string;
  };
  python: {
    installed: boolean;
    version?: string;
  };
  vllm: {
    installed: boolean;
    version?: string;
  };
  huggingface: {
    authenticated: boolean;
    username?: string;
  };
}

export interface ModelStatus {
  name: string;
  role: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  port?: number;
  pid?: number;
  uptime?: number;
  gpuUsage?: number;
}

export enum OperationMode {
  IDE_ONLY = 'IDE_ONLY',
  GUI_CHAT = 'GUI_CHAT'
}

export interface BootstrapProgress {
  stage: string;
  progress: number;
  message: string;
  completed: boolean;
}
