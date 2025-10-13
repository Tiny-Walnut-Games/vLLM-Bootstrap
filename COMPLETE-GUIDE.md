# Local LLM Ritual — Four-Scroll Doctrine

## Complete Setup Guide: Zero to Rider Chat

**doctrine-version: 2025.10.10**

---

## 📖 Foreword

This bootstrap was created in response for my, @jmeyer1980, desire to quickly set up and distribute LLMs internally for use with Rider and other agentic IDE interfaces.

It was developed for myself and a friend who recently grabbed a 16GB VRAM card and plans on self-hosting as well. I cannot claim usability of this script for every system.

Feel free to comment with suggested updates. Please stick to those HuggingFace hosted models that can be easily pulled and served using this workflow. Collaborators should keep the overall mental model in consideration when recommending updates.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PART 1: SYSTEM SETUP

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 1: Install WSL (Windows Subsystem for Linux)

**1.1 Open PowerShell as Administrator**

- Right-click Start menu
- Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

**1.2 Install Ubuntu**

```powershell
wsl --install -d Ubuntu
```

If WSL is already installed, update it:

```powershell
wsl --update
```

**1.3 Restart your computer** if prompted

**1.4 Launch WSL** via any of these methods:

- **Start menu**: Press Windows key, type "Ubuntu," press Enter
- **Windows Terminal**: Open Terminal, select "Ubuntu" from dropdown
- **Run box**: Win+R → type "wsl" → Enter

**1.5 Create Linux user account**

On first launch, you'll be prompted to create a username and password.

⚠️ **IMPORTANT**: The password field shows **NO feedback** (no dots/asterisks)

- Type your password carefully
- Press Enter
- Type it again to confirm
- Press Enter

---

### Step 2: Get HuggingFace Access Token

Some models (Llama, Gemma, etc.) require authentication to download.

**2.1 Create HuggingFace account** (if you don't have one)

- Visit: <https://huggingface.co/join>
- Sign up with email

**2.2 Generate access token**

1. Go to: <https://huggingface.co/settings/tokens>
2. Click "New token"
3. Name it (e.g., "vllm-doctrine")
4. Select **"Read"** access (sufficient for downloading models)
5. Click "Generate token"
6. **Copy the token** (starts with "hf_...")
7. **Keep this handy** for the installation step

💡 **Tip**: Save the token in a password manager for future use

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PART 2: INSTALLATION

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 1: Download Doctrine Scripts

Download the doctrine scripts from GitHub gist or repository.

### Step 2: Create Doctrine Directory

In your WSL terminal:

```bash
mkdir -p ~/.config/llm-doctrine
cd ~/.config/llm-doctrine
```

💡 **Windows path equivalent**: `\\wsl.localhost\Ubuntu\home\YOUR_USERNAME\.config\llm-doctrine`

You can drag-and-drop files here from Windows Explorer!

### Step 3: Copy Scripts

Extract/copy all scripts to `~/.config/llm-doctrine`:

- `initial-bootstrap.sh`
- `daily-bootstrap.sh`
- `models.conf`
- `ports.conf`
- `chat-templates.conf`
- `test-connection.sh`
- `README.txt`

### Step 4: Make Scripts Executable

```bash
chmod +x initial-bootstrap.sh daily-bootstrap.sh test-connection.sh
```

### Step 5: Run Initial Bootstrap

```bash
./initial-bootstrap.sh
```

**This will:**

1. ✅ Install system dependencies (Python, CUDA, tmux, etc.)
2. ✅ Create Python virtual environment at `~/torch-env`
3. ✅ Install PyTorch with CUDA support
4. ✅ Install vLLM and dependencies
5. ✅ Prompt for HuggingFace token
6. ✅ Create/update configuration files

**When prompted for HuggingFace token:**

- Press `y` to configure now
- Paste your token (from Part 1, Step 2)
- Press Enter

⏱️ **Time estimate**: 10-30 minutes depending on internet speed

☕ **Grab a coffee!** This downloads several GB of packages.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PART 3: LAUNCHING YOUR FIRST MODEL

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 1: Activate Python Environment

```bash
source ~/torch-env/bin/activate
```

You should see `(torch-env)` appear in your prompt.

### Step 2: Launch a Model

Choose a role based on your needs:

```bash
./daily-bootstrap.sh qa
```

**Available roles:**

- `fast` → 1B models → Autocomplete, boilerplate
- `edit` → 4B models → Light code editing
- `qa` → 7B models → **General assistant, chat** ⭐ (recommended first)
- `plan` → 15B models → Deep planning, architecture

### Step 3: Wait for Model to Load

**First time**: Model downloads from HuggingFace (several GB)

- You'll see download progress
- Subsequent launches are much faster

**You'll see:**

```
🚀 Launching qa (mistralai/Mistral-7B-Instruct-v0.3) on port 8500 with GPU util 0.45
📝 Logs: ./logs/qa_8500.log
💡 After launch, test with: ./test-connection.sh 8500
```

**Wait for:**

```
INFO: Application startup complete.
```

✅ **Model is ready!**

### Step 4: Test the Connection

**Open a NEW terminal** (keep the model running in the first terminal)

```bash
cd ~/.config/llm-doctrine
source ~/torch-env/bin/activate
./test-connection.sh 8500
```

**Expected output:**

```
🔍 Testing vLLM server on port 8500...

1️⃣ Health Check...
   ✅ Server is healthy

2️⃣ Available Models...
   - mistralai/Mistral-7B-Instruct-v0.3

3️⃣ Chat Completion Test...
   ✅ Chat completion successful
   📝 Response: Hello there friend!

🎉 All tests passed! Server is ready for Rider integration.

📌 Connection details for Rider:
   URL: http://localhost:8500/v1
   Format: OpenAI Compatible
```

🎉 **Success!** Your local LLM is running and responding.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PART 4: RIDER INTEGRATION

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 1: Open Rider Settings

In JetBrains Rider:

- **File** → **Settings** (or press `Ctrl+Alt+S`)

### Step 2: Navigate to AI Assistant Settings

- **Tools** → **AI Assistant** → **Models**

### Step 3: Add Third-Party Provider

In the **"Third-party AI providers"** section:

**Click "+ Add"** or configure existing entry:

| Field | Value |
|-------|-------|
| **Provider** | Select "OpenAI Compatible" or "Custom" |
| **Name** | `Local vLLM QA` (or your preferred name) |
| **URL** | `http://localhost:8500/v1` |
| **API Key** | Leave blank or enter any text (not validated) |

⚠️ **Important**: Use the port where your model is running (8500 for `qa` role)

### Step 4: Test Connection

1. Click **"Test Connection"** button
2. Should show: ✅ **Connection successful**

If it fails:

- Verify model is running in WSL terminal
- Run `./test-connection.sh 8500` to diagnose
- Check firewall isn't blocking localhost

### Step 5: Apply Settings

1. Click **"Apply"**
2. Click **"OK"**

### Step 6: Use in AI Assistant

1. Open **AI Assistant** panel (usually on right side)
   - Or: **View** → **Tool Windows** → **AI Assistant**

2. Click the **model dropdown** at the top

3. Select **"Local vLLM QA"**

4. **Start chatting!** 🎉

**Try asking:**

- "Explain this code" (select code first)
- "Write a function to parse JSON"
- "What's the difference between async and sync?"

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PART 5: ADVANCED CONFIGURATION

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Running Multiple Models Simultaneously

**VRAM Requirements:**

- **8GB VRAM**: Run ONE model at a time (solo mode) ⚠️
- **16GB VRAM**: Run 2-3 models simultaneously (indi-team mode) ✅
- **24GB+ VRAM**: Run all tiers simultaneously 🚀

**Example: Running 3 models**

Terminal 1:

```bash
source ~/torch-env/bin/activate
./daily-bootstrap.sh edit   # Port 8300
```

Terminal 2:

```bash
source ~/torch-env/bin/activate
./daily-bootstrap.sh qa     # Port 8500
```

Terminal 3:

```bash
source ~/torch-env/bin/activate
./daily-bootstrap.sh plan   # Port 8700
```

**Add each to Rider:**

| Name | URL | Use Case |
|------|-----|----------|
| Local Edit | `http://localhost:8300/v1` | Quick code edits |
| Local QA | `http://localhost:8500/v1` | General chat |
| Local Plan | `http://localhost:8700/v1` | Architecture planning |

Switch between them in the AI Assistant dropdown!

---

### Switching Models

Edit `models.conf` to change which model is used for each tier:

```ini
[7B]
default = mistralai/Mistral-7B-Instruct-v0.3
alt1 = teknium/OpenHermes-2.5-Mistral-7B
alt2 = WizardLM/WizardLM-2-7B
```

**To switch to alt1:**

1. Comment out current default: `# default = mistralai/Mistral-7B-Instruct-v0.3`
2. Rename alt1 to default: `default = teknium/OpenHermes-2.5-Mistral-7B`
3. Restart the model

---

### Running in Background (tmux)

Keep models running even after closing terminal:

**Start tmux session:**

```bash
tmux new -s llm-qa
```

**Launch model:**

```bash
source ~/torch-env/bin/activate
./daily-bootstrap.sh qa
```

**Detach from session:**

- Press `Ctrl+B`, then press `D`

**Reattach later:**

```bash
tmux attach -t llm-qa
```

**List all sessions:**

```bash
tmux ls
```

**Kill session:**

```bash
tmux kill-session -t llm-qa
```

---

### Port Ranges Reference

| Tier | Port Range | Default Model | VRAM Usage |
|------|------------|---------------|------------|
| 1B (fast) | 8100-8299 | Llama-3.2-1B | ~2GB |
| 4B (edit) | 8300-8499 | Phi-3.5-mini | ~4GB |
| 7B (qa) | 8500-8699 | Mistral-7B | ~6GB |
| 15B (plan) | 8700-8899 | StarCoder2-15B | ~12GB |

---

### Chat Templates

`chat-templates.conf` maps models to their chat formats.

Most models auto-detect from their tokenizer, but you can override:

```ini
mistralai/Mistral-7B-Instruct-v0.3 = mistral
```

**Available templates:**

- `llama3` - Llama 3.x format
- `chatml` - ChatML format (Qwen, OpenHermes)
- `phi3` - Phi-3 format
- `gemma` - Gemma format
- `mistral` - Mistral format
- `vicuna` - Vicuna format
- `starcoder` - Code-focused format
- `deepseek` - DeepSeek format

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## TROUBLESHOOTING

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ❌ Model won't download

**Symptoms:**

- "401 Unauthorized" error
- "Repository not found" error

**Solutions:**

1. Check HuggingFace authentication:

   ```bash
   huggingface-cli whoami
   ```

2. Re-authenticate:

   ```bash
   huggingface-cli login
   ```

3. Check model access:
   - Some models (Llama, Gemma) require accepting terms on HuggingFace
   - Visit the model page and click "Agree and access repository"

---

### ❌ Out of memory errors

**Symptoms:**

- "CUDA out of memory"
- Model crashes during loading

**Solutions:**

1. Use a smaller tier:

   ```bash
   ./daily-bootstrap.sh edit  # Instead of qa
   ```

2. Close other GPU applications:
   - Games, video editors, other AI tools

3. Check GPU usage:

   ```bash
   nvidia-smi
   ```

4. Restart WSL to clear GPU memory:

   ```powershell
   # In Windows PowerShell
   wsl --shutdown
   wsl
   ```

---

### ❌ Connection refused in Rider

**Symptoms:**

- "Connection refused" in Rider test
- "Cannot connect to server"

**Solutions:**

1. Verify model is running:

   ```bash
   ./test-connection.sh 8500
   ```

2. Check correct port:
   - Look at model launch output for actual port
   - Use that port in Rider URL

3. Ensure `/v1` suffix:
   - Correct: `http://localhost:8500/v1`
   - Wrong: `http://localhost:8500`

4. Check firewall:
   - Windows Firewall shouldn't block localhost, but verify

---

### ❌ Chat template errors

**Symptoms:**

- "Chat template not found"
- Malformed responses

**Solutions:**

1. Check logs:

   ```bash
   tail -f ./logs/qa_8500.log
   ```

2. Verify chat-templates.conf has entry for your model

3. Try without chat template:
   - Remove or comment out the line in `chat-templates.conf`
   - Restart model

---

### ❌ Slow responses

**Symptoms:**

- First request takes 30+ seconds
- Subsequent requests also slow

**Solutions:**

1. **First request is always slow** (model loading into VRAM)
   - This is normal, wait it out

2. Check GPU utilization:

   ```bash
   nvidia-smi
   ```

   - Should show high GPU usage during inference

3. Consider smaller model:
   - 7B models are faster than 15B
   - 4B models are faster than 7B

4. Check CPU bottleneck:
   - If GPU usage is low, CPU might be bottleneck
   - Close other applications

---

### ❌ "netcat: command not found"

**Solution:**

```bash
sudo apt install netcat-openbsd
```

---

### ❌ "nvidia-smi: command not found"

**Symptoms:**

- Warning about no GPU detected
- CPU-only mode

**Solutions:**

1. Ensure NVIDIA drivers are installed in Windows
2. Update WSL:

   ```powershell
   wsl --update
   ```

3. Restart WSL:

   ```powershell
   wsl --shutdown
   wsl
   ```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## API USAGE FROM CODE

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### cURL Example

```bash
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Write a hello world in Python"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

### Python Example

```python
import requests

response = requests.post(
    "http://localhost:8500/v1/chat/completions",
    json={
        "model": "default",
        "messages": [
            {"role": "user", "content": "Write a hello world in Python"}
        ],
        "max_tokens": 100,
        "temperature": 0.7
    }
)

print(response.json()["choices"][0]["message"]["content"])
```

### C# Example

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

var client = new HttpClient();
var request = new
{
    model = "default",
    messages = new[] { new { role = "user", content = "Write a hello world in C#" } },
    max_tokens = 100,
    temperature = 0.7
};

var response = await client.PostAsync(
    "http://localhost:8500/v1/chat/completions",
    new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json")
);

var result = await response.Content.ReadAsStringAsync();
Console.WriteLine(result);
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SUPPORT & CONTRIBUTION

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Reporting Issues

- Open an issue on GitHub with:
  - Your GPU model and VRAM
  - WSL version (`wsl --version`)
  - Error messages from logs
  - Steps to reproduce

### Suggesting Models

When suggesting new models:

1. Verify it works with vLLM
2. Test chat template compatibility
3. Document VRAM requirements
4. Add entry to `chat-templates.conf`

### Contributing

- Keep the ritual-framed mental model
- Test thoroughly before submitting
- Document all changes
- Follow existing code style

---

## 🏛️ Happy coding with your local LLM temple

**May your tokens flow freely and your context windows never overflow.**

---

**License**: MIT  
**Author**: Jerimiah Michael Meyer (@jmeyer1980)  
**Version**: 2025.10.10
