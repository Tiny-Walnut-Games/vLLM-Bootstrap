# Installation Guide

**Detailed walkthrough of vLLM-Bootstrap installation**

For a quicker guide, see: [Getting Started](Getting-Started)

---

## Prerequisites

### Hardware Requirements

**Minimum (Tested)**:

- NVIDIA GPU: RTX 2060, GTX 1080 Ti, or equivalent
- VRAM: 8GB (for 7B models)
- System RAM: 16GB
- Storage: 50GB free

**Recommended**:

- NVIDIA GPU: RTX 3060, RTX 4060, or better
- VRAM: 12GB+ (for multiple models or larger ones)
- System RAM: 32GB
- Storage: 100GB free (SSD preferred)

**CPU-only mode**: Supported but 10-20x slower than GPU

### Software Requirements

**Windows**:

- Windows 10 version 2004+ or Windows 11
- WSL 2 enabled
- PowerShell 5.1+ (built-in)

**Linux**:

- Ubuntu 20.04, 22.04, or 24.04
- Other distros may work but are untested

**Both**:

- Internet connection (for downloads)
- Admin/sudo privileges (for installation)

---

## Installation Steps

### Step 1: WSL Installation (Windows Only)

#### Check if WSL is Already Installed

```powershell
wsl --version
```

If you see version info, skip to [Step 1.4](#14-verify-wsl-version).

#### 1.1 Open PowerShell as Administrator

1. Press Windows key
2. Type "PowerShell"
3. Right-click "Windows PowerShell"
4. Select "Run as administrator"

#### 1.2 Install WSL with Ubuntu

```powershell
wsl --install -d Ubuntu
```

**What this does**:

- Enables WSL 2 feature
- Downloads Ubuntu
- Installs Ubuntu as default distribution

**Expected output**:

```
Installing: Virtual Machine Platform
Installing: Windows Subsystem for Linux
Installing: Ubuntu
Ubuntu has been installed.
```

#### 1.3 Restart Computer

If prompted:

```
Please restart your computer to complete installation
```

**Restart now**.

#### 1.4 Verify WSL Version

After restart:

```powershell
wsl --version
```

**Should show**:

```
WSL version: 2.x.x.x
```

If it shows WSL version 1, upgrade:

```powershell
wsl --set-default-version 2
```

#### 1.5 Launch Ubuntu

**Method 1**: Start menu

- Press Windows key → Type "Ubuntu" → Press Enter

**Method 2**: Windows Terminal

- Open Terminal → Dropdown menu → "Ubuntu"

**Method 3**: Direct command

- Press Win+R → Type `wsl` → Enter

#### 1.6 First Launch Setup

**Username prompt**:

```
Enter new UNIX username:
```

- Use lowercase letters only
- No spaces
- Example: `john` or `jdoe`

**Password prompt**:

```
New password:
```

**⚠️ CRITICAL**: Password field shows NO feedback (no dots, no asterisks)

1. Type password carefully
2. Press Enter
3. Type same password again
4. Press Enter

**Success**:

```
Installation successful!
username@hostname:~$
```

#### 1.7 Update Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

**Time**: 2-5 minutes

---

### Step 2: HuggingFace Setup

#### 2.1 Why You Need This

Some models (Llama, Gemma, Phi) require authentication to download. HuggingFace is the platform hosting these models.

#### 2.2 Create Account

1. Visit: https://huggingface.co/join
2. Fill in:
   - Email
   - Username
   - Password
3. Click "Sign up"
4. Verify email

**Time**: 2 minutes

#### 2.3 Generate Access Token

1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Token details:
   - **Name**: `vllm-bootstrap` (or your choice)
   - **Type**: Select **"Read"**
   - **Repositories**: "All"
4. Click "Generate token"
5. **Copy the token** (looks like `hf_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789`)

**⚠️ IMPORTANT**: Save this token! You'll need it in Step 4.

**Security note**: Read tokens can only download models, not modify your account.

---

### Step 3: Download vLLM-Bootstrap

#### 3.1 Create Installation Directory

In WSL/Linux terminal:

```bash
mkdir -p ~/.config/llm-doctrine
cd ~/.config/llm-doctrine
```

**What `~/.config` is**: Hidden directory in your home folder for application configs

**Windows equivalent path**: `\\wsl.localhost\Ubuntu\home\USERNAME\.config\llm-doctrine\`

#### 3.2 Download via Git (Recommended)

```bash
# Install git if not already installed
sudo apt install git -y

# Clone repository
git clone https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap.git .
```

**Note the `.` at the end** - it clones into current directory, not a subdirectory.

**Expected output**:

```
Cloning into '.'...
Receiving objects: 100% (XXX/XXX), done.
```

#### 3.3 Download Manually (Alternative)

If git doesn't work:

1. Go to: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap
2. Click green "Code" button
3. Click "Download ZIP"
4. Extract ZIP
5. Copy all files to `~/.config/llm-doctrine/`

**Via Windows Explorer**:

1. Open: `\\wsl.localhost\Ubuntu\home\USERNAME\.config\llm-doctrine\`
2. Drag and drop files here

#### 3.4 Verify Files

```bash
ls -la ~/.config/llm-doctrine/scripts/
```

**Should see**:

```
initial-bootstrap.sh
daily-bootstrap.sh
test-connection.sh
(and other files)
```

#### 3.5 Make Scripts Executable

```bash
chmod +x ~/.config/llm-doctrine/scripts/*.sh
```

**What this does**: Marks shell scripts as runnable programs

**Verify**:

```bash
ls -l ~/.config/llm-doctrine/scripts/initial-bootstrap.sh
```

Should show: `-rwxr-xr-x` (note the `x` for executable)

---

### Step 4: Run Initial Bootstrap

#### 4.1 Launch Installer

```bash
cd ~/.config/llm-doctrine
./scripts/initial-bootstrap.sh
```

**What this script does**:

1. Checks system requirements
2. Installs system dependencies (Python, CUDA, tmux)
3. Creates Python virtual environment (`~/torch-env`)
4. Installs PyTorch with CUDA support
5. Installs vLLM and dependencies
6. Configures HuggingFace authentication
7. Generates configuration files

#### 4.2 Installation Phases

**Phase 1: System Dependencies** (2-5 min)

```
📦 Installing system dependencies...
  ✓ python3
  ✓ python3-venv
  ✓ python3-pip
  ✓ tmux
  ✓ netcat
```

**Phase 2: Python Environment** (5-10 min)

```
🐍 Creating Python virtual environment...
  ✓ Virtual environment created at ~/torch-env
```

**Phase 3: PyTorch** (5-15 min)

```
🔥 Installing PyTorch with CUDA 12.1...
  Downloading: pytorch-2.x.x+cu121
```

**Phase 4: vLLM** (3-8 min)

```
🚀 Installing vLLM...
  ✓ vllm
  ✓ autoawq
  ✓ huggingface-hub
```

**Phase 5: Configuration**

```
🔐 HuggingFace Authentication Setup
Do you want to configure HuggingFace authentication now? (y/n)
```

#### 4.3 HuggingFace Authentication

When prompted:

**Prompt**:

```
Do you want to configure HuggingFace authentication now? (y/n)
```

**Response**: Type `y` and press Enter

**Token prompt**:

```
Please paste your HuggingFace token:
```

1. Paste your token (from Step 2.3)
2. Press Enter

**Verification**:

```
✅ HuggingFace authentication successful
   Logged in as: your-username
```

If you see this, authentication worked.

#### 4.4 Configuration Files Generated

```
📝 Generating configuration files...
  ✓ models.conf
  ✓ ports.conf
  ✓ chat-templates.conf
  ✓ README.txt
```

#### 4.5 Installation Complete

**Success message**:

```
✅ Installation complete!

Next steps:
1. Activate environment: source ~/torch-env/bin/activate
2. Launch a model: ./scripts/daily-bootstrap.sh qa
3. Test connection: ./scripts/test-connection.sh 8500
```

**Total time**: 15-40 minutes (depends on internet speed and system)

---

### Step 5: Verify Installation

#### 5.1 Check Python Environment

```bash
source ~/torch-env/bin/activate
python --version
```

**Should show**: `Python 3.10.x` or `Python 3.11.x`

#### 5.2 Check CUDA Support

```bash
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

**Expected output**:

```
CUDA available: True
```

If `False`, you're in CPU-only mode (slower but still works).

#### 5.3 Check vLLM

```bash
python -c "import vllm; print(f'vLLM version: {vllm.__version__}')"
```

**Expected output**:

```
vLLM version: 0.x.x
```

#### 5.4 Check HuggingFace Auth

```bash
huggingface-cli whoami
```

**Expected output**:

```
username: your-username
```

If this shows an error, re-run:

```bash
huggingface-cli login
# Paste token again
```

---

## Post-Installation

### Environment Activation

**Every time you open a new terminal**, activate the environment:

```bash
source ~/torch-env/bin/activate
```

**You'll see**: `(torch-env)` appear in your prompt

**To automate** (optional):

```bash
echo "source ~/torch-env/bin/activate" >> ~/.bashrc
```

Now it activates automatically when you open WSL.

### Configuration Files

Located in `~/.config/llm-doctrine/`:

- **models.conf** - Model definitions for each tier
- **ports.conf** - Port range assignments
- **chat-templates.conf** - Chat template mappings
- **README.txt** - Quick reference guide

**Do not edit these files** unless you know what you're doing. The bootstrap script overwrites them on updates.

### Directory Structure

```
~/.config/llm-doctrine/
├── scripts/
│   ├── initial-bootstrap.sh     # Setup script
│   ├── daily-bootstrap.sh       # Model launcher
│   ├── test-connection.sh       # Connection tester
│   └── ...
├── logs/                        # Model server logs (created on first launch)
├── models.conf                  # Model configuration
├── ports.conf                   # Port configuration
├── chat-templates.conf          # Template configuration
└── README.txt                   # Quick reference

~/.cache/huggingface/
└── hub/                         # Downloaded models (auto-created)

~/torch-env/                     # Python virtual environment
└── ...
```

---

## Updating

### Update vLLM-Bootstrap Scripts

```bash
cd ~/.config/llm-doctrine
git pull
chmod +x scripts/*.sh
```

### Update Dependencies

```bash
source ~/torch-env/bin/activate
pip install --upgrade vllm torch
```

### Regenerate Configuration

If configuration files are outdated:

```bash
./scripts/initial-bootstrap.sh
```

**This creates backups** of your existing configs before overwriting.

---

## Uninstalling

### Remove Python Environment

```bash
rm -rf ~/torch-env
```

### Remove vLLM-Bootstrap

```bash
rm -rf ~/.config/llm-doctrine
```

### Remove Downloaded Models

```bash
rm -rf ~/.cache/huggingface
```

**Warning**: This deletes all downloaded models (several GB). You'll need to re-download them.

### Uninstall WSL (Windows)

**PowerShell as admin**:

```powershell
wsl --unregister Ubuntu
```

**This deletes the entire Ubuntu installation** including all data.

---

## Troubleshooting

### Installation Fails: "Unable to locate package python3"

**Cause**: Package list needs updating

**Fix**:

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip
```

### Installation Fails: "CUDA not available"

**Cause**: NVIDIA drivers not installed or outdated

**Fix** (WSL):

1. Install latest NVIDIA drivers on Windows (not inside WSL)
2. Download from: https://www.nvidia.com/download/index.aspx
3. Restart Windows
4. In WSL, verify: `nvidia-smi`

### Installation Fails: "Disk space full"

**Cause**: Insufficient storage

**Fix**:

```bash
# Check available space
df -h ~

# Clean package cache
sudo apt clean
sudo apt autoremove
```

You need at least 30GB free for installation, 50GB for comfortable usage.

### HuggingFace Token Rejected

**Cause**: Invalid token or insufficient permissions

**Fix**:

1. Generate new token at https://huggingface.co/settings/tokens
2. Ensure type is **"Read"**
3. Try again:

```bash
source ~/torch-env/bin/activate
huggingface-cli login
```

### Scripts Not Executable

**Cause**: File permissions not set

**Fix**:

```bash
chmod +x ~/.config/llm-doctrine/scripts/*.sh
```

---

## Next Steps

Installation complete! Now:

1. **[Launch your first model](Getting-Started#step-5-launch-your-first-model)**
2. **[Learn CLI usage](CLI-Usage)**
3. **[Configure models](Model-Configuration)**
4. **[Run tests](Testing-Guide)**

---

**Need help?** → [Troubleshooting Guide](Troubleshooting) | [FAQ](FAQ)
