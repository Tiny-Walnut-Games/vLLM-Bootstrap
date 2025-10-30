# Testing Guide

**Validate your vLLM-Bootstrap installation with automated tests**

---

## What Testing Does

Testing validates that your installation works correctly:

- ✅ Models launch successfully
- ✅ API endpoints respond correctly
- ✅ Chat completions work as expected
- ✅ Configuration files are valid

**Testing is optional** but recommended for:

- First-time installation verification
- Troubleshooting issues
- Contributing to the project

---

## Testing vs. Using

**Important distinction**:

| **Using vLLM**                    | **Testing vLLM**                |
| --------------------------------- | ------------------------------- |
| Run models, chat via CLI          | Validate installation works     |
| WSL/Linux environment             | Windows (PowerShell) or Linux   |
| Python dependencies               | Node.js/Playwright dependencies |
| `./scripts/daily-bootstrap.sh qa` | `npm run test`                  |

**If you just want to use vLLM**, you don't need testing. Follow [Getting Started](Getting-Started) instead.

---

## Prerequisites

### For Testing (Additional Requirements)

**Windows**:

- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)
- PowerShell 5.1+

**Linux**:

- Node.js 18+
- npm
- Bash

### Check if Installed

```bash
node --version
npm --version
```

**If not installed**, see [Installing Node.js](#installing-nodejs) below.

---

## Installing Node.js

### Windows

**Option A: Official Installer** (Recommended)

1. Go to: https://nodejs.org/
2. Download **LTS version**
3. Run installer with default settings
4. **Restart terminal/IDE** after installation

**Option B: Windows Package Manager**

```powershell
winget install OpenJS.NodeJS.LTS
```

**Option C: Chocolatey**

```powershell
choco install nodejs-lts
```

### Linux

**Ubuntu/Debian**:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

**Verify installation**:

```bash
node --version  # Should show v18.x.x or v20.x.x
npm --version   # Should show 9.x.x or 10.x.x
```

---

## Setting Up Tests

### Install Test Dependencies

From project root:

```bash
cd ~/vLLM-Bootstrap  # Or wherever you cloned the repo
npm install
npx playwright install
```

**What this installs**:

- Playwright testing framework
- TypeScript compiler
- Browser engines for testing

**Time**: 2-5 minutes

---

## Running Tests

### Quick Test (1B Tier Only)

**Recommended for local testing** (works on RTX 2060, 8GB VRAM):

```bash
npm run test:1b
```

**What this does**:

- Launches 1B model (Llama-3.2-1B) on port 8100
- Runs comprehensive test suite
- Generates HTML report

**Time**: 5-10 minutes

### Full Test Suite

**Requires 16GB+ VRAM** (tests all tiers: 1B, 4B, 7B, 15B):

```bash
npm test
```

**Time**: 20-40 minutes

### Specific Test Files

```bash
# Configuration validation only
npx playwright test tests/e2e/configuration-validation.spec.ts

# API validation
npx playwright test tests/e2e/api-validation.spec.ts

# CLI chat tests
npx playwright test tests/e2e/cli-chat-1b.spec.ts
```

---

## Test Categories

### 1. Configuration Tests

**What they check**:

- Config files exist and are valid
- Port ranges don't overlap
- Chat template mappings are complete
- Script versions are consistent

**Run**:

```bash
npx playwright test configuration-validation
```

**Time**: 1-2 minutes (no model launch)

### 2. API Tests

**What they check**:

- Model launches successfully
- Health endpoint responds
- Models list correctly
- Chat completions work
- OpenAI API compatibility

**Run**:

```bash
npx playwright test api-validation
```

**Time**: 5-10 minutes (includes model launch)

### 3. CLI Chat Tests (1B Tier)

**What they check**:

- 1B model launches on port 8100
- Greeting test ("Say hello in 3 words")
- Math test ("What is 2+2?")
- Code generation
- Multi-turn conversations
- Concurrent requests
- Error handling

**Run**:

```bash
npx playwright test cli-chat-1b
```

**Time**: 5-8 minutes

**Hardware**: RTX 2060, GTX 1080 Ti, or better (6-8GB VRAM)

---

## Understanding Test Results

### Successful Test Run

```
Running 8 tests using 1 worker

  ✓ tests/e2e/cli-chat-1b.spec.ts:10:5 › Health endpoint responds (3s)
  ✓ tests/e2e/cli-chat-1b.spec.ts:15:5 › Models list correctly (2s)
  ✓ tests/e2e/cli-chat-1b.spec.ts:20:5 › Greeting test passes (5s)
  ✓ tests/e2e/cli-chat-1b.spec.ts:25:5 › Math test passes (4s)
  ✓ tests/e2e/cli-chat-1b.spec.ts:30:5 › Code generation works (8s)
  ✓ tests/e2e/cli-chat-1b.spec.ts:35:5 › Multi-turn conversation (6s)
  ✓ tests/e2e/cli-chat-1b.spec.ts:40:5 › Concurrent requests (7s)
  ✓ tests/e2e/cli-chat-1b.spec.ts:45:5 › Error handling works (3s)

  8 passed (38s)
```

**All green checkmarks** = Installation validated!

### Failed Test Example

```
Running 8 tests using 1 worker

  ✓ tests/e2e/cli-chat-1b.spec.ts:10:5 › Health endpoint responds (3s)
  ✗ tests/e2e/cli-chat-1b.spec.ts:15:5 › Models list correctly (2s)
    Error: connect ECONNREFUSED 127.0.0.1:8100
```

**Red X** = Something went wrong. See [Troubleshooting Test Failures](#troubleshooting-test-failures).

### Test Reports

**HTML Report** (auto-opens in browser):

```
test-reports/html/index.html
```

**JSON Report** (for CI/CD):

```
test-reports/results.json
```

**Manual open**:

```bash
# Open HTML report
npx playwright show-report

# View JSON report
cat test-reports/results.json | jq
```

---

## Test Options

### Headed Mode (See Browser)

```bash
npm run test:head
```

Runs tests with visible browser (useful for debugging).

### Debug Mode

```bash
npm run test:debug
```

Pauses at each step, allows inspection.

### UI Mode (Interactive)

```bash
npx playwright test --ui
```

Interactive test runner with real-time updates.

### Skip Model Launch

If model is already running:

```bash
# Windows
.\tests\run-1b-tests-local.ps1 -NoModel

# Linux
./tests/run-1b-tests-local.sh --no-model
```

---

## Platform-Specific Runners

### Windows PowerShell

```powershell
.\tests\run-1b-tests-local.ps1
```

**Options**:

- `-NoModel` - Skip model launch (use existing)
- `-Cleanup` - Kill model after tests

### Linux/WSL

```bash
./tests/run-1b-tests-local.sh
```

**Options**:

- `--no-model` - Skip model launch
- `--cleanup` - Kill model after tests

---

## Troubleshooting Test Failures

### "node: command not found"

**Cause**: Node.js not installed

**Fix**:

1. Install Node.js from https://nodejs.org/
2. Restart terminal
3. Verify: `node --version`

### "Cannot find module '@playwright/test'"

**Cause**: Playwright not installed

**Fix**:

```bash
npm install
npx playwright install
```

### "Connection refused (ECONNREFUSED)"

**Cause**: Model not running

**Fix**:

```bash
# In WSL/Linux terminal
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./scripts/daily-bootstrap.sh fast  # Or whatever tier
```

Wait for "Application startup complete", then re-run tests.

### Tests Timeout

**Cause**: Slow system or insufficient VRAM

**Fix**:

- Try 1B tier only: `npm run test:1b`
- Increase timeout in `playwright.config.ts` (advanced)
- Check GPU: `nvidia-smi`

### Model Launch Fails in Tests

**Cause**: HuggingFace auth, VRAM, or CUDA issues

**Fix**:

1. Verify manual launch works:
   ```bash
   source ~/torch-env/bin/activate
   cd ~/.config/llm-doctrine
   ./scripts/daily-bootstrap.sh fast
   ```
2. If manual launch works, tests should work
3. Check test logs in `test-reports/`

---

## CI/CD Testing (Advanced)

### GitHub Actions

Tests run automatically on push/PR (if configured):

**Workflows**:

- `.github/workflows/test-all-tiers.yml` - Tests all tiers sequentially
- `.github/workflows/test-linux-practical.yml` - Auto-detects GPU, tests available tiers

**Requirements**:

- Self-hosted GitHub Actions runner
- NVIDIA GPU with CUDA support
- 16GB+ VRAM (for full suite)

**Status**: Configured but requires self-hosted runner (GPU runners not available on GitHub's hosted runners)

---

## What Tests Cover

### ✅ Tested and Validated

- WSL installation workflow
- Python environment setup
- Model launching (1B tier on RTX 2060)
- OpenAI API compatibility
- Chat completions via curl
- Health checks
- Error handling
- Configuration file validation

### ⚠️ Configured But Not Fully CI-Tested

- 4B tier models (works locally, not CI-tested)
- 7B tier models (works locally, not CI-tested)
- 15B tier models (works locally, not CI-tested)
- Multiple simultaneous models
- Cross-platform (macOS not tested)

### ❌ Not Yet Implemented

- IDE integration tests (requires chat templates)
- Rider/VS Code E2E tests
- Performance benchmarking
- Load testing
- Security testing

---

## Contributing Test Improvements

Found an issue? Want to improve tests?

1. **Report Issues**: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues
2. **Questions**: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues (use `question` label)
3. **Pull Requests**: See [CONTRIBUTING.md](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/blob/main/CONTRIBUTING.md)

**Helpful contributions**:

- Test on different hardware configurations
- Add test cases for edge cases
- Improve test documentation
- Report false positives/negatives

---

## Next Steps

After tests pass:

- **[Use vLLM via CLI](CLI-Usage)** - Chat with your models
- **[Configure Models](Model-Configuration)** - Try different tiers
- **[Troubleshoot Issues](Troubleshooting)** - If tests fail

---

**Need help?** → [Troubleshooting Guide](Troubleshooting) | [FAQ](FAQ)
