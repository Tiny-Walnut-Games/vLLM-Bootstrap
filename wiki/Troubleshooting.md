# Troubleshooting

**Common problems and their solutions**

---

## Quick Diagnosis

### Is Model Running?

```bash
curl http://localhost:8500/health
```

**Expected**: `OK`

**If fails**: Model isn't running → [Model Won't Load](#model-wont-load)

### Is Environment Activated?

```bash
echo $VIRTUAL_ENV
```

**Expected**: `/home/username/torch-env`

**If empty**: Activate it:
```bash
source ~/torch-env/bin/activate
```

### Is CUDA Working?

```bash
nvidia-smi
```

**Expected**: GPU info and memory usage

**If fails**: GPU/CUDA issues → [CUDA Not Available](#cuda-not-available)

---

## Model Won't Load

### Symptom

```bash
$ ./scripts/daily-bootstrap.sh qa
Error: Failed to load model
```

### Causes and Fixes

#### 1. Insufficient VRAM

**Check**:
```bash
nvidia-smi
```

Look at "Memory-Usage" - is it already near 100%?

**Fix**:
- Kill other GPU processes
- Try smaller model: `./scripts/daily-bootstrap.sh fast`
- Restart computer to clear GPU memory

#### 2. HuggingFace Authentication Failed

**Check**:
```bash
huggingface-cli whoami
```

**Expected**: Your username

**If fails**:
```bash
huggingface-cli login
# Paste your token (starts with hf_...)
```

Get token from: https://huggingface.co/settings/tokens

#### 3. Model Not Downloaded Yet

**Symptom**: Long wait on first launch

**This is normal!** Models are several GB:
- 1B models: ~1-2GB download
- 7B models: ~7GB download
- 15B models: ~15GB download

**Wait for download to complete**. Subsequent launches are much faster.

#### 4. Python Environment Not Active

**Check**:
```bash
echo $VIRTUAL_ENV
```

**Fix**:
```bash
source ~/torch-env/bin/activate
```

#### 5. Port Already in Use

**Check**:
```bash
lsof -i :8500
# or
netstat -tulpn | grep 8500
```

**Fix**:
```bash
# Kill the process
kill <PID>

# Or use a different model tier (different port)
./scripts/daily-bootstrap.sh fast  # Port 8100 instead
```

---

## Connection Refused

### Symptom

```bash
$ curl http://localhost:8500/v1/chat/completions ...
curl: (7) Failed to connect to localhost port 8500: Connection refused
```

### Causes and Fixes

#### 1. Model Isn't Running

**Check**: Do you see the model terminal showing logs?

**Fix**: Launch model first:
```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./scripts/daily-bootstrap.sh qa
```

**Wait for**: "Application startup complete"

#### 2. Wrong Port

**Check**: What port did model launch on?

Model logs show:
```
🚀 Launching qa on port 8500
```

**Fix**: Use matching port in curl command

#### 3. Model Crashed

**Check logs**:
```bash
tail -f ~/.config/llm-doctrine/logs/qa_8500.log
```

**Common crashes**:
- Out of memory (VRAM) → Use smaller model
- CUDA error → Restart computer, update drivers

---

## Out of VRAM

### Symptom

```
RuntimeError: CUDA out of memory
OutOfMemoryError: Tried to allocate 8.5 GB
```

### Causes and Fixes

#### 1. Model Too Large for GPU

**Your VRAM vs. Model requirements**:
- 6GB VRAM → max 1B models
- 8GB VRAM → max 7B models (one at a time)
- 12GB VRAM → 7B models comfortably
- 16GB+ VRAM → 15B models or multiple smaller models

**Fix**: Use smaller model tier:
```bash
./scripts/daily-bootstrap.sh fast  # 1B, needs ~2-3GB
```

#### 2. Multiple Models Running

**Check**:
```bash
nvidia-smi
```

Look for multiple `python` processes using GPU.

**Fix**: Stop other models (Ctrl+C in their terminals)

#### 3. Other GPU Applications

**Check**: Gaming, video editing, rendering software?

**Fix**: Close them, then try again

#### 4. GPU Memory Not Cleared

**Fix**: Restart computer to fully clear VRAM

---

## CUDA Not Available

### Symptom

```bash
$ python -c "import torch; print(torch.cuda.is_available())"
False
```

### Causes and Fixes (Windows WSL)

#### 1. NVIDIA Drivers Not Installed (Windows Host)

**Check** (in Windows, not WSL):
```powershell
nvidia-smi
```

**If fails**: Install drivers from https://www.nvidia.com/download/index.aspx

**After install**: Restart Windows

#### 2. WSL Not Updated

**In Windows PowerShell (Admin)**:
```powershell
wsl --update
wsl --shutdown
```

Reopen WSL and try again.

#### 3. Wrong PyTorch Version

**Check**:
```bash
source ~/torch-env/bin/activate
python -c "import torch; print(torch.__version__)"
```

**Should show**: `2.x.x+cu121` (note the `+cu121` for CUDA)

**If not**:
```bash
pip install --upgrade torch --index-url https://download.pytorch.org/whl/cu121
```

### Causes and Fixes (Linux)

#### NVIDIA Drivers Not Installed

**Check**:
```bash
nvidia-smi
```

**If fails**:
```bash
# Ubuntu
sudo ubuntu-drivers autoinstall
sudo reboot
```

After reboot, verify:
```bash
nvidia-smi
```

---

## Slow Responses

### Symptom

Model takes 30+ seconds per response

### Causes and Fixes

#### 1. CPU Mode (No CUDA)

**Check**:
```bash
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
```

**If False**: See [CUDA Not Available](#cuda-not-available)

**CPU mode is 10-20x slower** than GPU mode.

#### 2. Model Too Large for Your Hardware

**Try smaller model**:
```bash
./scripts/daily-bootstrap.sh fast  # Much faster
```

#### 3. Long max_tokens

```bash
# Slow: Generates up to 2000 tokens
curl ... -d '{"max_tokens": 2000, ...}'

# Fast: Generates up to 100 tokens
curl ... -d '{"max_tokens": 100, ...}'
```

---

## Script Permission Denied

### Symptom

```bash
$ ./scripts/initial-bootstrap.sh
bash: ./scripts/initial-bootstrap.sh: Permission denied
```

### Fix

```bash
chmod +x ~/.config/llm-doctrine/scripts/*.sh
```

---

## HuggingFace Issues

### Login Fails

**Symptom**:
```
huggingface-cli login
Error: Invalid token
```

**Fix**:
1. Generate new token: https://huggingface.co/settings/tokens
2. Type: **"Read"**
3. Copy token (starts with `hf_...`)
4. Try again:
   ```bash
   huggingface-cli login
   ```

### Model Download Stuck

**Symptom**: Download at 0% for several minutes

**Causes**:
- Slow internet → Wait (models are several GB)
- Authentication issue → Run `huggingface-cli login` again
- Disk space full → Check: `df -h ~`

### Can't Access Gated Models

Some models (Llama 3, Gemma) require acceptance of terms:

1. Go to model page on HuggingFace (e.g., https://huggingface.co/meta-llama/Llama-3.2-1B)
2. Accept the license/terms
3. Try download again

---

## WSL Issues (Windows)

### WSL Command Not Found

**Symptom** (in PowerShell):
```
wsl : The term 'wsl' is not recognized
```

**Cause**: WSL not installed

**Fix**:
```powershell
# In PowerShell as Administrator
wsl --install
```

Restart computer after installation.

### Can't Access WSL Files from Windows

**Use**:
```
\\wsl.localhost\Ubuntu\home\username\
```

**Not**:
```
C:\Users\username\AppData\Local\...
```

### WSL Networking Issues

**Symptom**: Can't access `localhost:8500` from Windows

**Fix 1**: Use WSL IP directly:
```bash
# In WSL, get IP
hostname -I
```

Use that IP from Windows: `http://<WSL_IP>:8500`

**Fix 2**: Restart WSL:
```powershell
# In PowerShell
wsl --shutdown
```

Reopen WSL, launch model again.

---

## Test Failures

### "Command not found: npm"

**Cause**: Node.js not installed

**Fix**: Install from https://nodejs.org/, restart terminal

### "Cannot find module '@playwright/test'"

**Cause**: Dependencies not installed

**Fix**:
```bash
cd ~/vLLM-Bootstrap
npm install
npx playwright install
```

### Tests Timeout

**Cause**: Slow system or insufficient VRAM

**Fix**:
- Use 1B tier only: `npm run test:1b`
- Skip large models: `export SKIP_LARGE_MODELS=true`
- Check GPU availability: `nvidia-smi`

---

## Configuration Issues

### "Config file not found"

**Symptom**:
```
Error: models.conf not found
```

**Fix**: Run initial bootstrap:
```bash
cd ~/.config/llm-doctrine
./scripts/initial-bootstrap.sh
```

### Wrong Model Loaded

**Check which model is configured**:
```bash
cat ~/.config/llm-doctrine/models.conf
```

Look for `default` line under your tier.

**To change**: Edit the file:
```bash
nano ~/.config/llm-doctrine/models.conf
```

Swap `default` and `alt1` lines, save, relaunch model.

---

## Disk Space Issues

### Check Available Space

```bash
df -h ~
```

### Models Take Too Much Space

**Each model**:
- 1B: ~1-2GB
- 4B: ~4GB
- 7B: ~7GB
- 15B: ~15GB

**Location**: `~/.cache/huggingface/hub/`

**To free space**: Delete unused models
```bash
rm -rf ~/.cache/huggingface/hub/models--<model-name>
```

**⚠️ WARNING**: Model will need to be re-downloaded on next use.

---

## Performance Optimization

### Faster Responses

1. **Use smaller models**:
   ```bash
   ./scripts/daily-bootstrap.sh fast
   ```

2. **Limit response length**:
   ```bash
   curl ... -d '{"max_tokens": 100, ...}'
   ```

3. **Lower temperature** (less creative, more deterministic):
   ```bash
   curl ... -d '{"temperature": 0.3, ...}'
   ```

### Better Quality

1. **Use larger models**:
   ```bash
   ./scripts/daily-bootstrap.sh qa  # 7B
   # or
   ./scripts/daily-bootstrap.sh plan  # 15B
   ```

2. **More tokens**:
   ```bash
   curl ... -d '{"max_tokens": 500, ...}'
   ```

3. **Higher temperature** (more creative):
   ```bash
   curl ... -d '{"temperature": 0.8, ...}'
   ```

---

## Getting More Help

### Check Logs

```bash
# Model logs
tail -f ~/.config/llm-doctrine/logs/qa_8500.log

# System logs
dmesg | grep -i cuda
dmesg | grep -i nvidia
```

### Run Diagnostics

```bash
# Test connection
./scripts/test-connection.sh 8500

# Check system info
nvidia-smi
python --version
pip list | grep -E 'torch|vllm'
huggingface-cli whoami
```

### Community Support

- **GitHub Issues**: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues
- **Discussions**: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions
- **FAQ**: [FAQ](FAQ)

---

## Known Issues

### WSL2 Networking on VPN

Some VPNs break WSL2 networking. Disconnect VPN or use WSL IP directly.

### First Launch Takes Forever

**Normal**: Model downloads several GB. Subsequent launches are fast (30-60s).

### Model Responses Are Repetitive

Try:
- Increase `temperature` (0.7-0.9)
- Add `top_p` parameter: `"top_p": 0.9`
- Use different model

---

**Still stuck?** → [FAQ](FAQ) | [GitHub Issues](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues)