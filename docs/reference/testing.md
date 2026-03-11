# vLLM-Doctrine Testing Guide

## 🎯 Overview

This guide helps you test the complete new user journey for vLLM-Doctrine, identifying friction points and validating the setup process.

## 🧪 Test Approaches

### Approach 1: Manual Journey Testing (Recommended)

**Best for:** Experiencing real friction points and issues

1. **Prepare Clean Environment**

   ```bash
   # In WSL/Ubuntu
   cd ~/.config
   rm -rf llm-doctrine-test  # Clean any previous test
   mkdir llm-doctrine-test
   cd llm-doctrine-test
   ```

2. **Copy Bootstrap Files**

   ```bash
   # Copy all necessary files from your working directory
   cp ~/.config/llm-doctrine/*.sh .
   cp ~/.config/llm-doctrine/*.conf .
   cp ~/.config/llm-doctrine/*.txt .
   ```

3. **Run the Journey**

   ```bash
   # Follow the complete new user process
   ./initial-bootstrap.sh
   # Provide HF token when prompted
   
   ./validate-config.sh
   
   source ~/torch-env/bin/activate
   ./daily-bootstrap.sh fast  # Start with small model
   
   # In another terminal
   ./test-connection.sh 8100
   ```

### Approach 2: Automated E2E Testing

**Best for:** Regression testing and CI/CD validation

1. **Install Test Dependencies**

   ```bash
   # On Windows (from repository root)
   .\run-journey-tests.bat
   ```

2. **Run Specific Test Suites**

   ```bash
   # Journey testing (without models)
   npm run test:journey
   
   # API testing (requires running models)  
   npm run test:rider
   
   # All tests
   npm test
   ```

### Approach 3: Pre-Flight Validation

**Best for:** Quick environment validation before full setup

```bash
# Make executable and run
chmod +x test-complete-journey.sh
./test-complete-journey.sh

# Or with HuggingFace token
./test-complete-journey.sh --with-hf-token hf_your_token_here
```

## 🔍 Common Issues to Watch For

### 1. Initial Bootstrap Failures

**Symptoms:**

- Package installation errors
- Python virtual environment creation fails
- PyTorch CUDA installation issues

**Testing:**

```bash
# Check system prerequisites
python3 --version
python3 -m venv --help
nvidia-smi  # GPU check
```

### 2. Model Download Issues

**Symptoms:**

- HuggingFace authentication errors
- Network timeouts
- Insufficient disk space

**Testing:**

```bash
# Test HF connectivity
curl -s https://huggingface.co/meta-llama/Llama-3.2-1B
huggingface-cli whoami

# Check disk space
df -h ~/.cache/huggingface
```

### 3. Model Launch Problems

**Symptoms:**

- Out of memory errors
- Port conflicts
- Long loading times

**Testing:**

```bash
# Check port availability
nc -z localhost 8100 && echo "Port busy" || echo "Port free"

# Monitor GPU usage during launch
watch -n 1 nvidia-smi

# Check model logs
tail -f ./logs/fast_8100.log
```

### 4. API Connectivity Issues

**Symptoms:**

- Connection refused errors
- Timeout on API calls
- Malformed responses

**Testing:**

```bash
# Basic connectivity
curl http://localhost:8100/health

# Model endpoint
curl http://localhost:8100/v1/models

# Chat completion
curl -X POST http://localhost:8100/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'
```

### 5. Rider Integration Problems

**Symptoms:**

- Rider can't connect to local model
- Authentication errors
- Slow or no responses

**Testing Steps:**

1. Verify model is running: `./test-connection.sh 8500`
2. Test from Rider:
   - Settings → Tools → AI Assistant → Models
   - Add OpenAI Compatible provider
   - URL: `http://localhost:8500/v1`
   - API Key: `test-key` (any value)
   - Test Connection

## 📊 Performance Expectations

### Hardware Performance Matrix

| Hardware | 1B Models | 4B Models | 7B Models | 15B Models |
|----------|-----------|-----------|-----------|------------|
| **4GB VRAM** | ⚠️ CPU fallback | ❌ OOM likely | ❌ OOM | ❌ OOM |
| **6GB VRAM** | ✅ Good | ⚠️ Slow | ❌ OOM | ❌ OOM |
| **8GB VRAM** | ✅ Excellent | ✅ Good | ⚠️ Slow | ❌ OOM |
| **12GB VRAM** | ✅ Excellent | ✅ Excellent | ✅ Good | ⚠️ Possible |
| **16GB+ VRAM** | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Good |

### Expected Response Times

| Model Tier | Cold Start | Warm Response |
|------------|------------|---------------|
| **1B (fast)** | 30-60s | 0.5-2s |
| **4B (edit)** | 1-2min | 1-3s |
| **7B (qa)** | 2-3min | 2-5s |
| **15B (plan)** | 3-5min | 5-15s |

## 🛠️ Debugging Tools

### Log Analysis

```bash
# Real-time model logs
tail -f ./logs/qa_8500.log

# Search for errors
grep -i error ./logs/*.log
grep -i "out of memory" ./logs/*.log
```

### System Monitoring

```bash
# GPU utilization
watch -n 1 nvidia-smi

# Memory usage
free -h
df -h

# Network connections
netstat -tulpn | grep 85
```

### API Testing

```bash
# Health check all ports
for port in 8100 8300 8500 8700; do
  curl -s http://localhost:$port/health && echo " - Port $port OK" || echo " - Port $port FAIL"
done

# Model information
curl -s http://localhost:8500/v1/models | python3 -m json.tool
```

## 📈 Success Metrics

A successful test should achieve:

✅ **Setup Success:** All bootstrap steps complete without errors  
✅ **Model Launch:** At least one model starts and responds to API calls  
✅ **API Compliance:** Responses match OpenAI format  
✅ **Rider Integration:** Can connect and get responses in IDE  
✅ **Performance:** Responses within expected time ranges  

---

## 🏛️ Council Mode Validation

Council mode means running all four tiers simultaneously. The tests below validate readiness
for and health of a full council deployment.

### Pre-flight Council Check

Before launching all four channels, verify the system meets minimum requirements:

```bash
# Check GPU VRAM (24GB+ recommended for all four channels)
nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits

# Verify all four ports are free
for port in 8100 8300 8500 8700; do
  nc -z localhost "$port" 2>/dev/null \
    && echo "⚠️  Port $port in use" \
    || echo "✅ Port $port free"
done

# Confirm tmux is available (required for council-launch.sh)
tmux -V
```

### Launching and Validating the Council

```bash
# Launch all four channels (creates tmux session "council")
./council-launch.sh

# Monitor resource usage while models load
watch -n 5 ./council-monitor.sh

# After models load, test each channel
for port in 8100 8300 8500 8700; do
  echo "--- Testing port $port ---"
  ./test-connection.sh "$port"
  echo ""
done
```

### Automated Council Validation

Run the Playwright test suite for council mode:

```bash
npm run test:council
```

Or run directly:

```bash
npx playwright test tests/e2e/council-validation.spec.ts
```

### Expected Council Success Metrics

| Check | Expected Result |
|-------|----------------|
| All four channels healthy | `curl http://localhost:{8100,8300,8500,8700}/health` returns `200` |
| VRAM headroom | At least 4 GB free after all models load |
| Chat completion on each channel | Each port returns valid OpenAI-format JSON |
| Log files present | `./logs/council_{fast,edit,qa,plan}_*.log` exist |
| tmux session active | `tmux has-session -t council` exits `0` |

### Stopping the Council

```bash
# Kill the tmux council session and all child processes
tmux kill-session -t council

# Verify no vLLM processes remain
pgrep -f "vllm.entrypoints" | wc -l   # should print 0
```

### Council Monitoring Reference

| Tool | Purpose |
|------|---------|
| `./council-monitor.sh` | Snapshot of GPU, RAM, and channel health |
| `watch -n 5 ./council-monitor.sh` | Continuous dashboard |
| `nvidia-smi` | Raw GPU usage |
| `tail -f ./logs/council_qa_8500.log` | Live log for a specific channel |
| `free -h` | System RAM at a glance |

## 🎉 Next Steps After Testing

Once you've identified and documented issues:

1. **Update Documentation:** Fix any inaccurate setup instructions
2. **Improve Error Messages:** Add better guidance for common failures  
3. **Add Automation:** Create scripts for common fixes
4. **Test More Scenarios:** Different hardware configurations, network setups
5. **Create Troubleshooting Guide:** Document all discovered solutions

## 📝 Reporting Issues

When reporting problems found during testing:

1. **Environment Details:** OS, GPU, VRAM, Python version
2. **Reproduction Steps:** Exact commands that led to issue  
3. **Error Messages:** Full error output and log excerpts
4. **Expected vs Actual:** What should have happened vs what did
5. **Workaround:** Any temporary fixes discovered

This systematic approach will help identify real friction points and improve the new user experience!
