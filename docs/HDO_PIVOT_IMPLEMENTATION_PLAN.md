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

### Phase 1B: HDO Details Page
- [ ] Remove assessment CTAs
- [ ] Refactor "Start Assessment" block copy
- [ ] Remove scrolling from Tasks section
- [ ] Remove Importance lines from tasks
- [ ] Move Trusted Partners block to top
- [ ] Create Employers Hiring Now section
- [ ] Create Relevant Programs section
- [ ] Add Data Source footer
- [ ] Implement smooth scroll anchors
- [ ] (Optional) Add video iframe modal

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

**Next Steps:** Begin Phase 1A - HDO Table Updates
