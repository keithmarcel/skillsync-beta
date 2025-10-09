# High-Demand Occupations Pivot - Implementation Plan

**Status:** In Progress  
**Branch:** `feature/high-demand-occupations-updates`  
**Updated:** October 9, 2025  
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

## Phase 1: UI & Routing Updates

### 1.1 HDO Table (High-Demand Tab)

**✅ REMOVE:**
- Actions menu: "Take Assessment"
- Actions menu: "Upload your resume and take a skills assessment"
- Actions menu: All separators
- Column: **AVG Salary**
- Column: **Role Readiness**

**✅ ADD:**
- **Column: Related Jobs**
  - Display: Badge with count (e.g., "4 Open Roles")
  - Data Source: Count of Featured Roles with matching `soc_code`
  - Click Behavior: Navigate to `/occupations/:id#open-roles` (smooth scroll)
  
- **Column: Education & Training**
  - Display: Badge with count (e.g., "4 Matches")
  - Data Source: Count of programs with overlapping skills
  - Click Behavior: Navigate to `/occupations/:id#programs` (smooth scroll)

**📝 NOTE:** Category/Industry column already exists - no changes needed

---

### 1.2 HDO Details Page (`/occupations/:id`)

**✅ REMOVE:**
- All assessment entry points
- Assessment CTAs from "Start Your Assessment" block

**✅ REFACTOR:**
- **"Start Your Assessment" Block**
  - Update copy to align with new discovery flow
  - Update CTA to relevant action (e.g., "View Related Roles")
  
- **Typical Tasks & Responsibilities Section**
  - Remove scrolling behavior - show all tasks
  - Remove "Importance" lines from all tasks

**✅ ADD/REORGANIZE:**

1. **Trusted Partners Block** (Move to top)
   - Position: Above "Employers Hiring Now"
   - Refactor copy: "Trusted Partners in your area are hiring for this occupation"
   
2. **Employers Hiring Now Section** (New - repurpose Related Job Titles design)
   - Position: Above "Skills and Responsibilities"
   - Break out of Skills container into own section
   - Display: Featured Roles with matching `soc_code`
   - Each card shows: Company logo, role title, "View Details" button
   - Links to: `/jobs/:roleId`
   - Empty state: "No active roles currently match this occupation"
   - Anchor ID: `#open-roles`

3. **Relevant Programs Section** (New)
   - Display: Programs with overlapping skills
   - Each card shows:
     - Program Title
     - Provider Name
     - Skill Overlap Count ("8 skills in common")
     - "View Program" button → `/programs/:id`
   - Empty state: "No matching programs currently available in your region"
   - Anchor ID: `#programs`

4. **CareerOneStop Video** (Keep existing)
   - **Enhancement:** Try creating iframe modal with video
   - Pull video info from CareerOneStop page

5. **Data Source Footer** (New)
   - Text: "Data source: BLS 2022; CareerOneStop; O*NET"
   - Links open in new tab
   - Position: Bottom of page

---

## Phase 2: Backend & Schema

### 2.1 Skills Extractor Strategy

**❌ DO NOT DUPLICATE** the extractor code

**✅ EXTEND** existing extractor to support both contexts:

```
Current: skills_extractor → high_demand_occupations.soc_code
New: skills_extractor → (high_demand_occupations.soc_code + featured_roles.soc_code)
```

**Key Challenge - Two Scenarios:**

**Scenario 1: Curated HDO Skills → Featured Role**
- Admin curates skills for SOC code via HDO pipeline
- Same SOC code used for Featured Role
- **Question:** Should Featured Role inherit exact same curated skills?

**Scenario 2: Employer Customization**
- Employer views curated skills for their role's SOC
- Wants to modify/add skills specific to their company
- **Question:** How do we maintain crosswalk integrity after customization?

**Proposed Solution (TBD):**
- Option A: Threshold-based overlap (e.g., 70% match still shows crosswalk)
- Option B: Separate "base skills" (SOC-level) vs "custom skills" (role-level)
- Option C: Track "skill drift" and show partial matches

**🔍 INVESTIGATION NEEDED:** Determine best approach for skill inheritance vs customization

---

### 2.2 Schema Investigation Required

**Tasks:**
1. **Audit `featured_roles` table in live Supabase:**
   - Does `soc_code` field exist?
   - Does `skills` field exist? (JSONB or relation to `job_skills`?)
   - Does `related_program_ids` exist?
   - Current data state - are SOC codes populated?

2. **Audit `jobs` table:**
   - Relationship to `featured_roles`
   - Current skills storage mechanism
   - Assessment linkage

3. **Check existing crosswalk logic:**
   - Any existing SOC crosswalk tables/views?
   - Current skill overlap queries?
   - Performance implications

**Expected Schema Additions:**
```sql
-- If missing, add to featured_roles:
ALTER TABLE featured_roles ADD COLUMN IF NOT EXISTS soc_code TEXT;
ALTER TABLE featured_roles ADD COLUMN IF NOT EXISTS required_proficiency_threshold INTEGER DEFAULT 90;
ALTER TABLE featured_roles ADD COLUMN IF NOT EXISTS auto_invite_threshold INTEGER DEFAULT 90;
ALTER TABLE featured_roles ADD COLUMN IF NOT EXISTS skills JSONB;
ALTER TABLE featured_roles ADD COLUMN IF NOT EXISTS related_program_ids TEXT[];

-- Indexes for crosswalk performance:
CREATE INDEX IF NOT EXISTS idx_featured_roles_soc ON featured_roles(soc_code);
CREATE INDEX IF NOT EXISTS idx_high_demand_occupations_soc ON high_demand_occupations(soc_code);
```

---

### 2.3 SOC Code Generation Script

**Need:** AI script to analyze existing Featured Roles and assign correct SOC codes

**Current State:** Mock Featured Roles may have incorrect/fake SOC codes

**Script Requirements:**
1. Analyze job title + description
2. Match to appropriate SOC code from O*NET taxonomy
3. One-time execution for existing roles
4. **Save script for reuse** in admin role editor

**Future Integration:**
- Add "Generate SOC Code" button to admin role editor
- Auto-suggest SOC code when creating new Featured Role
- Allow manual override

---

### 2.4 Crosswalk Logic Architecture

**Requirements:**
- Fast response time
- Scalable (growing Featured Roles + HDO)
- No tech debt

**Options to Evaluate:**

**Option A: Database View**
```sql
CREATE VIEW soc_crosswalk AS
SELECT 
  hdo.soc_code,
  COUNT(DISTINCT fr.id) as featured_roles_count,
  COUNT(DISTINCT p.id) as programs_count
FROM high_demand_occupations hdo
LEFT JOIN featured_roles fr ON fr.soc_code = hdo.soc_code
LEFT JOIN programs p ON p.skills && hdo.skills
GROUP BY hdo.soc_code;
```

**Option B: Materialized View** (refresh periodically)

**Option C: Real-time Query** (with proper indexes)

**🔍 INVESTIGATION NEEDED:** Performance testing with current data volume

---

### 2.5 Admin Tools Audit

**Tasks:**
1. **Review current admin role editor** (`/admin/roles/[id]`)
   - Does it have SOC code field?
   - Are all user-facing fields editable?
   - Image upload functionality?
   - Multi-select for categories?
   - Ability to add new categories?

2. **Required Fields Checklist:**
   - [ ] Role Title (editable)
   - [ ] Description (editable)
   - [ ] SOC Code (editable with auto-suggest)
   - [ ] Category (multi-select)
   - [ ] Employment Type (dropdown)
   - [ ] Salary Range (editable)
   - [ ] Location (editable)
   - [ ] Skills (multi-select with add new)
   - [ ] Responsibilities (rich text)
   - [ ] Education Requirements (dropdown)
   - [ ] Company Logo (upload)
   - [ ] Role Image (upload)
   - [ ] Trusted Partner Badge (checkbox)

3. **Skills Extraction Trigger:**
   - Currently: Manual
   - Add: "Extract Skills from SOC" button
   - Behavior: Pulls curated skills for selected SOC code
   - Allow: Manual editing after extraction

---

## Phase 3: Data Migration & Cleanup

### 3.1 Featured Roles Data Audit

**Tasks:**
1. Export current Featured Roles data
2. Validate SOC codes (real vs mock)
3. Run SOC generation script
4. Backup existing skills data
5. Re-run skills extraction pipeline with correct SOC codes

### 3.2 Skills Data Strategy

**Current State:** Featured Role skills exist but will be replaced

**Migration Plan:**
1. Backup existing `job_skills` data
2. Run skills extractor on correct SOC codes
3. Admin curates extracted skills
4. Populate Featured Roles with curated skills
5. Test crosswalk logic

---

## 🔍 Required Investigations

### High Priority
1. **Schema Audit** - Check live Supabase for existing fields
2. **Crosswalk Performance** - Test query performance with current data
3. **Skills Inheritance Logic** - Decide on customization strategy
4. **Admin Editor Review** - Ensure all required fields present

### Medium Priority
5. **SOC Code Validation** - Audit existing Featured Roles SOC codes
6. **Skills Extractor Extension** - Plan dual-context support
7. **Routing Conflicts** - Ensure `/occupations/:id` vs `/jobs/:id` clarity

### Low Priority
8. **Video Modal** - CareerOneStop iframe feasibility
9. **Smooth Scroll** - Anchor link implementation
10. **Badge Styling** - Consistent design for counts

---

## 📋 Implementation Checklist

### Phase 1A: HDO Table Updates
- [ ] Remove AVG Salary column
- [ ] Remove Role Readiness column
- [ ] Remove assessment actions from menu
- [ ] Remove separators from actions menu
- [ ] Add Related Jobs column with badge
- [ ] Add Education & Training column with badge
- [ ] Implement click handlers for smooth scroll
- [ ] Add crosswalk count queries

### Phase 1B: HDO Details Page ✅ COMPLETE
- [x] Remove assessment CTAs - Removed "Start Assessment" block entirely
- [x] Refactor "Start Assessment" block copy - N/A (removed)
- [x] Remove scrolling from Tasks section - Removed max-h and overflow
- [x] Remove Importance lines from tasks - Removed importance labels
- [x] Move Trusted Partners block to top - Removed block (replaced with new sections)
- [x] Create Employers Hiring Now section - 3-column cards with Load More
- [x] Create Relevant Programs section - 3-column cards with Load More
- [x] Add Data Source footer - BLS 2022, CareerOneStop, O*NET links
- [x] Implement smooth scroll anchors - #open-roles and #programs IDs
- [ ] (Optional) Add video iframe modal - Not needed (kept external link)

**Additional Improvements:**
- Removed bullets from Core Responsibilities and Typical Tasks
- Removed Related Job Titles section
- Added regional indicator cleaning helper (removes "(National)", etc.)
- Styled cards to match featured card design (text-lg, font-bold, Source Sans Pro)
- Added separator between employer and program sections
- Updated section titles: "Local Employers Hiring Now" and "Relevant Education & Training Programs"
- Deduplicated tasks display
- Implemented compact empty states (message replaces subheading)
- Logo sizing: h-6, max-w-[110px] for consistent display
- Card padding: p-5 pb-3 for tighter spacing
- Proficiency badge: Consolidated into badge row (teal with icon)
- Load More: Shows after 6 cards, reuses hiring now tab pattern

#### Card Section Implementation Details

**Local Employers Hiring Now Section:**
- Location: Between hero image and Skills & Responsibilities
- Anchor ID: `#open-roles` for smooth scroll from table badges
- Layout: 3-column responsive grid (`md:grid-cols-3`)
- Card Structure:
  - Title: text-lg, font-bold, leading-tight, Source Sans Pro, hover underline
  - Company name: text-sm, gray-600
  - Badge row: Category (blue), Employment Type (gray), Proficiency (teal with checkmark icon)
  - Description: text-sm, line-clamp-2
  - Footer: Logo (h-6, max-w-110px) + Explore button (ghost, teal)
- Empty State: "No active roles currently match this occupation. Check back soon..."
- Empty State Styling: Replaces subheading, mt-2, gray-500, left-aligned

**Relevant Education & Training Programs Section:**
- Location: After separator, before Skills & Responsibilities
- Anchor ID: `#programs` for smooth scroll from table badges
- Layout: 3-column responsive grid (`md:grid-cols-3`)
- Card Structure:
  - Title: text-lg, font-bold, leading-tight, Source Sans Pro, hover underline
  - Provider name: text-sm, gray-600
  - Badge row: Program Type (purple), Format (gray), Duration (gray)
  - Description: text-sm, line-clamp-2
  - Footer: Logo (h-6, max-w-110px) + Explore button (ghost, teal)
- Empty State: "No matching programs are currently available in your region..."
- Empty State Styling: Replaces subheading, mt-2, gray-500, left-aligned

**Load More Functionality:**
- State variables: `showAllRoles`, `showAllPrograms`
- Default display: First 6 cards
- Button appears when: `!showAll && items.length > 6`
- Button styling: Teal outline, hover fills teal background
- Shows remaining count: "Load More (X remaining)"
- Pattern reused from hiring now tab

**Design Consistency:**
- All cards match featured card component styling
- Logos constrained to prevent size inconsistencies
- Compact padding for efficient space usage
- Empty states minimize vertical space when no data
- Separator provides clear visual break between sections

### Phase 1C: BLS 2024 Regional Data Upgrade ✅ COMPLETE
- [x] Document BLS API research findings
- [x] Audit current BLS data connections
- [x] Update to May 2024 OEWS data
- [x] Implement regional data priority (Tampa Bay → Florida → National)
- [x] Add regional salary display (shows area name)
- [x] Update data source footer to "BLS 2024"
- [x] Create test script for BLS API
- [x] Research OEWS data access methods (API not available, use flat files)
- [x] Create OEWS flat file import script
- [x] Update getJobById query to fetch regional wage data
- [x] Import sample May 2024 data (8 key occupations)
- [x] Test on occupation detail pages

**Regional Data Priority:**
1. **Primary:** Pinellas County, FL (all zip codes)
2. **Secondary:** Tampa-St. Petersburg-Clearwater MSA
3. **Tertiary:** Florida state-level
4. **Fallback:** National data

**BLS API Research Findings:**
- **May 2024 OEWS data available** (2-year improvement over current 2022 data)
- **Regional granularity:** State, Metro Area, and some county-level data
- **API Access:** BLS Public Data API v2.0 (no registration required)
- **Coverage:** ~830 occupations by SOC code
- **Update frequency:** Annual (every May)

**Data Sources:**
- Salary/Employment: BLS OEWS May 2024
- Projections: BLS Employment Projections 2022-2032 (national only, biennial updates)
- Skills/Tasks: O*NET 30.0 (2025) - national only
- Regional Projections: State workforce agencies (Florida DEO)

**Implementation Details:**
- **File Updated:** `/src/lib/services/bls-api.ts`
  - Added Florida state FIPS code (12)
  - Updated series ID priority: Tampa MSA → Florida → National
  - Changed date range to 2023-2024 for May 2024 data
  - Enhanced area name detection for Tampa MSA and Florida
  - Added comments about Pinellas County (limited OEWS availability)

- **UI Updated:** `/src/app/(main)/jobs/[id]/page.tsx`
  - Changed "BLS 2022" to "BLS 2024" in data source footer
  - Updated salary area label to show dynamic area name
  - Defaults to "Tampa Bay Area" if no area name provided

**Key Discovery:**
- ⚠️ **OEWS data is NOT available through BLS Public Data API**
- BLS API is for time series data (CPI, unemployment, etc.)
- OEWS is distributed as **flat files only** (official BLS method)
- See detailed research: `/docs/BLS_API_RESEARCH_FINDINGS.md`

**Solution Implemented:**
- Created OEWS flat file import script: `/scripts/import-oews-2024-data.js`
- Downloads May 2024 data from BLS (National, State, MSA)
- Parses CSV files and imports to `bls_wage_data` table
- Implements regional priority: Tampa (45300) → Florida (12) → National (0000000)

**Database Integration:**
- Updated `getJobById()` query in `/src/lib/database/queries.ts`
- Fetches wage data with regional priority
- Populates `median_wage_usd`, `wage_area_name`, `wage_data_year` fields
- Displays on occupation detail pages (e.g., `/jobs/9ee597fb-5b50-49bc-9e08-f2543a8b658b`)

**Data Imported:**
- ✅ 8 key occupations with May 2024 data
- ✅ Tampa MSA, Florida, and National data for each
- ✅ 24 total wage records in database
- Script: `scripts/import-sample-oews-data.js`

**Occupations with Regional Data:**
1. Software Developers (15-1252)
2. Registered Nurses (29-1141)
3. Accountants and Auditors (13-2011)
4. General and Operations Managers (11-1021)
5. Marketing Managers (11-2021)
6. Financial Analysts (13-2051)
7. Medical and Health Services Managers (11-9111)
8. Human Resources Managers (11-3121)

**Next Steps:**
- Expand to all occupations using BLS One-Screen tool
- Set up annual refresh process (May each year)
- See: `/docs/OEWS_DATA_IMPORT_GUIDE.md` for full import process

### Phase 2A: Schema & Data
- [ ] Complete schema audit
- [ ] Add missing fields to featured_roles
- [ ] Create indexes for crosswalk
- [ ] Build SOC code generation script
- [ ] Run script on existing Featured Roles
- [ ] Decide on skills inheritance strategy

### Phase 2B: Admin Tools
- [ ] Audit admin role editor
- [ ] Add missing editable fields
- [ ] Add SOC code auto-suggest
- [ ] Add "Extract Skills" button
- [ ] Test image upload functionality
- [ ] Add category management

### Phase 2C: Crosswalk Logic
- [ ] Design crosswalk architecture
- [ ] Implement SOC matching queries
- [ ] Implement skill overlap queries
- [ ] Performance test with real data
- [ ] Add caching if needed

---

## 🎯 Success Criteria

- [ ] No assessment entry points on HDO pages
- [ ] HDO table shows accurate crosswalk counts
- [ ] Clicking badges navigates with smooth scroll
- [ ] HDO details page shows related roles and programs
- [ ] Featured Role admin editor has all required fields
- [ ] SOC code generation works for new roles
- [ ] Skills extractor supports both HDO and Featured Roles
- [ ] Crosswalk logic performs well at scale
- [ ] Data source footer appears on all HDO pages
- [ ] No routing conflicts between occupations and roles

---

## 📝 Open Questions

1. **Skills Customization:** How do we handle employer modifications to curated skills while maintaining crosswalk integrity?
2. **Threshold Logic:** What % overlap still qualifies for crosswalk display?
3. **Performance:** Do we need materialized views or is real-time querying sufficient?
4. **Admin Validation:** Do we need SOC code validation or trust admin input for now?
5. **Video Modal:** Is CareerOneStop iframe embedding feasible/allowed?

---

---

## 🔬 Investigation Findings

### Schema Audit (In Progress)

**Status:** 🔄 Starting investigation  
**Date:** October 9, 2025

#### Featured Roles Table (jobs table where job_kind='featured_role')
- [x] Check if `soc_code` field exists
- [x] Check if `skills` field exists (JSONB or relation?)
- [x] Check if `required_proficiency_threshold` exists
- [x] Check if `auto_invite_threshold` exists
- [ ] Check if `related_program_ids` exists
- [ ] Count roles with populated SOC codes (need live DB query)
- [ ] Sample data quality check (need live DB query)

**Findings:**
```sql
-- JOBS TABLE SCHEMA (from migrations):
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY,
  job_kind job_kind NOT NULL,  -- 'featured_role' or 'occupation'
  title text NOT NULL,
  soc_code text,  -- ✅ EXISTS
  company_id uuid,
  job_type text,
  category text,
  location_city text,
  location_state text,
  median_wage_usd numeric,
  long_desc text,
  short_desc text,  -- Added in migration
  featured_image_url text,
  skills_count integer DEFAULT 0,
  
  -- Employer Dashboard Fields (added 2025-10-07):
  is_published BOOLEAN DEFAULT true,  -- ✅ EXISTS
  assessments_count INTEGER DEFAULT 0,
  
  -- Invitation System Fields:
  required_proficiency_pct NUMERIC DEFAULT 90,  -- ✅ EXISTS (as required_proficiency_pct)
  application_url TEXT,
  visibility_threshold_pct NUMERIC DEFAULT 85,  -- ✅ EXISTS (similar to auto_invite_threshold)
  
  -- Status for draft/publish:
  status text DEFAULT 'published',  -- 'draft', 'published', 'archived'
  
  -- Other fields:
  is_featured boolean DEFAULT false,
  employment_outlook text,
  education_level text,
  core_responsibilities JSONB,
  related_job_titles JSONB,
  education_requirements text,
  projected_open_positions integer,
  job_growth_outlook text
);

-- SKILLS STORAGE:
-- ❌ NO `skills` JSONB field in jobs table
-- ✅ Skills stored via JUNCTION TABLE: job_skills
CREATE TABLE public.job_skills (
  job_id uuid REFERENCES jobs(id),
  skill_id uuid REFERENCES skills(id),
  weight numeric DEFAULT 1.0,
  PRIMARY KEY (job_id, skill_id)
);

-- ✅ CURATED SKILLS via SOC_SKILLS junction:
CREATE TABLE public.soc_skills (
  id uuid PRIMARY KEY,
  soc_code text NOT NULL,
  skill_id uuid REFERENCES skills(id),
  weight numeric DEFAULT 1.0,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  UNIQUE(soc_code, skill_id)
);

-- MISSING FIELDS:
-- ❌ related_program_ids - DOES NOT EXIST (need to add or use junction table)

-- CURRENT QUERY LOGIC (from queries.ts):
-- Featured Roles query checks soc_skills FIRST, falls back to job_skills
-- This means curated SOC skills already take precedence!
```

**Key Findings:**
1. ✅ `soc_code` exists on jobs table
2. ✅ `required_proficiency_pct` exists (exact field name)
3. ✅ `visibility_threshold_pct` exists (similar to auto_invite_threshold)
4. ❌ `skills` JSONB field does NOT exist - uses `job_skills` junction table
5. ❌ `related_program_ids` does NOT exist
6. ✅ Skills inheritance already implemented! Query checks `soc_skills` first, then `job_skills`
7. ✅ `is_published` field exists for draft/publish workflow

#### High-Demand Occupations (jobs table where job_kind='occupation')
- [x] Current SOC code population
- [x] Skills data structure
- [x] Existing crosswalk queries

**Findings:**
```sql
-- Same table as Featured Roles, just filtered by job_kind
-- All fields from jobs table apply

-- Query logic (from queries.ts):
export async function getHighDemandOccupations() {
  // Selects from jobs where job_kind = 'occupation'
  // Also checks soc_skills first, then job_skills
  // Same inheritance pattern as Featured Roles!
}

-- ✅ SOC codes exist for occupations
-- ✅ Skills inheritance already working
-- ✅ Can crosswalk via soc_code matching
```

**Key Findings:**
1. ✅ HDO and Featured Roles use SAME table (jobs)
2. ✅ Both use same skills inheritance (soc_skills → job_skills)
3. ✅ Crosswalk is simple: match on `soc_code` field
4. ✅ No separate "high_demand_occupations" table

#### Programs Table
- [x] Skills data structure
- [x] Overlap query feasibility
- [x] CIP code relationship

**Findings:**
```sql
CREATE TABLE public.programs (
  id uuid PRIMARY KEY,
  school_id uuid REFERENCES schools(id),
  name text NOT NULL,
  program_type text,  -- Certificate, Associate's, Bachelor Degree, etc.
  format text,
  duration_text text,
  short_desc text,
  program_url text,
  cip_code text REFERENCES cip_codes(cip_code),
  
  -- Extended fields:
  program_id text UNIQUE NOT NULL,
  catalog_provider text,
  discipline text,
  long_desc text,
  program_guide_url text,
  
  -- Status fields:
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  status text DEFAULT 'published',
  featured_image_url text,
  skills_count integer DEFAULT 0,
  inquiries_count integer DEFAULT 0,
  
  -- CIP metadata:
  cip_assignment_confidence integer DEFAULT 100,
  cip_assignment_method text DEFAULT 'manual',
  cip_approved boolean DEFAULT true
);

-- SKILLS STORAGE:
CREATE TABLE public.program_skills (
  program_id uuid REFERENCES programs(id),
  skill_id uuid REFERENCES skills(id),
  weight numeric DEFAULT 1.0,
  PRIMARY KEY (program_id, skill_id)
);

-- CIP → SOC CROSSWALK:
CREATE TABLE public.cip_soc_crosswalk (
  cip_code text REFERENCES cip_codes(cip_code),
  soc_code text NOT NULL,
  source text DEFAULT 'ONET',
  PRIMARY KEY (cip_code, soc_code)
);

-- PROGRAM → JOBS JUNCTION (added 2025-09-30):
CREATE TABLE public.program_jobs (
  program_id uuid REFERENCES programs(id),
  job_id uuid REFERENCES jobs(id),
  match_score numeric,
  PRIMARY KEY (program_id, job_id)
);
```

**Key Findings:**
1. ✅ Programs have `program_skills` junction table
2. ✅ CIP → SOC crosswalk table exists!
3. ✅ `program_jobs` junction table exists for direct matching
4. ✅ Can calculate skill overlap via:
   - Option A: Direct `program_jobs` junction
   - Option B: CIP → SOC → programs path
   - Option C: Skills array intersection
5. ✅ Programs have `is_published` for filtering

---

## 📊 Implementation Progress

### Current Status: **Phase 0 - Investigations**

**Approach:** Investigation-first strategy to prevent rework and ensure UI is built on solid data foundation.

**Timeline:**
- **Now (30-60 min):** Schema audit + data state check
- **Then (2-3 hours):** Phase 1A - HDO Table UI updates
- **Next Session:** Phase 1B - HDO Details page updates

### Completed Tasks
- [x] Create comprehensive implementation plan
- [x] Document all requirements and open questions
- [x] Commit plan to repository
- [x] Schema audit - Featured Roles/Jobs table
- [x] Schema audit - High-Demand Occupations
- [x] Schema audit - Programs table
- [x] Identify existing crosswalk infrastructure

### 🎯 Major Discovery: Infrastructure Already Exists!

**GOOD NEWS:** Much of the backend work is already done!

1. **✅ Skills Inheritance Already Working**
   - Query logic already checks `soc_skills` first, then `job_skills`
   - Featured Roles automatically inherit curated SOC skills
   - No duplication needed - system already supports both contexts!

2. **✅ Crosswalk Tables Exist**
   - `cip_soc_crosswalk` - Links programs to occupations via CIP→SOC
   - `program_jobs` - Direct junction between programs and jobs
   - Can use either for crosswalk logic

3. **✅ All Required Fields Exist**
   - `soc_code` on jobs table ✅
   - `required_proficiency_pct` ✅
   - `visibility_threshold_pct` ✅
   - `is_published` for filtering ✅

4. **❌ Only Missing: `related_program_ids`**
   - But we have `program_jobs` junction table instead
   - Actually better - more flexible and normalized

**IMPLICATIONS:**
- ✅ No schema migrations needed for Phase 1
- ✅ No skills extractor duplication needed
- ✅ Crosswalk queries can be built immediately
- ✅ Can start UI work right away

### In Progress
- [ ] Phase 1B: HDO Details Page Updates

### Completed - Phase 1A (HDO Table) ✅
- [x] Build crosswalk count queries
- [x] Remove AVG Salary column
- [x] Remove Role Readiness column
- [x] Add "Open Roles" column with crosswalk counts
- [x] Add "Programs" column with crosswalk counts
- [x] Style badges as pills with teal colors
- [x] Always show badges (gray when count is 0)
- [x] Update column labels for single-line display ("Open Roles", "Programs")
- [x] Adjust column widths (Summary: 30%, Job Title: 22%)
- [x] Remove "Take Assessment" from Actions menu
- [x] Remove "Upload Resume" from Actions menu
- [x] Remove separators from Actions menu
- [x] Make badges non-clickable when count is 0

**Files Modified:**
- `src/lib/table-configs.ts` - Column definitions, badge rendering
- `src/lib/database/queries.ts` - Crosswalk count queries
- `src/components/ui/data-table.tsx` - Column widths, Actions menu
- `docs/HDO_PIVOT_IMPLEMENTATION_PLAN.md` - Progress tracking

### Up Next
- [ ] Phase 1B: HDO Details Page Updates
- [ ] Phase 2A: Schema & Data Migration

---

**Next Steps:** Begin Schema Audit Investigation
