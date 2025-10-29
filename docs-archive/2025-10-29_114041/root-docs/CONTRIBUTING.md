# Contributing to vLLM-Doctrine

Thank you for your interest in contributing! This project is in **alpha status** and we need community help to validate it across different hardware and software configurations.

---

## 🎯 How You Can Help

### 1. **Test on Your Hardware** (Most Valuable!)

We need testing on various configurations:

#### Hardware We Need Tested:
- [ ] 4GB VRAM GPUs (RTX 3050, GTX 1650, etc.)
- [ ] 6GB VRAM GPUs (RTX 2060, GTX 1660 Ti, etc.)
- [ ] 12GB VRAM GPUs (RTX 3060 12GB, RTX 4070, etc.)
- [ ] 24GB+ VRAM GPUs (RTX 3090, RTX 4090, A5000, etc.)
- [ ] AMD GPUs with ROCm support
- [ ] Multi-GPU setups
- [ ] CPU-only mode (not recommended, but curious!)

#### Software Configurations:
- [ ] Windows 10 (various builds)
- [ ] Windows 11 (various builds)
- [ ] Different WSL distributions (Ubuntu 20.04, 24.04, Debian, etc.)
- [ ] Different IDEs (VS Code, Cursor, IntelliJ, PyCharm, etc.)
- [ ] Non-C: drive WSL installations

### 2. **Report Issues**

Found a bug? Please report it!

**Before reporting:**
1. Check [Known Issues](docs/reference/known-issues.md) to see if it's already documented
2. Run `./validate-config.sh` to gather diagnostic info
3. Check logs in `./logs/` directory

**When reporting, include:**
- Hardware specs (GPU model, VRAM, RAM)
- Windows version: `winver` output
- WSL version: `wsl --list --verbose`
- Output from `./validate-config.sh`
- Relevant log excerpts
- Steps to reproduce

**Create issue at:** https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues

### 3. **Suggest Models**

Know a great model that fits our criteria? Suggest it!

**Model Requirements:**
- ✅ Hosted on HuggingFace
- ✅ No waitlist or special approval required
- ✅ Works with vLLM (no exotic architectures)
- ✅ Fits in one of our tiers: 1B, 4B, 7B, or 15B
- ✅ Has clear chat template documentation
- ✅ Permissive license (MIT, Apache 2.0, etc.)

**How to suggest:**
1. Test the model yourself first
2. Document which chat template works
3. Note VRAM requirements
4. Create issue with `model-suggestion` label

### 4. **Improve Documentation**

Found something confusing? Help us clarify!

**Documentation needs:**
- Clearer installation steps
- More troubleshooting scenarios
- Screenshots/videos of setup process
- IDE-specific configuration guides
- Model comparison benchmarks

### 5. **Test Chat Templates**

This is a big one! We have 12 default models but limited testing.

**How to help:**
1. Launch a model: `./daily-bootstrap.sh qa`
2. Test with `./test-connection.sh 8500`
3. Try in Rider/your IDE
4. Report if responses are malformed or incorrect
5. Suggest template fixes in `chat-templates.conf`

---

## 🔧 Development Setup

### For Testing Changes:

```bash
# Fork the repository
git clone https://github.com/YOUR-USERNAME/vLLM-Bootstrap.git
cd vLLM-Bootstrap

# Make your changes to scripts

# Test in WSL
wsl
cd ~/.config/llm-doctrine
# Copy your modified scripts here
./initial-bootstrap.sh
```

### For Test Suite Development:

```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers
npm run install-playwright

# Run tests
npm test

# Run specific test
npm run test:journey
```

---

## 📝 Contribution Guidelines

### Code Style

**Bash Scripts:**
- Use 4-space indentation
- Add comments for complex logic
- Use descriptive variable names
- Include error handling
- Test on Ubuntu 22.04 WSL2

**TypeScript Tests:**
- Follow existing Playwright patterns
- Add descriptive test names
- Include error messages in assertions
- Test both success and failure cases

### Commit Messages

Use conventional commit format:

```
feat: Add support for AMD GPUs
fix: Correct chat template for Mistral models
docs: Clarify WSL installation steps
test: Add E2E test for model switching
chore: Update dependencies
```

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Test thoroughly** (see testing checklist below)
5. **Update documentation** if needed
6. **Commit with clear messages**
7. **Push to your fork**
8. **Create Pull Request** with:
   - Clear description of changes
   - Testing performed
   - Hardware/software tested on
   - Screenshots if UI-related
   - Link to related issues

### Testing Checklist

Before submitting PR, verify:

- [ ] `./initial-bootstrap.sh` runs without errors
- [ ] `./validate-config.sh` passes all checks
- [ ] At least one model launches successfully
- [ ] `./test-connection.sh` confirms model is responding
- [ ] No breaking changes to existing configs
- [ ] Documentation updated if behavior changed
- [ ] Tested on at least one GPU configuration

---

## 🎨 What We're Looking For

### High Priority:
- **Hardware validation** - Test on different GPUs
- **Bug fixes** - Especially for edge cases
- **Chat template corrections** - Fix models that don't respond correctly
- **WSL quirk documentation** - Help others avoid pitfalls
- **IDE integration guides** - VS Code, Cursor, etc.

### Medium Priority:
- **Model suggestions** - New models that fit our criteria
- **Performance optimizations** - Faster startup, better VRAM usage
- **Error message improvements** - Clearer, more actionable
- **Logging enhancements** - Better debugging info

### Lower Priority (But Welcome!):
- **New features** - Discuss in issue first
- **Alternative deployment methods** - Docker, systemd, etc.
- **Web UI** - Management interface
- **Monitoring tools** - Performance dashboards

---

## 🚫 What We're NOT Looking For

To keep the project focused and maintainable:

- ❌ Models requiring waitlists or special approval
- ❌ Models with restrictive licenses
- ❌ Complex RAG/routing systems (keep it simple)
- ❌ Cloud-based solutions (this is for local hosting)
- ❌ Non-Windows platforms (Linux/Mac have simpler setups)
- ❌ Massive refactors without discussion first

---

## 💬 Communication

### Where to Discuss:

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - General questions, ideas, show-and-tell
- **Pull Requests** - Code review, implementation details

### Response Times:

This is a side project, so please be patient:
- Issues: Typically responded to within 2-3 days
- PRs: Reviewed within a week
- Complex changes: May take longer for thorough review

---

## 🏆 Recognition

Contributors will be:
- Listed in CHANGELOG.md for their contributions
- Credited in release notes
- Added to README.md contributors section (if significant contribution)

---

## 📚 Resources

### Helpful Links:
- [vLLM Documentation](https://docs.vllm.ai/)
- [HuggingFace Model Hub](https://huggingface.co/models)
- [WSL Documentation](https://learn.microsoft.com/en-us/windows/wsl/)
- [Playwright Testing](https://playwright.dev/)

### Project Documentation:
- [README.md](README.md) - Quick start guide
- [Complete Setup Guide](docs/guides/complete-setup.md) - Comprehensive setup guide
- [Known Issues](docs/reference/known-issues.md) - Known problems and workarounds
- [Testing Guide](docs/reference/testing.md) - How to run tests
- [CHANGELOG.md](CHANGELOG.md) - Version history

---

## 🤝 Code of Conduct

### Be Respectful:
- This is a community project
- Be patient with beginners
- Provide constructive feedback
- Assume good intentions

### Be Helpful:
- Share your knowledge
- Document your findings
- Help others troubleshoot
- Celebrate successes

### Be Honest:
- Report real test results (good or bad)
- Admit when you don't know something
- Ask for help when stuck
- Give credit where due

---

## 🎯 Current Focus Areas (Alpha Release)

For the alpha release, we're prioritizing:

1. **Hardware Validation** - Does it work on your GPU?
2. **Chat Template Testing** - Do models respond correctly?
3. **WSL Quirks** - What unexpected issues arise?
4. **Documentation Gaps** - What's confusing or missing?
5. **Rider Integration** - Does it work smoothly with Rider?

If you can help with any of these, you're making a huge impact! 🚀

---

## 📧 Contact

- **Maintainer:** @jmeyer1980
- **Repository:** https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap
- **Issues:** https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues

---

**Thank you for contributing to vLLM-Doctrine!** 🙏

Every test, bug report, and suggestion helps make this tool better for the entire community.