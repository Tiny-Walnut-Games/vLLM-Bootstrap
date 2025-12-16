/**
 * TypeScript type definitions for vLLM-Doctrine tests
 */

export interface OpenAICompatibleResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant' | 'user' | 'system';
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelsListResponse {
  object: 'list';
  data: Array<{
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
  }>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
}

export interface ModelConfiguration {
  tier: '1B' | '4B' | '7B' | '15B';
  role: 'fast' | 'edit' | 'qa' | 'plan';
  defaultModel: string;
  alternativeModels: string[];
  portRange: {
    start: number;
    end: number;
  };
  expectedChatTemplate: string;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  errorMessage?: string;
  details?: Record<string, any>;
}

export interface ApiCompatibilityResult {
  health: boolean;
  models: boolean;
  chat: boolean;
  modelList?: string[];
  chatResponse?: string;
  errors: string[];
}

export interface IDEIntegrationResult {
  codeGeneration: boolean;
  codeCompletion: boolean;
  systemMessages: boolean;
  multiTurn: boolean;
  errors: string[];
}

export interface SystemRequirements {
  pythonVersion?: string;
  venvExists: boolean;
  cudaAvailable: boolean;
  huggingfaceAuth: boolean;
  requiredPackages: string[];
  missingPackages: string[];
}

export interface ConfigurationValidation {
  modelsConf: boolean;
  portsConf: boolean;
  chatTemplatesConf: boolean;
  scriptsExecutable: boolean;
  versionConsistency: boolean;
  errors: string[];
}