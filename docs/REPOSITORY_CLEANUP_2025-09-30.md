# Repository Cleanup - September 30, 2025

## Overview
Organized scattered files and updated documentation to maintain clean repository structure.

## Files Moved

### SQL Scripts → `/docs/archive/sql-scripts/`
All root-level `.sql` files moved to archive:
- `bls_test.sql`, `check_fix.sql`, `clean_check.sql`, `final_bls_test.sql`
- `temp_check.sql`, `temp_data.sql`, `test_check.sql`, `test_fix.sql`
- `FIX_COMPANY_PUBLISHING.sql`, `check-featured-programs.sql`
- `check_onet_population.sql`, `clean_skills_for_repopulation.sql`
- `create-dev-favorites-table.sql`, `current_schema.sql`
- `enable-dev-favorites.js`, `enable-rls-favorites.js`
- `fix-admin-access.sql`, `fix-favorites-rls.sql`
- `fix_soc_code_format.sql`, `mock_enrichment_data.sql`
- `schema.sql`, `updated_schema.sql`

### JavaScript Scripts → `/docs/archive/js-scripts/`
Root-level utility `.js` files moved to archive:
- `apply-rls-direct.js`, `apply-rls-policies.js`
- `check-actual-schema.js`, `check-db-status.js`
- `check-jobs-data.js`, `check-profiles-columns.js`
- `check-profiles-schema.js`, `create-mock-user.js`
- `fix-missing-profile.js`, `verify-company-publishing.js`

**Note:** `tailwind.config.js` and `postcss.config.js` were initially moved but restored to root (required for build)

### Documentation → `/docs/reference/`
- `HUBSPOT_IMPORT_QUICKSTART.md` → `/docs/reference/`
- `PROGRAMS_ALIGNMENT_GUIDE.md` → `/docs/reference/`

### Old Migrations → `/docs/migrations-archive/`
- Moved old `/migrations/` folder contents to archive
- Active migrations remain in `/supabase/migrations/`

## Active Files Structure

### Root Directory (Clean)
```
/
├── README.md                    # Main project readme
├── package.json                 # Dependencies
├── next.config.mjs             # Next.js config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
├── vitest.config.ts            # Test config
├── components.json             # shadcn/ui config
├── .env.local                  # Environment variables
└── .gitignore                  # Git ignore rules
```

### Documentation Structure
```
/docs/
├── skill-sync-technical-architecture.md  # MAIN TECHNICAL DOC (updated)
├── SPRINT_ROADMAP.md                     # Current roadmap
├── README.md                             # Docs index
├── CLEANUP_PLAN.md                       # Cleanup tracking
├── DOCUMENTATION_AUDIT.md                # Doc audit
│
├── /reference/                           # Reference docs
│   ├── api-documentation.md
│   ├── api-resources.md
│   ├── app-styles.md
│   ├── component-library.md
│   ├── hubspot-import-guide.md          # NEW
│   ├── PROGRAMS_ALIGNMENT_GUIDE.md      # MOVED
│   ├── HUBSPOT_IMPORT_QUICKSTART.md     # MOVED
│   ├── admin-tools-schema-update-analysis.md
│   ├── cip_scaffolding.md
│   ├── skills-taxonomy-architecture.md
│   └── technical-debt-backlog.md
│
├── /features/                            # Feature specs
│   ├── skillsync_admin_tools_spec.md
│   ├── skillsync_admin_tools_completion_plan.md
│   ├── user-roles-implementation-plan.md
│   ├── assessment-proficiency-engine.md
│   ├── programs-catalog-implementation-plan.md
│   ├── skills_taxonomy_api_integration_plan.md
│   ├── ui-nice-to-haves.md              # NEW
│   └── ...
│
├── /specifications/                      # Original specs
│   ├── skill_sync_windsurf_app_skeleton_spec_pinellas_v_0.md
│   ├── SkillSync Component Data Structure.md
│   └── database-design-recommendation.md
│
├── /archive/                             # Historical docs
│   ├── /sql-scripts/                    # OLD SQL files
│   ├── /js-scripts/                     # OLD JS files
│   ├── /completed-phases/               # Completed work
│   └── ...
│
├── /testing/                             # Test docs
│   └── ADMIN_TOOLS_TESTING_CHECKLIST.md
│
├── /csv/                                 # Data files
│   └── hubspot-programs_2025-09-02-2.md
│
└── /db/                                  # Database docs
    └── supabase_schema-issues-and-changelog.md
```

### Active Code Structure
```
/src/
├── /app/                    # Next.js routes
│   ├── /(main)/            # User-facing app
│   └── /admin/             # Admin tools
├── /components/            # React components
├── /hooks/                 # Custom hooks
├── /lib/                   # Utilities
└── /types/                 # TypeScript types

/supabase/
└── /migrations/            # Active database migrations
    ├── 20250930000000_extend_programs_schema.sql
    ├── 20250930000001_create_hubspot_staging.sql
    ├── 20250930000002_align_programs_with_jobs.sql
    ├── 20250930000003_add_school_catalog_affiliation.sql
    └── 20250930000004_remove_featured_image_constraint.sql

/scripts/
├── validate-admin-tools.js      # Admin validation
├── test-admin-ui-flows.js       # UI flow tests
└── ...                          # Other utility scripts

/tests/
├── /admin/                      # Admin tests
│   ├── programs-admin.test.ts
│   └── admin-endpoints.test.ts
└── /unit/                       # Unit tests
```

## Documentation Updates

### Technical Architecture (UPDATED)
- Added HubSpot Programs Import section
- Documented admin tools implementation
- Listed all 5 migrations
- Added test coverage details
- Included key files and next steps

### New Documentation
- `/docs/features/ui-nice-to-haves.md` - UI improvements wishlist
- `/docs/reference/hubspot-import-guide.md` - Import process
- `/docs/reference/admin-tools-schema-update-analysis.md` - Schema analysis

## Benefits

1. **Clean Root Directory** - Only essential config files
2. **Organized Documentation** - Clear structure by category
3. **Archived Legacy Files** - Preserved but out of the way
4. **Updated Technical Docs** - Current implementation status
5. **Easy Navigation** - Logical folder structure

## Maintenance Guidelines

### When Adding New Files:
- **SQL Scripts** → `/docs/archive/sql-scripts/` (if temporary)
- **Migrations** → `/supabase/migrations/` (if permanent)
- **Documentation** → `/docs/[category]/` (by type)
- **Tests** → `/tests/[category]/`
- **Scripts** → `/scripts/` (if reusable)

### When Updating:
- Always update `/docs/skill-sync-technical-architecture.md` after major changes
- Archive old versions before major refactors
- Keep README.md current with latest features
- Update SPRINT_ROADMAP.md with progress

## Next Steps

1. Review and delete truly obsolete files from archives
2. Consider creating `/docs/api/` for API documentation
3. Add automated doc generation for TypeScript interfaces
4. Create changelog automation
