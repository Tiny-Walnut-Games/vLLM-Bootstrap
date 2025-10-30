/**
 * Global Teardown for vLLM-Doctrine Tests
 *
 * Cleans up any running model servers and test artifacts.
 * Handles both vLLM and fallback server cleanup.
 */
import { FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Cleaning up vLLM-Doctrine test environment...');

  let vllmCleanupSuccess = false;
  let fallbackCleanupSuccess = false;

  try {
    // Kill any remaining vLLM processes
    execSync('pkill -f "vllm.entrypoints.openai.api_server" || true', { stdio: 'pipe' });
    vllmCleanupSuccess = true;
    console.log('✅ Stopped any running vLLM servers');
  } catch (error) {
    // Cleanup failed - log and continue (processes may not be running)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Could not stop vLLM servers: ${errorMessage}`);
    vllmCleanupSuccess = false;
  }

  try {
    // Kill any remaining fallback server processes
    execSync('pkill -f "fallback-openai-server.py" || true', { stdio: 'pipe' });
    fallbackCleanupSuccess = true;
    console.log('✅ Stopped any running fallback servers');
  } catch (error) {
    // Cleanup failed - log and continue (processes may not be running)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Could not stop fallback servers: ${errorMessage}`);
    fallbackCleanupSuccess = false;
  }

  if (!vllmCleanupSuccess && !fallbackCleanupSuccess) {
    console.warn('   ℹ️ No model processes were running or cleanup skipped');
  }

  // Wait a moment for processes to fully terminate
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('✅ Cleanup complete');
}

export default globalTeardown;
