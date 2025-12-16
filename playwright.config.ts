import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for vLLM-Doctrine E2E tests
 * 
 * These tests validate the complete new user journey from
 * initial setup through successful Rider integration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for setup tests
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1, // Single worker for model tests
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-reports/html' }],
    ['json', { outputFile: 'test-reports/results.json' }],
    ['line']
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL for API tests */
    baseURL: 'http://localhost:8500',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    /* Extended timeout for model operations */
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'api-tests',
      testMatch: /.*\.(test|spec)\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/setup/global-setup.ts'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.ts'),

  /* Development server configuration - disabled for bootstrap testing */
  // webServer: {
  //   command: 'echo "vLLM models should be started manually before running tests"',
  //   port: 8500,
  //   reuseExistingServer: true,
  //   timeout: 5000,
  // },

  /* Test timeout */
  timeout: 120000, // 2 minutes per test (models can be slow)
  expect: {
    timeout: 30000, // 30 seconds for assertions
  },
});
