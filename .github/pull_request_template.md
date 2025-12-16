## 📋 Change Classification

- [ ] **Test Changes** - Modifications to E2E tests or test infrastructure
- [ ] **Script Changes** - Updates to deployment or utility scripts
- [ ] **Documentation** - README, guides, or inline documentation updates
- [ ] **CI/CD Changes** - Workflow, automation, or build configuration
- [ ] **Configuration** - Model configs, Playwright settings, or environment setup
- [ ] **Other** - Please describe: _______________

## ✅ Validation Checklist

### For Test Changes
- [ ] All existing tests pass (`npm test`)
- [ ] New tests follow existing patterns and conventions
- [ ] Tests are properly isolated and don't depend on execution order
- [ ] Test timeouts are appropriate for the operations being tested
- [ ] Test descriptions clearly explain what is being validated

### For Script Changes
- [ ] Scripts work on both Windows (.bat) and Unix (.sh) platforms
- [ ] Error handling is robust and provides clear messages
- [ ] Scripts validate prerequisites before execution
- [ ] Documentation is updated to reflect script changes

### For Documentation Changes
- [ ] Links are valid and point to correct resources
- [ ] Code examples are tested and work as documented
- [ ] Markdown formatting is correct
- [ ] Documentation follows the project structure

### For All Changes
- [ ] CI workflows pass successfully
- [ ] No breaking changes (or clearly documented if unavoidable)
- [ ] Changes follow existing code style and conventions
- [ ] Commit messages are clear and descriptive

## 📝 Description

### What Changed

### Why

### How to Test

### Breaking Changes
(If none, write "None")

## 🎯 Related Issues

Closes #
Related to #

## 🧪 Testing Done

- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Cross-platform testing (if applicable)
- [ ] Tested with multiple models (if applicable)

## 📸 Screenshots/Examples

```
Example output or test results:
```

## 🌟 Additional Notes

---

**Reviewer Notes:**
- Documentation-only changes can typically be merged quickly
- Test changes require validation that they properly test the intended functionality
- Script changes should be tested on both Windows and Unix platforms
- CI/CD changes should be tested in a fork before merging