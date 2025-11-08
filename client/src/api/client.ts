import axios, { AxiosInstance } from 'axios';
import type { AuthTokens, Model, CompletionRequest, User } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            if (this.refreshToken) {
              const { data } = await this.client.post<AuthTokens>('/auth/refresh', {
                refreshToken: this.refreshToken
              });

              this.setTokens(data.accessToken, data.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    this.loadTokensFromStorage();
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private loadTokensFromStorage(): void {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async register(username: string, password: string): Promise<AuthTokens> {
    this.clearTokens();
    const { data } = await this.client.post<AuthTokens>('/auth/register', {
      username,
      password,
      role: 'user'
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async login(username: string, password: string): Promise<AuthTokens> {
    this.clearTokens();
    const { data } = await this.client.post<AuthTokens>('/auth/login', {
      username,
      password
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async verifyToken(): Promise<User> {
    const { data } = await this.client.get<User>('/auth/verify');
    return data;
  }

  async get<T = any>(url: string, config?: any): Promise<{ data: T }> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return this.client.put<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<{ data: T }> {
    return this.client.delete<T>(url, config);
  }

  async listModels(): Promise<Model[]> {
    const { data } = await this.client.get<{ models: Model[] }>('/models');
    return data.models;
  }

  async createCompletion(request: CompletionRequest): Promise<any> {
    const { data } = await this.client.post('/chat/completions', request);
    return data;
  }

  logout(): void {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const apiClient = new ApiClient();
