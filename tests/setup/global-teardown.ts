import { FullConfig } from '@playwright/test';

/**
 * Global teardown for vLLM-Doctrine E2E tests
 * 
 * Cleanup after test suite completion.
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 vLLM-Doctrine E2E Test Cleanup');
  console.log('=================================');
  
  // Note: We don't shut down models automatically since they take time to start
  // Users can manually stop them with Ctrl+C in the terminal
  
  console.log('✅ Test cleanup complete');
  console.log('');
  console.log('💡 Models are still running - stop manually with Ctrl+C if needed');
  console.log('');
}

export default globalTeardown;