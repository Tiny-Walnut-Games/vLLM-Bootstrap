/**
 * Global Setup for vLLM-Doctrine Tests
 *
 * This setup ensures that the testing environment is properly configured
 * and that required models can be launched for testing.
 */
import { FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

function detectWSLEnvironment(): boolean {
  try {
    const isWSL = !!(
      process.env.WSL_DISTRO_NAME ||
      (existsSync('/proc/version') &&
        execSync('cat /proc/version', { encoding: 'utf8' }).includes('WSL'))
    );

    console.log(
      isWSL
        ? '✅ WSL environment detected'
        : 'ℹ️ Not running in WSL - some tests may need adaptation',
    );
    return isWSL;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`ℹ️ Could not determine environment: ${errorMessage}`);
    return false;
  }
}

function verifyRequiredFiles(): void {
  const requiredFiles = [
    './initial-bootstrap.sh',
    './daily-bootstrap.sh',
    './test-connection.sh',
    './models.conf',
    './ports.conf',
    './chat-templates.conf',
  ];

  const missingFiles = requiredFiles.filter((file) => !existsSync(file));
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles);
    throw new Error('Setup incomplete - run ./initial-bootstrap.sh first');
  }

  console.log('✅ All required configuration files found');
}

function checkPythonEnvironment(): void {
  const venvPath = process.env.HOME + '/torch-env';
  if (existsSync(venvPath)) {
    console.log('✅ Python virtual environment found');
  } else {
    console.warn('⚠️ Virtual environment not found at ~/torch-env');
    console.warn('   Run ./initial-bootstrap.sh to set up the environment');
  }
}

function checkGPUAvailability(): boolean {
  try {
    execSync('nvidia-smi', { stdio: 'pipe' });
    console.log('✅ NVIDIA GPU detected');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ No NVIDIA GPU detected - tests will use CPU fallback');
    console.warn(`   Error: ${errorMessage}`);
    console.warn('   ⚠️ Tests may run slower without GPU acceleration');
    return false;
  }
}

function verifyHuggingFaceAuth(): boolean {
  try {
    execSync('huggingface-cli whoami', { stdio: 'pipe' });
    console.log('✅ HuggingFace authentication configured');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ HuggingFace authentication not configured');
    console.warn('   Some gated models may not be accessible');
    console.warn(`   Error: ${errorMessage}`);
    console.warn('   💡 Run: huggingface-cli login');
    return false;
  }
}

async function globalSetup(_config: FullConfig) {
  console.log('🏗️ Setting up vLLM-Doctrine test environment...');

  // Create test results directory
  if (!existsSync('test-results')) {
    mkdirSync('test-results', { recursive: true });
  }

  detectWSLEnvironment();
  verifyRequiredFiles();
  checkPythonEnvironment();
  checkGPUAvailability();
  verifyHuggingFaceAuth();

  console.log('🎯 Test environment ready!');
}

export default globalSetup;
