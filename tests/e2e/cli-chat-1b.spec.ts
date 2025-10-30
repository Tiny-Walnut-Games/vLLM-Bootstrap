/**
 * 1B Tier CLI Chat Validation Tests
 *
 * These tests validate the core customer experience on consumer hardware (RTX 2060 6GB VRAM).
 * They follow the exact path: download → bootstrap → launch → chat, as a fresh user would.
 *
 * Tests are designed to run on Windows (via WSL), Linux, and macOS.
 * They validate actual chat responses from the 1B model via CLI commands.
 */

import { test, expect } from '@playwright/test';
import { exec, execSync } from 'node:child_process';

const FAST_TIER_PORT = 8100;
const LAUNCH_TIMEOUT = 180000; // 3 minutes for model to launch
const CHAT_TIMEOUT = 30000; // 30 seconds per chat request
const AUTH_TOKEN = process.env.FALLBACK_AUTH_TOKEN ?? 'fallback-token-12345';

// Type-safe response validation with runtime type guards
// No explicit interfaces needed - using type guards on unknown types

/**
 * Helper: Execute chat completion via safe HTTP client (not shell command)
 * Uses native fetch to prevent command injection vulnerabilities
 */
async function chatWithModel(prompt: string, maxTokens = 30): Promise<string> {
  try {
    const payload = {
      model: 'default',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT);

    try {
      const response = await fetch(`http://localhost:${FAST_TIER_PORT}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as unknown;

      // Validate response structure
      if (
        typeof data !== 'object' ||
        data === null ||
        !('choices' in data) ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0
      ) {
        throw new Error('Invalid response structure: missing choices array');
      }

      const choice = data.choices[0];
      if (
        typeof choice !== 'object' ||
        choice === null ||
        !('message' in choice) ||
        typeof choice.message !== 'object' ||
        choice.message === null ||
        !('content' in choice.message) ||
        typeof choice.message.content !== 'string'
      ) {
        throw new Error('Invalid response structure: message content is not a string');
      }

      return choice.message.content;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Network error: Failed to connect to model on port ${FAST_TIER_PORT}. Is the server running?`,
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Chat request failed: ${msg}`);
  }
}

/**
 * Helper: Check if port is listening
 */
async function isPortReady(port: number, timeout = 5000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        return true;
      }
    } catch {
      // Connection failed, retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

/**
 * Helper: Launch the 1B model
 */
async function launch1BModel(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🚀 Launching 1B (fast) model...');

  // Kill any existing processes
  try {
    execSync('pkill -f "vllm.*8100" || true', { stdio: 'pipe' });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (e) {
    // Ignore
  }

  // Launch model in background
  // On Linux/macOS: uses WSL bash via wsl command or native bash
  // On Windows: wraps in wsl bash
  const launchCmd =
    process.platform === 'win32'
      ? 'wsl bash -c "cd ~/.config/llm-doctrine && source ~/torch-env/bin/activate && ./daily-bootstrap.sh fast"'
      : 'bash -c "cd ~/.config/llm-doctrine && source ~/torch-env/bin/activate && ./daily-bootstrap.sh fast"';

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exec(launchCmd, { detached: true, stdio: 'ignore' } as any);
  } catch (e) {
    // Background execution may throw, but process is launched
  }

  // Wait for model to become ready
  const ready = await isPortReady(FAST_TIER_PORT, LAUNCH_TIMEOUT);
  if (!ready) {
    throw new Error(
      `1B model failed to start on port ${FAST_TIER_PORT} within ${LAUNCH_TIMEOUT}ms`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(`✅ 1B model ready on port ${FAST_TIER_PORT}`);
}

/**
 * Helper: Stop the 1B model
 */
async function stop1BModel(): Promise<void> {
  try {
    const cmd =
      process.platform === 'win32'
        ? 'wsl bash -c "pkill -f \'vllm.*8100\' || true"'
        : 'pkill -f "vllm.*8100" || true';

    execSync(cmd, { stdio: 'pipe' });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (e) {
    // Ignore
  }
}

test.describe('1B Tier (Fast) - CLI Chat Validation', () => {
  test.beforeAll(async () => {
    // Launch once for all tests in this suite
    await launch1BModel();
  });

  test.afterAll(async () => {
    // Cleanup
    await stop1BModel();
  });

  test('should have health endpoint responding', async () => {
    const response = await fetch(`http://localhost:${FAST_TIER_PORT}/health`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });

  test('should list available models via API', async () => {
    const response = await fetch(`http://localhost:${FAST_TIER_PORT}/v1/models`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });
    expect(response.ok).toBe(true);

    const data = (await response.json()) as unknown;

    // Type-safe validation
    if (
      typeof data !== 'object' ||
      data === null ||
      !('data' in data) ||
      !Array.isArray(data.data) ||
      data.data.length === 0
    ) {
      throw new Error('Invalid models response structure');
    }

    // Should include 'default' model
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasDefault = data.data.some((m: any) => m.id === 'default');
    expect(hasDefault).toBe(true);
  });

  test('SCENARIO 1: Greeting Test - "Say hello in exactly 3 words"', async () => {
    const prompt = 'Say hello in exactly 3 words.';
    const response = await chatWithModel(prompt, 20);

    // Response should not be empty
    expect(response.trim().length).toBeGreaterThan(0);

    // Response should contain greeting-like words
    const lowerResponse = response.toLowerCase();
    const hasGreeting =
      lowerResponse.includes('hello') ||
      lowerResponse.includes('hi') ||
      lowerResponse.includes('hey') ||
      lowerResponse.includes('greetings');

    expect(hasGreeting).toBe(true);
  });

  test('SCENARIO 2: Math Test - "What is 2 + 2?"', async () => {
    const prompt = 'What is 2 + 2?';
    const response = await chatWithModel(prompt, 20);

    // Response should not be empty
    expect(response.trim().length).toBeGreaterThan(0);

    // Response should contain "4" or "four"
    const hasCorrectAnswer = response.includes('4') || response.toLowerCase().includes('four');

    expect(hasCorrectAnswer).toBe(true);
  });

  test('SCENARIO 3: Code Generation - "Write a Python function that adds two numbers"', async () => {
    const prompt = 'Write a Python function that adds two numbers';
    const response = await chatWithModel(prompt, 100);

    // Response should not be empty
    expect(response.trim().length).toBeGreaterThan(0);

    // Response should look like Python code (contains def, function syntax)
    const lowerResponse = response.toLowerCase();
    const hasFunctionDef =
      response.includes('def ') || response.includes('function') || lowerResponse.includes('def');

    expect(hasFunctionDef).toBe(true);

    // Should have some kind of addition or parameter handling
    const hasAddLogic =
      response.includes('+') || response.includes('add') || response.includes('sum');

    expect(hasAddLogic).toBe(true);
  });

  test('should handle multi-turn conversations', async () => {
    // First turn
    const prompt1 = 'What is Python?';
    const response1 = await chatWithModel(prompt1, 50);

    expect(response1.trim().length).toBeGreaterThan(0);

    // Second turn (different question)
    const prompt2 = 'What is JavaScript?';
    const response2 = await chatWithModel(prompt2, 50);

    expect(response2.trim().length).toBeGreaterThan(0);

    // Both should have content about their respective languages
    expect(response1.toLowerCase().includes('python')).toBe(true);
    expect(response2.toLowerCase().includes('javascript')).toBe(true);
  });

  test('should handle concurrent requests without hanging', async () => {
    const prompts = ['Say yes', 'Say no', 'Say maybe'];

    // Send all requests in parallel
    const responses = await Promise.all(prompts.map((p) => chatWithModel(p, 20)));

    // All should have responses
    expect(responses.length).toBe(3);
    responses.forEach((response) => {
      expect(response.trim().length).toBeGreaterThan(0);
    });
  });

  test('should return valid JSON responses', async () => {
    const prompt = 'Test';
    const payload = {
      model: 'default',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20,
      temperature: 0.7,
    };

    const response = await fetch(`http://localhost:${FAST_TIER_PORT}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    expect(response.ok).toBe(true);

    // Should be valid JSON
    const data = (await response.json()) as unknown;

    // Type-safe validation
    if (typeof data !== 'object' || data === null || !('choices' in data)) {
      throw new Error('Invalid JSON response structure');
    }

    expect(data.choices).toBeDefined();
  });

  test('should gracefully handle empty/whitespace prompts', async () => {
    const payload = {
      model: 'default',
      messages: [{ role: 'user', content: '   ' }],
      max_tokens: 10,
      temperature: 0.7,
    };

    const response = await fetch(`http://localhost:${FAST_TIER_PORT}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    expect(response.ok).toBe(true);
    const data = (await response.json()) as Record<string, unknown>;

    // Should either handle gracefully or return a response
    expect(data).toBeDefined();

    if (
      (data as Record<string, unknown>)?.choices &&
      Array.isArray((data as Record<string, unknown>)?.choices)
    ) {
      // If it responds, response should be defined
      expect(((data as Record<string, unknown>)?.choices as unknown[])[0]).toBeDefined();
    }
  });

  test('Customer Experience Summary: Full Chat Workflow', async () => {
    // This test simulates a real user following the README to chat with the model

    // User sees: "Model is ready and responding to chat"
    const testPrompt = 'Respond with a single word: ready';
    const response = await chatWithModel(testPrompt, 10);

    expect(response.trim().length).toBeGreaterThan(0);
  });
});
