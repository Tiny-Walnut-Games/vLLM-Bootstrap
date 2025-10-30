# vLLM-Bootstrap

**A toolkit for running local Large Language Models via OpenAI-compatible API**

---

## What This Does

vLLM-Bootstrap sets up local LLMs on your machine that you can chat with via command-line curl requests. Models run on `localhost` with OpenAI-compatible API endpoints.

**Current Status**: CLI chat via curl commands (tested and working)

---

## What Works Right Now

✅ **Install and run models** on your Windows machine (via WSL) or Linux  
✅ **Chat via command line** using curl  
✅ **Four model tiers**: 1B (fast), 4B (edit), 7B (QA), 15B (plan)  
✅ **OpenAI API compatibility** for programmatic access  
✅ **Automatic testing** with Playwright (1B tier validated)

---

## What Doesn't Work Yet

❌ **IDE chat integration** (Rider, VS Code) - requires chat templates (not yet implemented)  
❌ **Multi-turn conversations in IDE** - depends on IDE integration  
❌ **Chat UI** - command line only for now

---

## System Requirements

**Minimum (Tested)**:

- Windows 10/11 with WSL2, or Ubuntu Linux
- NVIDIA GPU with 8GB VRAM (RTX 2060, GTX 1080 Ti, or better)
- 16GB system RAM
- 50GB free disk space

**CPU-only mode works** but is significantly slower.

---

## Quick Start

Get from zero to chatting with a local LLM in 30 minutes:

1. **[Install WSL](Installation-Guide#wsl-installation)** (Windows only)
2. **[Get HuggingFace token](Installation-Guide#huggingface-setup)** (free account)
3. **[Run installation script](Installation-Guide#running-installer)**
4. **[Launch a model](Getting-Started#launch-your-first-model)**
5. **[Chat via CLI](CLI-Usage#chatting-with-curl)**

**→ Start here: [Getting Started Guide](Getting-Started)**

---

## Documentation

### New Users

- **[Getting Started](Getting-Started)** - Zero to CLI chat (30 min)
- **[Installation Guide](Installation-Guide)** - Detailed setup walkthrough
- **[CLI Usage](CLI-Usage)** - How to chat with models

### Configuration

- **[Model Configuration](Model-Configuration)** - Change models, manage VRAM
- **[Testing Guide](Testing-Guide)** - Validate your installation

### Help

- **[Troubleshooting](Troubleshooting)** - Common problems and solutions
- **[FAQ](FAQ)** - Frequently asked questions

---

## Model Tiers

| Tier     | Size | Default Model  | Port | Use Case        | VRAM    |
| -------- | ---- | -------------- | ---- | --------------- | ------- |
| **fast** | 1B   | Llama-3.2-1B   | 8100 | Quick responses | 2-3GB   |
| **edit** | 4B   | Phi-3.5-mini   | 8300 | Code editing    | 4-5GB   |
| **qa**   | 7B   | Mistral-7B     | 8500 | General chat    | 7-8GB   |
| **plan** | 15B  | StarCoder2-15B | 8700 | Complex tasks   | 14-16GB |

---

## Example: Chatting with CLI

```bash
# Launch a model
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./daily-bootstrap.sh qa

# In another terminal, chat via curl
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [{"role": "user", "content": "Explain what a linked list is"}],
    "max_tokens": 200
  }'
```

**Response**: JSON with model's answer

---

## Project Status

**Version**: 0.2.0-alpha  
**License**: MIT  
**Author**: Jerimiah Michael Meyer (@jmeyer1980)

**Testing Status**:

- ✅ 1B tier models (local hardware, RTX 2060 tested)
- ✅ OpenAI API compatibility (curl validated)
- ✅ WSL setup workflow (reproducible)
- ⚠️ 4B/7B/15B tiers (configured, not yet CI-tested on all hardware)

---

## Contributing

Found a bug? Have a suggestion? Want to test on your hardware?

- **[Report Issues](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues)**
- **[Discussions](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions)**
- **[Contribution Guide](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/blob/main/CONTRIBUTING.md)**

---

## Next Steps

👉 **[Start with Getting Started Guide](Getting-Started)**

Or jump to:

- [Detailed Installation Guide](Installation-Guide)
- [How to Use CLI Chat](CLI-Usage)
- [Model Configuration](Model-Configuration)
