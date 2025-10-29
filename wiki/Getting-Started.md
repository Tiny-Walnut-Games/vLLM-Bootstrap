# Getting Started with vLLM-Bootstrap

**Goal**: Get from zero to chatting with a local LLM in 30 minutes

**What you'll have**: A local Mistral-7B model responding to CLI chat commands

---

## Before You Start

### What You Need
- Windows 10/11 (with admin rights) or Ubuntu Linux
- NVIDIA GPU with 8GB+ VRAM (RTX 2060, GTX 1080 Ti, or better)
- 16GB system RAM
- 50GB free disk space
- Internet connection (for downloads)

### Time Estimate
- First-time setup: **30-45 minutes**
- Launching models after setup: **2-5 minutes**

---

## Step 1: Install WSL (Windows Only)

**Linux users**: Skip to [Step 2](#step-2-get-huggingface-token)

### 1.1 Open PowerShell as Administrator

Right-click Start menu → Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

### 1.2 Install Ubuntu

```powershell
wsl --install -d Ubuntu
```

**Expected output**:
```
Installing: Ubuntu
Ubuntu has been installed.
```

If WSL is already installed:
```powershell
wsl --update
```

### 1.3 Restart Computer

If prompted, restart your computer.

### 1.4 Launch WSL

After restart, open Ubuntu:
- Press Windows key → Type "Ubuntu" → Press Enter

**OR**

- Open Windows Terminal → Select "Ubuntu" from dropdown

### 1.5 Create User Account

First launch prompts for username and password.

**⚠️ IMPORTANT**: Password field shows NO visual feedback (no dots or asterisks).

1. Enter username (lowercase, no spaces)
2. Enter password (type carefully, you won't see it)
3. Press Enter
4. Re-enter password
5. Press Enter

**Success looks like**:
```
Installation successful!
username@computername:~$
```

---

## Step 2: Get HuggingFace Token

Some models require authentication to download.

### 2.1 Create Account

Visit: https://huggingface.co/join

Sign up with email (it's free).

### 2.2 Generate Access Token

1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name: `vllm-bootstrap`
4. Type: Select **"Read"** (sufficient for downloading)
5. Click "Generate token"
6. **Copy the token** (starts with `hf_...`)
7. Save it somewhere (you'll need it in Step 4)

---

## Step 3: Download vLLM-Bootstrap

In your WSL terminal (or Linux terminal):

### 3.1 Create Directory

```bash
mkdir -p ~/.config/llm-doctrine
cd ~/.config/llm-doctrine
```

**What this does**: Creates a hidden config directory in your home folder

### 3.2 Download Scripts

**Option A: Git Clone (Recommended)**

```bash
git clone https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap.git .
```

**Option B: Manual Download**

1. Download repository as ZIP from GitHub
2. Extract all files to `~/.config/llm-doctrine/`

**Windows path equivalent**: `\\wsl.localhost\Ubuntu\home\YOUR_USERNAME\.config\llm-doctrine\`

You can drag-and-drop files here from Windows Explorer!

### 3.3 Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

---

## Step 4: Run Installation

### 4.1 Launch Installer

```bash
cd ~/.config/llm-doctrine
./scripts/initial-bootstrap.sh
```

**This installs**:
- System dependencies (Python, CUDA, tmux, netcat)
- Python virtual environment at `~/torch-env`
- PyTorch with CUDA support
- vLLM and HuggingFace libraries

### 4.2 Provide HuggingFace Token

When prompted:
```
Do you want to configure HuggingFace authentication now? (y/n)
```

1. Type `y` and press Enter
2. Paste your token (from Step 2)
3. Press Enter

### 4.3 Wait for Completion

**Time**: 10-30 minutes depending on internet speed

☕ **Grab a coffee!** This downloads several GB of packages.

**Success looks like**:
```
✅ Installation complete!
📝 Configuration files created
🚀 Ready to launch models
```

**🎯 After installation**, these helper scripts are automatically created for you:
- `daily-bootstrap.sh` - Launches models by tier
- `test-connection.sh` - Tests if a model is running
- Configuration files in `~/.config/llm-doctrine/`

---

## Step 5: Launch Your First Model

### 5.1 Activate Python Environment

```bash
source ~/torch-env/bin/activate
```

**Success**: You'll see `(torch-env)` appear in your prompt

### 5.2 Launch QA Tier Model

```bash
cd ~/.config/llm-doctrine
./daily-bootstrap.sh qa
```

**What this does**: Launches Mistral-7B on port 8500

### 5.3 Wait for Model Load

**First time**: Model downloads from HuggingFace (several GB)

**You'll see**:
```
🚀 Launching qa (mistralai/Mistral-7B-Instruct-v0.3) on port 8500
📝 Logs: ./logs/qa_8500.log
⏳ Loading model...
```

**Wait for**:
```
INFO: Application startup complete.
```

✅ **Model is ready!** (Takes 30-90 seconds first time)

---

## Step 6: Test the Connection

### 6.1 Open New Terminal

**Keep the model running** in the first terminal.

Open a second WSL terminal:
- Windows: Open another Ubuntu window
- Linux: Open another terminal tab

### 6.2 Run Test Script

```bash
cd ~/.config/llm-doctrine
source ~/torch-env/bin/activate
./test-connection.sh 8500
```

**Expected output**:
```
🔍 Testing vLLM server on port 8500...

1️⃣ Health Check...
   ✅ Server is healthy

2️⃣ Available Models...
   - mistralai/Mistral-7B-Instruct-v0.3

3️⃣ Chat Completion Test...
   ✅ Chat completion successful
   📝 Response: Hello there friend!

🎉 All tests passed!
```

✅ **Success!** Your model is working.

---

## Step 7: Chat via CLI

### 7.1 Send a Chat Request

```bash
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Explain what a hash table is in 3 sentences"}
    ],
    "max_tokens": 150
  }'
```

**You'll get a JSON response**:
```json
{
  "id": "cmpl-...",
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "A hash table is a data structure that stores key-value pairs..."
      }
    }
  ]
}
```

### 7.2 Try More Questions

```bash
# Ask about code
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Write a Python function to reverse a string"}
    ]
  }'

# Ask about concepts
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "What is the difference between async and sync programming?"}
    ]
  }'
```

---

## 🎉 You're Done!

You now have:
- ✅ WSL configured (Windows) or Linux ready
- ✅ vLLM-Bootstrap installed
- ✅ Mistral-7B model running on port 8500
- ✅ Ability to chat via CLI using curl

---

## Next Steps

### Learn More
- **[CLI Usage Guide](CLI-Usage)** - Advanced curl commands, multi-turn chat
- **[Model Configuration](Model-Configuration)** - Try different models, manage VRAM
- **[Testing Guide](Testing-Guide)** - Run automated tests to validate installation

### Troubleshooting
- Model won't load? → [Troubleshooting: Model Loading](Troubleshooting#model-wont-load)
- Connection refused? → [Troubleshooting: Connection Issues](Troubleshooting#connection-refused)
- Out of memory? → [Troubleshooting: VRAM Issues](Troubleshooting#out-of-vram)

### Try Different Models
```bash
cd ~/.config/llm-doctrine

# Smaller model (1B, faster)
./daily-bootstrap.sh fast

# Larger model (15B, more capable)
./daily-bootstrap.sh plan
```

---

## Common First-Time Issues

### "Command not found: ./scripts/initial-bootstrap.sh"
**Fix**: You're not in the right directory
```bash
cd ~/.config/llm-doctrine
ls -la scripts/  # Should show initial-bootstrap.sh
```

### "Permission denied"
**Fix**: Scripts aren't executable
```bash
chmod +x scripts/*.sh
```

### "HuggingFace authentication failed"
**Fix**: Invalid or expired token
```bash
# Log in again
source ~/torch-env/bin/activate
huggingface-cli login
# Paste your token
```

### Model download is slow
**Normal**: First download can take 10-30 minutes for 7B models (3-7 GB)
**Subsequent launches** are much faster (30-60 seconds)

---

**Need help?** → [Troubleshooting Guide](Troubleshooting) | [FAQ](FAQ)