import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for vLLM-Doctrine E2E tests
 * 
 * This setup validates that the testing environment is ready
 * and models are accessible before running the test suite.
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 vLLM-Doctrine E2E Test Setup');
  console.log('================================');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Check if any vLLM models are running
    const testPorts = [8100, 8300, 8500, 8700];
    let modelsFound = 0;
    
    for (const port of testPorts) {
      try {
        console.log(`🔍 Checking for model on port ${port}...`);
        
        const response = await page.request.get(`http://localhost:${port}/health`, {
          timeout: 2000
        });
        
        if (response.ok()) {
          console.log(`✅ Model found on port ${port}`);
          modelsFound++;
          
          // Get model info
          try {
            const modelsResponse = await page.request.get(`http://localhost:${port}/v1/models`);
            if (modelsResponse.ok()) {
              const data = await modelsResponse.json();
              if (data.data && data.data.length > 0) {
                console.log(`   📋 Model: ${data.data[0].id}`);
              }
            }
          } catch (e) {
            // Model info fetch failed, but health check passed
            console.log(`   ⚠️ Model running but couldn't get details`);
          }
        }
      } catch (e) {
        // Port not accessible, model not running
      }
    }
    
    if (modelsFound === 0) {
      console.log('');
      console.log('⚠️ WARNING: No vLLM models detected');
      console.log('');
      console.log('To run the complete E2E test suite:');
      console.log('1. Launch a model: ./daily-bootstrap.sh qa');  
      console.log('2. Wait for model to load (2-5 minutes)');
      console.log('3. Run tests: npm test');
      console.log('');
      console.log('Some API tests will be skipped without running models.');
    } else {
      console.log('');
      console.log(`✅ Found ${modelsFound} running model(s) - API tests will run`);
    }
    
    // Store model availability for tests
    process.env.MODELS_AVAILABLE = modelsFound.toString();
    
  } catch (error) {
    console.log('❌ Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('');
  console.log('🎯 Test environment ready!');
  console.log('');
}

export default globalSetup;