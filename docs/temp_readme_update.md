### 🗂️ Documentation Structure

**Core Documentation (Source of Truth):**
├── [17 core docs]           # Source of truth files in root
├── archive/                 # Historical record (organized by date/type)
├── features/                # Feature-specific implementation details
├── api/                     # API integration docs and service guides
├── db/                      # Database schema and migration docs
│   └── checks/             # Database validation queries
├── testing/                # Testing documentation and procedures
├── migrations/             # Migration documentation and guides
├── process/                # Development process docs (checklists, templates)
└── strategic/              # Business strategy docs

### 📋 When to Update Core Docs

**MANDATORY:** Update relevant core docs after any major technical work:
- New API integrations (O*NET, CareerOneStop, BLS, Lightcast)
- Major feature implementations
- Architecture changes
- Database schema changes
- Skills taxonomy updates
- Authentication system changes

### 🗃️ Archive Policy

**Files moved to organized locations:**
- Development checklists → `/docs/process/`
- Migration docs → `/docs/migrations/`
- Testing guides → `/docs/testing/`
- Feature specs → `/docs/features/`
- Database checks → `/docs/db/checks/`

**Archive Structure:**
```
docs/archive/
├── 2025-temp-docs/          # Current year temporary files
├── completed-phases/        # Completed project phases
├── historical_data/         # Legacy data and migrations
├── migrations-archive/      # Archived migration docs
└── [feature-specific folders]
```
