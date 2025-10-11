/**
 * Global Teardown for vLLM-Doctrine Tests
 * 
 * Cleans up any running model servers and test artifacts.
 */
import { FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up vLLM-Doctrine test environment...');
  
  let cleanupSuccess = false;
  try {
    // Kill any remaining vLLM processes
    execSync('pkill -f "vllm.entrypoints.openai.api_server" || true', { stdio: 'pipe' });
    cleanupSuccess = true;
    console.log('✅ Stopped any running vLLM servers');
  } catch (error) {
    // Cleanup failed - log and continue (processes may not be running)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Could not stop vLLM servers: ${errorMessage}`);
    cleanupSuccess = false;
  }
  
  if (!cleanupSuccess) {
    console.warn('   ℹ️ No vLLM processes were running or cleanup failed');
  }
  
  // Wait a moment for processes to fully terminate
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✅ Cleanup complete');
}

export default globalTeardown;