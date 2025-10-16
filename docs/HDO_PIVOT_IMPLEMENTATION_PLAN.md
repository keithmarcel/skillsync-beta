# High-Demand Occupations Pivot - Implementation Plan V2

**Status:** Phase 3 Complete ✅ | Phase 4 Planning  
**Branch:** `feature/employer-dashboard-updates`  
**Updated:** October 16, 2025 12:08 AM  
**Owner:** Keith + Claude

---

## 🎯 Executive Summary

Transforming High-Demand Occupations from an assessment entry point into a discovery & intelligence hub that connects regional labor market data with live employer demand.

**Key Terminology:**
- **Jobs** = Overarching bucket (Occupations + Roles)
- **Occupations** = High-demand occupations (HDO) - general job outlines, BLS/O*NET data
- **Roles** = Featured Roles - company-sponsored, employer-paid positions
- **User Flow:** Occupations → Roles → Assessments → Role Readiness

---

## 📊 Current Status

### ✅ Completed Phases (1-3)

**Phase 1: Foundation & Data** ✅
- UI & routing updates
- Featured card refinements
- BLS 2024 regional data (105 wage records, Tampa Bay priority)
- O*NET data pipeline (all 35 occupations enriched)

**Phase 2: Data Quality & Performance** ✅
- O*NET enrichment (real API + AI refinement)
- Content differentiation (strategic vs tactical)
- Performance optimization (96% query reduction, <1s load times)
- Featured role enhancements

**Phase 3: Admin Tools & Customization** ✅
- **3A:** Role Editor (6 tabs, production-ready)
- **3B:** Skills Management (SOC taxonomy curation)
- **3C:** SEO & Metadata (AI-generated fields)
- **3D:** Proficiency Thresholds (required/visibility settings)
- **3E:** Invitations V2 Refactor (unified DataTable architecture)

**See detailed accomplishments:** [Phase 1-3 Archive](#phase-1-3-archive)

---

## 🎯 Phase 4: Intelligence & Discovery (IN PROGRESS)

### Remaining Work

#### 4A: Crosswalk UI - Related Roles and Programs Display
**Status:** 🔄 In Progress

**HDO Table Updates:**
- [ ] Add "Open Roles" column with crosswalk counts
- [ ] Add "Programs" column with crosswalk counts
- [ ] Implement click handlers for smooth scroll to detail page sections
- [ ] Style badges consistently (teal pills, gray when 0)

**HDO Details Page:**
- [x] "Local Employers Hiring Now" section (3-column cards, Load More)
- [x] "Relevant Education & Training Programs" section (3-column cards, Load More)
- [x] Data Source footer (BLS, CareerOneStop, O*NET)
- [x] Smooth scroll anchors (#open-roles, #programs)
- [ ] **TODO:** Verify crosswalk logic accuracy
- [ ] **TODO:** Test with real user data

**Featured Role Details Page:**
- [ ] Add "Related Occupations" section (reverse crosswalk)
- [ ] Add "Relevant Programs" section
- [ ] Add "Similar Roles at Other Companies" section
- [ ] Update data source footer
- [ ] Implement smooth scroll anchors
- [ ] Match HDO page styling and layout

#### 4B: Advanced Caching
**Status:** ⏳ Future

- [ ] Evaluate need for materialized views
- [ ] Performance test crosswalk queries at scale
- [ ] Implement caching if needed

#### 4C: Advanced Features
**Status:** ⏳ Future

- [ ] Video iframe modal (CareerOneStop)
- [ ] Skill gap analysis visualization
- [ ] Enhanced analytics

#### 4D: Program Skills Taxonomy Refactor
**Status:** ⏳ Future

**Goal:** Ensure programs use SOC taxonomy for proper crosswalk consistency

**Proposed Architecture:**
1. **CIP→SOC Pipeline** - Continue using existing CIP-to-SOC crosswalk
2. **SOC Skills Lookup** - Check which SOC skills exist for mapped SOC code(s)
3. **Apply Taxonomy Skills** - Assign relevant SOC skills to programs
4. **AI Gap Filling** - Use AI when crosswalk data is insufficient
5. **Validation** - Ensure program skills align with occupation skills

**Benefits:**
- Consistent skills taxonomy across jobs and programs
- Proper crosswalk between programs and occupations
- Better program-to-job matching accuracy

---

## 🔍 Outstanding Investigations

### High Priority
1. **Crosswalk Performance Testing**
   - Test query performance with current data volume
   - Determine if materialized views needed
   - Evaluate caching strategy

2. **Skills Customization Strategy**
   - How do employers modify curated skills while maintaining crosswalk?
   - Threshold-based overlap (e.g., 70% match)?
   - Separate "base skills" vs "custom skills"?
   - Track "skill drift" and show partial matches?

### Medium Priority
3. **Featured Role Detail Page Design**
   - Finalize layout for related sections
   - Determine card content and styling
   - Empty state messaging

4. **Admin Override System Design**
   - UI for viewing inherited O*NET data
   - Edit/override workflow
   - Restore to defaults functionality
   - Diff view between custom and default

### Low Priority
5. **Video Modal Feasibility**
   - CareerOneStop iframe embedding allowed?
   - Alternative approaches?

6. **Occupations Editor Refactor**
   - Match Role Editor experience
   - Same tab structure and UX patterns
   - Deferred until after quiz generation fix

---

## 📋 Phase 4 Implementation Checklist

### 4A: Crosswalk UI (Current Sprint)

**HDO Table:**
- [ ] Implement crosswalk count queries
- [ ] Add "Open Roles" column
- [ ] Add "Programs" column
- [ ] Style badges (teal pills, gray when 0)
- [ ] Make badges clickable (navigate to detail page with anchor)
- [ ] Test with various data scenarios (0 roles, many roles, etc.)

**Featured Role Details Page:**
- [ ] Design "Related Occupations" section
- [ ] Design "Relevant Programs" section
- [ ] Design "Similar Roles" section
- [ ] Implement 3-column card grid
- [ ] Add Load More functionality
- [ ] Add smooth scroll anchors
- [ ] Match HDO page styling
- [ ] Test empty states

**Testing:**
- [ ] Verify crosswalk counts are accurate
- [ ] Test smooth scroll behavior
- [ ] Test Load More pagination
- [ ] Test empty states
- [ ] Test with various screen sizes
- [ ] Performance test with large datasets

---

## 📝 Open Questions

1. **Skills Customization:** How do we handle employer modifications to curated skills while maintaining crosswalk integrity?
2. **Threshold Logic:** What % overlap still qualifies for crosswalk display?
3. **Performance:** Do we need materialized views or is real-time querying sufficient?
4. **Video Modal:** Is CareerOneStop iframe embedding feasible/allowed?
5. **Occupations Editor:** When should we refactor to match Role Editor experience?

---

## 🎯 Success Criteria

### Phase 4A (Current)
- [ ] HDO table shows accurate crosswalk counts
- [ ] Clicking badges navigates with smooth scroll
- [ ] Featured Role pages show related occupations and programs
- [ ] Crosswalk logic performs well at scale
- [ ] Consistent styling across all pages
- [ ] No routing conflicts

### Overall Pivot Success
- [x] No assessment entry points on HDO pages
- [x] HDO details page shows related roles and programs
- [x] Featured Role admin editor has all required fields
- [x] SOC code generation works for new roles
- [x] Skills extractor supports both HDO and Featured Roles
- [x] Data source footer appears on all HDO pages
- [x] Regional BLS data (May 2024) displayed
- [x] O*NET data enrichment complete

---

## 📚 Key Documentation

### Current Implementation
- [Technical Architecture](../skill-sync-technical-architecture.md) - System overview
- [Invitations V2 Refactor](./features/INVITATIONS_V2_REFACTOR_COMPLETE.md) - Latest refactor
- [Sprint Roadmap](./SPRINT_ROADMAP.md) - Sprint tracking

### Reference
- [BLS API Research](./BLS_API_RESEARCH_FINDINGS.md) - API findings
- [Phase 1-3 Archive](#phase-1-3-archive) - Completed work details

---

## 🔗 Related Systems

### Database Schema
- **jobs table** - Both occupations and featured roles (filtered by `job_kind`)
- **soc_skills table** - Curated SOC taxonomy skills
- **job_skills table** - Job-specific skills (falls back after soc_skills)
- **program_skills table** - Program skills
- **cip_soc_crosswalk table** - CIP to SOC mapping
- **program_jobs table** - Direct program-to-job junction

### Skills Inheritance
- Query checks `soc_skills` FIRST, then `job_skills`
- Featured Roles automatically inherit curated SOC skills
- Employers can add custom skills via `job_skills`
- Crosswalk maintained via SOC code matching

### Crosswalk Logic
**Option A:** Direct `program_jobs` junction (fastest)
**Option B:** CIP → SOC → programs path (most accurate)
**Option C:** Skills array intersection (most flexible)

**Current Implementation:** Combination of A and B

---

## 📈 Next Session Priorities

1. **Complete HDO Table Crosswalk** (2-3 hours)
   - Add Open Roles and Programs columns
   - Implement crosswalk count queries
   - Style badges and click handlers
   - Test thoroughly

2. **Featured Role Details Page** (3-4 hours)
   - Design related sections
   - Implement 3-column cards
   - Add Load More functionality
   - Match HDO styling

3. **Performance Testing** (1 hour)
   - Test crosswalk queries at scale
   - Evaluate caching needs
   - Optimize if needed

---

# Phase 1-3 Archive

## 🎉 Phase 3 Accomplishments

### 3A: Role Editor - Complete Admin Interface
**Location:** `/admin/roles/[id]`

**6 Production-Ready Tabs:**
1. **Basic Information** - All role metadata, company selector, SOC auto-suggest, proficiency thresholds
2. **Descriptions** - Short/long descriptions with AI generation
3. **Skills** - Current skills display with X-button removal, AI extractor, manual selector
4. **Assessments** - Placeholder for quiz management
5. **Role Details** - Draggable card editors for responsibilities, tasks, tools
6. **SEO & Metadata** - SEO fields, Open Graph tags, AI SEO generator with preview

**Key Features:**
- Dirty state tracking with unsaved changes warning
- Toast notifications (Title Case)
- DestructiveDialog for delete confirmations
- Professional error handling
- Image upload with validation
- Draggable content management
- AI-powered content generation
- Service role key for RLS bypass

### 3B: Skills Management
- Remove skills from SOC taxonomy (deletes from `soc_skills` table)
- Skills tracked in `localChanges`, deleted on Save
- Proper refresh after deletion
- RLS bypass using service role key

### 3C: SEO & Metadata
- Database migration: `20251010000004_add_seo_fields_to_jobs.sql`
- Fields: `seo_title`, `meta_description`, `og_title`, `og_description`, `og_image`, `slug`
- AI generator analyzes all tabs for optimal SEO
- OG image preview with featured image inheritance

### 3D: Proficiency Thresholds
- `required_proficiency_pct` - Job seeker "Role Ready" threshold (default 90%)
- `visibility_threshold_pct` - Employer dashboard visibility (default 85%)
- Both fields save to existing database columns

### 3E: Invitations V2 Refactor (October 15, 2025)
**Duration:** 4 hours  
**Documentation:** [INVITATIONS_V2_REFACTOR_COMPLETE.md](./features/INVITATIONS_V2_REFACTOR_COMPLETE.md)

**Key Accomplishments:**
1. Unified DataTable Architecture
2. Tab Pattern Standardization
3. Proficiency & Readiness System ("Almost There" terminology)
4. Search, Filter & Sort Improvements
5. Status-Dependent Actions
6. Loading States Optimization
7. Archived Status Handling

**Technical Achievements:**
- Code reduction: 2 table implementations → 1 shared DataTable
- Consistent patterns across employer and job seeker views
- Reusable configuration architecture
- Performance: Eliminated unnecessary re-renders

---

## 🎉 Phase 2 Accomplishments

### O*NET Data Enrichment Pipeline
**Script:** `scripts/enrich-jobs-onet.js`

**Results:**
- All 8 Featured Roles enriched with real O*NET + AI refinement
- All 30 HDOs enriched with real O*NET + AI refinement
- 6-8 strategic responsibilities per job
- 10-12 tactical tasks per job
- 5-12 tools per job (categorized)

### Performance Optimization
- Featured Roles: 9 queries → 2 queries (78% reduction)
- HDO: 91 queries → 4 queries (96% reduction)
- Load times: 3-5s → <1s
- Parallel execution with Promise.all

### Featured Role Enhancements
1. Work Location Types (Onsite/Remote/Hybrid)
2. Descriptions (short_desc vs long_desc structure)
3. UI Polish (Role Type card, assessment card)
4. Assessment Card redesign
5. Page differentiation (HDO vs Featured Role layouts)

---

## 🎉 Phase 1 Accomplishments

### 1A-B: UI & Featured Cards
- Removed assessment entry points from HDO pages
- Refined featured card components
- Implemented "Load More" functionality
- Updated routing and navigation

### 1C: BLS 2024 Regional Data
- **105 wage records** imported (35 occupations × 3 areas)
- **Regional priority:** Tampa MSA → Florida → National
- **May 2024 data** (2-year improvement)
- **UI updates:** Shows area names, regional employment

**Scripts Created:**
- `import-all-occupations-oews-data.js`
- `enrich-jobs-with-onet-data.js`
- `check-wage-data.js`
- `check-onet-data-coverage.js`

### 1D: O*NET Data Pipeline
- Documented existing services
- Analyzed coverage (79% responsibilities, 66% tasks)
- Identified gaps
- Defined strategy (O*NET primary, AI supplement, admin override)

---

## 🔬 Investigation Findings

### Schema Audit (Complete)

**Key Findings:**
1. ✅ `soc_code` exists on jobs table
2. ✅ `required_proficiency_pct` exists
3. ✅ `visibility_threshold_pct` exists
4. ✅ Skills inheritance already implemented (soc_skills → job_skills)
5. ✅ `is_published` field exists for draft/publish workflow
6. ✅ HDO and Featured Roles use SAME table (jobs)
7. ✅ Crosswalk tables exist (cip_soc_crosswalk, program_jobs)
8. ❌ `related_program_ids` does NOT exist (but program_jobs junction is better)

**Infrastructure Already Exists:**
- Skills inheritance working
- Crosswalk tables exist
- All required fields present
- No schema migrations needed for Phase 4

---

**For detailed Phase 1-3 implementation notes, see:** [HDO_PIVOT_IMPLEMENTATION_PLAN.md](./HDO_PIVOT_IMPLEMENTATION_PLAN.md) (archived version)
