# Known Issues & Workarounds

This document tracks known issues, limitations, and workarounds for vLLM-Doctrine.

**Last Updated:** 2025-10-11 (v0.1.0-alpha)

---

## 🔴 Critical Issues

### WSL Default Installation on C: Drive

**Issue:** WSL defaults to installing distributions on the C: drive, which can be problematic for users with limited system drive space or who prefer to use secondary NVMe drives.

**Impact:**

- Large model downloads (1GB-30GB per model) consume C: drive space
- Virtual environment and PyTorch installation (~5GB) on C: drive
- Can cause system drive to fill up quickly

**Workarounds:**

#### Option 1: Move Existing WSL Distribution (Recommended)

```powershell
# Export your WSL distribution
wsl --export Ubuntu D:\WSL-Backup\ubuntu.tar

# Unregister the old distribution
wsl --unregister Ubuntu

# Import to new location
wsl --import Ubuntu D:\WSL\Ubuntu D:\WSL-Backup\ubuntu.tar

# Set as default
wsl --set-default Ubuntu
```

#### Option 2: Symlink HuggingFace Cache

```bash
# In WSL, move cache to secondary drive
mkdir -p /mnt/d/huggingface-cache
mv ~/.cache/huggingface /mnt/d/huggingface-cache/
ln -s /mnt/d/huggingface-cache ~/.cache/huggingface
```

#### Option 3: Use Custom Cache Location

```bash
# Set environment variable in ~/.bashrc
echo 'export HF_HOME=/mnt/d/huggingface-cache' >> ~/.bashrc
source ~/.bashrc
```

**Status:** Workarounds available, no fix planned (WSL limitation)

---

## 🟡 Moderate Issues

### Chat Template Compatibility

**Issue:** Chat templates are configured based on model documentation but have limited real-world testing across all 12 default models.

**Impact:**

- Some models may not respond correctly to chat completions
- Template mismatches can cause formatting issues in Rider

**Workaround:**

1. Edit `~/.config/llm-doctrine/chat-templates.conf`
2. Try alternative templates for your model:
   - `llama3` - Works for most Llama-based models
   - `chatml` - Good fallback for instruction-tuned models
   - `mistral` - For Mistral family models
3. Test with `./test-connection.sh <port>`

**Status:** Community testing needed

---

### Windows Firewall Blocking WSL Connections

**Issue:** Some Windows firewall configurations block localhost connections from WSL to Windows applications (like Rider).

**Symptoms:**

- Connection refused errors when testing from Windows
- Works from within WSL but not from Windows host

**Workaround:**

```powershell
# Allow WSL through Windows Firewall (PowerShell as Admin)
New-NetFirewallRule -DisplayName "WSL" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow
```

**Alternative:** Test from within WSL first to verify model is working:

```bash
# In WSL
curl http://localhost:8500/v1/models
```

**Status:** Windows configuration issue, documented workaround

---

### VRAM Estimation Conservative

**Issue:** GPU memory utilization percentages in `daily-bootstrap.sh` are conservative estimates and may not be optimal for all GPU/model combinations.

**Impact:**

- May underutilize available VRAM
- Could potentially load larger models than currently configured

**Workaround:**
Edit `daily-bootstrap.sh` and adjust GPU memory fractions:

```bash
# Find lines like:
GPU_MEM_UTIL="0.85"  # Increase to 0.90 or 0.95 if you have headroom

# Or manually specify when launching:
vllm serve model-name --gpu-memory-utilization 0.95
```

**Status:** Intentionally conservative for stability

---

## 🟢 Minor Issues / Limitations

### Multi-GPU Support Not Configured

**Issue:** Scripts assume single GPU setup. Multi-GPU configurations require manual adjustment.

**Workaround:**

```bash
# Manually specify tensor parallel size
vllm serve model-name --tensor-parallel-size 2
```

**Status:** Feature request for future release

---

### CPU Fallback Mode Untested

**Issue:** CPU-only mode (no NVIDIA GPU) has minimal testing and will be extremely slow.

**Impact:**

- 10-100x slower inference
- May timeout on larger models
- Not recommended for practical use

**Workaround:** Use smaller models (1B tier) only, or consider cloud GPU options.

**Status:** Not a priority (GPU-focused tool)

---

### tmux Session Management

**Issue:** Multiple model launches create multiple tmux sessions without automatic cleanup.

**Impact:**

- `tmux ls` shows many sessions
- Manual cleanup required

**Workaround:**

```bash
# Kill all vllm sessions
tmux kill-session -t vllm-fast
tmux kill-session -t vllm-edit
tmux kill-session -t vllm-qa
tmux kill-session -t vllm-plan

# Or kill all tmux sessions
tmux kill-server
```

**Status:** Enhancement planned for future release

---

## 🔵 Testing Gaps (Alpha Status)

These are areas with limited testing that need community validation:

### Hardware Configurations

- ✅ Tested: 8GB VRAM (RTX 3060), 16GB VRAM (RTX 4060 Ti)
- ⚠️ Untested: 4GB, 6GB, 12GB, 24GB+ VRAM configurations
- ⚠️ Untested: AMD GPUs (ROCm support)
- ⚠️ Untested: Multi-GPU setups

### Windows Versions

- ✅ Tested: Windows 10 (22H2), Windows 11 (23H2)
- ⚠️ Untested: Windows 10 older builds
- ⚠️ Untested: Windows 11 Insider builds
- ⚠️ Untested: Windows Server

### WSL Configurations

- ✅ Tested: WSL2 with Ubuntu 22.04
- ⚠️ Untested: Ubuntu 20.04, 24.04
- ⚠️ Untested: Other distributions (Debian, Arch, etc.)
- ⚠️ Untested: WSL1 (not recommended)

### IDE Integrations

- ✅ Tested: JetBrains Rider 2024.2+
- ⚠️ Untested: VS Code with Continue/Cody
- ⚠️ Untested: Cursor IDE
- ⚠️ Untested: Other JetBrains IDEs (IntelliJ, PyCharm, etc.)

---

## 📝 Reporting New Issues

If you encounter an issue not listed here:

1. **Check validation first:**

   ```bash
   cd ~/.config/llm-doctrine
   ./validate-config.sh
   ```

2. **Gather logs:**

   ```bash
   # Model logs
   cat ./logs/qa_8500.log

   # Bootstrap logs
   cat ./bootstrap-*.log
   ```

3. **Create GitHub Issue** with:
   - Your hardware specs (GPU model, VRAM, RAM)
   - Windows version and WSL version
   - Output from `validate-config.sh`
   - Relevant log excerpts
   - Steps to reproduce

4. **Label appropriately:**
   - `bug` - Something broken
   - `hardware-specific` - Works on some systems, not others
   - `documentation` - Unclear instructions
   - `enhancement` - Feature request

---

## 🔧 Quick Diagnostic Commands

```bash
# Check WSL version and distribution
wsl --list --verbose

# Check GPU in WSL
nvidia-smi

# Check Python environment
source ~/torch-env/bin/activate
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}')"

# Check vLLM installation
python -c "import vllm; print(f'vLLM: {vllm.__version__}')"

# Check HuggingFace authentication
huggingface-cli whoami

# Check running models
curl http://localhost:8500/v1/models

# Check port usage
netstat -tuln | grep 85
```

---

## 💡 Tips & Best Practices

### For Limited C: Drive Space

1. Move WSL to secondary drive (see workaround above)
2. Use `HF_HOME` environment variable
3. Regularly clean up old model downloads
4. Use `preload-models.sh` to download only what you need

### For Laptop/Desktop Switching (KVM Users)

1. Keep WSL distributions in sync (export/import)
2. Use same model cache location on both systems
3. Document your custom configurations
4. Consider using Git to sync `~/.config/llm-doctrine` customizations

### For Multi-System Testing

1. Use `models.conf` to standardize model selection
2. Keep `ports.conf` consistent across systems
3. Document hardware-specific adjustments
4. Share your findings with the community!

---

**Last Updated:** 2025-10-11  
**Version:** 0.1.0-alpha  
**Maintainer:** @jmeyer1980
