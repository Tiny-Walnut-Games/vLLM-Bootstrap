import { User } from '../types';
import * as fs from 'fs';
import * as path from 'path';

class UserStorage {
  private users: Map<string, User> = new Map();
  private usernameIndex: Map<string, string> = new Map();
  private storageFile: string;

  constructor() {
    this.storageFile = path.join(__dirname, '../../..', '.users.json');
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf-8');
        const users: User[] = JSON.parse(data);
        users.forEach(user => {
          user.createdAt = new Date(user.createdAt);
          this.users.set(user.id, user);
          this.usernameIndex.set(user.username, user.id);
        });
        console.log(`[STORAGE] Loaded ${users.length} users from disk`);
      }
    } catch (error) {
      console.error('[STORAGE] Failed to load users from file:', error);
    }
  }

  private saveToFile(): void {
    try {
      const users = Array.from(this.users.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('[STORAGE] Failed to save users to file:', error);
    }
  }

  async createUser(user: User): Promise<User> {
    if (this.usernameIndex.has(user.username)) {
      throw new Error('Username already exists');
    }

    this.users.set(user.id, user);
    this.usernameIndex.set(user.username, user.id);
    this.saveToFile();
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userId = this.usernameIndex.get(username);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    this.saveToFile();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    this.usernameIndex.delete(user.username);
    this.users.delete(id);
    this.saveToFile();
    return true;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const userStorage = new UserStorage();
