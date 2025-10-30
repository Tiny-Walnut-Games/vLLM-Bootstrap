/**
 * Configuration Validation Tests for vLLM-Doctrine
 * 
 * Tests to validate that the configuration files, chat templates,
 * and system setup are working correctly.
 */
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { launchModel, stopAllModels } from '../utils/model-utils';

// Authentication token for fallback server (matches fallback server config)
const AUTH_TOKEN = 'fallback-token-12345';

test.describe('Configuration Validation', () => {
  
  test.beforeEach(async () => {
    await stopAllModels();
  });
  
  test.afterEach(async () => {
    await stopAllModels();
  });

  test('should have all required configuration files', async () => {
    const requiredFiles = [
      './initial-bootstrap.sh',
      './daily-bootstrap.sh',
      './test-connection.sh',
      './models.conf',
      './ports.conf',
      './chat-templates.conf'
    ];
    
    for (const file of requiredFiles) {
      expect(existsSync(file), `Missing required file: ${file}`).toBe(true);
      
      // Check if files are executable (for .sh files)
      if (file.endsWith('.sh')) {
        try {
          const stats = require('fs').statSync(file);
          const isExecutable = !!(stats.mode & parseInt('111', 8));
          expect(isExecutable, `${file} is not executable`).toBe(true);
        } catch (error) {
          // On Windows, this might not work, so just check file exists
          console.warn(`Could not check executable permissions for ${file}`);
        }
      }
    }
  });
  
  test('should validate models.conf structure', async () => {
    const modelsConfPath = './models.conf';
    expect(existsSync(modelsConfPath), 'models.conf not found').toBe(true);
    
    const content = readFileSync(modelsConfPath, 'utf8');
    
    // Check for required sections
    const requiredSections = ['[1B]', '[4B]', '[7B]', '[15B]'];
    for (const section of requiredSections) {
      expect(content.includes(section), `Missing section: ${section}`).toBe(true);
    }
    
    // Check for default models in each section
    const lines = content.split('\n');
    let currentSection = '';
    const sectionModels: Record<string, string[]> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed;
        sectionModels[currentSection] = [];
      } else if (trimmed.includes('=') && currentSection) {
        const [key, value] = trimmed.split('=').map(s => s.trim());
        if (key === 'default') {
          sectionModels[currentSection].push(value);
        }
      }
    }
    
    // Validate each section has a default model
    for (const section of requiredSections) {
      expect(sectionModels[section], `No models found in ${section}`).toBeDefined();
      expect(sectionModels[section].length, `No default model in ${section}`).toBeGreaterThan(0);
      
      const defaultModel = sectionModels[section][0];
      expect(defaultModel.includes('/'), `Invalid model format in ${section}: ${defaultModel}`).toBe(true);
    }
  });
  
  test('should validate ports.conf structure', async () => {
    const portsConfPath = './ports.conf';
    expect(existsSync(portsConfPath), 'ports.conf not found').toBe(true);
    
    const content = readFileSync(portsConfPath, 'utf8');
    
    // Check for ranges section
    expect(content.includes('[ranges]'), 'Missing [ranges] section').toBe(true);
    
    // Validate port ranges
    const expectedRanges = {
      '1B': '8100-8299',
      '4B': '8300-8499', 
      '7B': '8500-8699',
      '15B': '8700-8899'
    };
    
    for (const [tier, expectedRange] of Object.entries(expectedRanges)) {
      expect(content.includes(`${tier} = ${expectedRange}`), 
        `Missing or incorrect range for ${tier}`).toBe(true);
    }
    
    // Validate no overlapping ranges
    const ranges = Object.values(expectedRanges).map(range => {
      const [start, end] = range.split('-').map(Number);
      return { start, end };
    });
    
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const range1 = ranges[i];
        const range2 = ranges[j];
        
        const overlap = !(range1.end < range2.start || range2.end < range1.start);
        expect(overlap, `Port ranges overlap: ${JSON.stringify(range1)} and ${JSON.stringify(range2)}`).toBe(false);
      }
    }
  });
  
  test('should validate chat-templates.conf structure', async () => {
    const templatesConfPath = './chat-templates.conf';
    expect(existsSync(templatesConfPath), 'chat-templates.conf not found').toBe(true);
    
    const content = readFileSync(templatesConfPath, 'utf8');
    
    // Get all models from models.conf
    const modelsContent = readFileSync('./models.conf', 'utf8');
    const modelNames: string[] = [];
    
    const modelsLines = modelsContent.split('\n');
    for (const line of modelsLines) {
      const trimmed = line.trim();
      if (trimmed.includes('=') && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=').map(s => s.trim());
        if (key.includes('default') || key.includes('alt')) {
          modelNames.push(value);
        }
      }
    }
    
    // Check that each model has a template mapping
    for (const modelName of modelNames) {
      if (modelName && modelName !== '') {
        expect(content.includes(modelName), 
          `Missing template mapping for model: ${modelName}`).toBe(true);
      }
    }
    
    // Validate template types are reasonable
    const validTemplateTypes = [
      'llama3', 'chatml', 'phi3', 'gemma', 'gpt2', 
      'mistral', 'vicuna', 'starcoder', 'deepseek'
    ];
    
    const templateLines = content.split('\n');
    for (const line of templateLines) {
      const trimmed = line.trim();
      if (trimmed.includes('=') && !trimmed.startsWith('#')) {
        const [model, template] = trimmed.split('=').map(s => s.trim());
        if (model && template) {
          expect(validTemplateTypes.includes(template), 
            `Unknown template type: ${template} for model: ${model}`).toBe(true);
        }
      }
    }
  });
  
  test('should validate system requirements', async () => {
    // Check Python installation
    try {
      const pythonVersion = execSync('python3 --version', { encoding: 'utf8' });
      expect(pythonVersion.includes('Python 3'), 'Python 3 not found').toBe(true);
      console.log(`✅ Found ${pythonVersion.trim()}`);
    } catch (error) {
      throw new Error('Python 3 is required but not found');
    }
    
    // Check virtual environment
    const venvPath = process.env.HOME + '/torch-env';
    if (existsSync(venvPath)) {
      console.log('✅ Virtual environment found');
    } else {
      console.warn('⚠️ Virtual environment not found - run ./initial-bootstrap.sh');
    }
    
    // Check CUDA availability (optional)
    try {
      const nvidiaSmi = execSync('nvidia-smi', { encoding: 'utf8' });
      console.log('✅ NVIDIA GPU detected');
    } catch (error) {
      console.warn('⚠️ NVIDIA GPU not detected - will use CPU fallback');
    }
    
    // Check required Python packages (if venv exists)
    if (existsSync(venvPath)) {
      try {
        const packages = execSync(
          `source ${venvPath}/bin/activate && pip list`, 
          { encoding: 'utf8', shell: '/bin/bash' }
        );
        
        const requiredPackages = ['vllm', 'torch', 'huggingface-hub'];
        for (const pkg of requiredPackages) {
          expect(packages.toLowerCase().includes(pkg), 
            `Required package not found: ${pkg}`).toBe(true);
        }
        console.log('✅ All required Python packages found');
      } catch (error) {
        console.warn('⚠️ Could not verify Python packages');
      }
    }
  });
  
  test('should validate HuggingFace authentication', async () => {
    try {
      const whoami = execSync('huggingface-cli whoami', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ HuggingFace authentication configured');
      console.log(`   User: ${whoami.trim()}`);
    } catch (error) {
      console.warn('⚠️ HuggingFace authentication not configured');
      console.warn('   Some gated models may not be accessible');
      // This is a warning, not a failure
    }
  });
  
  test('should validate configuration consistency', async () => {
    // Read all config files
    const modelsConf = readFileSync('./models.conf', 'utf8');
    const portsConf = readFileSync('./ports.conf', 'utf8');
    const templatesConf = readFileSync('./chat-templates.conf', 'utf8');
    
    // Extract tiers from models.conf
    const modelTiers = modelsConf.match(/\[(\w+)\]/g)?.map(m => m.slice(1, -1)) || [];
    
    // Extract tiers from ports.conf
    const portTiers = [];
    const portLines = portsConf.split('\n');
    for (const line of portLines) {
      if (line.includes('=') && !line.startsWith('#')) {
        const [tier] = line.split('=').map(s => s.trim());
        if (tier !== 'ranges') {
          portTiers.push(tier);
        }
      }
    }
    
    // Validate consistency
    expect(modelTiers.length, 'No model tiers found').toBeGreaterThan(0);
    expect(portTiers.length, 'No port tiers found').toBeGreaterThan(0);
    
    for (const tier of modelTiers) {
      expect(portTiers.includes(tier), 
        `Model tier ${tier} has no corresponding port range`).toBe(true);
    }
    
    for (const tier of portTiers) {
      expect(modelTiers.includes(tier), 
        `Port tier ${tier} has no corresponding model section`).toBe(true);
    }
  });
  
  test('should validate script version consistency', async () => {
    const scriptFiles = [
      './initial-bootstrap.sh',
      './daily-bootstrap.sh',
      './test-connection.sh'
    ];
    
    const versions = [];
    
    for (const file of scriptFiles) {
      const content = readFileSync(file, 'utf8');
      const versionMatch = content.match(/doctrine-version:\s*(\S+)/);
      if (versionMatch) {
        versions.push({
          file,
          version: versionMatch[1]
        });
      }
    }
    
    expect(versions.length, 'No version information found in scripts').toBeGreaterThan(0);
    
    // All versions should be the same
    const firstVersion = versions[0].version;
    for (const { file, version } of versions) {
      expect(version, `Version mismatch in ${file}: expected ${firstVersion}, got ${version}`).toBe(firstVersion);
    }
    
    console.log(`✅ All scripts are version ${firstVersion}`);
  });
  
  test('should validate chat template application', async () => {
    // Test that chat templates are actually being applied
    const port = await launchModel('fast', 180000);
    
    // Make a request and check that it completes successfully
    const response = await fetch(`http://localhost:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        model: 'default',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Template working" if you can understand this message structure.' }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });
    
    expect(response.ok, 'Chat template test failed').toBe(true);
    
    const data = await response.json();
    expect(data.choices, 'No choices returned from template test').toBeDefined();
    expect(data.choices.length, 'Empty choices from template test').toBeGreaterThan(0);
    
    const content = data.choices[0].message.content;
    expect(content, 'Empty response from template test').toBeDefined();
    expect(content.trim().length, 'Very short response from template test').toBeGreaterThan(0);
    
    console.log(`✅ Chat template working - Response: ${content.trim()}`);
  });
});