# Model Configuration

**Understanding and customizing your local LLMs**

---

## Model Tiers Overview

vLLM-Bootstrap organizes models into four tiers based on size and capability:

| Tier     | Size | Default Model            | VRAM    | Port | Use Case                        |
| -------- | ---- | ------------------------ | ------- | ---- | ------------------------------- |
| **fast** | 1B   | Llama-3.2-1B             | 2-3GB   | 8100 | Quick autocomplete, boilerplate |
| **edit** | 4B   | Phi-3.5-mini-3.8b        | 4-5GB   | 8300 | Light code editing, refactoring |
| **qa**   | 7B   | Mistral-7B-Instruct-v0.3 | 7-8GB   | 8500 | General chat, Q&A, explanations |
| **plan** | 15B  | StarCoder2-15B           | 14-16GB | 8700 | Deep planning, architecture     |

---

## Launching Different Tiers

### Basic Launch

```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine

# Launch by tier name
./scripts/daily-bootstrap.sh {fast|edit|qa|plan}
```

### Fast Tier (1B)

**Best for**: Quick completions, simple tasks

```bash
./scripts/daily-bootstrap.sh fast
```

**Specifications**:

- Model: Llama-3.2-1B
- VRAM: 2-3GB
- Port: 8100
- Speed: Very fast (<1s per response)

**Use when**:

- Limited VRAM
- Need quick responses
- Simple autocomplete tasks

### Edit Tier (4B)

**Best for**: Code editing, refactoring

```bash
./scripts/daily-bootstrap.sh edit
```

**Specifications**:

- Model: Phi-3.5-mini-3.8b-instruct
- VRAM: 4-5GB
- Port: 8300
- Speed: Fast (~1-2s per response)

**Use when**:

- Editing existing code
- Refactoring suggestions
- Moderate complexity tasks

### QA Tier (7B)

**Best for**: General purpose, chat, explanations

```bash
./scripts/daily-bootstrap.sh qa
```

**Specifications**:

- Model: Mistral-7B-Instruct-v0.3
- VRAM: 7-8GB
- Port: 8500
- Speed: Medium (~2-4s per response)

**Use when**:

- Need detailed explanations
- General programming questions
- Code review and analysis

### Plan Tier (15B)

**Best for**: Architecture, complex reasoning

```bash
./scripts/daily-bootstrap.sh plan
```

**Specifications**:

- Model: StarCoder2-15B
- VRAM: 14-16GB
- Port: 8700
- Speed: Slower (~4-8s per response)

**Use when**:

- Architectural decisions
- Complex problem-solving
- System design discussions

---

## Available Models

### Configuration File

Models are defined in `~/.config/llm-doctrine/models.conf`:

```ini
[1B]
default = meta-llama/Llama-3.2-1B
alt1 = Qwen/Qwen2.5-0.5B-Instruct
alt2 = HuggingFaceTB/SmolLM2-1.7B-Instruct

[4B]
default = microsoft/phi-3.5-mini-3.8b-instruct
alt1 = google/gemma-3-4b
alt2 = cerebras/Cerebras-GPT-2.7B

[7B]
default = mistralai/Mistral-7B-Instruct-v0.3
alt1 = teknium/OpenHermes-2.5-Mistral-7B
alt2 = WizardLM/WizardLM-2-7B

[15B]
default = bigcode/starcoder2-15b
alt1 = deepseek-ai/DeepSeek-Coder-V2
alt2 = mistralai/Codestral-15B
```

### 1B Tier Models

| Model            | Strengths             | Download Size |
| ---------------- | --------------------- | ------------- |
| **Llama-3.2-1B** | General purpose, fast | ~1.2GB        |
| Qwen2.5-0.5B     | Smallest, ultra-fast  | ~500MB        |
| SmolLM2-1.7B     | Balanced performance  | ~1.7GB        |

### 4B Tier Models

| Model             | Strengths                 | Download Size |
| ----------------- | ------------------------- | ------------- |
| **Phi-3.5-mini**  | Code-focused, efficient   | ~3.8GB        |
| Gemma-3-4B        | Google's model, versatile | ~4GB          |
| Cerebras-GPT-2.7B | Mid-range option          | ~2.7GB        |

### 7B Tier Models

| Model                   | Strengths                 | Download Size |
| ----------------------- | ------------------------- | ------------- |
| **Mistral-7B-Instruct** | Excellent chat, versatile | ~7GB          |
| OpenHermes-2.5-Mistral  | Enhanced reasoning        | ~7GB          |
| WizardLM-2-7B           | Strong on complex tasks   | ~7GB          |

### 15B Tier Models

| Model              | Strengths                 | Download Size |
| ------------------ | ------------------------- | ------------- |
| **StarCoder2-15B** | Code generation, analysis | ~15GB         |
| DeepSeek-Coder-V2  | Advanced coding tasks     | ~15-16GB      |
| Codestral-15B      | Mistral's code specialist | ~15GB         |

---

## Switching Models

### Method 1: Edit Configuration File

```bash
# Open config file
nano ~/.config/llm-doctrine/models.conf
```

**To switch from default to alt1** in 7B tier:

**Before**:

```ini
[7B]
default = mistralai/Mistral-7B-Instruct-v0.3
alt1 = teknium/OpenHermes-2.5-Mistral-7B
alt2 = WizardLM/WizardLM-2-7B
```

**After**:

```ini
[7B]
default = teknium/OpenHermes-2.5-Mistral-7B
alt1 = mistralai/Mistral-7B-Instruct-v0.3
alt2 = WizardLM/WizardLM-2-7B
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

**Relaunch the tier**:

```bash
./scripts/daily-bootstrap.sh qa
```

### Method 2: Specify Model Directly

```bash
# Launch specific model (not yet implemented in daily-bootstrap.sh)
# Currently, you must edit models.conf
```

---

## VRAM Management

### Single Model Usage

| VRAM  | Recommended Tier | Can Run                               |
| ----- | ---------------- | ------------------------------------- |
| 6GB   | Fast (1B)        | 1B only                               |
| 8GB   | QA (7B)          | 1B, 4B, 7B (one at a time)            |
| 12GB  | QA (7B)          | 1B, 4B, 7B comfortably                |
| 16GB  | Plan (15B)       | All tiers, or multiple smaller models |
| 24GB+ | Any              | Multiple models simultaneously        |

### Running Multiple Models

**Requirements**:

- 16GB+ VRAM recommended
- Separate terminals for each model

**Example: Run Fast + QA** (10-11GB total)

**Terminal 1**:

```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./scripts/daily-bootstrap.sh fast
```

**Terminal 2**:

```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./scripts/daily-bootstrap.sh qa
```

**Check VRAM usage**:

```bash
nvidia-smi
```

### GPU Memory Utilization

The bootstrap script automatically calculates GPU memory usage:

- **1B models**: ~25% VRAM utilization
- **4B models**: ~40% VRAM utilization
- **7B models**: ~55% VRAM utilization
- **15B models**: ~80% VRAM utilization

**Custom utilization** (advanced):

```bash
# Not yet exposed in daily-bootstrap.sh
# Edit script to change gpu-memory-utilization flag
```

---

## Port Configuration

### Port Ranges

Defined in `~/.config/llm-doctrine/ports.conf`:

```ini
[ranges]
1B = 8100-8299
4B = 8300-8499
7B = 8500-8699
15B = 8700-8899
```

### Default Ports

| Tier | Port | Range     |
| ---- | ---- | --------- |
| fast | 8100 | 8100-8299 |
| edit | 8300 | 8300-8499 |
| qa   | 8500 | 8500-8699 |
| plan | 8700 | 8700-8899 |

### Port Conflicts

If a port is already in use:

**Check what's using it**:

```bash
lsof -i :8500
# or
netstat -tulpn | grep 8500
```

**Kill the process**:

```bash
kill <PID>
```

**Use a different port** (advanced):

```bash
# Edit daily-bootstrap.sh to specify custom port
# This is not yet user-friendly; requires script modification
```

---

## Preloading Models

### Why Preload?

Models download on first use (several GB per model). Preload to:

- Use offline later
- Avoid wait time during first launch
- Ensure all models are cached

### Preload Script

```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./scripts/preload-models.sh
```

**What this does**:

- Downloads all models defined in `models.conf`
- Caches them in `~/.cache/huggingface/hub/`
- No server launch, just downloads

**Time**: 30-60 minutes (depends on internet speed)
**Storage**: ~50GB for all default models

### Manual Preload

```bash
source ~/torch-env/bin/activate

# Preload specific model
huggingface-cli download meta-llama/Llama-3.2-1B
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.3
```

---

## Model Storage

### Cache Location

```
~/.cache/huggingface/hub/
```

**Windows path**:

```
\\wsl.localhost\Ubuntu\home\USERNAME\.cache\huggingface\hub\
```

### Check Downloaded Models

```bash
ls -lh ~/.cache/huggingface/hub/
```

### Clear Cache (Free Space)

**⚠️ WARNING**: This deletes all models. You'll need to re-download them.

```bash
rm -rf ~/.cache/huggingface/hub/
```

### Move Cache to Different Disk (Advanced)

```bash
# Create new cache location
mkdir -p /mnt/d/hf-cache

# Symlink to new location
rm -rf ~/.cache/huggingface
ln -s /mnt/d/hf-cache ~/.cache/huggingface
```

---

## Chat Templates

### What Are Chat Templates?

Chat templates format messages for models in their expected input format.

### Template Configuration

Defined in `~/.config/llm-doctrine/chat-templates.conf`:

```ini
mistralai/Mistral-7B-Instruct-v0.3 = mistral
microsoft/phi-3.5-mini-3.8b-instruct = phi3
meta-llama/Llama-3.2-1B = llama3
bigcode/starcoder2-15b = starcoder
```

**⚠️ Note**: Chat templates are used by vLLM automatically. Manual configuration is not required for CLI usage.

---

## Performance Tuning

### Response Speed

Factors affecting speed:

1. **Model size**: Larger = slower
2. **VRAM**: More VRAM = faster
3. **GPU**: Newer GPU = faster
4. **Max tokens**: Longer responses = slower

### Optimize for Speed

**Use smaller models**:

```bash
./scripts/daily-bootstrap.sh fast  # 1B, very fast
```

**Limit response length**:

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [{"role": "user", "content": "Explain recursion"}],
    "max_tokens": 100
  }'
```

**Use quantized models** (future feature):

- AWQ quantization for 2x speed
- Not yet exposed in configuration

---

## Troubleshooting

### Model Won't Load

**Check VRAM**:

```bash
nvidia-smi
```

**Try smaller model**:

```bash
./scripts/daily-bootstrap.sh fast
```

### Model Download Fails

**Check authentication**:

```bash
huggingface-cli whoami
```

**Re-login if needed**:

```bash
huggingface-cli login
```

### Wrong Model Loaded

**Check config file**:

```bash
cat ~/.config/llm-doctrine/models.conf
```

**Verify correct model for tier**: Ensure `default` line matches what you expect

---

## Next Steps

- **[CLI Usage Guide](CLI-Usage)** - Learn to chat with models
- **[Testing Guide](Testing-Guide)** - Validate your setup
- **[Troubleshooting](Troubleshooting)** - Solve common issues

---

**Need help?** → [Troubleshooting Guide](Troubleshooting) | [FAQ](FAQ)
