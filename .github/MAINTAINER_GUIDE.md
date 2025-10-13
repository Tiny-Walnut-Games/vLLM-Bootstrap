# 🛠️ Maintainer Guide

This guide helps maintainers manage the vLLM-Doctrine project effectively using the community infrastructure.

---

## 📋 Quick Reference

### Issue Management

**Triage New Issues:**
1. Apply appropriate labels (`bug`, `enhancement`, `question`, `documentation`)
2. Assign to milestone if it fits current roadmap
3. Add `good-first-issue` for beginner-friendly tasks
4. Add `help-wanted` for community contributions
5. Close duplicates with reference to original issue

**Priority Labels:**
- `priority:critical` - Blocks usage, needs immediate attention
- `priority:high` - Important but has workarounds
- `priority:medium` - Should be addressed soon
- `priority:low` - Nice to have

**Status Labels:**
- `status:needs-info` - Waiting for reporter response
- `status:confirmed` - Bug reproduced or feature approved
- `status:in-progress` - Someone is actively working on it
- `status:blocked` - Waiting on external dependency

---

## 🎯 Milestone Management

### Creating Milestones

Follow [MILESTONES.md](../MILESTONES.md) for milestone definitions.

**In GitHub:**
1. Go to **Issues → Milestones → New Milestone**
2. Use the title from MILESTONES.md (e.g., "v0.2.0-alpha")
3. Set due date (if applicable)
4. Add description with key deliverables
5. Link to ROADMAP.md section

### Managing Milestones

**Weekly Review:**
- Check progress on current milestone
- Update issue assignments
- Adjust scope if needed
- Communicate blockers

**Monthly Review:**
- Evaluate if milestone is on track
- Consider moving non-critical issues to next milestone
- Update ROADMAP.md if priorities change

**Milestone Completion:**
1. Verify all exit criteria met (see ROADMAP.md)
2. Close milestone in GitHub
3. Update CHANGELOG.md
4. Create release (see Release Process below)
5. Update ROADMAP.md status

---

## 🚀 Release Process

### Pre-Release Checklist

- [ ] All milestone issues closed or moved
- [ ] CI/CD workflows passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated with release notes
- [ ] Version bumped in package.json
- [ ] All tests passing

### Creating a Release

**1. Prepare Release Branch:**
```bash
git checkout main
git pull origin main
git checkout -b release/v0.2.0-alpha
```

**2. Update Version:**
```bash
# Update package.json version
npm version 0.2.0-alpha --no-git-tag-version

# Update README.md version references
# Update CHANGELOG.md with release date
```

**3. Commit and Tag:**
```bash
git add .
git commit -m "chore: Prepare v0.2.0-alpha release"
git push origin release/v0.2.0-alpha

# Create PR to main
# After merge, tag the release
git checkout main
git pull origin main
git tag -a v0.2.0-alpha -m "Release v0.2.0-alpha"
git push origin v0.2.0-alpha
```

**4. GitHub Release:**
- Release workflow will auto-create GitHub Release
- Review and edit release notes
- Mark as pre-release if alpha/beta/rc
- Publish release

**5. Post-Release:**
- Close milestone
- Update project board
- Announce in Discussions
- Tweet/share if appropriate

---

## 💬 Discussion Management

### Categories

**General:**
- General questions and discussions
- Community chat
- Project updates

**Ideas:**
- Feature brainstorming
- Architecture discussions
- Long-term planning

**Show and Tell:**
- User showcases
- Configuration sharing
- Success stories

**Q&A:**
- Technical questions
- Troubleshooting help
- Best practices

### Moderation

**Encourage:**
- Detailed problem descriptions
- Sharing configurations and logs
- Helping other users
- Constructive feedback

**Discourage:**
- Duplicate questions (link to existing)
- Off-topic discussions
- Demands without context
- Unconstructive criticism

**Convert to Issues:**
- Clear bug reports → Bug issue
- Well-defined features → Feature request
- Documentation gaps → Documentation issue

---

## 🏷️ Label System

### Standard Labels

**Type:**
- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation improvements
- `question` - Further information requested
- `discussion` - Needs community input

**Priority:**
- `priority:critical` - Immediate attention needed
- `priority:high` - Important, schedule soon
- `priority:medium` - Normal priority
- `priority:low` - Nice to have

**Status:**
- `status:needs-info` - Waiting for more information
- `status:confirmed` - Verified and ready to work on
- `status:in-progress` - Actively being worked on
- `status:blocked` - Waiting on dependency
- `status:wontfix` - Won't be addressed (explain why)

**Difficulty:**
- `good-first-issue` - Good for newcomers
- `help-wanted` - Community contributions welcome
- `advanced` - Requires deep knowledge

**Area:**
- `area:testing` - Test suite related
- `area:scripts` - Deployment scripts
- `area:docs` - Documentation
- `area:ci-cd` - CI/CD workflows
- `area:models` - Model configurations

---

## 🤝 Community Engagement

### Weekly Tasks

**Monday:**
- Review new issues from weekend
- Triage and label
- Respond to urgent questions

**Wednesday:**
- Check PR status
- Review milestone progress
- Update project board

**Friday:**
- Community engagement (Discussions)
- Plan next week's focus
- Update roadmap if needed

### Monthly Tasks

**First Week:**
- Milestone review and planning
- Roadmap updates
- Community feedback review

**Mid-Month:**
- Documentation review
- Test coverage check
- Dependency updates

**End of Month:**
- Monthly progress report (Discussion post)
- Contributor recognition
- Next month planning

---

## 📊 Metrics to Track

### Health Indicators

**Good Signs:**
- More feature requests than bugs
- Active community discussions
- Regular contributions
- Positive feedback

**Warning Signs:**
- Increasing bug backlog
- Stale issues/PRs
- Declining engagement
- Negative sentiment

### Key Metrics

**Weekly:**
- New issues opened
- Issues closed
- PR merge rate
- Discussion activity

**Monthly:**
- Stars/forks growth
- Contributor count
- Test coverage
- Documentation completeness

**Quarterly:**
- Milestone completion rate
- Community growth
- Project velocity
- User satisfaction

---

## 🔧 Automation

### GitHub Actions

**CI Workflow:**
- Runs on every push/PR
- Tests across Node.js versions
- Validates scripts and docs
- Reports test coverage

**Lint Workflow:**
- Code quality checks
- Documentation linting
- Shell script validation
- TypeScript type checking

**Release Workflow:**
- Triggered by version tags
- Creates GitHub Release
- Uploads artifacts
- Posts announcement

### Dependabot

**Configuration:**
- Weekly dependency updates
- Auto-merge for patch versions
- Manual review for major versions
- Security updates prioritized

---

## 📝 Documentation Maintenance

### Regular Reviews

**Monthly:**
- Check for outdated information
- Update screenshots if UI changed
- Verify all links work
- Test code examples

**Per Release:**
- Update version references
- Add new features to docs
- Update troubleshooting guide
- Refresh getting started guide

### Documentation Standards

**All Docs Should Have:**
- Clear title and purpose
- Table of contents (if >3 sections)
- Code examples that work
- Last updated date
- Links to related docs

**Writing Style:**
- Clear and concise
- Beginner-friendly
- Step-by-step instructions
- Troubleshooting sections
- Real-world examples

---

## 🎓 Onboarding New Maintainers

### First Week

1. **Repository Access:**
   - Add as collaborator
   - Grant appropriate permissions
   - Add to team discussions

2. **Documentation Review:**
   - Read CONTRIBUTING.md
   - Review ROADMAP.md
   - Understand MILESTONES.md
   - Study this guide

3. **Shadow Activities:**
   - Observe issue triage
   - Watch PR reviews
   - Join planning discussions

### First Month

1. **Start Contributing:**
   - Triage issues
   - Review PRs
   - Answer questions
   - Update documentation

2. **Learn Workflows:**
   - Release process
   - Milestone management
   - Community engagement
   - Automation tools

3. **Build Relationships:**
   - Engage with community
   - Collaborate with other maintainers
   - Understand project vision

---

## 🚨 Handling Issues

### Security Issues

**DO NOT discuss publicly!**

1. Ask reporter to email privately
2. Assess severity
3. Develop fix privately
4. Coordinate disclosure
5. Release security update
6. Publish advisory

### Controversial Issues

1. **Stay Neutral:** Don't take sides
2. **Gather Input:** Ask community for feedback
3. **Document Reasoning:** Explain decisions clearly
4. **Be Respectful:** Acknowledge all viewpoints
5. **Make Decision:** Based on project goals
6. **Communicate:** Explain outcome transparently

### Stale Issues

**After 30 days of inactivity:**
1. Add `status:needs-info` label
2. Comment asking for update
3. Wait 14 days
4. Close with explanation
5. Note: Can be reopened if needed

---

## 📞 Communication

### Tone and Style

**Be:**
- Professional but friendly
- Patient and understanding
- Clear and concise
- Encouraging and supportive

**Avoid:**
- Jargon without explanation
- Dismissive responses
- Assumptions about knowledge
- Passive-aggressive tone

### Response Templates

**Bug Report Acknowledgment:**
```markdown
Thanks for reporting this! I'll investigate and get back to you soon.

In the meantime, could you provide:
- Output from `./validate-config.sh`
- Relevant log excerpts
- Your hardware specs

This will help me reproduce and fix the issue faster.
```

**Feature Request Response:**
```markdown
Interesting idea! This aligns with our roadmap for [milestone].

I've added this to the [milestone] for consideration. 
Community feedback is welcome - if others find this useful, 
please 👍 this issue!
```

**Closing Stale Issue:**
```markdown
I'm closing this due to inactivity, but feel free to reopen 
if you're still experiencing this issue. Please include the 
requested information when reopening.

Thanks for your report!
```

---

## 🎯 Project Vision

Always keep these principles in mind:

1. **User-Focused:** Make local LLM deployment accessible
2. **Quality Over Speed:** Ship when ready, not by deadline
3. **Community-Driven:** Listen to and empower users
4. **Well-Documented:** Clear docs are as important as code
5. **Sustainable:** Build for long-term maintenance

---

## 📚 Resources

### Internal
- [ROADMAP.md](../ROADMAP.md)
- [MILESTONES.md](../MILESTONES.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [CHANGELOG.md](../CHANGELOG.md)

### External
- [GitHub Docs - Managing Issues](https://docs.github.com/en/issues)
- [GitHub Docs - Managing Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Questions?** Open a discussion or reach out to @jmeyer1980

**Last Updated:** January 2025  
**Next Review:** Quarterly