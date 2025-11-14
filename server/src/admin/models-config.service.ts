import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export interface TierModels {
  default: string;
  alt1?: string;
  alt2?: string;
}

export interface ModelsConfig {
  [tier: string]: TierModels;
}

export interface RoleModelMapping {
  [role: string]: {
    tier: string;
    model: string;
    token?: string;
  };
}

class ModelsConfigService {
  private configFilePath = join(__dirname, '../../../config/role-model-mapping.json');
  private modelsConfPath = join(__dirname, '../../../scripts/models.conf');
  private modelsCache: ModelsConfig | null = null;

  async loadModelsConf(): Promise<ModelsConfig> {
    if (this.modelsCache) {
      return this.modelsCache;
    }

    try {
      const content = await readFile(this.modelsConfPath, 'utf-8');
      const config: ModelsConfig = {};
      let currentTier: string | null = null;

      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        const tierMatch = trimmed.match(/^\[([A-Za-z0-9B]+)\]$/);
        if (tierMatch) {
          currentTier = tierMatch[1];
          config[currentTier] = { default: '' };
          continue;
        }

        if (currentTier && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const keyTrimmed = key.trim();
          const value = valueParts.join('=').trim();

          if (keyTrimmed === 'default') {
            config[currentTier].default = value;
          } else if (keyTrimmed === 'alt1') {
            config[currentTier].alt1 = value;
          } else if (keyTrimmed === 'alt2') {
            config[currentTier].alt2 = value;
          }
        }
      }

      this.modelsCache = config;
      return config;
    } catch (error) {
      console.error('[ModelsConfigService] Error loading models.conf:', error);
      return {};
    }
  }

  async getRoleModelMapping(): Promise<RoleModelMapping> {
    try {
      const content = await readFile(this.configFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.log('[ModelsConfigService] No role-model mapping found, initializing defaults from models.conf');
      const defaults = await this.getDefaultRoleMappings();
      if (Object.keys(defaults).length > 0) {
        await this.setRoleModelMapping(defaults);
      }
      return defaults;
    }
  }

  private async getDefaultRoleMappings(): Promise<RoleModelMapping> {
    const config = await this.loadModelsConf();
    const mapping: RoleModelMapping = {};

    if (config['1B']?.default) {
      mapping['fast'] = {
        tier: '1B',
        model: config['1B'].default
      };
    }
    if (config['4B']?.default) {
      mapping['edit'] = {
        tier: '4B',
        model: config['4B'].default
      };
    }
    if (config['7B']?.default) {
      mapping['qa'] = {
        tier: '7B',
        model: config['7B'].default
      };
    }
    if (config['15B']?.default) {
      mapping['plan'] = {
        tier: '15B',
        model: config['15B'].default
      };
    }

    return mapping;
  }

  async setRoleModelMapping(mapping: RoleModelMapping): Promise<void> {
    try {
      await writeFile(this.configFilePath, JSON.stringify(mapping, null, 2));
      console.log('[ModelsConfigService] Role-model mapping saved');
    } catch (error) {
      console.error('[ModelsConfigService] Error saving mapping:', error);
      throw error;
    }
  }

  async getModelForRole(role: string): Promise<{ model: string; token?: string } | null> {
    const mapping = await this.getRoleModelMapping();
    const roleConfig = mapping[role];

    if (roleConfig) {
      const tokenEnvKey = `MODEL_${role.toUpperCase()}_TOKEN`;
      const token = process.env[tokenEnvKey] || process.env.HF_TOKEN;
      
      return {
        model: roleConfig.model,
        token
      };
    }

    return null;
  }

  async getAllAvailableModels(): Promise<{
    tiers: string[];
    modelsByTier: ModelsConfig;
  }> {
    const config = await this.loadModelsConf();
    return {
      tiers: Object.keys(config),
      modelsByTier: config
    };
  }

  async setModelForRole(role: string, tier: string, model: string, token?: string): Promise<void> {
    const mapping = await this.getRoleModelMapping();
    mapping[role] = { tier, model, token };
    await this.setRoleModelMapping(mapping);
  }
}

export const modelsConfigService = new ModelsConfigService();
