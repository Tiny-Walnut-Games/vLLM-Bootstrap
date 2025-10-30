# vLLM-Bootstrap Documentation Plan

## Customer-Facing Documentation for GitHub Wiki & GitBook

**Plan Date**: 2025-10-29  
**Status**: Ready for Implementation  
**Alignment**: Scrollkeeper Doctrine

---

## 🎯 Guiding Principles

### Scrollkeeper Doctrine Compliance

1. **No Premature Celebration**: Only document what passes tests
2. **Mental Model Verification**: Align docs with actual implementation
3. **Zero-to-Completion**: New user can follow and succeed without prior context
4. **Accessibility**: Clear for neurodivergent navigation
5. **Truth Over Aspiration**: Current status, not future plans

### Current Project Status

**What Works (Proven by Tests)**:

- ✅ WSL installation and setup
- ✅ Python environment creation
- ✅ vLLM model launching via `initial-bootstrap.sh` and `daily-bootstrap.sh`
- ✅ OpenAI-compatible API serving on localhost
- ✅ CLI chat via curl commands
- ✅ 1B tier model testing (RTX 2060 compatible)
- ✅ Health checks and connection validation

**What Doesn't Exist Yet**:

- ❌ IDE chat templates (model-specific, unverified)
- ❌ Rider/VS Code chat integration (depends on templates)
- ❌ Multi-turn IDE conversations (requires templates)

**Documentation Scope**: Zero to CLI Chat ONLY (no IDE integration yet)

---

## 📚 Documentation Structure

### Part 1: GitHub Wiki (Public, Customer-Facing)

#### Home Page

- **Filename**: `Home.md`
- **Purpose**: Landing page, project overview
- **Content**:
  - What is vLLM-Bootstrap
  - Current capabilities (CLI chat)
  - System requirements
  - Quick navigation to other pages

#### Getting Started

- **Filename**: `Getting-Started.md`
- **Purpose**: Zero-to-CLI-chat in 30 minutes
- **Content**:
  - Prerequisites check
  - WSL installation (step-by-step)
  - HuggingFace account setup
  - Running first model
  - Testing CLI chat with curl

#### Installation Guide

- **Filename**: `Installation-Guide.md`
- **Purpose**: Detailed installation walkthrough
- **Content**:
  - System requirements (verified minimums)
  - WSL setup (Windows-specific)
  - Linux native setup
  - Python environment setup
  - Dependency installation
  - Troubleshooting common issues

#### Model Configuration

- **Filename**: `Model-Configuration.md`
- **Purpose**: Understanding and configuring models
- **Content**:
  - Model tiers (1B, 4B, 7B, 15B)
  - Port assignments
  - VRAM requirements (tested)
  - Switching models
  - Model preloading

#### CLI Usage

- **Filename**: `CLI-Usage.md`
- **Purpose**: Using models via command line
- **Content**:
  - Launching models by tier
  - Chat via curl (with examples)
  - Health checks
  - Log monitoring
  - Stopping models

#### Testing Your Installation

- **Filename**: `Testing-Guide.md`
- **Purpose**: Validate installation with test suite
- **Content**:
  - Test infrastructure overview
  - Running 1B tier tests
  - Understanding test results
  - Troubleshooting test failures

#### Troubleshooting

- **Filename**: `Troubleshooting.md`
- **Purpose**: Common issues and solutions
- **Content**:
  - WSL networking issues
  - CUDA/GPU problems
  - Model loading failures
  - Port conflicts
  - Authentication errors

#### FAQ

- **Filename**: `FAQ.md`
- **Purpose**: Frequently asked questions
- **Content**:
  - Can I use CPU only? (Yes, but slower)
  - How much VRAM do I need? (8GB minimum)
  - Can I run multiple models? (Yes, with 16GB+ VRAM)
  - Do I need internet after setup? (Only for model downloads)
  - What about IDE integration? (Not yet implemented)

---

### Part 2: GitBook Structure (Same Content, Different Format)

#### Book Structure

```
vLLM-Bootstrap/
├── Introduction
│   ├── Overview
│   ├── What You'll Learn
│   └── Prerequisites
├── Getting Started
│   ├── System Setup
│   ├── WSL Installation
│   └── HuggingFace Setup
├── Installation
│   ├── Quick Install
│   ├── Detailed Steps
│   └── Verification
├── Using vLLM-Bootstrap
│   ├── Launching Models
│   ├── CLI Chat
│   └── Model Configuration
├── Testing
│   ├── Running Tests
│   ├── Test Results
│   └── Continuous Integration
├── Troubleshooting
│   ├── Common Issues
│   ├── WSL Problems
│   └── GPU/CUDA Issues
└── Reference
    ├── Model Tiers
    ├── Port Ranges
    └── Command Reference
```

---

## 📝 Content Guidelines

### Writing Style

- **Imperative, direct instructions**: "Run this command" not "You should run"
- **Short sentences**: Max 20 words per sentence
- **Code-first examples**: Show, then explain
- **Progressive disclosure**: Basic → Advanced
- **No jargon without definition**

### Code Block Standards

```bash
# Always include:
# 1. Prompt indicator ($ for user, # for comment)
# 2. Expected output
# 3. What success looks like

$ ./daily-bootstrap.sh qa
🚀 Launching qa tier (Mistral-7B) on port 8500...
✅ Model loaded successfully
```

### Verification Points

Every major step includes:

1. **Command to run**
2. **Expected output**
3. **How to verify success**
4. **What to do if it fails**

### Screenshots/Diagrams

- **Diagrams**: ASCII art or mermaid.js (text-based)
- **No screenshots**: Breaks accessibility, hard to maintain
- **Alternative**: Detailed text descriptions of UI steps

---

## 🚀 Implementation Order

    ### Phase 1: Core Documentation (Week 1)

1. `Home.md` - Landing page
2. `Getting-Started.md` - Zero to CLI chat
3. `Installation-Guide.md` - Detailed setup
4. `CLI-Usage.md` - Using the system

   ### Phase 2: Advanced Topics (Week 2)

5. `Model-Configuration.md` - Model management
6. `Testing-Guide.md` - Test suite usage
7. `Troubleshooting.md` - Problem solving

   ### Phase 3: Reference & Polish (Week 3)

8. `FAQ.md` - Common questions
9. GitBook conversion
10. Internal review and validation

---

## ✅ Success Criteria

### For Each Document

- [ ] A new user with NO context can follow it
- [ ] Every command is copy-pasteable
- [ ] Every claim is verified by tests
- [ ] No aspirational language ("will support", "coming soon")
- [ ] Includes troubleshooting for common failures
- [ ] Accessible to neurodivergent readers (clear structure, no ambiguity)

### For Overall Documentation

- [ ] User can go from zero to CLI chat in 30 minutes
- [ ] Every documented feature has passing tests
- [ ] No false celebrations or unverified claims
- [ ] Clear separation: "What works now" vs "Not yet implemented"
- [ ] GitHub Wiki published and navigable
- [ ] GitBook structure ready for publication

---

## 📋 Documentation Maintenance

### Update Triggers

- New feature passes tests → Update docs
- Test coverage expands → Update capabilities
- Bug fixed → Update troubleshooting
- User reports confusion → Improve clarity

### Version Alignment

- Documentation version matches `doctrine-version` in scripts
- Changelog tracks doc updates
- Archive old docs before major rewrites

### Community Feedback

- GitHub Issues for doc improvements
- Discussion board for questions
- Pull requests for corrections

---

## 🎓 Next Steps

1. **Review and Approve** this plan
2. **Implement Phase 1** (Core Documentation)
3. **Test with Fresh User** (zero-context validation)
4. **Iterate Based on Feedback**
5. **Publish to GitHub Wiki**
6. **Prepare GitBook Version**

---

_This plan adheres to Scrollkeeper Doctrine: celebrating only what is proven, ensuring reproducibility, and honoring the mental model of users navigating from zero context._
