# Documentation Naming Convention & Organization Guide

**Purpose:** Prevent documentation bloat by establishing clear guidelines for when to create files and how to name them.

## 📁 File Naming Convention

### Core Documentation (Keep in `/docs/` root)
**Pattern:** `DESCRIPTIVE_NAME.md` (no dates, no status prefixes)
- `skill-sync-technical-architecture.md`
- `AUTHENTICATION_ARCHITECTURE.md`
- `SPRINT_ROADMAP.md`
- `HDO_PIVOT_IMPLEMENTATION_PLAN.md`

### Temporary Documentation (Create in `/docs/archive/[year]-temp-docs/`)
**Pattern:** Include dates and status when time-sensitive
- `PROJECT_STATUS_2025-10-03.md`
- `DEPLOYMENT_BLOCKERS_2025-10-02.md`
- `FEATURE_COMPLETION_SUMMARY_2025-09-30.md`

### Feature Documentation (`/docs/features/`)
**Pattern:** `feature-description.md` or `FEATURE_NAME.md`
- `assessment-proficiency-engine.md`
- `skills_taxonomy_api_integration_plan.md`
- `user-roles-implementation-plan.md`

## 📋 When to Create Documentation

### ✅ ALWAYS Create Core Docs For:
- System architecture decisions
- API integration specifications
- Database schema changes
- Authentication/auth system changes
- Major feature architectures
- Business logic implementations
- Skills system changes

### ✅ Create Temporary Docs For:
- Bug investigations (move to archive after fix)
- Implementation status updates (archive after completion)
- Sprint planning documents (archive after sprint)
- Demo preparation materials (archive after demo)
- Blocker documentation (archive after resolution)

### ❌ NEVER Create Docs For:
- Daily standup notes
- Minor bug fixes (document in commit messages)
- Code review feedback (use GitHub PR comments)
- Personal TODO lists (use project management tools)

## 🔄 Documentation Lifecycle

### Core Docs:
1. **Create** in `/docs/` root with descriptive names
2. **Update** after major changes (MANDATORY)
3. **Keep** indefinitely as source of truth

### Temporary Docs:
1. **Create** in `/docs/` root during active work
2. **Move to archive** when work completes or becomes outdated
3. **Delete** after 6 months if no longer referenced

### Archive Process:
```bash
# Move completed temporary docs to archive
mv TEMP_DOC.md docs/archive/2025-temp-docs/
```

## 📊 Documentation Categories

### Core Categories (Always Keep):
- **Architecture** - System design and patterns
- **API** - Integration specifications
- **Database** - Schema and migration docs
- **Authentication** - Auth system design
- **Skills** - Skills system architecture
- **Assessment** - Assessment system logic
- **Style** - Design system guidelines

### Temporary Categories (Archive After Use):
- **Status** - Project status updates
- **Investigation** - Bug research and analysis
- **Planning** - Sprint/feature planning
- **Blockers** - Deployment/issue tracking
- **Demo** - Presentation materials
- **Migration** - One-time data migrations

## 🏷️ File Headers Standard

### Core Docs Header:
```markdown
# Document Title

**Last Updated:** Month DD, YYYY
**Version:** X.Y
**Audience:** [Senior Engineers, Product Team, etc.]
```

### Temporary Docs Header:
```markdown
# Document Title

**Date:** Month DD, YYYY
**Status:** [In Progress, Completed, Blocked]
**Context:** [Sprint name, feature name, etc.]
```

## 📈 Maintenance Guidelines

### Monthly Review:
- Archive temporary docs older than 3 months
- Delete archived docs older than 6 months (if not referenced)
- Update core doc modification dates

### Before Major Work:
- Check if existing core docs need updates
- Create temporary docs for planning/investigation
- Archive completed temporary docs

### After Major Work:
- Update all relevant core docs (MANDATORY)
- Move temporary docs to archive
- Update README.md links if needed

## 🎯 Success Metrics

- **Core docs:** < 25 files in `/docs/` root
- **Archive growth:** < 10 new files/month
- **Reference validity:** 100% of cross-references working
- **Update compliance:** Core docs updated after 100% of major features
