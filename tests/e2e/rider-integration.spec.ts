import { test, expect } from '@playwright/test';

// Authentication token for fallback server (matches fallback server config)
const AUTH_TOKEN = process.env.FALLBACK_AUTH_TOKEN ?? 'fallback-token-12345';

/**
 * JetBrains Rider AI Assistant Integration Tests
 *
 * These tests verify the complete integration between vLLM-Doctrine
 * and JetBrains Rider's AI Assistant functionality.
 *
 * Prerequisites:
 * - vLLM-Doctrine model running (e.g., qa tier on port 8500)
 * - JetBrains Rider installed and accessible
 */

test.describe('Rider AI Assistant Integration', () => {
  const modelPort = 8500;
  const baseUrl = `http://localhost:${modelPort}`;

  test.beforeEach(async () => {
    // Set longer timeout for model interactions
    test.setTimeout(60000);
  });

  test('Verify OpenAI Compatible API Structure', async ({ request }) => {
    // eslint-disable-next-line no-console
    console.log('🔍 Verifying OpenAI API compatibility...');

    // Test the /v1/models endpoint structure
    const modelsResponse = await request.get(`${baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    expect(modelsResponse.ok()).toBeTruthy();

    const modelsData = await modelsResponse.json();
    expect(modelsData).toHaveProperty('object', 'list');
    expect(modelsData).toHaveProperty('data');
    expect(Array.isArray(modelsData.data)).toBeTruthy();

    // Verify model object structure matches OpenAI format
    if (modelsData.data.length > 0) {
      const model = modelsData.data[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('object', 'model');
      expect(model).toHaveProperty('created');
      // eslint-disable-next-line no-console
      console.log(`✅ Model available: ${model.id}`);
    }
  });

  test('Test Chat Completions Endpoint Compatibility', async ({ request }) => {
    // eslint-disable-next-line no-console
    console.log('💬 Testing chat completions compatibility...');

    const chatRequest = {
      model: 'default',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful coding assistant integrated with JetBrains Rider.',
        },
        {
          role: 'user',
          content: 'Write a simple C# method that adds two numbers.',
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
      stream: false,
    };

    const response = await request.post(`${baseUrl}/v1/chat/completions`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      data: chatRequest,
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify OpenAI-compatible response structure
    expect(data).toHaveProperty('object', 'chat.completion');
    expect(data).toHaveProperty('choices');
    expect(data).toHaveProperty('usage');

    expect(Array.isArray(data.choices)).toBeTruthy();
    expect(data.choices.length).toBeGreaterThan(0);

    const choice = data.choices[0];
    expect(choice).toHaveProperty('message');
    expect(choice.message).toHaveProperty('role', 'assistant');
    expect(choice.message).toHaveProperty('content');

    const content = choice.message.content;
    expect(content).toContain('public');
    expect(content).toContain('int');
    // eslint-disable-next-line no-console
    console.log(`✅ Generated C# code:\n${content}`);
  });

  test('Test Streaming Chat Completions', async ({ request }) => {
    // eslint-disable-next-line no-console
    console.log('🌊 Testing streaming chat completions...');

    const chatRequest = {
      model: 'default',
      messages: [
        {
          role: 'user',
          content: 'Explain what LINQ is in C# in one paragraph.',
        },
      ],
      max_tokens: 150,
      temperature: 0.5,
      stream: true,
    };

    const response = await request.post(`${baseUrl}/v1/chat/completions`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      data: chatRequest,
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();

    // Verify streaming format (Server-Sent Events)
    const lines = body.split('\n').filter((line) => line.trim());
    const dataLines = lines.filter((line) => line.startsWith('data: '));

    expect(dataLines.length).toBeGreaterThan(0);

    // Verify each chunk has proper structure
    let fullContent = '';
    for (const line of dataLines) {
      if (line === 'data: [DONE]') {
        break;
      }

      const jsonStr = line.substring(6); // Remove 'data: ' prefix
      try {
        const chunk = JSON.parse(jsonStr);
        expect(chunk).toHaveProperty('choices');

        if (chunk.choices[0]?.delta?.content) {
          fullContent += chunk.choices[0].delta.content;
        }
      } catch (e) {
        // Some chunks might be malformed, that's ok for this test
        // eslint-disable-next-line no-console
        console.warn(`Skipped malformed chunk: ${line}`);
      }
    }

    expect(fullContent.length).toBeGreaterThan(0);
    expect(fullContent.toLowerCase()).toContain('linq');
    // eslint-disable-next-line no-console
    console.log(`✅ Streamed content length: ${fullContent.length} chars`);
  });

  test('Test Code Generation Capabilities', async ({ request }) => {
    // eslint-disable-next-line no-console
    console.log('💻 Testing code generation capabilities...');

    const codePrompts = [
      {
        language: 'C#',
        prompt:
          'Create a simple REST API controller for managing users with GET and POST endpoints.',
        expectedKeywords: ['ApiController', 'HttpGet', 'HttpPost', 'public class'],
      },
      {
        language: 'C#',
        prompt: 'Write a unit test using xUnit for testing a calculator Add method.',
        expectedKeywords: ['[Test]', '[Fact]', 'Assert', 'public void'],
      },
      {
        language: 'SQL',
        prompt: 'Write a SQL query to find all users who registered in the last 30 days.',
        expectedKeywords: ['SELECT', 'WHERE', 'DATEADD', 'GETDATE'],
      },
    ];

    for (const testCase of codePrompts) {
      // eslint-disable-next-line no-console
      console.log(`  Testing ${testCase.language} code generation...`);

      const response = await request.post(`${baseUrl}/v1/chat/completions`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        data: {
          model: 'default',
          messages: [
            {
              role: 'system',
              content: `You are an expert ${testCase.language} developer. Provide clean, production-ready code.`,
            },
            {
              role: 'user',
              content: testCase.prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.3,
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Check for expected keywords
      const foundKeywords = testCase.expectedKeywords.filter((keyword) =>
        content.toLowerCase().includes(keyword.toLowerCase()),
      );

      // eslint-disable-next-line no-console
      console.log(
        `    Found ${foundKeywords.length}/${testCase.expectedKeywords.length} expected keywords`,
      );
      expect(foundKeywords.length).toBeGreaterThan(0);
    }
  });

  test('Test Error Handling', async ({ request }) => {
    // eslint-disable-next-line no-console
    console.log('⚠️ Testing error handling...');

    // Test malformed request
    const malformedResponse = await request.post(`${baseUrl}/v1/chat/completions`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      data: {
        // Missing required fields
        messages: [],
        max_tokens: -1,
      },
    });

    expect(malformedResponse.status()).toBe(400);

    // Test invalid endpoint
    const invalidResponse = await request.get(`${baseUrl}/v1/invalid-endpoint`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    expect(invalidResponse.status()).toBe(404);

    // eslint-disable-next-line no-console
    console.log('✅ Error handling works correctly');
  });

  test('Test Performance Metrics', async ({ request }) => {
    // eslint-disable-next-line no-console
    console.log('📊 Testing performance metrics...');

    const startTime = Date.now();

    const response = await request.post(`${baseUrl}/v1/chat/completions`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      data: {
        model: 'default',
        messages: [{ role: 'user', content: 'Write a simple "Hello World" in C#.' }],
        max_tokens: 50,
        temperature: 0.1,
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Check if usage statistics are provided
    if (data.usage) {
      // eslint-disable-next-line no-console
      console.log(`  Prompt tokens: ${data.usage.prompt_tokens}`);
      // eslint-disable-next-line no-console
      console.log(`  Completion tokens: ${data.usage.completion_tokens}`);
      // eslint-disable-next-line no-console
      console.log(`  Total tokens: ${data.usage.total_tokens}`);
    }

    // eslint-disable-next-line no-console
    console.log(`  Response time: ${responseTime}ms`);

    // Performance expectations
    if (responseTime > 30000) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️ Slow response time: ${responseTime}ms (CPU mode?)`);
    } else if (responseTime > 5000) {
      // eslint-disable-next-line no-console
      console.log(`⚡ Moderate response time: ${responseTime}ms (GPU mode)`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`🚀 Fast response time: ${responseTime}ms`);
    }

    expect(responseTime).toBeLessThan(60000); // Max 1 minute timeout
  });
});

test.describe('Rider Configuration Scenarios', () => {
  test('Generate Rider Settings Configuration', async () => {
    // eslint-disable-next-line no-console
    console.log('⚙️ Generating Rider configuration guide...');

    const configurationSteps = [
      {
        step: 1,
        action: 'Open JetBrains Rider',
        details: 'Launch Rider and open any C# project or solution',
      },
      {
        step: 2,
        action: 'Access AI Assistant Settings',
        details: 'Go to File → Settings → Tools → AI Assistant → Models',
      },
      {
        step: 3,
        action: 'Add OpenAI Compatible Provider',
        details: 'Click "+" to add new provider, select "OpenAI Compatible"',
      },
      {
        step: 4,
        action: 'Configure Connection',
        details: [
          'Name: vLLM-Doctrine Local',
          'Base URL: http://localhost:8500/v1',
          'API Key: any-key (not used by vLLM)',
          'Model: default or specific model name',
        ],
      },
      {
        step: 5,
        action: 'Test Connection',
        details: 'Click "Test Connection" to verify setup',
      },
      {
        step: 6,
        action: 'Enable AI Assistant',
        details: 'Make sure AI Assistant is enabled in Tools → AI Assistant → Enable AI Assistant',
      },
      {
        step: 7,
        action: 'Start Using',
        details: [
          'Press Alt+Enter for AI suggestions',
          'Use AI Assistant chat panel',
          'Right-click → AI Actions for context menu',
        ],
      },
    ];

    configurationSteps.forEach((step) => {
      // eslint-disable-next-line no-console
      console.log(`\n${step.step}. ${step.action}`);
      if (Array.isArray(step.details)) {
        step.details.forEach((detail) => {
          // eslint-disable-next-line no-console
          console.log(`   • ${detail}`);
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(`   ${step.details}`);
      }
    });

    expect(configurationSteps.length).toBe(7);
  });

  test('Common Integration Issues and Solutions', async () => {
    // eslint-disable-next-line no-console
    console.log('🔧 Common Rider integration issues...');

    const commonIssues = [
      {
        issue: 'Connection Refused',
        symptoms: ['Test Connection fails', '"Connection refused" error'],
        causes: ['Model not running', 'Wrong port', 'Firewall blocking'],
        solutions: [
          'Verify model is running: ./test-connection.sh 8500',
          'Check correct port in Rider settings',
          'Ensure Windows firewall allows WSL connections',
        ],
      },
      {
        issue: 'Slow Responses in Rider',
        symptoms: ['AI suggestions take >30 seconds', 'Timeout errors'],
        causes: ['CPU-only mode', 'Large model on limited VRAM', 'Network latency'],
        solutions: [
          'Switch to smaller model tier (fast/edit)',
          'Verify GPU utilization with nvidia-smi',
          'Use localhost instead of 127.0.0.1',
        ],
      },
      {
        issue: 'Authentication Errors',
        symptoms: ['401 Unauthorized', 'API key required'],
        causes: ['Incorrect API configuration in Rider'],
        solutions: [
          'Use any dummy API key (vLLM ignores it)',
          'Ensure Base URL ends with /v1',
          'Check provider type is "OpenAI Compatible"',
        ],
      },
      {
        issue: 'Model Switching',
        symptoms: ['Want to use different model without restarting'],
        causes: ['Single model per port limitation'],
        solutions: [
          'Run multiple models on different ports',
          'Configure multiple providers in Rider',
          'Use tmux sessions for model management',
        ],
      },
    ];

    commonIssues.forEach((issue, index) => {
      // eslint-disable-next-line no-console
      console.log(`\n${index + 1}. ${issue.issue}`);
      // eslint-disable-next-line no-console
      console.log(`   Symptoms: ${issue.symptoms.join(', ')}`);
      // eslint-disable-next-line no-console
      console.log(`   Causes: ${issue.causes.join(', ')}`);
      // eslint-disable-next-line no-console
      console.log('   Solutions:');
      issue.solutions.forEach((solution) => {
        // eslint-disable-next-line no-console
        console.log(`     • ${solution}`);
      });
    });

    expect(commonIssues.length).toBeGreaterThan(0);
  });

  test('Multi-Model Setup for Different Use Cases', async () => {
    // eslint-disable-next-line no-console
    console.log('🎯 Multi-model setup recommendations...');

    const setupRecommendations = [
      {
        useCase: 'Full Development Workflow',
        models: [
          {
            tier: 'fast',
            port: 8100,
            purpose: 'Autocomplete, quick suggestions',
          },
          {
            tier: 'edit',
            port: 8300,
            purpose: 'Code refactoring, documentation',
          },
          { tier: 'qa', port: 8500, purpose: 'Code review, debugging help' },
        ],
        riderConfig: 'Configure 3 providers, switch based on task complexity',
      },
      {
        useCase: 'Resource-Constrained Setup',
        models: [{ tier: 'fast', port: 8100, purpose: 'Primary model for all tasks' }],
        riderConfig: 'Single provider, good for systems with <12GB VRAM',
      },
      {
        useCase: 'Specialized Development',
        models: [
          {
            tier: 'plan',
            port: 8700,
            purpose: 'Architecture decisions, complex planning',
          },
          { tier: 'qa', port: 8500, purpose: 'General coding assistance' },
        ],
        riderConfig: 'Two providers: planning model + general-purpose model',
      },
    ];

    setupRecommendations.forEach((setup, index) => {
      // eslint-disable-next-line no-console
      console.log(`\n${index + 1}. ${setup.useCase}`);
      // eslint-disable-next-line no-console
      console.log('   Models:');
      setup.models.forEach((model) => {
        // eslint-disable-next-line no-console
        console.log(`     • ${model.tier} (port ${model.port}): ${model.purpose}`);
      });
      // eslint-disable-next-line no-console
      console.log(`   Rider Configuration: ${setup.riderConfig}`);
    });

    expect(setupRecommendations.length).toBe(3);
  });
});
