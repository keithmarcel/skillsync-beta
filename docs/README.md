# SkillSync Documentation

Welcome to the SkillSync documentation hub. This directory contains comprehensive technical documentation, implementation guides, and architectural decisions.

## 📚 Essential Documentation

### Start Here
1. **[Technical Architecture](./skill-sync-technical-architecture.md)** - Complete system architecture, database schema, API patterns
2. **[Project Status](./PROJECT_STATUS.md)** - Current status and recent milestones
3. **[Sprint Roadmap](./SPRINT_ROADMAP.md)** - Current progress and priorities
4. **[Assessment Workflow](./ASSESSMENT_WORKFLOW.md)** ⭐ NEW - Complete assessment flow & data integrity rules
5. **[Enum Standardization](./ENUM_STANDARDIZATION.md)** ⭐ NEW - Skill proficiency enum standards
6. **[Skills Import Quickstart](./SKILLS_IMPORT_QUICKSTART.md)** - Skills population guide

### Feature Documentation (`/features`)

**Core Systems:**
- **[CIP-SOC Crosswalk System](./features/CIP_SOC_CROSSWALK_SYSTEM.md)** - Dynamic program matching via industry taxonomy
- **[Auto-Invite System](./features/AUTO_INVITE_SYSTEM.md)** - Automatic employer invitation queue population
- **[Assessment Proficiency Engine](./features/assessment-proficiency-engine.md)** - Three-layer weighting system
- **[Skills Taxonomy Architecture](./features/SKILLS_TAXONOMY_ARCHITECTURE.md)** - Lightcast + O*NET hybrid system

**Employer Features:**
- **[Employer Invitations](./features/EMPLOYER_INVITATIONS_SPEC.md)** - Complete invitation system
- **[Admin Tools Spec](./features/skillsync_admin_tools_spec.md)** - CMS requirements

**User Features:**
- **[Authentication Architecture](./features/AUTHENTICATION_ARCHITECTURE.md)** - Role-based auth system
- **[Account Settings](./features/ACCOUNT_SETTINGS.md)** - User profile management

**Assessment System:**
- **[Assessment Quick Reference](./features/ASSESSMENT_QUICK_REFERENCE.md)** - Assessment system guide
- **[Assessment Experience Plan](./features/assessment-experience-implementation-plan.md)** - UX implementation

### API Documentation (`/api`)
- **[CareerOneStop Integration](./api/COS/)** - COS API documentation
- **[BLS API Research](./api/BLS_API_RESEARCH_FINDINGS.md)** - Bureau of Labor Statistics
- **[Lightcast Integration](./api/LAISER_INTEGRATION_SUMMARY.md)** - Skills taxonomy API

### Archive (`/archive`)
- Historical implementation notes
- Completed sprint reviews
- Migration documentation
- Old checklists and status docs

## 🚀 Quick Start

**For Developers:**
1. Read [Technical Architecture](./skill-sync-technical-architecture.md)
2. Review [Project Status](./PROJECT_STATUS.md) for latest features
3. Check [Sprint Roadmap](./SPRINT_ROADMAP.md) for current priorities
4. Explore feature docs for specific systems

**For Product/Business:**
1. Review [Project Status](./PROJECT_STATUS.md) for current state
2. Check [Admin Tools Spec](./features/skillsync_admin_tools_spec.md)
3. Review [Sprint Roadmap](./SPRINT_ROADMAP.md) for timeline

**For QA/Testing:**
1. See [Testing README](../TESTING_README.md) in root
2. Review feature-specific testing guides in `/features`

## ✅ Current Status (October 21, 2025)

### Recently Completed
- ✅ **CIP-SOC Crosswalk System** - 100% job coverage, dynamic program matching
- ✅ **Auto-Invite System** - Automatic qualification and employer queue population
- ✅ **30 Fresh Assessments** - All scenarios (role-ready, close, needs-development)
- ✅ **Quality Filtering** - Only valid programs displayed
- ✅ **Skeleton UI** - Proper loading states throughout
- ✅ **Toast Notifications** - User feedback when results shared

### Production Ready
- ✅ Skills taxonomy (34,863 skills: 62 O*NET + 34,796 Lightcast)
- ✅ Assessment system (weighted scoring, 3-layer)
- ✅ Program matching (crosswalk + skill-based)
- ✅ Invitation system (auto-population)
- ✅ User accounts (full settings, notifications)
- ✅ Homepage (redesigned with interactive charts)

### In Progress
- 🔄 Admin CMS tools completion
- 🔄 Employer dashboard enhancements

### Next
- 📋 Geographic filtering for programs
- 📋 Cost/duration filtering
- 📋 ML-based recommendations
- 📋 Explicit consent per company

---

## 📁 Directory Structure

```
/docs
├── README.md                           # This file
├── PROJECT_STATUS.md                   # Current status and metrics
├── SPRINT_ROADMAP.md                   # Sprint planning
├── skill-sync-technical-architecture.md # System architecture
├── SKILLS_IMPORT_QUICKSTART.md         # Skills setup guide
├── DATABASE_CONFIGURATION.md           # Database setup
├── STYLE_GUIDE.md                      # Code style guide
│
├── /features                           # Feature documentation
│   ├── CIP_SOC_CROSSWALK_SYSTEM.md    # Crosswalk system (NEW)
│   ├── AUTO_INVITE_SYSTEM.md          # Auto-invite system (NEW)
│   ├── SKILLS_TAXONOMY_ARCHITECTURE.md # Skills system
│   ├── EMPLOYER_INVITATIONS_SPEC.md   # Invitations
│   ├── AUTHENTICATION_ARCHITECTURE.md  # Auth system
│   └── ... (other feature docs)
│
├── /api                                # API documentation
│   ├── /COS                           # CareerOneStop
│   ├── BLS_API_RESEARCH_FINDINGS.md   # BLS API
│   └── LAISER_INTEGRATION_SUMMARY.md  # Lightcast
│
└── /archive                            # Historical docs
    ├── /2025-09-30-reviews            # Sprint reviews
    └── ... (completed/old docs)
```

---

**For detailed technical information, start with [Technical Architecture](./skill-sync-technical-architecture.md)**
