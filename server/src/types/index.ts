export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: Date;
  rateLimit?: number;
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  port: number;
  tier: string;
  status: 'running' | 'stopped' | 'error';
}

export interface CompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}
