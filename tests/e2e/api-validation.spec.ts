/**
 * vLLM-Doctrine API Validation Tests
 * 
 * Comprehensive end-to-end tests for validating the OpenAI-compatible API
 * functionality across all model tiers and ensuring proper IDE integration.
 */
import { test, expect } from '@playwright/test';
import { 
  MODEL_TIERS, 
  launchModel, 
  stopAllModels, 
  testOpenAICompatibility,
  testIDEIntegration 
} from '../utils/model-utils';

test.describe('vLLM-Doctrine API Validation', () => {
  
  test.beforeEach(async () => {
    // Ensure clean state before each test
    await stopAllModels();
  });
  
  test.afterEach(async () => {
    // Clean up after each test
    await stopAllModels();
  });

  for (const tier of MODEL_TIERS) {
    test.describe(`${tier.name} Model Tier`, () => {
      
      test(`should launch ${tier.role} model and pass health checks`, async () => {
        // Launch the model
        const port = await launchModel(tier.role, 180000); // 3 minute timeout for model loading
        
        // Verify it's within expected port range
        expect(port).toBeGreaterThanOrEqual(tier.portStart);
        expect(port).toBeLessThanOrEqual(tier.portEnd);
        
        // Test OpenAI compatibility
        const results = await testOpenAICompatibility(port);
        
        // Assertions
        expect(results.health).toBe(true);
        expect(results.models).toBe(true);
        expect(results.chat).toBe(true);
        
        // Validate model list contains expected models
        expect(results.modelList).toBeDefined();
        expect(results.modelList!.length).toBeGreaterThan(0);
        
        // Validate chat response is meaningful
        expect(results.chatResponse).toBeDefined();
        expect(results.chatResponse!.trim().length).toBeGreaterThan(0);
        
        // Report any errors
        if (results.errors.length > 0) {
          console.warn('Test warnings:', results.errors);
        }
      });
      
      test(`should handle IDE integration scenarios for ${tier.role}`, async () => {
        // Skip 15B tier on systems with limited resources
        if (tier.tier === '15B' && process.env.SKIP_LARGE_MODELS === 'true') {
          test.skip();
        }
        
        const port = await launchModel(tier.role, 180000);
        
        // Test IDE-specific scenarios
        const ideResults = await testIDEIntegration(port);
        
        // Code generation should work for all tiers
        expect(ideResults.codeGeneration).toBe(true);
        
        // Code completion should work for all tiers
        expect(ideResults.codeCompletion).toBe(true);
        
        // System messages should be handled properly
        expect(ideResults.systemMessages).toBe(true);
        
        // Multi-turn conversations should work (especially important for IDE usage)
        expect(ideResults.multiTurn).toBe(true);
        
        // Report errors if any
        if (ideResults.errors.length > 0) {
          console.warn('IDE integration warnings:', ideResults.errors);
        }
      });
      
      test(`should validate chat template format for ${tier.role}`, async () => {
        const port = await launchModel(tier.role, 180000);
        
        // Test different message formats that IDEs might send
        const testCases = [
          // Basic user message
          {
            messages: [{ role: 'user', content: 'Hello' }],
            description: 'basic user message'
          },
          // System + user (Rider format)
          {
            messages: [
              { role: 'system', content: 'You are a helpful coding assistant.' },
              { role: 'user', content: 'Help me write code' }
            ],
            description: 'system + user messages'
          },
          // Multi-turn conversation (VS Code format)
          {
            messages: [
              { role: 'user', content: 'Write a function' },
              { role: 'assistant', content: 'def example(): pass' },
              { role: 'user', content: 'Add documentation' }
            ],
            description: 'multi-turn conversation'
          }
        ];
        
        for (const testCase of testCases) {
          const response = await fetch(`http://localhost:${port}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'default',
              messages: testCase.messages,
              max_tokens: 50,
              temperature: 0.3
            })
          });
          
          expect(response.ok, `Failed for ${testCase.description}`).toBe(true);
          
          const data = await response.json();
          expect(data.choices, `No choices in response for ${testCase.description}`).toBeDefined();
          expect(data.choices.length, `Empty choices for ${testCase.description}`).toBeGreaterThan(0);
          expect(data.choices[0].message.content, `Empty content for ${testCase.description}`).toBeDefined();
        }
      });
      
      test(`should handle concurrent requests for ${tier.role}`, async () => {
        const port = await launchModel(tier.role, 180000);
        
        // Send multiple concurrent requests (simulating IDE usage)
        const requests = Array.from({ length: 5 }, (_, i) => 
          fetch(`http://localhost:${port}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'default',
              messages: [{ role: 'user', content: `Test request ${i + 1}` }],
              max_tokens: 20,
              temperature: 0.1
            })
          })
        );
        
        const responses = await Promise.all(requests);
        
        // All requests should succeed
        for (let i = 0; i < responses.length; i++) {
          expect(responses[i].ok, `Request ${i + 1} failed`).toBe(true);
          
          const data = await responses[i].json();
          expect(data.choices, `Request ${i + 1} has no choices`).toBeDefined();
          expect(data.choices.length, `Request ${i + 1} has empty choices`).toBeGreaterThan(0);
        }
      });
    });
  }
  
  test('should handle port conflicts gracefully', async () => {
    // Launch two models of the same tier
    const port1 = await launchModel('fast', 180000);
    const port2 = await launchModel('fast', 180000);
    
    // Should get different ports
    expect(port1).not.toBe(port2);
    
    // Both should be in the correct range
    const fastTier = MODEL_TIERS.find(t => t.role === 'fast')!;
    expect(port1).toBeGreaterThanOrEqual(fastTier.portStart);
    expect(port1).toBeLessThanOrEqual(fastTier.portEnd);
    expect(port2).toBeGreaterThanOrEqual(fastTier.portStart);
    expect(port2).toBeLessThanOrEqual(fastTier.portEnd);
    
    // Both should be functional
    const results1 = await testOpenAICompatibility(port1);
    const results2 = await testOpenAICompatibility(port2);
    
    expect(results1.health && results1.models && results1.chat).toBe(true);
    expect(results2.health && results2.models && results2.chat).toBe(true);
  });
  
  test('should validate error handling for malformed requests', async () => {
    const port = await launchModel('fast', 180000);
    
    // Test malformed JSON
    const malformedResponse = await fetch(`http://localhost:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json }'
    });
    
    expect(malformedResponse.status).toBe(400);
    
    // Test missing required fields
    const missingFieldsResponse = await fetch(`http://localhost:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'default'
        // Missing messages field
      })
    });
    
    expect(missingFieldsResponse.status).toBe(400);
    
    // Test invalid model name
    const invalidModelResponse = await fetch(`http://localhost:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'non-existent-model',
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    // Should either work (if model accepts any name) or return 400/404
    expect([200, 400, 404]).toContain(invalidModelResponse.status);
  });
});