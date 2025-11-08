import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { User, TokenPayload, AuthResponse } from '../types';
import { userStorage } from './storage';

const SALT_ROUNDS = 10;

export class AuthService {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable must be set');
    }
    if (!this.jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable must be set');
    }
  }

  async register(
    username: string,
    password: string,
    role: 'admin' | 'user' = 'user'
  ): Promise<AuthResponse> {
    this.validatePassword(password);

    const existingUser = await userStorage.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user: User = {
      id: randomUUID(),
      username,
      passwordHash,
      role,
      createdAt: new Date()
    };

    await userStorage.createUser(user);
    return this.generateTokens(user);
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const user = await userStorage.findByUsername(username);
    if (!user) {
      console.log(`[AUTH] Login failed: user "${username}" not found`);
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as TokenPayload;
      const user = await userStorage.findById(payload.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private generateTokens(user: User): AuthResponse {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const accessToken = (jwt.sign as any)(payload, this.jwtSecret, { 
      expiresIn: this.jwtExpiresIn 
    });
    
    const refreshToken = (jwt.sign as any)(payload, this.jwtRefreshSecret, { 
      expiresIn: this.jwtRefreshExpiresIn 
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(this.jwtExpiresIn)
    };
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900;

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    return value * (multipliers[unit] || 60);
  }
}

export const authService = new AuthService();
