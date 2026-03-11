# Council Mode — Running All Four Channels Simultaneously

## **doctrine-version: 2025.10.12**

---

## 📖 Overview

**Council mode** means running all four model tiers—`fast` (1B), `edit` (4B), `qa` (7B), and
`plan` (15B)—simultaneously as a local AI council. Each channel serves a different role and
listens on its own port, allowing an agentic IDE (or any OpenAI-compatible client) to route
requests to the most appropriate model.

This guide covers:

- Minimum and recommended hardware requirements
- Step-by-step setup for full council operation
- VRAM budget tables for 16 GB, 24 GB, and 32 GB configurations
- Per-channel GPU utilization tuning tips
- Resource monitoring and validation procedures
- Troubleshooting common council mode failures

---

## ⚙️ Hardware Requirements

### Minimum Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **GPU VRAM** | 20 GB | 24 GB+ | All four channels active; 32 GB+ for comfortable operation |
| **System RAM** | 32 GB | 64 GB+ | Model loading, OS, IDE, and token buffers |
| **Disk (free)** | 50 GB | 100 GB+ | HuggingFace model cache for all four default models |
| **CPU** | 8 cores | 16 cores+ | Context preparation and API routing |
| **Network** | Gigabit LAN | — | Only needed for initial model download |

### VRAM Budget by Configuration

The table below shows estimated VRAM consumed per tier when all four channels run concurrently,
using the council-mode GPU utilization fractions (`council-launch.sh`).

| Tier | Model (default) | Council util | 20 GB GPU | 24 GB GPU | 32 GB GPU | 40 GB GPU |
|------|----------------|:------------:|----------:|----------:|----------:|----------:|
| fast (1B) | Llama-3.2-1B | 0.07 | 1.4 GB | 1.7 GB | 2.2 GB | 2.8 GB |
| edit (4B) | Phi-3.5-mini | 0.12 | 2.4 GB | 2.9 GB | 3.8 GB | 4.8 GB |
| qa (7B) | Mistral-7B-v0.3 | 0.22 | 4.4 GB | 5.3 GB | 7.0 GB | 8.8 GB |
| plan (15B) | StarCoder2-15B | 0.34 | 6.8 GB | 8.2 GB | 10.9 GB | 13.6 GB |
| **Total reserved** | | **0.75** | **15.0 GB** | **18.0 GB** | **24.0 GB** | **30.0 GB** |
| **Headroom** | | | **5.0 GB** | **6.0 GB** | **8.0 GB** | **10.0 GB** |

> **Note:** `--gpu-memory-utilization` sets the *maximum* fraction vLLM may allocate.
> Actual usage depends on model precision and KV-cache size. The default models use FP16/BF16;
> running quantized (INT8/INT4) variants can lower VRAM needs significantly.

### Port Usage

| Channel | Tier | Default Port |
|---------|------|:------------:|
| fast | 1B | 8100 |
| edit | 4B | 8300 |
| qa | 7B | 8500 |
| plan | 15B | 8700 |

All four port ranges (8100–8899) must be available. Check with:

```bash
for port in 8100 8300 8500 8700; do
  nc -z localhost "$port" 2>/dev/null && echo "Port $port IN USE" || echo "Port $port free"
done
```

---

## 🚀 Step-by-Step Council Setup

### Prerequisites

Before launching council mode, ensure you have:

1. **Completed initial bootstrap:**

   ```bash
   ./initial-bootstrap.sh
   ```

2. **Validated the configuration:**

   ```bash
   ./validate-config.sh
   ```

3. **Activated the virtual environment:**

   ```bash
   source ~/torch-env/bin/activate
   ```

4. **(Optional but recommended) Preloaded all models** to avoid long download waits during launch:

   ```bash
   ./preload-models.sh
   ```

---

### Launch Council Mode

Run the generated council launcher. It creates a `tmux` session named **council** with one window per tier.

```bash
./council-launch.sh
```

**Expected output:**

```text
🏛️  Council Mode Launcher — Four-Scroll Doctrine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ GPU detected: 24576MB VRAM total
✅ Sufficient VRAM for council mode.

📋 Council configuration:
   fast   meta-llama/Llama-3.2-1B                       port 8100  gpu-util 0.07
   edit   microsoft/phi-3.5-mini-instruct                port 8300  gpu-util 0.12
   qa     mistralai/Mistral-7B-Instruct-v0.3             port 8500  gpu-util 0.22
   plan   bigcode/starcoder2-15b                         port 8700  gpu-util 0.34

🏛️  Council session launched in tmux.

📺 Attach to session:    tmux attach -t council
🔀 Switch between tiers: Ctrl+B then window number (0=fast, 1=edit, 2=qa, 3=plan)
🚪 Detach from session:  Ctrl+B then D
🛑 Kill the council:     tmux kill-session -t council

📊 Monitor resources:    ./council-monitor.sh

⏳ Allow 2-5 minutes for all models to load before testing.
```

> **Dry-run mode:** Use `./council-launch.sh --dry-run` to preview the configuration without starting any models.

---

### Monitor Resource Usage

After launching, track GPU VRAM, system RAM, and channel health:

```bash
./council-monitor.sh
```

For continuous monitoring (refreshes every 5 seconds):

```bash
watch -n 5 ./council-monitor.sh
```

**Sample output:**

```text
📊 Council Mode Resource Monitor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️  GPU Status:
   GPU:        NVIDIA GeForce RTX 4090
   VRAM Total: 24564 MiB
   VRAM Used:  18450 MiB
   VRAM Free:  6114 MiB
   GPU Util:   67 %

💾 System Memory:
   Total: 64Gi  |  Used: 22Gi  |  Free: 38Gi

🔌 Channel Status:
   ✅ fast  (1B)   →  http://localhost:8100/v1
   ✅ edit  (4B)   →  http://localhost:8300/v1
   ✅ qa    (7B)   →  http://localhost:8500/v1
   ✅ plan  (15B)  →  http://localhost:8700/v1

   Active channels: 4 / 4
```

---

### Validate All Channels

Test that every channel responds correctly:

```bash
for port in 8100 8300 8500 8700; do
  echo "--- Testing port $port ---"
  ./test-connection.sh "$port"
  echo ""
done
```

Or test health endpoints directly:

```bash
for port in 8100 8300 8500 8700; do
  curl -s "http://localhost:$port/health" \
    && echo " ✅ Port $port OK" \
    || echo " ❌ Port $port FAIL"
done
```

---

### Configure Rider for Council Mode

Add all four channels in Rider to route tasks to the best-fit model:

1. Open **Settings → Tools → AI Assistant → Models**
2. Add four **OpenAI Compatible** providers:

   | Provider Name | URL | Suggested Use |
   |---------------|-----|---------------|
   | Local Fast | `http://localhost:8100/v1` | Autocomplete, snippets |
   | Local Edit | `http://localhost:8300/v1` | Refactoring, code review |
   | Local QA | `http://localhost:8500/v1` | Q&A, explanation |
   | Local Plan | `http://localhost:8700/v1` | Architecture, deep planning |

3. Leave API Key blank or use any dummy value (e.g., `local-key`).
4. Click **Test Connection** for each provider.

---

## 🔧 vLLM Tuning for Council Mode

### Reducing KV-Cache Size

Each vLLM server allocates a KV-cache proportional to `--gpu-memory-utilization`. For council
mode the fractions are already reduced, but you can tune further:

```bash
# Example: lower qa tier utilization to free more VRAM for plan
python3 -m vllm.entrypoints.openai.api_server \
  --model mistralai/Mistral-7B-Instruct-v0.3 \
  --port 8500 \
  --gpu-memory-utilization 0.18   # down from default 0.22
```

### Maximum Context Length

Shorter context windows reduce KV-cache memory pressure:

```bash
python3 -m vllm.entrypoints.openai.api_server \
  --model bigcode/starcoder2-15b \
  --port 8700 \
  --gpu-memory-utilization 0.34 \
  --max-model-len 4096   # cap context at 4K tokens
```

### Quantization (INT8 / INT4)

Quantized models require significantly less VRAM:

| Precision | 7B model VRAM | 15B model VRAM |
|-----------|:-------------:|:--------------:|
| FP16 (default) | ~14 GB | ~30 GB |
| INT8 | ~7 GB | ~15 GB |
| INT4 (AWQ/GPTQ) | ~3.5 GB | ~7.5 GB |

To serve an AWQ-quantized model:

```bash
python3 -m vllm.entrypoints.openai.api_server \
  --model TheBloke/Mistral-7B-Instruct-v0.2-AWQ \
  --port 8500 \
  --quantization awq \
  --gpu-memory-utilization 0.22
```

### Multi-GPU Setup (Tensor Parallelism)

If you have two or more GPUs, distribute the larger model across them:

```bash
python3 -m vllm.entrypoints.openai.api_server \
  --model bigcode/starcoder2-15b \
  --port 8700 \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.45
```

> This requires `torch` with multi-GPU support and the same CUDA version on all GPUs.

---

## 📋 Recommended Hardware Configurations

### Experimental / Personal Council (minimum)

| Component | Specification |
|-----------|--------------|
| GPU | NVIDIA RTX 4090 (24 GB) or equivalent |
| System RAM | 32 GB DDR5 |
| Storage | NVMe SSD with 100 GB+ free |
| OS | Ubuntu 22.04 LTS (bare-metal or WSL2) |
| Notes | Runs all four channels; limited KV-cache and context window |

### Comfortable / Developer Council (recommended)

| Component | Specification |
|-----------|--------------|
| GPU | NVIDIA RTX 6000 Ada (48 GB) or dual RTX 4090 |
| System RAM | 64 GB DDR5 |
| Storage | NVMe SSD with 200 GB+ free |
| OS | Ubuntu 22.04 LTS (bare-metal) |
| Notes | Full-precision models; larger context windows; room for additional models |

### Production / Cloud Council

| Provider | Instance Type | VRAM | Notes |
|----------|--------------|------|-------|
| AWS | `p3.8xlarge` | 4× 16 GB V100 | Tensor-parallel or 2–3 models |
| AWS | `p4d.24xlarge` | 8× 40 GB A100 | Comfortable full council |
| GCP | `a2-highgpu-2g` | 2× 40 GB A100 | Cost-effective full council |
| Lambda Labs | `gpu_8x_a100` | 8× 40 GB A100 | Affordable cloud option |
| RunPod | A100 80 GB | 80 GB | Single GPU full council + headroom |

---

## 🛠️ Troubleshooting Council Mode

### ❌ CUDA out of memory during council launch

**Cause:** Total VRAM utilization fractions exceed available GPU memory.

**Solutions:**

1. Reduce utilization fractions in `council-launch.sh`:

   ```bash
   UTIL_1B=0.05
   UTIL_4B=0.10
   UTIL_7B=0.18
   UTIL_15B=0.30
   ```

2. Use quantized models (AWQ/GPTQ) to reduce per-model VRAM.
3. Drop the `plan` (15B) tier and run only three channels:

   ```bash
   ./daily-bootstrap.sh fast
   ./daily-bootstrap.sh edit
   ./daily-bootstrap.sh qa
   ```

---

### ❌ One or more channels not responding

**Diagnosis:**

```bash
./council-monitor.sh
tail -f ./logs/council_qa_8500.log  # Check specific channel log
```

**Solutions:**

1. The model may still be loading — allow up to 5 minutes.
2. Restart that channel's tmux window:

   ```bash
   tmux attach -t council
   # Navigate to the failing window with Ctrl+B, then 0-3
   # Press Ctrl+C and re-run the launch command shown at the top of the window
   ```

---

### ❌ Port already in use

**Diagnosis:**

```bash
netstat -tulpn | grep -E '810[0-9]|830[0-9]|850[0-9]|870[0-9]'
```

**Solution:** Stop the conflicting process or kill an existing vLLM server:

```bash
# Kill all vLLM processes
pkill -f "vllm.entrypoints" || true
```

---

### ❌ Council-launch.sh not found

**Cause:** `council-launch.sh` is generated by `initial-bootstrap.sh`. If it is missing, re-run the bootstrap:

```bash
./initial-bootstrap.sh
```

---

## 📈 Expected Performance in Council Mode

| Channel | Tier | Cold Start | Warm Response | Typical Use |
|---------|------|:----------:|:-------------:|-------------|
| fast | 1B | 30–90 s | 0.5–3 s | Autocomplete, snippets |
| edit | 4B | 1–3 min | 1–4 s | Refactoring, short edits |
| qa | 7B | 2–5 min | 3–8 s | Questions, explanations |
| plan | 15B | 4–8 min | 8–20 s | Architecture, complex planning |

> Cold start is slower in council mode because all four models load in parallel and compete
> for disk I/O. Preloading models (`./preload-models.sh`) reduces this to the GPU load time only.

---

## 🔗 Related Resources

- [Complete Setup Guide](./complete-setup.md) — Full installation and single-model setup
- [Testing Guide](../reference/testing.md) — Manual and automated testing approaches
- [Known Issues](../reference/known-issues.md) — Common problems and workarounds
- [ROADMAP.md](../../ROADMAP.md) — Planned features and future council enhancements

---

**License**: MIT  
**Author**: Jerimiah Michael Meyer (@jmeyer1980)
