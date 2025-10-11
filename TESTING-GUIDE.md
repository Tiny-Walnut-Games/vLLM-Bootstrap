# vLLM-Doctrine: Testing Guide
**Version**: 2025.10.10  
**Purpose**: Validate chat templates and system functionality

---

## 🎯 Testing Objectives

1. Verify chat templates work correctly with each model
2. Confirm OpenAI API compatibility with Rider
3. Validate HuggingFace authentication flow
4. Test on different GPU configurations
5. Document any issues and fixes

---

## 📋 Pre-Testing Checklist

Before starting tests, ensure:

```bash
# 1. System is set up
cd ~/.config/llm-doctrine
./validate-config.sh

# 2. HuggingFace authentication is configured
huggingface-cli whoami

# 3. Virtual environment is activated
source ~/torch-env/bin/activate

# 4. All scripts are executable
chmod +x *.sh
```

---

## 🧪 Test Suite 1: Chat Template Validation

### Test 1.1: 1B Tier - Llama 3.2
```bash
# Launch model
./daily-bootstrap.sh fast

# Wait for startup (check logs)
tail -f ./logs/fast_*.log
# Look for: "Application startup complete"
# Press Ctrl+C when ready

# Test connection
./test-connection.sh 8100

# Manual chat test
curl -X POST http://localhost:8100/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.2-1B",
    "messages": [
      {"role": "user", "content": "Write a Python hello world function"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }' | python3 -m json.tool

# Expected: Valid JSON response with code
# Record result: ✅ PASS / ❌ FAIL
```

**Expected Output**:
```json
{
  "id": "cmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "meta-llama/Llama-3.2-1B",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "def hello_world():\n    print(\"Hello, World!\")"
      },
      "finish_reason": "stop"
    }
  ]
}
```

**Common Issues**:
- ❌ **Template error**: Check chat-templates.conf has correct mapping
- ❌ **Timeout**: Model may still be loading, wait longer
- ❌ **Connection refused**: Check port is correct (8100-8299 for 1B)

---

### Test 1.2: 4B Tier - Phi-3.5
```bash
# Stop previous model
pkill -f "vllm.entrypoints.openai.api_server"

# Launch Phi-3.5
./daily-bootstrap.sh edit

# Test
./test-connection.sh 8300

# Manual test
curl -X POST http://localhost:8300/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "microsoft/phi-3.5-mini-3.8b-instruct",
    "messages": [
      {"role": "user", "content": "Explain what a function is in one sentence"}
    ],
    "max_tokens": 50
  }' | python3 -m json.tool

# Record result: ✅ PASS / ❌ FAIL
```

---

### Test 1.3: 7B Tier - Mistral
```bash
# Stop previous model
pkill -f "vllm.entrypoints.openai.api_server"

# Launch Mistral
./daily-bootstrap.sh qa

# Test
./test-connection.sh 8500

# Manual test
curl -X POST http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "Write a function to calculate factorial"}
    ],
    "max_tokens": 150
  }' | python3 -m json.tool

# Record result: ✅ PASS / ❌ FAIL
```

---

### Test 1.4: 15B Tier - StarCoder2
```bash
# Stop previous model
pkill -f "vllm.entrypoints.openai.api_server"

# Launch StarCoder2
./daily-bootstrap.sh plan

# Test
./test-connection.sh 8700

# Manual test
curl -X POST http://localhost:8700/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bigcode/starcoder2-15b",
    "messages": [
      {"role": "user", "content": "Write a binary search algorithm in Python"}
    ],
    "max_tokens": 200
  }' | python3 -m json.tool

# Record result: ✅ PASS / ❌ FAIL
```

---

## 🧪 Test Suite 2: Rider Integration

### Test 2.1: Basic Rider Connection
```bash
# 1. Launch a model (recommend 7B for testing)
./daily-bootstrap.sh qa

# 2. Verify it's running
./test-connection.sh 8500

# 3. Open Rider
# 4. Go to: Settings → Tools → AI Assistant → Models
# 5. Click "Add" → "OpenAI Compatible"
# 6. Configure:
#    - Name: vLLM Local (Mistral 7B)
#    - URL: http://localhost:8500/v1
#    - API Key: (leave empty or use "dummy")
# 7. Click "Test Connection"
# 8. Expected: ✅ "Connection successful"

# Record result: ✅ PASS / ❌ FAIL
```

### Test 2.2: Rider Chat Functionality
```bash
# 1. In Rider, open AI Assistant panel
# 2. Select your local model from dropdown
# 3. Type: "Write a C# hello world program"
# 4. Expected: Model generates valid C# code
# 5. Try follow-up: "Add error handling"
# 6. Expected: Model modifies the code appropriately

# Record result: ✅ PASS / ❌ FAIL
```

### Test 2.3: Rider Code Completion
```bash
# 1. Open a C# file in Rider
# 2. Start typing a function:
#    public int Calculate
# 3. Trigger AI completion (usually Ctrl+Space or Alt+\)
# 4. Expected: Model suggests function completion
# 5. Accept suggestion
# 6. Verify code is syntactically correct

# Record result: ✅ PASS / ❌ FAIL
```

---

## 🧪 Test Suite 3: HuggingFace Authentication

### Test 3.1: Fresh Installation
```bash
# 1. Remove existing HF token
rm -f ~/.cache/huggingface/token

# 2. Run initial bootstrap
./initial-bootstrap.sh

# 3. When prompted for HF token:
#    - Choose "y" to configure now
#    - Paste a valid token
# 4. Expected: "✅ HuggingFace authentication successful!"

# 5. Verify
huggingface-cli whoami

# Record result: ✅ PASS / ❌ FAIL
```

### Test 3.2: Skip and Configure Later
```bash
# 1. Remove existing HF token
rm -f ~/.cache/huggingface/token

# 2. Run initial bootstrap
./initial-bootstrap.sh

# 3. When prompted for HF token:
#    - Choose "n" to skip
# 4. Expected: "⚠️ Skipping HuggingFace authentication..."

# 5. Configure later
huggingface-cli login
# Paste token when prompted

# 6. Verify
huggingface-cli whoami

# Record result: ✅ PASS / ❌ FAIL
```

---

## 🧪 Test Suite 4: GPU Configurations

### Test 4.1: 8GB VRAM
```bash
# 1. Launch 7B model
./daily-bootstrap.sh qa

# 2. Monitor VRAM usage
watch -n 1 nvidia-smi

# 3. Expected VRAM usage: ~4-5GB (55% of 8GB)
# 4. Test chat completion
./test-connection.sh 8500

# 5. Record:
#    - VRAM used: _____ GB
#    - Response time: _____ seconds
#    - Result: ✅ PASS / ❌ FAIL
```

### Test 4.2: 16GB VRAM
```bash
# 1. Launch 15B model
./daily-bootstrap.sh plan

# 2. Monitor VRAM usage
watch -n 1 nvidia-smi

# 3. Expected VRAM usage: ~8-9GB (55% of 16GB)
# 4. Test chat completion
./test-connection.sh 8700

# 5. Record:
#    - VRAM used: _____ GB
#    - Response time: _____ seconds
#    - Result: ✅ PASS / ❌ FAIL
```

### Test 4.3: CPU Fallback
```bash
# 1. Temporarily disable GPU (for testing)
export CUDA_VISIBLE_DEVICES=""

# 2. Launch 1B model
./daily-bootstrap.sh fast

# 3. Expected: "⚠️ No NVIDIA GPU detected. Using CPU fallback..."
# 4. Test chat completion
./test-connection.sh 8100

# 5. Record:
#    - Response time: _____ seconds (expect slower)
#    - Result: ✅ PASS / ❌ FAIL

# 6. Re-enable GPU
unset CUDA_VISIBLE_DEVICES
```

---

## 🧪 Test Suite 5: Error Handling

### Test 5.1: Port Already in Use
```bash
# 1. Launch a model
./daily-bootstrap.sh qa

# 2. Try to launch same role again (new terminal)
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./daily-bootstrap.sh qa

# 3. Expected: Launches on next available port (8501)
# 4. Verify both are running
./test-connection.sh 8500
./test-connection.sh 8501

# Record result: ✅ PASS / ❌ FAIL
```

### Test 5.2: Invalid Model
```bash
# 1. Edit models.conf
# 2. Change a model to invalid name: "invalid/model-name"
# 3. Try to launch
./daily-bootstrap.sh qa

# 4. Expected: Error message about model not found
# 5. Check logs
tail -f ./logs/qa_*.log

# 6. Restore valid model name
# Record result: ✅ PASS / ❌ FAIL
```

### Test 5.3: Missing HuggingFace Auth
```bash
# 1. Remove HF token
rm -f ~/.cache/huggingface/token

# 2. Try to launch gated model (Llama)
./daily-bootstrap.sh fast

# 3. Expected: Error about authentication
# 4. Check logs
tail -f ./logs/fast_*.log

# 5. Re-authenticate
huggingface-cli login

# Record result: ✅ PASS / ❌ FAIL
```

---

## 📊 Test Results Template

Copy this template to record your results:

```markdown
# vLLM-Doctrine Test Results
**Date**: YYYY-MM-DD
**Tester**: Your Name
**System**: GPU Model, VRAM, OS

## Chat Template Tests
- [ ] 1B Tier (Llama 3.2): ✅ PASS / ❌ FAIL
  - Notes: 
- [ ] 4B Tier (Phi-3.5): ✅ PASS / ❌ FAIL
  - Notes:
- [ ] 7B Tier (Mistral): ✅ PASS / ❌ FAIL
  - Notes:
- [ ] 15B Tier (StarCoder2): ✅ PASS / ❌ FAIL
  - Notes:

## Rider Integration Tests
- [ ] Basic Connection: ✅ PASS / ❌ FAIL
  - Notes:
- [ ] Chat Functionality: ✅ PASS / ❌ FAIL
  - Notes:
- [ ] Code Completion: ✅ PASS / ❌ FAIL
  - Notes:

## HuggingFace Auth Tests
- [ ] Fresh Installation: ✅ PASS / ❌ FAIL
  - Notes:
- [ ] Skip and Configure Later: ✅ PASS / ❌ FAIL
  - Notes:

## GPU Configuration Tests
- [ ] 8GB VRAM: ✅ PASS / ❌ FAIL / ⚠️ N/A
  - VRAM Used: _____ GB
  - Response Time: _____ seconds
- [ ] 16GB VRAM: ✅ PASS / ❌ FAIL / ⚠️ N/A
  - VRAM Used: _____ GB
  - Response Time: _____ seconds
- [ ] CPU Fallback: ✅ PASS / ❌ FAIL / ⚠️ N/A
  - Response Time: _____ seconds

## Error Handling Tests
- [ ] Port Already in Use: ✅ PASS / ❌ FAIL
  - Notes:
- [ ] Invalid Model: ✅ PASS / ❌ FAIL
  - Notes:
- [ ] Missing HF Auth: ✅ PASS / ❌ FAIL
  - Notes:

## Issues Found
1. Issue description
   - Severity: Critical / High / Medium / Low
   - Workaround: 
   - Fix needed:

## Overall Assessment
- **System Stability**: Excellent / Good / Fair / Poor
- **Documentation Accuracy**: Excellent / Good / Fair / Poor
- **User Experience**: Excellent / Good / Fair / Poor
- **Ready for Production**: Yes / No / With Caveats

## Recommendations
1. 
2. 
3. 
```

---

## 🔧 Troubleshooting During Testing

### Issue: Model won't load
```bash
# Check logs
tail -f ./logs/*_*.log

# Common causes:
# 1. Insufficient VRAM → Try smaller model
# 2. Missing HF auth → Run: huggingface-cli login
# 3. Model not downloaded → Check HF cache: ls ~/.cache/huggingface/hub/
```

### Issue: Chat template error
```bash
# Check if template is applied
grep "chat-template" ./logs/*_*.log

# If missing, verify chat-templates.conf exists
cat ./chat-templates.conf

# Try without template (edit daily-bootstrap.sh temporarily)
# Comment out line 221: # $CHAT_TEMPLATE \
```

### Issue: Rider can't connect
```bash
# 1. Verify model is running
./test-connection.sh 8500

# 2. Check firewall (Windows)
# Allow WSL through Windows Firewall

# 3. Try from Windows PowerShell
curl http://localhost:8500/health

# 4. Check WSL networking
ip addr show eth0
```

---

## 📝 Reporting Issues

When reporting issues, include:

1. **System Info**:
   ```bash
   uname -a
   nvidia-smi
   python3 --version
   ```

2. **Logs**:
   ```bash
   tail -n 100 ./logs/*_*.log
   ```

3. **Configuration**:
   ```bash
   cat ./models.conf
   cat ./ports.conf
   cat ./chat-templates.conf
   ```

4. **Steps to Reproduce**:
   - Exact commands run
   - Expected behavior
   - Actual behavior

---

## ✅ Testing Completion Checklist

- [ ] All chat template tests completed
- [ ] Rider integration verified
- [ ] HuggingFace auth tested
- [ ] At least one GPU config tested
- [ ] Error handling validated
- [ ] Test results documented
- [ ] Issues reported (if any)
- [ ] Recommendations provided

---

**Happy Testing!** 🧪

If you discover issues, please document them thoroughly so we can improve the system for everyone.

---

**Maintainer**: @jmeyer1980  
**License**: MIT  
**Version**: 2025.10.10