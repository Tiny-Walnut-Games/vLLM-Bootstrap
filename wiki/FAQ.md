# Frequently Asked Questions (FAQ)

**Quick answers to common questions**

---

## General Questions

### What is vLLM-Bootstrap?

A toolkit that helps you run Large Language Models locally on your machine. You can chat with them via command-line tools.

**Current capabilities**: CLI chat using curl commands  
**Not yet implemented**: IDE integration (Rider, VS Code)

### Do I need an internet connection?

**During setup**: Yes (downloads models and dependencies)  
**After setup**: Only for downloading new models  
**For chatting**: No internet needed (runs 100% locally)

### Is this free?

Yes. MIT licensed, completely free and open source.

### Can I use this commercially?

Yes, but check individual model licenses:

- Most models (Mistral, Llama) allow commercial use
- Some (Gemma, certain others) have restrictions
- Check model card on HuggingFace

---

## Hardware Requirements

### Can I run this without a GPU?

Yes, but it's **10-20x slower**.

CPU mode example:

- GPU: 2-4 seconds per response
- CPU: 30-60 seconds per response

### How much VRAM do I need?

**Minimum**: 6GB (for 1B models)  
**Recommended**: 8GB (for 7B models)  
**Comfortable**: 12GB+ (for 7B or multiple models)  
**Advanced**: 16GB+ (for 15B models or multiple tiers)

### What GPUs are supported?

**NVIDIA GPUs only** (requires CUDA):

- RTX 2060, 3060, 4060, 4070, 4090
- GTX 1080 Ti, 1660 Ti
- Any NVIDIA GPU with 6GB+ VRAM

**AMD/Intel GPUs**: Not currently supported by vLLM

### Can I use this on a laptop?

Yes, if it has:

- NVIDIA GPU with 8GB+ VRAM
- 16GB+ system RAM
- 50GB+ free storage

Most gaming laptops work fine.

### My GPU has 4GB VRAM, will it work?

You can try 1B models, but it might be tight. 6GB minimum recommended.

---

## Installation Questions

### Do I need WSL on Linux?

No. WSL is only for Windows users. Native Linux users can run scripts directly.

### Which Linux distributions are supported?

**Tested**: Ubuntu 20.04, 22.04, 24.04  
**Should work**: Debian, Pop!\_OS, Linux Mint  
**Untested**: Fedora, Arch, openSUSE (may require adjustments)

### Can I install on macOS?

Scripts are designed for Linux. macOS users would need to:

- Install dependencies manually
- Adapt scripts (replace `apt` with `brew`, etc.)
- Note: vLLM doesn't support macOS GPUs (Metal)

**Status**: Not officially supported, but possible with modifications

### How much disk space do I need?

**Minimum**: 30GB (for installation + one 7B model)  
**Recommended**: 50GB (for installation + multiple models)  
**Comfortable**: 100GB (for all models + workspace)

### How long does installation take?

**First time**: 30-60 minutes

- 10-20 min: Downloading dependencies
- 5-10 min: Installing Python packages
- 10-30 min: Downloading first model

**Subsequent models**: 5-15 minutes each

---

## Model Questions

### Which model should I start with?

**QA tier (7B)**: Best balance of speed and capability

```bash
./scripts/daily-bootstrap.sh qa
```

### What's the difference between tiers?

| Tier     | Size | Speed  | Quality  | Use Case          |
| -------- | ---- | ------ | -------- | ----------------- |
| **fast** | 1B   | ⚡⚡⚡ | ⭐       | Quick tasks       |
| **edit** | 4B   | ⚡⚡   | ⭐⭐     | Code editing      |
| **qa**   | 7B   | ⚡     | ⭐⭐⭐   | General chat      |
| **plan** | 15B  | 🐌     | ⭐⭐⭐⭐ | Complex reasoning |

### Can I use models not listed in models.conf?

Technically yes, but requires manual configuration:

1. Find model on HuggingFace
2. Edit `models.conf`
3. Add model identifier
4. Ensure it's OpenAI-compatible

**Not recommended for beginners.**

### How do I switch models?

Edit `~/.config/llm-doctrine/models.conf`:

- Swap `default` and `alt1` lines
- Save file
- Relaunch model tier

See: [Model Configuration Guide](Model-Configuration#switching-models)

### Do models improve over time?

Models don't "learn" from your conversations. Each chat starts fresh.

To get better responses:

- Use larger models
- Write clearer prompts
- Provide more context in messages

---

## Usage Questions

### Can I chat with the model in a browser?

Not directly. Current version is CLI-only via curl commands.

**Workarounds**:

- Use a web UI tool that connects to OpenAI-compatible APIs
- Wait for future IDE integration

### Can I use this with ChatGPT-style apps?

If the app supports "OpenAI-compatible" endpoints, yes:

1. Set URL to `http://localhost:8500/v1`
2. API key: Leave blank or use "dummy"
3. Model: Use the full model name (e.g., `mistralai/Mistral-7B-Instruct-v0.3`)

### How do I stop a model?

**In the terminal where it's running**:

- Press `Ctrl+C`

**From another terminal**:

```bash
# Find process
ps aux | grep vllm

# Kill it
kill <PID>
```

### Can I run multiple models at once?

**Yes, if you have 16GB+ VRAM**:

1. Open separate terminals
2. Launch different tiers (different ports)
3. Chat with each on their respective ports

### Do my conversations get saved?

**No**. Models don't store conversation history.

**For multi-turn conversations**: Include previous messages in each API call.

See: [CLI Usage: Multi-Turn Conversations](CLI-Usage#multi-turn-conversation)

### Are my chats private?

**Yes**. Everything runs locally:

- No data sent to cloud
- No internet connection needed (after setup)
- No telemetry or tracking

---

## Performance Questions

### Why are responses slow?

Common causes:

1. **CPU mode** (no GPU) → Check: `nvidia-smi`
2. **Large model** → Try: `./scripts/daily-bootstrap.sh fast`
3. **Long responses** → Limit: `"max_tokens": 100`

### How many tokens per second can I expect?

**GPU mode** (8GB VRAM, RTX 3060):

- 1B models: 100-150 tokens/sec
- 7B models: 30-50 tokens/sec
- 15B models: 15-25 tokens/sec

**CPU mode**:

- 1B models: 5-10 tokens/sec
- 7B models: 1-3 tokens/sec

### Can I make models faster?

**Hardware**: Better GPU = faster  
**Software**:

- Use smaller models
- Reduce `max_tokens`
- Quantization (future feature)

### Why does the first response take longer?

**Model loading**: First inference loads model weights into memory. Subsequent responses are faster.

---

## Technical Questions

### What's the difference between "using" and "testing"?

**Using**: Running models, chatting via CLI (Python/vLLM in WSL)  
**Testing**: Validating installation works (Node.js/Playwright on Windows)

**You don't need testing** to use vLLM. Testing is optional validation.

### What is an OpenAI-compatible API?

vLLM mimics OpenAI's API format:

- Same endpoints (`/v1/chat/completions`)
- Same request structure
- Same response format

**Benefit**: Tools built for OpenAI API work with vLLM.

### What are chat templates?

Formats that structure messages for models. Each model expects different formats:

- Llama: `<|begin_of_text|>...`
- Mistral: `[INST]...[/INST]`
- Phi: `<|user|>...<|assistant|>`

**vLLM handles this automatically** based on model.

### Can I use this for production services?

Current version is designed for **personal development use**.

**For production**:

- Review model licenses (some restrict commercial use)
- Add authentication (currently none)
- Implement rate limiting
- Monitor resource usage

### What's the roadmap?

See: [ROADMAP.md](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/blob/main/ROADMAP.md)

**Coming next**: IDE integration (chat templates for Rider, VS Code)

---

## Troubleshooting Questions

### Model won't load, what do I do?

See: [Troubleshooting: Model Won't Load](Troubleshooting#model-wont-load)

**Quick checks**:

1. Activate environment: `source ~/torch-env/bin/activate`
2. Check VRAM: `nvidia-smi`
3. Check auth: `huggingface-cli whoami`

### Connection refused, what's wrong?

See: [Troubleshooting: Connection Refused](Troubleshooting#connection-refused)

**Quick fix**: Ensure model is running and you're using the correct port.

### How do I update vLLM-Bootstrap?

```bash
cd ~/.config/llm-doctrine
git pull
chmod +x scripts/*.sh
```

### Can I reset to default configuration?

```bash
cd ~/.config/llm-doctrine
./scripts/initial-bootstrap.sh
```

**This regenerates config files** (backs up existing ones).

---

## Contribution Questions

### How can I help?

Ways to contribute:

1. **Test on your hardware** and report results
2. **Submit bug reports** with detailed info
3. **Suggest models** that work well
4. **Improve documentation** with pull requests
5. **Share your use cases** in Discussions

### I found a bug, where do I report it?

**GitHub Issues**: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues

**Include**:

- System info (GPU, VRAM, OS)
- Steps to reproduce
- Error messages
- Relevant log snippets

### Can I add support for my favorite model?

Yes! Submit a pull request:

1. Add model to appropriate tier in `models.conf`
2. Test it works
3. Document VRAM requirements
4. Submit PR with changes

See: [CONTRIBUTING.md](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/blob/main/CONTRIBUTING.md)

---

## Comparison Questions

### How is this different from Ollama?

**vLLM-Bootstrap**:

- Focuses on OpenAI API compatibility
- Designed for IDE integration
- Tier-based model organization
- Requires more setup

**Ollama**:

- Simpler installation
- Built-in CLI chat interface
- Different API format
- More user-friendly for beginners

**Choose vLLM-Bootstrap if**: You want OpenAI API compatibility for IDE tools  
**Choose Ollama if**: You want simpler setup and don't need OpenAI API format

### How is this different from LM Studio?

**vLLM-Bootstrap**: Command-line, script-based, open source  
**LM Studio**: GUI application, commercial, easier for non-technical users

### How is this different from text-generation-webui?

**vLLM-Bootstrap**: API server, CLI-focused, development-oriented  
**text-generation-webui**: Web UI, chat interface, more end-user friendly

---

## IDE Integration Questions

### Can I use this with JetBrains Rider?

**Not yet**. Chat templates are required but not yet implemented.

**Current status**: Configuration is prepared, but IDE chat integration is unverified.

### What about VS Code?

Same as Rider - waiting on chat template implementation.

### When will IDE integration be available?

**Next major milestone** after CLI chat is stable.

**Follow progress**: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/milestones

---

## Licensing Questions

### What license is vLLM-Bootstrap under?

MIT License - free for personal and commercial use.

### What about the models?

Each model has its own license:

- **Mistral**: Apache 2.0 (commercial use OK)
- **Llama**: Llama 3 license (mostly permissive)
- **Phi**: Microsoft Research License (more restrictive)

**Always check model card** on HuggingFace for specifics.

### Can I distribute my modifications?

Yes, under MIT license. Include original copyright notice.

---

## Still Have Questions?

- **[Troubleshooting Guide](Troubleshooting)** - Solve common problems
- **[GitHub Discussions](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions)** - Ask the community
- **[GitHub Issues](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues)** - Report bugs
- **[Documentation](Home)** - Browse all guides

---

**Didn't find your answer?** → [Start a Discussion](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions/new)
