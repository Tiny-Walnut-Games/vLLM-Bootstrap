# Alpha Release Preparation

**Date:** 2025-01-11  
**Version:** 0.1.0-alpha

## Changes Made

### Version Alignment

- Updated version references to `0.1.0-alpha` in README.md, package.json, and CHANGELOG.md

### Badge Corrections

- Fixed repository URLs in badges from `jmeyer1980/vLLM-Doctrine` to `Tiny-Walnut-Games/vLLM-Bootstrap`
- Removed "Production Ready" badge
- Added alpha status badges

### Documentation Updates

- Added alpha status warning section to README
- Updated testing status table to reflect actual test coverage
- Expanded contributing section with specific testing needs

### New Documentation Files

**KNOWN-ISSUES.md**

- WSL C: drive space limitations with 3 workarounds
- Chat template compatibility notes
- Windows Firewall configuration
- VRAM estimation approach
- Testing gaps documentation
- Diagnostic commands
- KVM user tips

**CONTRIBUTING.md**

- Hardware testing guidelines
- Bug reporting process
- Model suggestion criteria
- Development setup instructions
- Code style guidelines

**RELEASE-NOTES-v0.1.0-alpha.md**

- Alpha release announcement
- Quick start instructions
- Testing checklist
- Known issues summary

**ALPHA-RELEASE-CHECKLIST.md**

- Release process steps
- GitHub setup tasks
- Announcement templates
- Success metrics

## Files Modified

- README.md: Alpha warning, badges, documentation links, testing table, footer
- package.json: Version update
- CHANGELOG.md: Alpha entry, updated v2025.10.10 description

## Technical Notes

### Testing Status

- Single hardware configuration tested (developer's system)
- Limited chat template validation
- No multi-GPU testing
- No AMD GPU testing

### Known Limitations

- Conservative VRAM estimates
- WSL C: drive space constraints
- Untested on diverse hardware configurations

## Next Actions

- Commit changes
- Create GitHub release (v0.1.0-alpha, pre-release)
- Set up issue tracking
- Community announcement
