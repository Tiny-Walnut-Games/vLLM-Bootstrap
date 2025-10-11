# Local LLM Ritual — Four-Scroll Doctrine

**doctrine-version: 2025.10.10**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green.svg)]()
[![Testing: Pending](https://img.shields.io/badge/Testing-Pending-orange.svg)]()

---

## 📖 Foreword

This bootstrap was created in response for my, @jmeyer1980, desire to quickly set up and distribute LLMs internally for use with Rider and other agentic IDE interfaces.

It was developed for myself and a friend who recently grabbed a 16GB VRAM card and plans on self-hosting as well. I cannot claim usability of this script for every system.

Feel free to comment with suggested updates. Please stick to those HuggingFace hosted models that can be easily pulled and served using this workflow. Collaborators should keep the overall mental model in consideration when recommending updates.

---

## ✨ Features

- 🚀 **One-Command Setup** - Single script installs everything
- 🔐 **HuggingFace Integration** - Interactive authentication setup
- 🎯 **Role-Based Models** - Fast (1B), Edit (4B), QA (7B), Plan (15B)
- 💬 **Chat Template Support** - Automatic template detection for 12+ models
- 🔌 **OpenAI API Compatible** - Works with Rider AI Assistant and other tools
- 🧪 **Built-in Testing** - Connection validation and system checks
- 📝 **Persistent Logging** - All output saved for debugging
- 🛡️ **Backup System** - Preserves your customizations
- 📚 **Comprehensive Docs** - Zero to Rider in 30 minutes

---

## 🎯 Quick Start

### Just Want to Use vLLM? (Most Users)
```bash
# 1. Install WSL (Windows PowerShell as Admin)
wsl --install -d Ubuntu

# 2. In WSL, create directory
mkdir -p ~/.config/llm-doctrine
cd ~/.config/llm-doctrine

# 3. Download and extract scripts here

# 4. Run initial setup
chmod +x *.sh
./initial-bootstrap.sh

# 5. Launch a model
source ~/torch-env/bin/activate
./daily-bootstrap.sh qa

# 6. Test connection
./test-connection.sh 8500

# 7. Configure Rider
# Settings → Tools → AI Assistant → Models
# Add: OpenAI Compatible
# URL: http://localhost:8500/v1
```

**See [COMPLETE-GUIDE.md](COMPLETE-GUIDE.md) for detailed instructions.**

### Want to Test Your Installation? (Optional)

**⚠️ Testing is a separate process** but now with **one-click setup**:

```cmd
# 1. One-click installer (auto-installs Node.js if needed)
E:\Tiny_Walnut_Games\vLLM-Doctrine\.vs\install-test-dependencies.bat

# 2. Run comprehensive tests
.\tests\run-comprehensive-tests.ps1

# OR individual tests:
npx playwright test
npx playwright test --ui
```

**See [tests/QUICK-START-TESTING.md](tests/QUICK-START-TESTING.md) for complete testing guide.**

**Testing validates your installation but is not required for normal usage.**

---

## 📋 Prerequisites

### System Requirements
- **OS**: Windows 10/11 with WSL2, or native Linux
- **GPU**: NVIDIA GPU with 8GB+ VRAM (recommended)
  - CPU fallback supported but slower
- **RAM**: 16GB+ recommended
- **Storage**: 50GB+ free space for models

### WSL Installation

1. Open PowerShell as Administrator
2. Install Ubuntu:
   ```powershell
   wsl --install -d Ubuntu
   ```
3. If WSL is already installed:
   ```powershell
   wsl --update
   ```
4. Restart if prompted
5. Launch WSL:
   - Start menu → type "Ubuntu" → Enter
   - Windows Terminal → select "Ubuntu" from dropdown
   - Run box (Win+R) → type "wsl" → Enter
6. Create Linux username and password
   - ⚠️ **Important**: Password field shows no feedback (no dots/asterisks)

---

## 📦 Installation

### Method 1: Git Clone (Recommended)
```bash
cd ~/.config
git clone <repository-url> llm-doctrine
cd llm-doctrine
chmod +x *.sh
./initial-bootstrap.sh
```

### Method 2: Manual Download
1. Download the repository as ZIP
2. Extract to `~/.config/llm-doctrine` in WSL
   - Windows UNC path: `\\wsl.localhost\Ubuntu\home\<username>\.config\llm-doctrine`
3. Make scripts executable:
   ```bash
   cd ~/.config/llm-doctrine
   chmod +x *.sh
   ./initial-bootstrap.sh
   ```

---

## 🚀 Usage

### Launching Models

```bash
# Activate virtual environment
source ~/torch-env/bin/activate

# Launch by role
./daily-bootstrap.sh {fast|edit|qa|plan}
```

### Model Roles

| Role | Tier | Default Model | Use Case | Port Range |
|------|------|---------------|----------|------------|
| **fast** | 1B | Llama-3.2-1B | Autocomplete, boilerplate | 8100-8299 |
| **edit** | 4B | Phi-3.5-mini | Light editing, refactoring | 8300-8499 |
| **qa** | 7B | Mistral-7B | General assistant, Q&A | 8500-8699 |
| **plan** | 15B | StarCoder2-15B | Deep planning, architecture | 8700-8899 |

### Testing & Validation

```bash
# Validate system configuration
./validate-config.sh

# Test model connection
./test-connection.sh <port>

# Preload all models (for offline use)
./preload-models.sh
```

---

## ⚙️ Configuration

### models.conf
Defines available models for each tier. Each tier has 3 models (default + 2 alts).

```ini
[7B]
default = mistralai/Mistral-7B-Instruct-v0.3
alt1 = teknium/OpenHermes-2.5-Mistral-7B
alt2 = WizardLM/WizardLM-2-7B
```

To switch models, edit `models.conf` and change which line is labeled `default`.

### ports.conf
Defines port ranges for each tier.

```ini
[ranges]
1B = 8100-8299
4B = 8300-8499
7B = 8500-8699
15B = 8700-8899
```

### chat-templates.conf
Maps models to their appropriate chat templates for OpenAI API compatibility.

```ini
mistralai/Mistral-7B-Instruct-v0.3 = mistral
microsoft/phi-3.5-mini-3.8b-instruct = phi3
meta-llama/Llama-3.2-1B = llama3
```

**Note**: These files are automatically generated by `initial-bootstrap.sh` and updated when doctrine-version changes.

---

## 🔌 Rider Integration

### Setup
1. Launch a model: `./daily-bootstrap.sh qa`
2. Open Rider
3. Go to: **Settings → Tools → AI Assistant → Models**
4. Click **Add** → **OpenAI Compatible**
5. Configure:
   - **Name**: vLLM Local (Mistral 7B)
   - **URL**: `http://localhost:8500/v1`
   - **API Key**: (leave empty or use "dummy")
6. Click **Test Connection**
7. Expected: ✅ "Connection successful"

### Usage
- Open AI Assistant panel in Rider
- Select your local model from dropdown
- Start chatting or use code completion features

**See [COMPLETE-GUIDE.md](COMPLETE-GUIDE.md) for detailed Rider configuration with screenshots-equivalent instructions.**

---

## 🎨 Architecture

### Design Philosophy
- **Ritual-Framed**: Temple/scroll metaphor for mental model
- **Self-Documenting**: Scripts explain themselves
- **Fail-Safe**: Backups, validation, clear errors
- **Progressive**: Works out-of-box, advanced features optional
- **Portable**: Pure bash, no compilation needed
- **Universal**: OpenAI API compatibility

### File Structure
```
~/.config/llm-doctrine/
├── initial-bootstrap.sh      # Main setup script
├── daily-bootstrap.sh         # Model launcher (generated)
├── test-connection.sh         # Connection tester (generated)
├── validate-config.sh         # System validator (generated)
├── preload-models.sh          # Model preloader (generated)
├── models.conf                # Model definitions (generated)
├── ports.conf                 # Port ranges (generated)
├── chat-templates.conf        # Template mappings (generated)
├── README.txt                 # Quick reference (generated)
├── logs/                      # Model server logs
│   ├── qa_8500.log
│   ├── fast_8100.log
│   └── ...
└── models/                    # Model cache (HuggingFace)
```

**Note**: Files marked "(generated)" are created/updated by `initial-bootstrap.sh` and should not be manually edited unless you know what you're doing. Your changes will be backed up before updates.

---

## 🐛 Troubleshooting

### Model won't load
```bash
# Check logs
tail -f ./logs/*_*.log

# Common causes:
# 1. Insufficient VRAM → Try smaller model
# 2. Missing HF auth → Run: huggingface-cli login
# 3. Model not downloaded → Check: ls ~/.cache/huggingface/hub/
```

### Connection refused
```bash
# Verify model is running
./test-connection.sh <port>

# Check if port is in use
nc -z localhost <port>

# Check logs for errors
tail -f ./logs/*_*.log
```

### Rider can't connect
```bash
# Test from Windows PowerShell
curl http://localhost:8500/health

# If fails, check WSL networking
wsl hostname -I

# Check Windows Firewall settings
```

**See [COMPLETE-GUIDE.md](COMPLETE-GUIDE.md) for comprehensive troubleshooting guide.**

---

## 📚 Documentation

- **[COMPLETE-GUIDE.md](COMPLETE-GUIDE.md)** - Comprehensive setup guide from zero to Rider
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and development notes
- **README.txt** - Quick reference (generated by bootstrap)

---

## 🧪 Testing Status

| Component | Implementation | Testing | Status |
|-----------|---------------|---------|--------|
| Core Bootstrap | ✅ Complete | ⚠️ Pending | Production Ready |
| HF Authentication | ✅ Complete | ⚠️ Pending | Needs Validation |
| Chat Templates | ✅ Complete | ⚠️ Pending | Needs Model Testing |
| Connection Testing | ✅ Complete | ✅ Tested | Production Ready |
| Config Validation | ✅ Complete | ✅ Tested | Production Ready |
| Documentation | ✅ Complete | ✅ Reviewed | Production Ready |

**Overall Status**: Production Ready - Testing Phase

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Keep the ritual-framed mental model
2. Test thoroughly before submitting
3. Update documentation
4. Follow existing code style
5. Use the artifact writer pattern for generated files

### Areas for Contribution
- Testing chat templates with various models
- Performance benchmarking on different GPUs
- Additional model recommendations
- Documentation improvements
- Bug fixes and error handling

---

## 📄 License

MIT License

Copyright (c) 2025 Jerimiah Michael Meyer (@jmeyer1980)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙏 Acknowledgments

- **vLLM Team** - For the excellent inference engine
- **HuggingFace** - For model hosting and tooling
- **Model Creators** - For amazing open-source models
- **Community** - For feedback and testing

---

## 📞 Support

- **Issues**: Report bugs with `./validate-config.sh` output and log excerpts
- **Questions**: Check COMPLETE-GUIDE.md first
- **Contributions**: Pull requests welcome!

---

**May your tokens flow freely and your context windows never overflow.** 🏛️

---

**Maintainer**: @jmeyer1980  
**Version**: 2025.10.10  
**Status**: Production Ready (Testing Phase)