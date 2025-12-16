export interface User {
  userId: string;
  username: string;
  role: 'admin' | 'user';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Model {
  id: string;
  name: string;
  port: number;
  tier: string;
  status: 'running' | 'stopped' | 'error';
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentModel: string | null;
}
