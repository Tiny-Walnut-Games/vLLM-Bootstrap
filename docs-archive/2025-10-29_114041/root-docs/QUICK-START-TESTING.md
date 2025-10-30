# vLLM-Doctrine: Quick Start Testing Guide

This guide will get you up and running with comprehensive testing of your vLLM-Doctrine installation.

## 🛑 READ THIS FIRST: Testing vs. Using vLLM

**⚠️ CRITICAL UNDERSTANDING**:

- **Using vLLM**: Run models, chat with them, integrate with your IDE ← This is in the [Complete Setup Guide](../docs/guides/complete-setup.md)
- **Testing vLLM**: Validate your installation works correctly ← This is what you're doing now

**These are completely separate processes with different requirements:**

| **Using vLLM**                    | **Testing vLLM**              |
| --------------------------------- | ----------------------------- |
| Runs in WSL/Linux                 | Runs on Windows               |
| Uses Python/CUDA                  | Uses Node.js/Playwright       |
| Launch: `./daily-bootstrap.sh qa` | Launch: `npx playwright test` |
| No extra install needed           | Requires Node.js installation |

**If you just want to use vLLM with your IDE, you don't need this testing guide at all!**

---

**⚠️ IMPORTANT**: Testing your vLLM-Doctrine installation requires **additional setup** beyond the main installation. The tests validate that your installation works correctly across different scenarios and IDEs, but they are not required for normal usage.

## 📋 Prerequisites (Step Zero - Start Here!)

**Before you can run any tests, you need:**

### 1. Node.js and npm (Required)

The test suite uses Playwright (a Node.js testing framework), so you need Node.js installed **on your Windows system** (not in WSL).

**Check if you have it:**

```bash
node --version
npm --version
```

**If those commands fail, install Node.js:**

**Option A: Official Installer (Recommended)**

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS version** (Long Term Support)
3. Run the installer with default settings
4. **Restart your terminal/IDE** after installation

**Option B: Windows Package Manager**

```powershell
# In PowerShell as Administrator
winget install OpenJS.NodeJS
```

**Option C: Chocolatey (if you use it)**

```powershell
# In PowerShell as Administrator
choco install nodejs
```

### 2. Your vLLM-Doctrine Installation

You should have already completed the [Complete Setup Guide](../docs/guides/complete-setup.md) and have:

- ✅ WSL with Ubuntu installed
- ✅ vLLM-Doctrine scripts in `~/.config/llm-doctrine/`
- ✅ Python environment at `~/torch-env/`
- ✅ HuggingFace authentication configured

**If you haven't done the main installation yet, stop here and complete the [Complete Setup Guide](../docs/guides/complete-setup.md) first.**

---

## 🚀 Quick Start (10-15 minutes total)

### 1. Install Test Dependencies

**First time setup only** - you need to install the testing framework:

**Option A: One-click installer (Recommended)**

```cmd
E:\Tiny_Walnut_Games\vLLM-Doctrine\.vs\install-test-dependencies.bat
```

**This will automatically:**

- ✅ Check for Node.js and install it if missing (via winget)
- ✅ Install Playwright testing framework
- ✅ Download browser engines for testing
- ✅ Set up all dependencies

**Option B: Manual installation (if you prefer)**

```bash
# First ensure Node.js is installed manually, then:
cd E:/Tiny_Walnut_Games/vLLM-Doctrine/.vs
npm install
npx playwright install
```

**Expected output:**

```
🔍 Checking for Node.js...
✅ Node.js found: v18.17.0 (or auto-installed)

✅ Test dependencies installed successfully!

📦 What was installed:
   ✅ Node.js: Available
   ✅ npm package manager
   ✅ Playwright testing framework
   ✅ Browser engines for testing
```

### 2. Run Full Test Suite

```bash
# Linux/macOS (in WSL)
./tests/run-comprehensive-tests.sh

# Windows PowerShell
.\tests\run-comprehensive-tests.ps1

# Or use npm directly
npx playwright test
```

### 3. View Results

Check `test-results/comprehensive-test-report.md` for detailed results.

---

## 📋 Test Categories

### Configuration Tests (⚡ Fast - 1-2 minutes)

Validates your setup without starting any models:

```bash
# Linux/WSL
./tests/run-comprehensive-tests.sh --config-only

# Windows
.\tests\run-comprehensive-tests.ps1 -ConfigOnly
```

**What it checks:**

- ✅ All config files exist and are valid
- ✅ Port ranges don't overlap
- ✅ Chat template mappings are complete
- ✅ Script versions are consistent
- ✅ System requirements (Python, GPU, etc.)

### API Tests (🐌 Slow - 5-10 minutes)

Tests actual model serving and API compatibility:

```bash
# Linux/WSL
./tests/run-comprehensive-tests.sh --api-only

# Windows
.\tests\run-comprehensive-tests.ps1 -ApiOnly
```

**What it tests:**

- 🚀 Model launching for each tier (1B, 4B, 7B, 15B)
- 🔗 OpenAI API compatibility
- 💬 Chat completion functionality
- ⚡ Concurrent request handling
- 🛡️ Error handling for malformed requests

### IDE Integration Tests (🎯 Focused - 3-5 minutes)

Simulates real IDE usage patterns:

```bash
# Linux/WSL
./tests/run-comprehensive-tests.sh --ide-only

# Windows
.\tests\run-comprehensive-tests.ps1 -IdeOnly
```

**What it validates:**

- 🔧 JetBrains Rider integration scenarios
- 💻 VS Code / Visual Studio compatibility
- 🔄 Multi-turn conversations
- 📝 Code generation and completion
- 🎨 Different authentication patterns

---

## 🎛️ Test Options

### Skip Resource-Intensive Tests

For systems with limited VRAM (< 16GB):

```bash
export SKIP_LARGE_MODELS=true
# Then run your tests normally
```

### Debug Individual Tests

Run specific test files:

```bash
npx playwright test tests/e2e/configuration-validation.spec.ts
npx playwright test tests/e2e/api-validation.spec.ts --headed
npx playwright test tests/e2e/ide-integration.spec.ts --debug
```

### View Test UI

Interactive test runner:

```bash
npx playwright test --ui
```

---

## 📊 Understanding Results

### ✅ All Tests Pass

Your installation is fully validated! You can:

1. Configure your IDE with `http://localhost:<port>/v1`
2. Launch models: `./daily-bootstrap.sh {fast|edit|qa|plan}`
3. Test connections: `./test-connection.sh <port>`

### ❌ Some Tests Fail

Common issues and solutions:

**Configuration Tests Fail:**

- Run `./initial-bootstrap.sh` to complete setup
- Check file permissions: `chmod +x *.sh`
- Verify you're in the correct directory

**API Tests Fail:**

- Activate Python environment: `source ~/torch-env/bin/activate`
- Check HuggingFace auth: `huggingface-cli whoami`
- Monitor GPU memory: `watch nvidia-smi`
- Check logs in `./logs/` directory

**IDE Tests Fail:**

- Verify models are actually serving on expected ports
- Check if firewall is blocking local connections
- Ensure sufficient system resources (RAM/VRAM)

---

## 🔍 Detailed Test Reports

Each test run generates multiple output files:

### Main Report

`test-results/comprehensive-test-report.md`

- High-level summary
- Pass/fail counts
- Environment information

### Playwright Reports

`test-results/index.html` - Interactive HTML report

- Detailed test execution traces
- Screenshots of failures
- Timing information

### Individual Logs

- `test-results/results.json` - Machine-readable results
- Console outputs for debugging

---

## 🛠️ Troubleshooting

### ❌ "Command not found" errors

**Symptoms:**

- `node: command not found`
- `npm: command not found`
- `npx: command not found`

**Solution:** Node.js isn't installed or available in your PATH.

**Easy fix:** Run the installer which handles this automatically:

```cmd
E:\Tiny_Walnut_Games\vLLM-Doctrine\.vs\install-test-dependencies.bat
```

**Manual fix:**

1. Install Node.js from [nodejs.org](https://nodejs.org)
2. **Restart your terminal/IDE** after installation
3. Test with `node --version`

### ❌ "Cannot find module" errors

**Symptoms:**

- `Error: Cannot find module '@playwright/test'`
- `Module not found` errors when running tests

**Solution:** Dependencies aren't installed yet.

1. Run `npm install` in the project directory
2. Run `npx playwright install` to get browser engines
3. Or use the installer: `.\install-test-dependencies.bat`

### ❌ Scripts Won't Run

**Symptoms:**

- `.\install-test-dependencies.bat` file not found
- `.\tests\run-comprehensive-tests.ps1` file not found

**Solution:** You're in the wrong directory or using the wrong path format.

1. **Check your current directory:** `pwd`
2. **Navigate to the right place:** `cd E:/Tiny_Walnut_Games/vLLM-Doctrine/.vs`
3. **Use correct path format:**
   - Windows: `.\install-test-dependencies.bat`
   - Bash/WSL: `./install-test-dependencies.bat` (if it works in bash)

### ❌ Permission Errors (Linux/WSL)

**Symptoms:**

- `Permission denied` when running `.sh` files

**Solution:**

```bash
chmod +x tests/run-comprehensive-tests.sh
chmod +x install-test-dependencies.bat  # if running in WSL
```

### Models Won't Launch

1. **Python environment:** Run `./initial-bootstrap.sh`
2. **CUDA issues:** Check `nvidia-smi`
3. **HuggingFace auth:** Run `huggingface-cli login`
4. **Port conflicts:** Check what's running on ports 8100-8899

### Tests Timeout

1. **Slow system:** Increase timeouts in test files
2. **Limited VRAM:** Set `SKIP_LARGE_MODELS=true`
3. **Network issues:** Check if localhost connections work

### IDE Integration Issues

1. **Wrong URLs:** Use `http://localhost:<port>/v1` (not just the port)
2. **Authentication:** Try both with/without API keys
3. **Model compatibility:** Some IDEs work better with specific model tiers

---

## 📞 Getting Help

1. **Check the main documentation:** `README.md`
2. **Review test logs:** `test-results/` directory
3. **Manual testing:** Use `./test-connection.sh <port>`
4. **System validation:** Run `./validate-config.sh`

---

## 🎯 Next Steps After Testing

Once all tests pass:

### For JetBrains Rider:

1. Open Settings → Tools → AI Assistant → Models
2. Add OpenAI Compatible model
3. Set URL: `http://localhost:8500/v1` (for QA tier)
4. Leave API key empty or use "dummy"

### For VS Code:

1. Install an OpenAI-compatible extension
2. Configure endpoint: `http://localhost:8300/v1` (for editing)
3. Test with code completion and chat

### For Production Use:

1. Launch your preferred model tier
2. Monitor performance with `nvidia-smi`
3. Check logs in `./logs/` directory
4. Use `./test-connection.sh` for health checks

Happy testing! 🧪✨
