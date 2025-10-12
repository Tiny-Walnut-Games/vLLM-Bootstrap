/**
 * Model Utilities for vLLM-Doctrine Tests
 * 
 * Provides helper functions for managing model lifecycle, API testing,
 * and validating OpenAI compatibility.
 */
import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
// Note: Using globalThis fetch if available, otherwise will need to install node-fetch
// @ts-ignore
const fetch = globalThis.fetch || require('node-fetch');

const execAsync = promisify(exec);

export interface ModelTier {
  name: string;
  role: 'fast' | 'edit' | 'qa' | 'plan';
  tier: '1B' | '4B' | '7B' | '15B';
  portStart: number;
  portEnd: number;
  models: string[];
  expectedTemplate?: string;
}

export const MODEL_TIERS: ModelTier[] = [
  {
    name: 'Fast (1B)',
    role: 'fast',
    tier: '1B',
    portStart: 8100,
    portEnd: 8299,
    models: [
      'meta-llama/Llama-3.2-1B',
      'Qwen/Qwen2.5-0.5B-Instruct',
      'HuggingFaceTB/SmolLM2-1.7B-Instruct'
    ],
    expectedTemplate: 'llama3'
  },
  {
    name: 'Edit (4B)',
    role: 'edit',
    tier: '4B',
    portStart: 8300,
    portEnd: 8499,
    models: [
      'microsoft/phi-3.5-mini-instruct',
      'google/gemma-3-4b',
      'cerebras/Cerebras-GPT-2.7B'
    ],
    expectedTemplate: 'phi3'
  },
  {
    name: 'QA (7B)',
    role: 'qa',
    tier: '7B',
    portStart: 8500,
    portEnd: 8699,
    models: [
      'mistralai/Mistral-7B-Instruct-v0.3',
      'teknium/OpenHermes-2.5-Mistral-7B',
      'MaziyarPanahi/WizardLM-2-7B-GGUF'
    ],
    expectedTemplate: 'mistral'
  },
  {
    name: 'Plan (15B)',
    role: 'plan',
    tier: '15B',
    portStart: 8700,
    portEnd: 8899,
    models: [
      'bigcode/starcoder2-15b',
      'ServiceNow-AI/Apriel-1.5-15b-Thinker',
      'mistralai/Codestral-15B'
    ],
    expectedTemplate: 'starcoder'
  }
];

/**
 * Check if a specific port has a healthy model server
 */
async function checkPortHealth(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.debug(`Port ${port} not ready: ${errorMessage}`);
    return false;
  }
}

/**
 * Scan port range for an available model server
 */
async function findAvailablePort(portStart: number, portEnd: number): Promise<number | null> {
  for (let port = portStart; port <= portEnd; port++) {
    const isHealthy = await checkPortHealth(port);
    if (isHealthy) {
      return port;
    }
  }
  return null;
}

/**
 * Kill existing model processes
 */
async function cleanupExistingProcesses(): Promise<void> {
  try {
    execSync('pkill -f "vllm.entrypoints.openai.api_server" || true', { stdio: 'pipe' });
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to kill existing processes: ${errorMessage}`);
    console.warn('Continuing with model launch despite cleanup failure...');
  }
}

/**
 * Launch a model server for the specified tier
 */
export async function launchModel(role: ModelTier['role'], timeout = 120000): Promise<number> {
  console.log(`🚀 Launching ${role} model...`);
  
  await cleanupExistingProcesses();
  
  // Launch the model
  exec(`source ~/torch-env/bin/activate && ./daily-bootstrap.sh ${role}`);
  
  const tier = MODEL_TIERS.find(t => t.role === role);
  if (!tier) {
    throw new Error(`Unknown role: ${role}`);
  }
  
  // Wait for the model to become available
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const port = await findAvailablePort(tier.portStart, tier.portEnd);
    if (port !== null) {
      console.log(`✅ Model ${role} ready on port ${port}`);
      return port;
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error(`Timeout waiting for ${role} model to start`);
}

/**
 * Stop all running model servers
 */
export async function stopAllModels(): Promise<void> {
  let stopSuccess = false;
  try {
    execSync('pkill -f "vllm.entrypoints.openai.api_server" || true', { stdio: 'pipe' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    stopSuccess = true;
    console.log('✅ All models stopped');
  } catch (error) {
    // Stop failed - log and set flag
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to stop models: ${errorMessage}`);
    stopSuccess = false;
  }
  
  if (!stopSuccess) {
    console.warn('⚠️ Some models may still be running');
  }
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    // Port check failed - log and return false (port not available)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.debug(`Port ${port} check failed: ${errorMessage}`);
    return false;
  }
}

/**
 * Test OpenAI-compatible API endpoints
 */
export async function testOpenAICompatibility(port: number): Promise<{
  health: boolean;
  models: boolean;
  chat: boolean;
  modelList?: string[];
  chatResponse?: string;
  errors: string[];
}> {
  const results = {
    health: false,
    models: false,
    chat: false,
    modelList: undefined as string[] | undefined,
    chatResponse: undefined as string | undefined,
    errors: [] as string[]
  };
  
  const baseUrl = `http://localhost:${port}`;
  
  // Test health endpoint
  try {
    const response = await fetch(`${baseUrl}/health`);
    results.health = response.ok;
  } catch (error) {
    results.errors.push(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Test models endpoint
  try {
    const response = await fetch(`${baseUrl}/v1/models`);
    if (response.ok) {
      const data = await response.json();
      results.models = true;
      results.modelList = data.data?.map((m: any) => m.id) || [];
    }
  } catch (error) {
    results.errors.push(`Models endpoint failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Test chat completion
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'default',
        messages: [
          { role: 'user', content: 'Say "Hello" and nothing else.' }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      results.chat = true;
      results.chatResponse = data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    results.errors.push(`Chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return results;
}

/**
 * Helper to make chat completion request
 */
async function makeChatRequest(
  baseUrl: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'default',
      messages,
      max_tokens: maxTokens,
      temperature
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
  return '';
}

/**
 * Test code generation capability
 */
async function testCodeGeneration(baseUrl: string): Promise<boolean> {
  try {
    const content = await makeChatRequest(
      baseUrl,
      [{ role: 'user', content: 'Write a Python function to calculate factorial' }],
      100,
      0.3
    );
    return content.includes('def') && content.includes('factorial');
  } catch (error) {
    throw new Error(`Code generation test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test code completion capability
 */
async function testCodeCompletion(baseUrl: string): Promise<boolean> {
  try {
    const content = await makeChatRequest(
      baseUrl,
      [{ role: 'user', content: 'Complete this Python code: def hello_world():' }],
      50,
      0.1
    );
    return content.includes('print') || content.includes('return');
  } catch (error) {
    throw new Error(`Code completion test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test system message handling
 */
async function testSystemMessages(baseUrl: string): Promise<boolean> {
  try {
    const content = await makeChatRequest(
      baseUrl,
      [
        { role: 'system', content: 'You are a helpful coding assistant working in an IDE.' },
        { role: 'user', content: 'Explain what this does: print("hello")' }
      ],
      80,
      0.2
    );
    return content.length > 10;
  } catch (error) {
    throw new Error(`System message test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test multi-turn conversation capability
 */
async function testMultiTurn(baseUrl: string): Promise<boolean> {
  try {
    const content = await makeChatRequest(
      baseUrl,
      [
        { role: 'user', content: 'Write a simple loop in Python' },
        { role: 'assistant', content: 'for i in range(5):\n    print(i)' },
        { role: 'user', content: 'Add error handling to this loop' }
      ],
      100,
      0.3
    );
    return content.includes('try') || content.includes('except');
  } catch (error) {
    throw new Error(`Multi-turn test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test IDE integration scenarios
 */
export async function testIDEIntegration(port: number): Promise<{
  codeGeneration: boolean;
  codeCompletion: boolean;
  systemMessages: boolean;
  multiTurn: boolean;
  errors: string[];
}> {
  const results = {
    codeGeneration: false,
    codeCompletion: false,
    systemMessages: false,
    multiTurn: false,
    errors: [] as string[]
  };
  
  const baseUrl = `http://localhost:${port}/v1/chat/completions`;
  
  // Run all tests and collect results
  try {
    results.codeGeneration = await testCodeGeneration(baseUrl);
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : String(error));
  }
  
  try {
    results.codeCompletion = await testCodeCompletion(baseUrl);
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : String(error));
  }
  
  try {
    results.systemMessages = await testSystemMessages(baseUrl);
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : String(error));
  }
  
  try {
    results.multiTurn = await testMultiTurn(baseUrl);
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : String(error));
  }
  
  return results;
}