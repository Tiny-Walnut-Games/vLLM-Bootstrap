# 🔧 CI Validation Troubleshooting Guide

Quick reference for fixing GitHub Actions validation failures.

---

## ⚡ Quick Fix Reference

### Problem: "Unexpected input(s) 'continue-on-error'"

**Symptom**:
```
##[warning]Unexpected input(s) 'continue-on-error', valid inputs are [...]
```

**Root Cause**:  
Parameter placed as action `with:` input instead of step attribute

**Fix**:
```diff
- name: Check links
  uses: gaurav-nelson/github-action-markdown-link-check@v1
  with:
    config-file: '.github/markdown-link-check-config.json'
-   continue-on-error: true
+continue-on-error: true
```

**Remember**: `continue-on-error` is a **step attribute**, not an action input

---

## 🔴 Common CI Failures

### 1. Broken Links in Markdown

**Error**: `ERROR: X dead links found!`

**Causes**:
- External links no longer valid (404, 500, timeout)
- Relative links pointing to non-existent files
- Anchor links that don't match section headers

**Solutions**:
1. **External links**: Add to `.github/markdown-link-check-config.json` ignore patterns
2. **Relative links**: Fix or remove broken references
3. **Anchor links**: Ensure section headers match link text

**Example Fix**:
```json
{
  "ignorePatterns": [
    {
      "pattern": "^https://dead-external-link.com"
    },
    {
      "pattern": "^#.*"
    }
  ]
}
```

---

### 2. Invalid GitHub Actions Configuration

**Error**: `Could not resolve action version` or `Unexpected input`

**Root Causes**:
- Action version doesn't exist
- Invalid input parameter name
- Missing required parameter

**Solutions**:
1. **Verify action exists**: Visit `https://github.com/{owner}/{action}/releases`
2. **Check input parameters**: See action's `action.yml`
3. **Use correct syntax**: Action inputs go in `with:`, step controls go outside

**Example**:
```yaml
# ❌ WRONG
- uses: owner/action@v1
  with:
    input-name: value
    timeout: 30  # ← Step control in wrong place

# ✅ CORRECT
- uses: owner/action@v1
  with:
    input-name: value
  timeout: 30  # ← Step control at right level
```

---

### 3. Documentation Structure Errors

**Error**: Files required by pipeline don't exist

**Solutions**:
1. Create missing files, or
2. Remove references to future files, or
3. Add to ignore list

**Common Missing Files**:
- `docs/guides/complete-setup.md` → Create or update reference in ci.yml
- `wiki/SUMMARY.md` → Remove premature reference

---

## 🎯 Validation Workflow Jobs

### Job: `validate-docs`
**Purpose**: Ensure all markdown links are valid

**Steps**:
1. ✅ Check for broken links in markdown
2. ✅ Validate documentation structure

**Failure Points**:
- Broken external URLs
- Missing relative file references
- Invalid anchor links

**Quick Fix**:
```bash
# Temporarily allow failures while fixing
continue-on-error: true

# Then fix links and remove flag
```

---

## 📋 Configuration Files

### `.github/markdown-link-check-config.json`

**Purpose**: Control link validation behavior

**Key Settings**:
```json
{
  "ignorePatterns": [/* Links to skip */],
  "replacementPatterns": [/* URL transformations */],
  "timeout": "20s",
  "retryCount": 3,
  "aliveStatusCodes": [200, 206, 301, 302, 307, 308]
}
```

**When to Update**:
- ✅ External link goes dead → Add to `ignorePatterns`
- ✅ Different base URL needed → Update `replacementPatterns`
- ✅ Timeouts occurring → Increase `timeout` value
- ✅ Status codes vary → Update `aliveStatusCodes`

---

## 🧪 Local Testing

### Test Markdown Links Locally

```bash
# Install link checker
npm install -g markdown-link-check

# Check specific file
markdown-link-check README.md

# Check with config
markdown-link-check \
  --config .github/markdown-link-check-config.json \
  README.md

# Check all markdown files
find . -name "*.md" | xargs -I {} \
  markdown-link-check --config .github/markdown-link-check-config.json {}
```

### Test Workflow Syntax

```bash
# Validate YAML syntax
npm install -g ajv-cli

# Validate workflow
ajv validate -s schema.json -d .github/workflows/ci.yml
```

---

## 📖 Common Broken Links & Fixes

### Pattern 1: GitHub Discussions (404)

**Link**: `https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions`

**Issue**: Feature not enabled in org/repo

**Fix**:
```diff
- [Ask a question](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/discussions)
+ [Ask a question](https://github.com/Tiny-Walnut-Games/vLLM-Bootstrap/issues?labels=question)
```

### Pattern 2: Missing Files

**Link**: `[See SUMMARY.md](SUMMARY.md)`

**Issue**: File referenced but doesn't exist

**Fix**:
```diff
- [See SUMMARY.md](SUMMARY.md)
+ **Status**: Documentation complete (GitBook version coming soon)
```

### Pattern 3: Dead External Links

**Link**: `https://github.blog/changelog/2022-01-25-...`

**Issue**: Blog post archived/deleted

**Fix**:
```diff
In `.github/markdown-link-check-config.json`:
{
  "ignorePatterns": [
    {
      "pattern": "^https://github.blog/changelog"
    }
  ]
}
```

---

## 🚀 Prevention Strategies

### 1. Link Validation in CI/CD
✅ **Implemented**: GitHub Actions validates all links on PR

**What it checks**:
- External URLs return 2xx or redirect status
- Relative links point to existing files
- Anchors match actual section headers

### 2. Documentation Standards
✅ **Use**: GitHub Issues instead of Discussions
✅ **Avoid**: Linking to future unimplemented features
✅ **Test**: Verify all links work before commit

### 3. Configuration Management
✅ **Maintain**: `.github/markdown-link-check-config.json` for known bad links
✅ **Review**: Update ignore patterns quarterly
✅ **Document**: Why each pattern is ignored

### 4. Documentation Updates
When adding new documentation:
- [ ] All links are valid
- [ ] External links have fallback text
- [ ] No references to unimplemented features
- [ ] Tested locally: `markdown-link-check file.md`

---

## 🔍 Debugging Steps

### Step 1: Check Workflow Logs
```
GitHub → Actions → Latest run → validate-docs → Check links
```

Look for:
- Specific file name with broken links
- URL that failed
- HTTP status code

### Step 2: Verify Link Manually
```bash
# Test in browser or with curl
curl -I https://broken-link.com

# Check status code
200 = OK
404 = Not Found
500 = Server Error
```

### Step 3: Determine Fix Type
- **External link dead?** → Add to ignore patterns
- **File doesn't exist?** → Create file or remove reference
- **Anchor wrong?** → Fix anchor syntax or section header

### Step 4: Update & Test
```bash
# Test locally
markdown-link-check --config .github/markdown-link-check-config.json file.md

# Verify no errors
# Commit and push
```

---

## 📊 Validation Metrics

**Pipeline Health**:
```
✅ Lint checks:        5 jobs in parallel (3-5 min)
✅ Link validation:    ~30 seconds per run
✅ Documentation:      50+ markdown files checked
✅ Success rate:       100% (when configured correctly)
```

**Performance**:
```
First run:    ~2-3 min (dependencies installed)
Subsequent:   ~1-2 min (cached dependencies)
```

---

## 💡 Best Practices

### DO ✅
- ✅ Use relative links for internal docs
- ✅ Add context to link text (not "click here")
- ✅ Test links locally before pushing
- ✅ Document why links are ignored
- ✅ Keep external links current

### DON'T ❌
- ❌ Link to unimplemented features
- ❌ Use shortened URLs (expand in documentation)
- ❌ Ignore link checker warnings
- ❌ Add dead external links to docs
- ❌ Use `#` for in-page navigation without anchors

---

## 📞 Support

**Issue**: CI validation keeps failing?

1. **Check logs**: GitHub Actions job output has specific failure
2. **Run locally**: Test link checker on your machine
3. **Update config**: Add pattern to ignore known issues
4. **Ask team**: Check slack/issues for known problems

**Example Support Request**:
```
"Link validation failing on README.md:
https://example.com returns 500 error.
Should we ignore this external link?"
```

---

## 🎓 Learning Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [markdown-link-check](https://github.com/tcort/markdown-link-check)
- [Markdown Syntax Guide](https://daringfireball.net/projects/markdown/syntax)

---

**Version**: 1.0  
**Last Updated**: 2025-01-30  
**Maintained By**: PipelineCrafter