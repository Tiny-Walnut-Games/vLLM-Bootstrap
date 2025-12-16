import axios, { AxiosInstance } from 'axios';
import { ModelInfo, CompletionRequest } from '../types';

export class ProxyService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.VLLM_BASE_URL || 'http://localhost:8500';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.get('/v1/models');
      
      if (response.data && response.data.data) {
        return response.data.data.map((model: any) => ({
          id: model.id,
          name: model.id,
          port: this.extractPort(this.baseUrl),
          tier: 'unknown',
          status: 'running' as const
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }

  async createCompletion(request: CompletionRequest): Promise<any> {
    try {
      const response = await this.client.post('/v1/chat/completions', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Proxy request failed');
      }
      throw error;
    }
  }

  async streamCompletion(request: CompletionRequest): Promise<AsyncGenerator<string>> {
    const response = await this.client.post('/v1/chat/completions', 
      { ...request, stream: true },
      { responseType: 'stream' }
    );

    const stream = response.data;
    
    return (async function* () {
      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e);
            }
          }
        }
      }
    })();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractPort(url: string): number {
    try {
      const urlObj = new URL(url);
      return parseInt(urlObj.port) || 80;
    } catch {
      return 8500;
    }
  }
}

export const proxyService = new ProxyService();
