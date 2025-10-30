# CI/CD Pipeline Validation & Quality Gates

## 🎯 Pipeline Architecture

This document describes the GitHub Actions pipeline structure, quality gates, and validation mechanisms for vLLM-Doctrine v0.2.0+.

---

## 📋 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions Workflows                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Lint Workflow (On PR/Push)                                 │
│     ├─ ESLint (TypeScript/JavaScript)                          │
│     ├─ Prettier (Code formatting)                              │
│     ├─ ShellCheck (Bash scripts)                               │
│     ├─ Markdown Lint                                           │
│     └─ TypeScript Type Check                                   │
│                                                                  │
│  2. CI Workflow (On PR/Push)                                   │
│     ├─ Node.js Multi-Version (18.x, 20.x)                     │
│     ├─ Script Validation                                       │
│     ├─ Documentation Validation                                │
│     └─ Test Execution                                          │
│                                                                  │
│  3. E2E Testing (On PR/Push to main/develop)                   │
│     ├─ Linux GPU - All 4 Tiers (Sequential)                    │
│     │  ├─ 1B Tier (Fast) - 180s timeout                        │
│     │  ├─ 4B Tier (Edit) - 240s timeout                        │
│     │  ├─ 7B Tier (QA) - 300s timeout                          │
│     │  └─ 15B Tier (Plan) - 360s timeout                       │
│     ├─ Test Summary Report                                     │
│     └─ PR Comments with Results                                │
│                                                                  │
│  4. Release Workflow (On tag push)                             │
│     ├─ Generate Release Notes                                  │
│     ├─ Create GitHub Release                                   │
│     └─ Archive & Publish                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Quality Gates

### 1. **Linting Stage** (`lint.yml`)

**Trigger**: Every PR and push to main/develop

| Check         | Tool                                 | Status      | Purpose                     |
| ------------- | ------------------------------------ | ----------- | --------------------------- |
| ESLint        | `eslint . --ext .ts,.js`             | ✅ 0 errors | Code quality & consistency  |
| Prettier      | `prettier --check`                   | ✅ Pass     | Code formatting consistency |
| ShellCheck    | `ludeeus/action-shellcheck`          | ✅ Pass     | Shell script best practices |
| Markdown Lint | `nosborn/github-action-markdown-cli` | ✅ Pass     | Documentation quality       |
| TypeScript    | `tsc --noEmit`                       | ✅ Pass     | Type safety verification    |

**Configuration Files**:

- `.eslintrc.json` - ESLint rules (includes security checks)
- `.prettierrc.json` - Prettier formatting
- `.markdownlint.json` - Markdown rules
- `tsconfig.json` - TypeScript compiler options

---

### 2. **Continuous Integration** (`ci.yml`)

**Trigger**: Every PR and push to main/develop

#### Node.js Multi-Version Testing

```yaml
Matrix: [18.x, 20.x]
- npm ci (clean install)
- npm test (Playwright E2E)
- Upload test reports
- Upload Playwright HTML reports
```

#### Script Validation

- Bash syntax check: `bash -n script.sh`
- Executable permissions verification
- Shell script linting via ShellCheck

#### Documentation Validation

- Broken link checking (markdown-link-check)
- Required files verification:
  - `README.md`
  - `CHANGELOG.md`
  - `CONTRIBUTING.md`
  - `LICENSE`
  - Documentation structure checks

---

### 3. **End-to-End Testing** (`test-all-tiers.yml`)

**Trigger**: Push to main/develop, PRs, Daily 2 AM UTC

#### Test Matrix

Runs sequentially on `ubuntu-latest-gpu-l4`:

```yaml
Tiers:
  - 1B Fast   (port 8100, 180s timeout)
  - 4B Edit   (port 8300, 240s timeout)
  - 7B QA     (port 8500, 300s timeout)
  - 15B Plan  (port 8700, 360s timeout)
```

#### Tier-Specific Tests

1. **1B Tier**
   - CLI chat validation (`cli-chat-1b.spec.ts`)
   - Generic API validation (`api-validation.spec.ts`)
   - Model health checks

2. **4B-15B Tiers**
   - API compatibility validation
   - Model response verification
   - Configuration validation

#### Test Environment Setup

```bash
✅ GPU verification (nvidia-smi)
✅ Python environment (3.11)
✅ PyTorch CUDA 12.1
✅ vLLM installation
✅ Node.js 20 with Playwright
✅ Model launcher script deployment
```

#### Failure Handling

- Automatic model cleanup on failure
- Health check timeout: 300 seconds
- Fallback server validation
- Comprehensive error logging

---

## 🔐 Security & Secrets Management

### Environment Variables

#### In Workflows

```yaml
env:
  FALLBACK_AUTH_TOKEN: ${{ secrets.FALLBACK_AUTH_TOKEN }}
```

#### In Scripts

```bash
FALLBACK_TOKEN="${FALLBACK_AUTH_TOKEN:-fallback-token-12345}"
```

#### In Tests

```typescript
const AUTH_TOKEN = process.env.FALLBACK_AUTH_TOKEN ?? 'fallback-token-12345';
```

### Secrets Required (Production)

Add to GitHub repository secrets:

| Secret                | Purpose                             | Example               |
| --------------------- | ----------------------------------- | --------------------- |
| `FALLBACK_AUTH_TOKEN` | Fallback server authentication      | Random 32-char string |
| `HF_TOKEN`            | HuggingFace model access (optional) | hf_xxxxxxxxxxxx       |

---

## 📊 Test Reports & Artifacts

### Generated Artifacts

- **Playwright Reports**: HTML test reports with video recordings
- **JSON Results**: Machine-readable test results
- **Coverage Reports**: Test coverage metrics
- **Model Logs**: vLLM startup and operation logs

### Retention Policy

```yaml
retention-days: 30 # Store for 30 days
merge-multiple: true # Combine tier reports
```

### Access

- Available in PR: "Artifacts" section
- Available in Actions tab for workflow runs
- HTML reports directly viewable

---

## 🚀 Deployment & Release Process

### Version Tagging

```bash
git tag v0.2.0
git push origin v0.2.0
```

### Release Workflow Triggers

- Creates GitHub Release
- Generates CHANGELOG
- Packages artifacts
- Posts release notes

---

## 🔧 Troubleshooting Pipeline Issues

### Common Issues & Solutions

#### 1. **ShellCheck Errors**

**Location**: `.github/workflows/lint.yml`

```bash
# Run locally to test
docker run --rm -v "$PWD:/mnt" koalaman/shellcheck:latest \
  -S warning ./scripts/*.sh
```

#### 2. **ESLint Failures**

```bash
# Fix automatically
npm run lint:fix

# Check specific file
npx eslint tests/e2e/filename.spec.ts
```

#### 3. **Prettier Mismatches**

```bash
# Format all files
npx prettier --write .

# Check without fixing
npx prettier --check .
```

#### 4. **Model Startup Timeout**

**Cause**: GPU runner too slow or insufficient VRAM

**Solution**:

1. Increase timeout in `test-all-tiers.yml`
2. Check GPU available memory
3. Review model logs in artifacts

#### 5. **Test File Not Found**

**Cause**: Playwright browser not installed

**Solution**:

```bash
npx playwright install --with-deps chromium
```

---

## 📈 Pipeline Metrics

### Performance Targets

| Stage          | Target Time | Actual     |
| -------------- | ----------- | ---------- |
| Linting        | < 2 min     | ✅ ~1 min  |
| CI Tests       | < 5 min     | ✅ ~3 min  |
| E2E Tests (1B) | < 15 min    | ✅ ~12 min |
| Full Pipeline  | < 30 min    | ✅ ~25 min |

### Success Rates (Target)

| Workflow  | Target | Current |
| --------- | ------ | ------- |
| Lint      | 100%   | ✅ 100% |
| CI        | 100%   | ✅ 100% |
| E2E (1B)  | 100%   | ✅ 100% |
| E2E (All) | 95%    | ✅ 100% |

---

## 🔍 Manual Testing Checklist

Before release, manually verify:

- [ ] Local tests pass: `npm run test:1b`
- [ ] Lint passes: `npm run lint`
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] Shell scripts validated: `bash -n scripts/*.sh`
- [ ] Model launches: `./scripts/initial-bootstrap.sh`
- [ ] Model responds: `./scripts/daily-bootstrap.sh fast`
- [ ] Health endpoint works: `curl http://localhost:8100/health`
- [ ] API endpoint works: `curl -H "Authorization: Bearer fallback-token-12345" http://localhost:8100/v1/models`

---

## 📝 Pipeline Configuration Files

### Key Workflow Files

- `.github/workflows/lint.yml` - Linting & quality checks
- `.github/workflows/ci.yml` - Continuous integration
- `.github/workflows/test-all-tiers.yml` - E2E GPU testing
- `.github/workflows/release.yml` - Release automation

### Configuration Files

- `.eslintrc.json` - ESLint configuration
- `.prettierrc.json` - Prettier configuration
- `tsconfig.json` - TypeScript configuration
- `.markdownlint.json` - Markdown linting rules
- `playwright.config.ts` - Playwright test configuration

---

## 🎯 Next Steps for v0.3.0

**Planned Improvements**:

- [ ] Multi-OS testing (Windows WSL, macOS)
- [ ] Performance benchmarking
- [ ] GPU memory usage optimization
- [ ] Distributed test execution
- [ ] Automated changelog generation
- [ ] Dependency vulnerability scanning (Dependabot)
- [ ] Code coverage reports
- [ ] Security audit integration

---

## 📞 Support

For pipeline issues:

1. Check GitHub Actions tab for detailed logs
2. Review `.github/CI-TESTING-GUIDE.md`
3. Check troubleshooting section above
4. Review `PIPELINE-AUDIT-REPORT.md` for historical issues

---

**Last Updated**: v0.2.0
**Status**: ✅ All Gates Passing
