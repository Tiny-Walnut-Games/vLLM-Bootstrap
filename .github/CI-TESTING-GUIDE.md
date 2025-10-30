# CI/CD Testing Guide for vLLM-Doctrine

This document describes how to set up and run comprehensive E2E tests across all model tiers on different environments.

## Overview

- **Local Testing**: 1B tier on consumer hardware (RTX 2060+)
- **CI Testing**: All tiers (1B, 4B, 7B, 15B) on GPU-enabled runners
- **Canonical Environment**: Linux (Ubuntu 22.04+)
- **Future Support**: Windows (WSL2) and macOS (MPS)

## Quick Start

### Local Testing (Consumer Hardware)

```bash
# Prerequisites: Node.js 18+, npm, Python 3.11+
npm install
npx playwright install

# Run 1B tier tests only (suitable for RTX 2060 6GB)
npx playwright test tests/e2e/cli-chat-1b.spec.ts

# Results in: test-reports/
```

### CI Testing Setup

The project includes GitHub Actions workflows. To use them:

1. Ensure your repository has GPU runners available
2. Workflows run on `ubuntu-latest` with GPU support
3. Tests run sequentially (one tier at a time) to manage GPU memory

## GitHub Actions Workflows

### Primary Workflow: `test-all-tiers.yml`

**Location**: `.github/workflows/test-all-tiers.yml`

**Triggers**:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily schedule at 2 AM UTC

**What it does**:

1. **Linux (Canonical)**: Tests all 4 tiers sequentially
   - 1B tier: ~3 minutes
   - 4B tier: ~5 minutes
   - 7B tier: ~8 minutes
   - 15B tier: ~10 minutes
2. Generates HTML and JSON reports
3. Uploads artifacts for analysis
4. Provides summary in PR comments

**GPU Requirements**:

- Minimum: 12GB VRAM (for 7B tier)
- Recommended: 16GB+ VRAM (for 15B tier)
- Instance type: NVIDIA A100 (40GB) or similar

## Configuring GPU Runners

### Option 1: GitHub Actions Self-Hosted Runner

1. **Host Requirements**:
   - Linux (Ubuntu 20.04+)
   - NVIDIA GPU with 16GB+ VRAM
   - CUDA 12.1 compatible
   - Docker installed

2. **Setup**:

   ```bash
   # On your GPU machine
   curl -o actions-runner-linux-x64-2.310.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.310.0/actions-runner-linux-x64-2.310.0.tar.gz
   tar xzf ./actions-runner-linux-x64-2.310.0.tar.gz

   # Follow GitHub's configuration wizard
   ./config.sh --url https://github.com/YOUR_REPO --token YOUR_TOKEN
   ./svc.sh install
   ./svc.sh start
   ```

3. **Runner labels**: Add `gpu`, `cuda`, `vllm` labels for identification

### Option 2: Lambda Labs (Recommended for Testing)

Lambda Labs provides on-demand GPU instances perfect for CI/CD.

1. **Create account** at lambda.com
2. **API setup**:

   ```bash
   # Store in GitHub Secrets
   LAMBDA_API_KEY=<your-api-key>
   LAMBDA_SSH_KEY=<your-ssh-key>
   ```

3. **Use with workflow**:
   ```yaml
   - name: Launch Lambda GPU instance
     run: |
       # Launch A100 instance
       INSTANCE_ID=$(curl -X POST https://api.lambdalabs.com/v1/instance-operations/launch \
         -H "Authorization: Bearer ${{ secrets.LAMBDA_API_KEY }}" \
         -d '{"instance_type_name":"gpu_1x_a100"}' \
         | jq -r '.data.instance_id')
   ```

### Option 3: Paperspace (Alternative)

Similar to Lambda Labs:

- Creates ephemeral GPU instances
- SSH access
- Suitable for automated testing

## Running Tests Locally for Development

### Setup WSL2 with GPU Support (Windows)

```powershell
# As Admin
wsl --install -d Ubuntu
wsl --update

# In WSL Ubuntu
sudo apt update
sudo apt install -y python3-pip python3-venv git nvidia-utils

# Check GPU access
nvidia-smi
```

### Bootstrap Test Environment

```bash
# In WSL or Linux
cd ~/.config/llm-doctrine
chmod +x *.sh
./initial-bootstrap.sh

# Verify
source ~/torch-env/bin/activate
python3 -c "import torch; print('CUDA Available:', torch.cuda.is_available())"
```

### Run Specific Test Suite

```bash
# 1B tier only
npx playwright test tests/e2e/cli-chat-1b.spec.ts

# All API validation tests
npx playwright test tests/e2e/api-validation.spec.ts

# With UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

## Test Structure

### 1B Tier Tests (`tests/e2e/cli-chat-1b.spec.ts`)

**Purpose**: Validate core customer experience on consumer hardware

**Scenarios**:

- ✅ Health endpoint check
- ✅ Model listing
- ✅ Greeting test (3 words)
- ✅ Math test (2+2)
- ✅ Code generation (Python function)
- ✅ Multi-turn conversations
- ✅ Concurrent requests
- ✅ JSON response validation

**Run time**: ~5 minutes on RTX 2060

### API Validation Tests (`tests/e2e/api-validation.spec.ts`)

**Purpose**: Comprehensive validation of OpenAI API compatibility

**Coverage**:

- Model launch and port assignment
- Health checks
- Model listing endpoint
- Chat completions (basic, system messages, multi-turn)
- Concurrent request handling
- Error handling (malformed requests, invalid models)
- IDE-specific scenarios

**Supported tiers**: All 4 (1B, 4B, 7B, 15B)

## Environment Variables

Control test behavior via environment variables:

```bash
# Skip large models (useful for resource-constrained CI)
SKIP_LARGE_MODELS=true

# Set specific model for testing
TEST_MODEL_1B="Qwen/Qwen2.5-0.5B-Instruct"
TEST_MODEL_4B="HuggingFaceTB/SmolLM2-1.7B-Instruct"

# Timeouts (in seconds)
MODEL_LAUNCH_TIMEOUT=180
CHAT_REQUEST_TIMEOUT=30
```

## Troubleshooting CI Tests

### Issue: "Timeout waiting for model to start"

**Possible causes**:

1. Insufficient GPU VRAM
2. Model download issues
3. Network connectivity
4. HuggingFace token required

**Solutions**:

```bash
# Check GPU memory
nvidia-smi

# Check download cache
ls ~/.cache/huggingface/hub/

# Verify HF auth
huggingface-cli login

# Check logs
tail -50 ~/.config/llm-doctrine/logs/*.log
```

### Issue: "CUDA out of memory"

**Solutions**:

1. Reduce `gpu_memory_utilization` in daily-bootstrap.sh
2. Use smaller model variant
3. Use CPU fallback mode

```bash
# CPU-only mode (slow but works)
CUDA_VISIBLE_DEVICES="" python3 -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --port 8100
```

### Issue: "Connection refused" on localhost:PORT

**Check**:

```bash
# Port in use?
lsof -i :8100

# Process running?
ps aux | grep vllm

# Try from inside WSL if on Windows
wsl curl http://localhost:8100/health
```

## Multi-OS Support Roadmap

### Linux ✅ (Done)

- **Status**: Canonical, fully tested
- **GPU**: NVIDIA CUDA 12.1
- **Instances**: Lambda Labs A100, self-hosted

### Windows (Planned)

- **Status**: In progress
- **Method**: WSL2 + GPU passthrough
- **Instances**: Azure GPU VMs, self-hosted
- **Workflow**: `.github/workflows/test-windows.yml` (TBD)

### macOS (Planned)

- **Status**: Future
- **Method**: Apple Silicon MPS acceleration
- **Limitation**: No discrete GPU support (M-series only)
- **Workflow**: `.github/workflows/test-macos.yml` (TBD)

## Performance Expectations

| Tier | Model        | Size  | Time to Ready | Time per Chat |
| ---- | ------------ | ----- | ------------- | ------------- |
| 1B   | Qwen2.5-0.5B | ~1GB  | 30-60s        | <1s           |
| 4B   | SmolLM2-1.7B | ~3GB  | 60-120s       | 2-3s          |
| 7B   | Mistral-7B   | ~14GB | 120-180s      | 5-10s         |
| 15B  | StarCoder2   | ~30GB | 180-300s      | 15-30s        |

_Times are approximate for A100 40GB. RTX 2060 6GB: 1B only (~30-60s startup)_

## Contributing Tests

When adding new tests:

1. **Use existing utilities** in `tests/utils/model-utils.ts`
2. **Follow naming**: `{feature}.spec.ts`
3. **Group tests**: Use `test.describe()` for organization
4. **Document purpose**: Add comments explaining test intent
5. **Add to CI workflow**: Update `.github/workflows/test-all-tiers.yml`

Example:

```typescript
import { test, expect } from '@playwright/test';
import { launchModel, testOpenAICompatibility } from '../utils/model-utils';

test.describe('My Feature Tests', () => {
  test('should validate feature X', async () => {
    const port = await launchModel('fast', 180000);
    // ... test code
  });
});
```

## Resources

- **vLLM Docs**: https://docs.vllm.ai/
- **Playwright Docs**: https://playwright.dev/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Lambda Labs**: https://lambdalabs.com/
- **Paperspace**: https://www.paperspace.com/

## Support

For issues with CI testing:

1. Check logs in GitHub Actions
2. Review this guide and troubleshooting section
3. Open issue with:
   - Workflow name and run ID
   - Error messages
   - Environment details
