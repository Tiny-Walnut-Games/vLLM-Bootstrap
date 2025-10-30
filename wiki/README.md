# vLLM-Bootstrap Documentation

**Customer-facing documentation for running local LLMs**

**Documentation Version**: 2025-10-29  
**Project Version**: 0.2.0-alpha  
**Doctrine Alignment**: Scrollkeeper Compliant

---

## 📚 Documentation Structure

### Getting Started (New Users)

1. **[Home](Home.md)** - Project overview and quick start
2. **[Getting Started](Getting-Started.md)** - Zero to CLI chat in 30 minutes
3. **[Installation Guide](Installation-Guide.md)** - Detailed setup walkthrough

### Using vLLM-Bootstrap

4. **[CLI Usage](CLI-Usage.md)** - Chat with models via command line
5. **[Model Configuration](Model-Configuration.md)** - Configure and manage models
6. **[Testing Guide](Testing-Guide.md)** - Validate your installation

### Getting Help

7. **[Troubleshooting](Troubleshooting.md)** - Common problems and solutions
8. **[FAQ](FAQ.md)** - Frequently asked questions

---

## 🎯 What This Documentation Covers

### ✅ Proven and Documented

- WSL installation and setup (Windows)
- Python environment creation
- Model launching via scripts
- CLI chat using curl commands
- OpenAI-compatible API usage
- Testing with Playwright (1B tier)
- Health checks and validation

### ❌ Not Yet Implemented

- IDE chat templates (model-specific)
- Rider/VS Code integration
- Multi-turn IDE conversations
- Chat UI interface

**Scope**: This documentation covers **zero-to-CLI-chat only**. IDE integration documentation will come after chat templates are implemented and verified.

---

## 📖 Documentation Principles

This documentation follows **Scrollkeeper Doctrine**:

1. **No Premature Celebration**: Only documented features that pass tests
2. **Mental Model Verification**: Docs align with actual implementation
3. **Zero-to-Completion Navigator**: New users can follow without prior context
4. **Accessibility**: Clear structure for neurodivergent readers
5. **Truth Over Aspiration**: Current status, not future plans

---

## 🚀 Quick Navigation

### I want to...

**...get started quickly** → [Getting Started Guide](Getting-Started.md)  
**...understand installation in detail** → [Installation Guide](Installation-Guide.md)  
**...learn how to use CLI chat** → [CLI Usage Guide](CLI-Usage.md)  
**...change or configure models** → [Model Configuration](Model-Configuration.md)  
**...test my installation** → [Testing Guide](Testing-Guide.md)  
**...solve a problem** → [Troubleshooting](Troubleshooting.md)  
**...find quick answers** → [FAQ](FAQ.md)

---

## 📊 Documentation Formats

### GitHub Wiki

Primary documentation hosted on GitHub Wiki for easy community editing and access.

**URL**: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/wiki

### GitBook (Future)

Same content formatted for GitBook publication.

**Status**: Documentation structure complete in wiki format (coming soon)

### Markdown Files

All documentation available as standalone markdown files in `wiki/` directory for offline reading.

---

## 📝 Documentation Maintenance

### Versioning

- Documentation version tracks major updates
- Aligned with `doctrine-version` in scripts
- Archived when major rewrites occur

### Archive

Previous documentation versions archived in:

```
docs-archive/YYYY-MM-DD_HHMMSS/
```

Current archive: `docs-archive/2025-10-29_114041/`

### Updates

Documentation is updated when:

- New features pass tests
- User feedback identifies confusion
- Bugs are fixed and require doc changes
- Project status changes

---

## 🤝 Contributing to Documentation

Found an error? Want to improve clarity?

1. **Small fixes**: Edit directly on GitHub Wiki
2. **Large changes**: Submit pull request with markdown file edits
3. **Suggestions**: Open GitHub Discussion

**Guidelines**:

- Write in imperative, direct style
- Include code examples with expected output
- Add verification steps for each instruction
- Maintain Scrollkeeper principles (no false celebration)
- Test instructions with fresh setup before documenting

---

## 🔄 Migration from Old Docs

### What Changed?

- Removed aspirational claims (IDE integration "complete")
- Focused on proven capabilities (CLI chat works)
- Clearer separation of setup vs. usage vs. testing
- More troubleshooting coverage
- Better accessibility (clearer structure, no jargon)

### Old Documentation

Archived in: `docs-archive/2025-10-29_114041/`

**Includes**:

- Previous README.md
- Old docs/ directory structure
- Historical guides and references

---

## 📞 Getting Help

**Documentation issues**:

- GitHub Issues: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues
- Label: `documentation`

**Questions**:

- GitHub Issues: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues (with `question` label)

**Bug reports** (not doc-related):

- GitHub Issues: https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues
- Label: `bug`

---

## 📄 License

Documentation is part of vLLM-Bootstrap project:

**License**: MIT  
**Copyright**: 2025 Jerimiah Michael Meyer (@jmeyer1980)

---

**Start Reading** → [Home](Home.md) | [Getting Started](Getting-Started.md)
