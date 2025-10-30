/**
 * IDE Integration Tests for vLLM-Doctrine
 *
 * Tests specifically designed to validate integration with JetBrains Rider,
 * Visual Studio, VS Code, and other IDEs that support OpenAI-compatible APIs.
 */
import { test, expect } from '@playwright/test';
import { launchModel, stopAllModels } from '../utils/model-utils';

// Type-safe response validation with runtime type guards
// No explicit interfaces needed - using type guards on unknown types

// Authentication token for fallback server (matches fallback server config)
const AUTH_TOKEN = 'fallback-token-12345';

test.describe('IDE Integration Validation', () => {
  test.beforeEach(async () => {
    await stopAllModels();
  });

  test.afterEach(async () => {
    await stopAllModels();
  });

  test.describe('JetBrains Rider Integration', () => {
    test('should handle Rider-style code assistance requests', async () => {
      const port = await launchModel('qa', 180000); // Use 7B for better code quality

      // Simulate Rider's code assistance patterns
      const riderRequests = [
        // Code generation request
        {
          name: 'Code Generation',
          payload: {
            model: 'default',
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful coding assistant in JetBrains Rider. Provide concise, accurate code solutions.',
              },
              {
                role: 'user',
                content:
                  'Create a C# class for a simple calculator with Add, Subtract, Multiply, and Divide methods.',
              },
            ],
            max_tokens: 300,
            temperature: 0.3,
          },
          validate: (content: string) => {
            return (
              content.includes('class') &&
              content.includes('Calculator') &&
              (content.includes('Add') || content.includes('add')) &&
              content.includes('public')
            );
          },
        },

        // Code explanation
        {
          name: 'Code Explanation',
          payload: {
            model: 'default',
            messages: [
              {
                role: 'system',
                content:
                  'You are a coding assistant. Explain code clearly and concisely.',
              },
              {
                role: 'user',
                content:
                  'Explain what this C# code does: public async Task<string> GetDataAsync() => await httpClient.GetStringAsync(url);',
              },
            ],
            max_tokens: 150,
            temperature: 0.2,
          },
          validate: (content: string) => {
            return (
              content.toLowerCase().includes('async') &&
              content.toLowerCase().includes('http')
            );
          },
        },

        // Code refactoring suggestion
        {
          name: 'Refactoring Suggestion',
          payload: {
            model: 'default',
            messages: [
              {
                role: 'user',
                content:
                  'How can I improve this C# code?\n\npublic void ProcessItems(List<string> items)\n{\n    for (int i = 0; i < items.Count; i++)\n    {\n        Console.WriteLine(items[i]);\n    }\n}',
              },
            ],
            max_tokens: 200,
            temperature: 0.4,
          },
          validate: (content: string) => {
            return (
              content.toLowerCase().includes('foreach') ||
              content.toLowerCase().includes('linq') ||
              content.toLowerCase().includes('improve')
            );
          },
        },
      ];

      for (const request of riderRequests) {
        const response = await fetch(
          `http://localhost:${port}/v1/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify(request.payload),
          },
        );

        expect(response.ok, `${request.name} request failed`).toBe(true);

        const data = (await response.json()) as unknown;

        // Type-safe validation
        if (
          typeof data !== 'object' ||
          data === null ||
          !('choices' in data) ||
          !Array.isArray(data.choices) ||
          data.choices.length === 0
        ) {
          throw new Error(`${request.name}: Invalid response structure`);
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
          throw new Error(`${request.name}: Invalid message content`);
        }

        const content = choice.message.content;
        expect(
          content.trim().length,
          `${request.name} returned very short content`,
        ).toBeGreaterThan(10);

        // Validate specific content expectations
        if (request.validate) {
          expect(
            request.validate(content),
            `${request.name} content validation failed: ${content}`,
          ).toBe(true);
        }
      }
    });

    test('should handle Rider code completion scenarios', async () => {
      const port = await launchModel('edit', 180000); // Use 4B for code completion

      // Simulate various code completion scenarios
      const completionScenarios = [
        {
          name: 'Method Completion',
          prompt:
            'Complete this C# method:\npublic string FormatName(string firstName, string lastName)\n{',
          expectedPatterns: ['return', 'string', '$"', '+'],
        },
        {
          name: 'LINQ Query Completion',
          prompt: 'Complete this LINQ query:\nvar result = items.Where(',
          expectedPatterns: ['=>', 'x', '!=', '=='],
        },
        {
          name: 'Property Declaration',
          prompt: 'Complete this property:\npublic string Name { get;',
          expectedPatterns: ['set;', '}', 'private set;'],
        },
      ];

      for (const scenario of completionScenarios) {
        const response = await fetch(
          `http://localhost:${port}/v1/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify({
              model: 'default',
              messages: [{ role: 'user', content: scenario.prompt }],
              max_tokens: 100,
              temperature: 0.1, // Lower temperature for more predictable completions
            }),
          },
        );

        expect(response.ok, `${scenario.name} failed`).toBe(true);

        const data = (await response.json()) as unknown;

        // Type-safe validation
        if (
          typeof data !== 'object' ||
          data === null ||
          !('choices' in data) ||
          !Array.isArray(data.choices) ||
          data.choices.length === 0
        ) {
          throw new Error(`${scenario.name}: Invalid response structure`);
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
          throw new Error(`${scenario.name}: Invalid message content`);
        }

        const content = choice.message.content;

        // Check if at least one expected pattern is present
        const hasExpectedPattern = scenario.expectedPatterns.some((pattern) =>
          content.toLowerCase().includes(pattern.toLowerCase()),
        );

        expect(
          hasExpectedPattern,
          `${scenario.name} doesn't contain expected patterns. Content: ${content}`,
        ).toBe(true);
      }
    });
  });

  test.describe('Visual Studio & VS Code Integration', () => {
    test('should handle VS/VS Code style requests', async () => {
      const port = await launchModel('qa', 180000);

      const vsRequests = [
        // IntelliSense-style request
        {
          name: 'IntelliSense Help',
          messages: [
            {
              role: 'user',
              content: "I'm writing JavaScript. What parameters does Array.map() take?",
            },
          ],
          validate: (content: string) => {
            return (
              content.toLowerCase().includes('callback') ||
              content.toLowerCase().includes('function') ||
              content.toLowerCase().includes('element')
            );
          },
        },

        // Copilot-style completion
        {
          name: 'Code Completion',
          messages: [
            {
              role: 'user',
              content:
                'Complete this JavaScript function:\nfunction validateEmail(email) {\n    const regex = ',
            },
          ],
          validate: (content: string) => {
            return (
              (content.includes('/') && content.includes('@')) ||
              content.includes('RegExp') ||
              content.includes('test')
            );
          },
        },

        // Error explanation
        {
          name: 'Error Explanation',
          messages: [
            {
              role: 'user',
              content:
                'Explain this error: "Cannot read property \'length\' of undefined"',
            },
          ],
          validate: (content: string) => {
            return (
              content.toLowerCase().includes('undefined') &&
              (content.toLowerCase().includes('null') ||
                content.toLowerCase().includes('check'))
            );
          },
        },
      ];

      for (const request of vsRequests) {
        const response = await fetch(
          `http://localhost:${port}/v1/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify({
              model: 'default',
              messages: request.messages,
              max_tokens: 200,
              temperature: 0.3,
            }),
          },
        );

        expect(response.ok, `${request.name} request failed`).toBe(true);

        const data = (await response.json()) as unknown;

        // Type-safe validation
        if (
          typeof data !== 'object' ||
          data === null ||
          !('choices' in data) ||
          !Array.isArray(data.choices) ||
          data.choices.length === 0
        ) {
          throw new Error(`${request.name}: Invalid response structure`);
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
          throw new Error(`${request.name}: Invalid message content`);
        }

        const content = choice.message.content;

        expect(
          content.trim().length,
          `${request.name} returned very short content`,
        ).toBeGreaterThan(10);

        if (request.validate) {
          expect(
            request.validate(content),
            `${request.name} content validation failed: ${content}`,
          ).toBe(true);
        }
      }
    });

    test('should handle streaming responses for real-time feedback', async () => {
      const port = await launchModel('fast', 180000); // Use fast model for streaming

      // Test streaming endpoint (if supported by vLLM)
      const response = await fetch(
        `http://localhost:${port}/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
          body: JSON.stringify({
            model: 'default',
            messages: [
              {
                role: 'user',
                content: 'Write a Python function to sort a list',
              },
            ],
            max_tokens: 100,
            temperature: 0.3,
            stream: true,
          }),
        },
      );

      expect(response.ok, 'Streaming request failed').toBe(true);

      // If streaming is supported, we should get chunked data
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('text/plain')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        let chunks = 0;

        if (reader) {
          while (chunks < 5) {
            // Read first few chunks
            const { done } = await reader.read();
            if (done) break;
            chunks++;
          }
          reader.releaseLock();
        }

        expect(chunks, 'No streaming chunks received').toBeGreaterThan(0);
      } else {
        // Fall back to regular response validation
        const data = (await response.json()) as unknown;

        // Type-safe validation
        if (
          typeof data !== 'object' ||
          data === null ||
          !('choices' in data) ||
          !Array.isArray(data.choices) ||
          data.choices.length === 0
        ) {
          throw new Error('Invalid response structure for fallback');
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
          throw new Error('Invalid message content for fallback');
        }

        expect(choice.message.content).toBeDefined();
      }
    });
  });

  test.describe('Cross-IDE Compatibility', () => {
    test('should maintain consistent behavior across different IDEs', async () => {
      const port = await launchModel('qa', 180000);

      // Same request formatted as different IDEs might send it
      const testPrompt = 'Write a function to reverse a string';

      const ideFormats = [
        {
          name: 'Rider Format',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful coding assistant in JetBrains Rider.',
            },
            { role: 'user', content: testPrompt },
          ],
        },
        {
          name: 'VS Code Format',
          messages: [{ role: 'user', content: testPrompt }],
        },
        {
          name: 'GitHub Copilot Format',
          messages: [
            {
              role: 'system',
              content: 'Complete the following code request accurately.',
            },
            { role: 'user', content: testPrompt },
          ],
        },
      ];

      const responses = [];

      for (const format of ideFormats) {
        const response = await fetch(
          `http://localhost:${port}/v1/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify({
              model: 'default',
              messages: format.messages,
              max_tokens: 150,
              temperature: 0.2, // Low temperature for consistency
            }),
          },
        );

        expect(response.ok, `${format.name} failed`).toBe(true);

        const data = (await response.json()) as unknown;

        // Type-safe validation
        if (
          typeof data !== 'object' ||
          data === null ||
          !('choices' in data) ||
          !Array.isArray(data.choices) ||
          data.choices.length === 0
        ) {
          throw new Error(`${format.name}: Invalid response structure`);
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
          throw new Error(`${format.name}: Invalid message content`);
        }

        const content = choice.message.content;

        responses.push({
          name: format.name,
          content: content.toLowerCase(),
        });

        // Each should contain function-like keywords
        expect(
          content.includes('function') ||
            content.includes('def') ||
            content.includes('=>') ||
            content.includes('reverse'),
          `${format.name} doesn't contain expected function content`,
        ).toBe(true);
      }

      // All responses should be reasonably similar in intent
      // (they should all try to solve the same problem)
      for (const response of responses) {
        expect(
          response.content.includes('reverse') ||
            response.content.includes('string') ||
            response.content.includes('char'),
          `${response.name} response seems unrelated to the prompt`,
        ).toBe(true);
      }
    });

    test('should handle different authentication patterns', async () => {
      const port = await launchModel('fast', 180000);

      const authPatterns = [
        // No auth (most common for local)
        {},
        // Dummy API key (some IDEs require this field)
        { Authorization: 'Bearer dummy-key' },
        // Different auth header formats
        { 'X-API-Key': 'local-key' },
        { Authorization: 'API-Key local' },
      ];

      for (const [index, headers] of authPatterns.entries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchHeaders: any = {
          'Content-Type': 'application/json',
          ...headers,
        };

        const response = await fetch(
          `http://localhost:${port}/v1/chat/completions`,
          {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify({
              model: 'default',
              messages: [{ role: 'user', content: 'Hello' }],
              max_tokens: 20,
            }),
          },
        );

        // Local vLLM should accept all auth patterns (or ignore them)
        expect(response.ok, `Auth pattern ${index} failed`).toBe(true);

        const data = (await response.json()) as unknown;

        // Type-safe validation
        if (typeof data !== 'object' || data === null || !('choices' in data)) {
          throw new Error(`Auth pattern ${index}: Invalid response structure`);
        }

        expect(data.choices).toBeDefined();
      }
    });
  });
});
