# SkillSync Documentation

Welcome to the SkillSync documentation hub. This directory contains comprehensive technical documentation, implementation guides, and architectural decisions.

## 📚 Documentation Organization

### 🔧 Core Documentation (Source of Truth)
These files define the app architecture and should be updated after every major feature implementation:

**System Architecture:**
- **[skill-sync-technical-architecture.md](./skill-sync-technical-architecture.md)** - Complete system architecture, database schema, API patterns
- **[AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md)** - Authentication system design and implementation

**Feature Architecture:**
- **[HDO_PIVOT_IMPLEMENTATION_PLAN.md](./HDO_PIVOT_IMPLEMENTATION_PLAN.md)** - High-demand occupations strategy and roadmap
- **[SPRINT_ROADMAP.md](./SPRINT_ROADMAP.md)** - Current sprint priorities and status
- **[ROLE_EDITOR_ARCHITECTURE.md](./ROLE_EDITOR_ARCHITECTURE.md)** - Role editor system architecture
- **[ASSESSMENT_QUICK_REFERENCE.md](./ASSESSMENT_QUICK_REFERENCE.md)** - Assessment system features and flow

**Skills System (Core Business Logic):**
- **[SKILLS_SYSTEM_STATUS_AND_RECOMMENDATIONS.md](./SKILLS_SYSTEM_STATUS_AND_RECOMMENDATIONS.md)** - Skills system architecture and status
- **[SKILLS_TAXONOMY_ARCHITECTURE.md](./SKILLS_TAXONOMY_ARCHITECTURE.md)** - Skills taxonomy structure and design
- **[SKILLS_WEIGHTING_AND_SCORING.md](./SKILLS_WEIGHTING_AND_SCORING.md)** - Skills weighting and scoring logic
- **[SKILLS_ARCHITECTURE_CHANGE.md](./SKILLS_ARCHITECTURE_CHANGE.md)** - Skills system architecture decisions
- **[SOC_SKILLS_SEEDING_STRATEGY.md](./SOC_SKILLS_SEEDING_STRATEGY.md)** - Skills seeding approach and strategy

**Technical References:**
- **[SKILLS_MAPPINGS_AND_RELATIONSHIPS.md](./SKILLS_MAPPINGS_AND_RELATIONSHIPS.md)** - Skills relationships and data flow
- **[SKILLS_IMPORT_QUICKSTART.md](./SKILLS_IMPORT_QUICKSTART.md)** - Skills data import procedures
- **[DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md)** - Database setup and configuration
- **[STYLE_GUIDE.md](./STYLE_GUIDE.md)** - Design system and UI guidelines

### 🗂️ Documentation Structure

**`/features/`** - Feature-specific implementation details and specifications
**`/api/`** - API integration documentation and service guides
**`/db/`** - Database schema and migration documentation
**`/archive/`** - Historical documentation, completed features, and temporary files
**`/testing/`** - Testing documentation and procedures
**`/legal/`** - Legal and compliance documentation

### 📋 When to Update Core Docs

**MANDATORY:** Update relevant core docs after any major technical work:
- New API integrations (O*NET, CareerOneStop, BLS, Lightcast)
- Major feature implementations
- Architecture changes
- Database schema changes
- Skills taxonomy updates
- Authentication system changes

### 🗃️ Archive Policy

**Temporary files moved to `/archive/2025-temp-docs/`:**
- Status updates and project reports (PROJECT_STATUS.md, COMPLETE_SYSTEM_STATUS.md)
- Implementation plans and TODO lists
- Bug investigations and blocker documentation
- Feature completion summaries with dates
- Demo and sprint-specific documentation

**Archive Structure:**
```
/archive/
├── 2025-temp-docs/          # Temporary files from 2025 cleanup
├── completed-phases/        # Completed project phases
├── historical_data/         # Legacy data and migrations
└── [other organized archives]
```

## 🚀 Quick Start

**For Developers:**
1. Read [Technical Architecture](./skill-sync-technical-architecture.md)
2. Review [Sprint Roadmap](./SPRINT_ROADMAP.md)
3. Check feature docs for specific systems

**For Product/Business:**
1. Review [HDO Pivot Plan](./HDO_PIVOT_IMPLEMENTATION_PLAN.md)
2. Check [Sprint Roadmap](./SPRINT_ROADMAP.md) for current status

---

**For detailed technical information, start with [Technical Architecture](./skill-sync-technical-architecture.md)**
