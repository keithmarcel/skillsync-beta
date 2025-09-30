# SkillSync File Cleanup & Reorganization Plan

**Date:** January 30, 2025  
**Purpose:** Remove redundant files, archive outdated content, reorganize documentation

---

## 🗑️ FILES TO DELETE (Redundant/Outdated)

### `/database/` Directory

#### ❌ DELETE: `/database/migrations/` (Entire Directory)
**Reason:** We use `/supabase/migrations/` as the source of truth
- Supabase CLI manages migrations in `/supabase/migrations/`
- `/database/migrations/` is a duplicate/outdated copy
- All current migrations are in `/supabase/migrations/`
- Keeping both creates confusion about which is authoritative

**Action:** Delete entire `/database/migrations/` directory

#### ❌ DELETE: `/database/sample_job_skills.sql`
**Reason:** Sample/test data not needed in production codebase
- We removed seed files from the pipeline
- API-first data model doesn't use SQL seed files
- If needed for reference, can be recreated from API data

**Action:** Delete file

**Result:** `/database/` directory will be empty → Delete entire `/database/` directory

---

### `/docs/db/` Directory

#### ❌ DELETE: `/docs/db/supabase_schema.sql`
**Reason:** Already archived to `/docs/archive/supabase_schema_old.sql`

#### ⚠️ REVIEW: `/docs/db/supabase_schema-issues-and-changelog.md`
**Content:** Historical schema issues and changes
**Decision:** 
- **KEEP** as historical reference (shows schema evolution)
- **MOVE** to `/docs/archive/schema-issues-and-changelog.md`
- Useful for understanding why certain decisions were made

#### ⚠️ REVIEW: `/docs/db/content_workflow_migration.sql`
**Decision:**
- **CHECK** if this was ever applied
- If applied → Archive to `/docs/archive/`
- If not applied and still needed → Move to `/supabase/migrations/`
- If not needed → Delete

**Result:** `/docs/db/` directory will be empty → Delete directory after moving relevant files

---

### `/docs/data/skillsync_seed_pack_v0/` Directory

#### ❌ DELETE: Entire `/docs/data/skillsync_seed_pack_v0/` directory
**Reason:** Seed data no longer used (API-first architecture)
- Contains CSV seed files (12 items)
- Contains SQL seed scripts
- Contains edge functions for seeding
- We removed seed.sql and use enrichment pipeline instead
- Keeping outdated seed data creates confusion

**Action:** Delete entire directory

**Result:** `/docs/data/` will be empty → Delete `/docs/data/` directory

---

### `/docs/documentation/` Directory - CSV Files

#### ❌ DELETE: CSV Files (Move to archive if needed)
- `Occupation_Data.csv` - Outdated occupation data
- `Pinellas-Hillsborough_Top_30_Filled.csv` - Historical data
- `featured_programs_v1.csv` - Old seed data
- `featured_roles_seed.csv` - Old seed data  
- `skillsync_pinellas_top30_enriched_v3_1.csv` - Old enriched data

**Reason:** 
- We now use API enrichment, not CSV imports
- Historical data that's been superseded
- If needed for reference, archive

**Action:** Move to `/docs/archive/historical_data/` or delete

---

### `/docs/` Root - Empty Files

#### ❌ DELETE: Empty placeholder files
- `QA_FIXES_REQUIRED.md` (0 bytes)
- `UI_UPDATES_IMPLEMENTATION.md` (0 bytes)

**Reason:** Empty files created accidentally, no content

---

## 📁 REORGANIZATION PLAN

### New Structure:

```
docs/
├── README.md (NEW - Overview of documentation)
├── CURRENT_STATUS.md (NEW - High-level project status)
├── skill-sync-technical-architecture.md (KEEP - Main technical doc)
├── DOCUMENTATION_AUDIT.md (KEEP - Maintenance guide)
│
├── specifications/
│   ├── skill_sync_windsurf_app_skeleton_spec_pinellas_v_0.md (MOVE from root)
│   ├── SkillSync Component Data Structure.md (MOVE from root)
│   └── database-design-recommendation.md (MOVE from root)
│
├── features/
│   ├── phase-5-api-integration-complete.md (KEEP)
│   ├── careeronestop-integration-summary.md (KEEP)
│   ├── skills_taxonomy_api_integration_plan.md (KEEP)
│   ├── assessment-proficiency-engine.md (KEEP)
│   ├── skillsync_admin_tools_spec.md (KEEP)
│   └── skillsync_admin_tools_completion_plan.md (KEEP)
│
├── api/
│   ├── BLS/
│   │   └── bls_api_documentation.md (CREATE)
│   └── COS/
│       └── cos_api_documentation_parsed.md (KEEP)
│
├── guides/
│   ├── enrichment-pipeline-guide.md (CREATE)
│   └── admin-tools-guide.md (CREATE from admin spec)
│
├── reference/
│   ├── api-documentation.md (MOVE from documentation/)
│   ├── api-resources.md (MOVE from documentation/)
│   ├── app-styles.md (MOVE from documentation/)
│   ├── component-library.md (MOVE from documentation/)
│   └── technical-debt-backlog.md (MOVE from documentation/)
│
├── archive/
│   ├── ACTION_PLAN_enriched_data_utilization.md (KEEP)
│   ├── DATABASE_AND_UI_STATUS.md (KEEP)
│   ├── supabase_schema_old.sql (KEEP)
│   ├── schema-issues-and-changelog.md (MOVE from db/)
│   ├── code-review-analysis-2025-08-22.md (MOVE from documentation/)
│   └── historical_data/ (NEW)
│       └── [CSV files if keeping for reference]
│
├── assets/ (KEEP as-is)
├── design/ (KEEP as-is - 33 items)
├── strategic/ (KEEP as-is)
└── testing/ (KEEP as-is)
```

### Deleted Directories:
- ❌ `/database/` (entire directory)
- ❌ `/docs/db/` (entire directory)
- ❌ `/docs/data/` (entire directory)
- ❌ `/docs/documentation/` (reorganized into other directories)

---

## ✅ EXECUTION CHECKLIST

### Phase 1: Delete Redundant Files (High Confidence)
- [ ] Delete `/database/` directory (migrations are in `/supabase/migrations/`)
- [ ] Delete `/docs/data/skillsync_seed_pack_v0/` (seed data not used)
- [ ] Delete empty files: `QA_FIXES_REQUIRED.md`, `UI_UPDATES_IMPLEMENTATION.md`

### Phase 2: Archive Historical Content
- [ ] Move `/docs/db/supabase_schema-issues-and-changelog.md` → `/docs/archive/`
- [ ] Check `/docs/db/content_workflow_migration.sql` - archive or delete
- [ ] Move CSV files from `/docs/documentation/` → `/docs/archive/historical_data/`
- [ ] Move `code-review-analysis-2025-08-22.md` → `/docs/archive/`

### Phase 3: Reorganize Documentation
- [ ] Create `/docs/specifications/` directory
- [ ] Move spec files from root → `/docs/specifications/`
- [ ] Create `/docs/guides/` directory
- [ ] Create `/docs/reference/` directory
- [ ] Move files from `/docs/documentation/` → `/docs/reference/`
- [ ] Delete empty `/docs/documentation/` directory
- [ ] Delete empty `/docs/db/` directory
- [ ] Delete empty `/docs/data/` directory

### Phase 4: Create New Documentation
- [ ] Create `/docs/README.md` (documentation overview)
- [ ] Create `/docs/CURRENT_STATUS.md` (project status)
- [ ] Create `/docs/api/BLS/bls_api_documentation.md`
- [ ] Create `/docs/guides/enrichment-pipeline-guide.md`

---

## 🎯 RATIONALE

### Why Delete `/database/migrations/`?
- **Single Source of Truth:** Supabase CLI uses `/supabase/migrations/`
- **Avoid Confusion:** Two migration directories creates ambiguity
- **Tool Compatibility:** Supabase tooling expects migrations in `/supabase/`
- **Current Practice:** All recent migrations are in `/supabase/migrations/`

### Why Delete Seed Data?
- **Architecture Change:** Moved to API-first data model
- **Seed Files Removed:** Already removed `seed.sql` from pipeline
- **Enrichment Pipeline:** Data comes from BLS/CareerOneStop APIs
- **Outdated:** Seed data doesn't reflect current schema or data sources

### Why Reorganize `/docs/`?
- **Clarity:** Group related documents together
- **Discoverability:** Easier to find relevant documentation
- **Maintenance:** Clear structure makes updates easier
- **Professionalism:** Well-organized docs for enterprise clients

---

## 📊 IMPACT SUMMARY

**Files to Delete:** ~35+ files (entire directories)
**Files to Move:** ~15 files
**Files to Create:** ~4 new docs
**Directories to Delete:** 3 (`/database/`, `/docs/db/`, `/docs/data/`)
**Directories to Create:** 3 (`/docs/specifications/`, `/docs/guides/`, `/docs/reference/`)

**Result:** Cleaner, more organized, easier to maintain documentation structure

---

## ⚠️ SAFETY CHECKS

Before deleting:
1. ✅ Verify `/supabase/migrations/` has all current migrations
2. ✅ Confirm seed data not used anywhere in code
3. ✅ Check if any scripts reference `/database/` directory
4. ✅ Ensure no imports from deleted directories

---

**Ready to Execute:** Yes, with user confirmation on each phase
