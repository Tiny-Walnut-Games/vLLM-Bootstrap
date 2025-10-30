# vLLM-Bootstrap

**Run local Large Language Models with OpenAI-compatible API**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/Tiny-Walnut-Games/vLLM-Bootstrap.svg)](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/stargazers)
[![Version](https://img.shields.io/badge/version-0.2.0--alpha-blue.svg)]()
[![Documentation](https://img.shields.io/badge/docs-wiki-brightgreen.svg)](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki)

---

## What This Does

vLLM-Bootstrap helps you run Large Language Models locally on your machine. Chat with them via command-line curl requests.

**Current Status**: CLI chat working and tested (zero-to-chat in 30 minutes)

**What Works**:

- ✅ WSL/Linux setup
- ✅ Model launching (1B, 4B, 7B, 15B tiers)
- ✅ CLI chat via curl
- ✅ OpenAI API compatibility
- ✅ Automated testing (1B tier validated)

**Not Yet Implemented**:

- ❌ IDE integration (requires chat templates)
- ❌ Chat UI interface

---

## Quick Start

### 1. Install WSL (Windows Only)

```powershell
# PowerShell as Administrator
wsl --install -d Ubuntu
```

### 2. Get HuggingFace Token

Sign up at [HuggingFace](https://huggingface.co/join), generate a read token at [Settings → Tokens](https://huggingface.co/settings/tokens).

### 3. Install vLLM-Bootstrap

```bash
# In WSL/Linux terminal
mkdir -p ~/.config/llm-doctrine
cd ~/.config/llm-doctrine
git clone https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap.git .
chmod +x scripts/*.sh
./scripts/initial-bootstrap.sh
```

### 4. Launch a Model

```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./scripts/daily-bootstrap.sh qa  # Launches Mistral-7B on port 8500
```

### 5. Chat via CLI

```bash
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [{"role": "user", "content": "Explain what a linked list is"}]
  }'
```

**🎉 You're chatting with a local LLM!**

---

## Documentation

**📚 [Read the Full Documentation on Wiki](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki)**

### Quick Links

- **New Users**: [Getting Started Guide](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/Getting-Started)
- **Installation**: [Detailed Installation Guide](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/Installation-Guide)
- **Usage**: [CLI Usage Guide](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/CLI-Usage)
- **Configuration**: [Model Configuration](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/Model-Configuration)
- **Testing**: [Testing Guide](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/Testing-Guide)
- **Help**: [Troubleshooting](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/Troubleshooting) | [FAQ](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/FAQ)

---

## System Requirements

**Minimum (Tested)**:

- Windows 10/11 with WSL2, or Ubuntu Linux
- NVIDIA GPU with 8GB VRAM (RTX 2060, GTX 1080 Ti)
- 16GB system RAM
- 50GB free disk space

**CPU-only mode supported** (10-20x slower)

---

## Model Tiers

| Tier     | Size | Model          | Port | VRAM    | Use Case          |
| -------- | ---- | -------------- | ---- | ------- | ----------------- |
| **fast** | 1B   | Llama-3.2-1B   | 8100 | 2-3GB   | Quick responses   |
| **edit** | 4B   | Phi-3.5-mini   | 8300 | 4-5GB   | Code editing      |
| **qa**   | 7B   | Mistral-7B     | 8500 | 7-8GB   | General chat      |
| **plan** | 15B  | StarCoder2-15B | 8700 | 14-16GB | Complex reasoning |

---

## Testing

Validate your installation:

```bash
# Install test dependencies (one-time)
npm install
npx playwright install

# Run 1B tier tests (RTX 2060 compatible)
npm run test:1b

# View results
# Opens: test-reports/html/index.html
```

**Testing Status**:

- ✅ 1B tier (local hardware, tested on RTX 2060)
- ✅ OpenAI API compatibility
- ✅ WSL setup workflow
- ⚠️ 4B/7B/15B tiers (configured, not fully CI-tested)

---

## Project Status

**Version**: 0.2.0-alpha  
**Status**: CLI chat production-ready  
**Next Milestone**: IDE integration (chat templates)

**What's Proven**:

- Installation workflow (reproducible)
- Model launching (all tiers)
- CLI chat (tested and working)
- OpenAI API compatibility (validated)

**In Development**:

- Chat templates for IDE integration
- Rider/VS Code chat support
- Performance optimizations

---

## Contributing

We welcome contributions!

**Ways to help**:

- Test on your hardware configuration
- Report bugs with detailed info
- Suggest models that work well
- Improve documentation
- Share your use cases

**Links**:

- [Contributing Guide](CONTRIBUTING.md)
- [GitHub Issues](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues)
- [Discussions](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions)

---

## Comparison with Alternatives

| Feature              | vLLM-Bootstrap | Ollama              | LM Studio      |
| -------------------- | -------------- | ------------------- | -------------- |
| **OpenAI API**       | ✅ Yes         | ❌ Different format | ⚠️ Partial     |
| **CLI-first**        | ✅ Yes         | ✅ Yes              | ❌ GUI-focused |
| **IDE integration**  | 🚧 In progress | ❌ No               | ⚠️ Limited     |
| **Setup complexity** | ⚠️ Medium      | ✅ Simple           | ✅ Simple      |
| **Open source**      | ✅ Yes (MIT)   | ✅ Yes              | ❌ Commercial  |

**Choose vLLM-Bootstrap if**: You want OpenAI API compatibility for development tools  
**Choose Ollama if**: You want simplest setup and don't need OpenAI API format  
**Choose LM Studio if**: You prefer GUI and don't need command-line access

---

## Documentation Philosophy

This project follows **Scrollkeeper Doctrine**:

> _"I do not celebrate what is claimed. I celebrate what is proven."_

**Principles**:

- Only document features that pass tests
- Ensure reproducibility from zero context
- No aspirational language or false celebration
- Clear separation: what works vs. what's planned
- Accessibility for neurodivergent navigation

---

## License

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

## Links

- **📚 [Documentation Wiki](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki)**
- **🐛 [Report Issues](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues)**
- **💬 [Discussions](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions)**
- **📖 [Getting Started](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/Getting-Started)**
- **🚀 [Roadmap](ROADMAP.md)**
- **📝 [Changelog](CHANGELOG.md)**

---

**Ready to start?** → [Read the Getting Started Guide](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki/Getting-Started)
