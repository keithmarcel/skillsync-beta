# Role Editor Field Mapping - Complete Audit

**Date:** October 9, 2025 11:55 PM  
**Status:** Phase 1 Complete - Data Audit

---

## 📊 COMPLETE DATABASE SCHEMA

### Jobs Table - All Fields

| Field Name | Type | Source | Used In Editor? | Used In Card? | Used In Detail? | Notes |
|------------|------|--------|----------------|---------------|-----------------|-------|
| **CORE FIELDS** |
| `id` | uuid | System | ❌ | ❌ | ❌ | Primary key |
| `job_kind` | enum | Manual | ✅ | ❌ | ❌ | 'featured_role' or 'occupation' |
| `title` | text | Manual | ✅ | ✅ | ✅ | Job title |
| `soc_code` | text | Manual/O*NET | ✅ | ❌ | ❌ | SOC classification |
| `company_id` | uuid | Manual | ✅ | ❌ | ✅ | FK to companies |
| `status` | text | Manual | ✅ | ❌ | ❌ | 'draft', 'published', 'archived' |
| `is_featured` | boolean | Auto | ❌ | ❌ | ❌ | Auto-set from job_kind |
| `created_at` | timestamp | System | ❌ | ❌ | ❌ | Auto timestamp |
| `updated_at` | timestamp | System | ❌ | ❌ | ❌ | Auto timestamp |
| **BASIC INFO** |
| `category` | text | Manual | ✅ | ✅ | ✅ | Business, Tech, etc. |
| `job_type` | text | Manual | ✅ | ✅ | ✅ | Full-time, Part-time, etc. |
| `location_city` | text | Manual | ✅ | ❌ | ✅ | City |
| `location_state` | text | Manual | ✅ | ❌ | ✅ | State |
| `work_location_type` | text | Manual | ❌ | ❌ | ✅ | Onsite, Remote, Hybrid |
| **DESCRIPTIONS** |
| `short_desc` | text | AI/Manual | ❌ | ✅ | ❌ | 13-15 words for cards |
| `long_desc` | text | O*NET/Manual | ❌ | ❌ | ✅ | Full description |
| **COMPENSATION** |
| `median_wage_usd` | numeric | BLS/Manual | ❌ | ✅ | ✅ | Median salary |
| **EDUCATION & REQUIREMENTS** |
| `education_level` | text | O*NET/Manual | ❌ | ❌ | ✅ | Education requirement |
| `work_experience` | text | O*NET/Manual | ❌ | ❌ | ❌ | Work experience needed |
| `on_job_training` | text | O*NET/Manual | ❌ | ❌ | ❌ | Training requirements |
| **CAREER OUTLOOK** |
| `employment_outlook` | text | BLS | ❌ | ❌ | ✅ | Career outlook text |
| `job_openings_annual` | integer | BLS | ❌ | ❌ | ❌ | Annual openings |
| `growth_rate_percent` | numeric | BLS | ❌ | ❌ | ❌ | Growth rate % |
| **SKILLS & ASSESSMENTS** |
| `skills_count` | integer | Computed | ❌ | ✅ | ✅ | Number of skills |
| `required_proficiency_pct` | numeric | Manual | ❌ | ✅ | ✅ | Required assessment score |
| **O*NET ENRICHMENT** |
| `onet_code` | text | O*NET | ❌ | ❌ | ❌ | O*NET code |
| `bright_outlook` | text | O*NET | ❌ | ❌ | ❌ | Bright outlook flag |
| `bright_outlook_category` | text | O*NET | ❌ | ❌ | ❌ | Bright outlook reason |
| `video_url` | text | O*NET | ❌ | ❌ | ❌ | Occupation video |
| `tasks` | jsonb | O*NET | ❌ | ❌ | ✅ | Day-to-day tasks array |
| `tools_and_technology` | jsonb | O*NET | ❌ | ❌ | ✅ | Tools & tech array |
| `core_responsibilities` | text[] | O*NET/AI | ❌ | ❌ | ✅ | Core responsibilities array |
| `related_job_titles` | text[] | AI | ❌ | ❌ | ❌ | Related titles |
| **MEDIA** |
| `featured_image_url` | text | Manual | ❌ | ❌ | ✅ | Hero image |

---

## 🔍 CRITICAL FINDINGS

### Issue 1: Missing Fields in Editor

**Fields displayed on user-facing pages but NOT in editor:**

1. **`short_desc`** (text)
   - **Used in:** Featured Role Cards
   - **Current:** Not in editor
   - **Impact:** Can't edit card descriptions
   - **Solution:** Add to Overview tab

2. **`work_location_type`** (text)
   - **Used in:** Detail page (Onsite, Remote, Hybrid)
   - **Current:** Not in editor
   - **Impact:** Can't set work arrangement
   - **Solution:** Add to Basic Info tab

3. **`tasks`** (jsonb)
   - **Used in:** Detail page "Day-to-Day Tasks" section
   - **Current:** Not in editor
   - **Impact:** Can't edit O*NET tasks
   - **Solution:** Add card-based editor in Role Details tab

4. **`tools_and_technology`** (jsonb)
   - **Used in:** Detail page "Tools & Technology" section
   - **Current:** Not in editor
   - **Impact:** Can't edit O*NET tools
   - **Solution:** Add card-based editor in Role Details tab

5. **`related_job_titles`** (text[])
   - **Used in:** Not currently displayed (future use?)
   - **Current:** Not in editor
   - **Impact:** Orphaned field
   - **Solution:** Add to SEO tab or remove

### Issue 2: Fields in Editor but NOT Displayed

**Fields in editor that don't appear on user-facing pages:**

1. **Job Description** (description tab)
   - **In Editor:** Yes (textarea)
   - **Displayed:** ❌ No
   - **Database Field:** Unknown - need to check
   - **Solution:** Either display it or remove from editor

2. **Key Responsibilities** (description tab)
   - **In Editor:** Yes (textarea)
   - **Displayed:** ❌ No (different from `core_responsibilities`)
   - **Database Field:** Unknown
   - **Solution:** Clarify vs core_responsibilities

3. **Requirements** (description tab)
   - **In Editor:** Yes (textarea)
   - **Displayed:** ❌ No
   - **Database Field:** Unknown
   - **Solution:** Either display or remove

4. **Benefits** (description tab)
   - **In Editor:** Yes (textarea)
   - **Displayed:** ❌ No
   - **Database Field:** Unknown
   - **Solution:** Either display or remove

5. **Growth Opportunities** (company details tab)
   - **In Editor:** Yes
   - **Displayed:** ❌ No
   - **Database Field:** Not in schema
   - **Solution:** Remove from editor

6. **Team Structure** (company details tab)
   - **In Editor:** Yes
   - **Displayed:** ❌ No
   - **Database Field:** Not in schema
   - **Solution:** Remove from editor

7. **Work Environment** (company details tab)
   - **In Editor:** Yes
   - **Displayed:** ❌ No
   - **Database Field:** Not in schema
   - **Solution:** Remove from editor

8. **Travel Requirements** (company details tab)
   - **In Editor:** Yes
   - **Displayed:** ❌ No
   - **Database Field:** Not in schema
   - **Solution:** Remove from editor

9. **Performance Metrics** (company details tab)
   - **In Editor:** Yes
   - **Displayed:** ❌ No
   - **Database Field:** Not in schema
   - **Solution:** Remove from editor

10. **Training Provided** (company details tab)
    - **In Editor:** Yes
    - **Displayed:** ❌ No
    - **Database Field:** Not in schema
    - **Solution:** Remove from editor

### Issue 3: Empty Fields When Data Exists

**Fields that should pre-populate but don't:**

1. **`job_type`** (Employment Type)
   - **Database:** Has value ("Full-time")
   - **Editor:** Empty
   - **Cause:** Not fetching from database
   - **Solution:** Fix useAdminEntity to populate

2. **`work_location_type`**
   - **Database:** Has value
   - **Editor:** Field doesn't exist
   - **Solution:** Add field + populate

3. **`education_level`**
   - **Database:** Has O*NET value
   - **Editor:** Dropdown doesn't show current value
   - **Solution:** Pre-select dropdown option

4. **`core_responsibilities`**
   - **Database:** Has O*NET array
   - **Editor:** Shows as textarea, not array
   - **Solution:** Card-based editor with array

---

## 📋 FEATURED ROLE CARD - COMPLETE FIELD LIST

**From:** `src/components/ui/featured-job-card-v2.tsx`

| Card Element | Database Field | Currently Editable? |
|--------------|---------------|---------------------|
| Title | `title` | ✅ Yes |
| Category Badge | `category` | ✅ Yes |
| Job Type Badge | `job_type` | ✅ Yes (but empty) |
| Skills Count Badge | `skills_count` | ❌ Computed |
| Description | `short_desc` | ❌ **MISSING** |
| Median Salary | `median_wage_usd` | ✅ Yes (as min/max) |
| Required Proficiency | `required_proficiency_pct` | ✅ Yes |
| Company Logo | `company.logo_url` | ❌ Company table |

**Missing from Editor:**
- `short_desc` - Card description (13-15 words)

---

## 📋 ROLE DETAIL PAGE - COMPLETE FIELD LIST

**From:** `src/app/(main)/jobs/[id]/page.tsx`

### Header Section
| Element | Database Field | Currently Editable? |
|---------|---------------|---------------------|
| Page Title | `title` | ✅ Yes |
| Company Name | `company.name` | ❌ Company table |
| Company Logo | `company.logo_url` | ❌ Company table |

### Overview Card (Teal)
| Element | Database Field | Currently Editable? |
|---------|---------------|---------------------|
| Category Badge | `category` | ✅ Yes |
| Skills Count Badge | `skills_count` | ❌ Computed |
| Long Description | `long_desc` | ❌ **MISSING** |
| Median Salary | `median_wage_usd` | ✅ Yes (as min/max) |
| Wage Area | `wage_area_name` | ❌ BLS data |
| Role Type | `job_type` | ✅ Yes (but empty) |
| Work Location | `work_location_type` | ❌ **MISSING** |
| Location | `location_city`, `location_state` | ✅ Yes |
| Education Requirements | `education_level` | ✅ Yes (dropdown) |
| Required Proficiency | `required_proficiency_pct` | ✅ Yes |

### Featured Image
| Element | Database Field | Currently Editable? |
|---------|---------------|---------------------|
| Hero Image | `featured_image_url` | ❌ **MISSING** |

### Skills & Responsibilities Card
| Element | Database Field | Currently Editable? |
|---------|---------------|---------------------|
| Core Skills | `job_skills` junction | ✅ Yes (dropdown) |
| Core Responsibilities | `core_responsibilities` | ✅ Yes (textarea, should be cards) |
| Day-to-Day Tasks | `tasks` | ❌ **MISSING** |
| Tools & Technology | `tools_and_technology` | ❌ **MISSING** |

---

## 🎯 ACTION ITEMS - PRIORITIZED

### Priority 1: Add Missing Critical Fields (Day 1)

1. **Add `short_desc` field**
   - Location: Overview tab
   - Type: Textarea
   - Label: "Short Description (for cards)"
   - Help text: "13-15 words, ~95 characters"
   - AI Generate button

2. **Add `work_location_type` field**
   - Location: Basic Info tab
   - Type: Select dropdown
   - Options: Onsite, Remote, Hybrid
   - Pre-populate from database

3. **Add `featured_image_url` field**
   - Location: Overview tab or new Media tab
   - Type: Image upload component
   - Show current image preview
   - Upload/Remove buttons

4. **Add `long_desc` field**
   - Location: Description tab
   - Type: Textarea
   - Label: "Full Job Description"
   - AI Generate button
   - This is the main description shown on detail page

### Priority 2: Fix Pre-Population (Day 1)

1. **Fix `job_type` field**
   - Currently empty when data exists
   - Update useAdminEntity to fetch value
   - Pre-select dropdown option

2. **Fix `education_level` field**
   - Show O*NET value as read-only reference
   - Allow override with dropdown
   - Pre-select current value

3. **Fix all select dropdowns**
   - Ensure current values pre-populate
   - Add "From O*NET" indicator where applicable

### Priority 3: Card-Based Editors (Days 2-3)

1. **Core Responsibilities Editor**
   - Convert from textarea to card list
   - Drag-and-drop reordering
   - Add/Edit/Delete individual items
   - Save as array to database

2. **Day-to-Day Tasks Editor**
   - New card-based editor
   - Edit O*NET tasks
   - Add custom tasks
   - Save to `tasks` jsonb field

3. **Tools & Technology Editor**
   - New card-based editor
   - Edit O*NET tools
   - Add custom tools
   - Save to `tools_and_technology` jsonb field

### Priority 4: Remove Orphaned Fields (Day 1)

**Remove these fields from editor (not in database, not displayed):**
- Growth Opportunities
- Team Structure
- Work Environment (unless we add to detail page)
- Travel Requirements (unless we add to detail page)
- Performance Metrics
- Training Provided

**Decision needed on these:**
- Job Description (description tab) - is this `long_desc`?
- Key Responsibilities (description tab) - is this `core_responsibilities`?
- Requirements (description tab) - new field or remove?
- Benefits (description tab) - new field or remove?

### Priority 5: Salary Logic Clarification (Day 1)

**Current State:**
- Editor has: `salary_min`, `salary_max`
- Database has: `median_wage_usd`
- Detail page shows: `median_wage_usd`
- Card shows: `median_wage_usd`

**Questions:**
1. Are min/max in database? (Need to check)
2. Is median calculated from min/max?
3. Or is median from BLS and min/max are separate?

**Recommendation:**
- Show BLS median as read-only reference
- Allow override with custom median
- OR allow min/max and calculate median
- Priority: Custom median > BLS median

---

## 🗂️ PROPOSED TAB REORGANIZATION

### Tab 1: Overview
- Job Title ✅
- Company ✅
- Category ✅
- Status ✅
- **Short Description** ⭐ NEW
- **Long Description** ⭐ NEW
- **Featured Image Upload** ⭐ NEW

### Tab 2: Location & Type
- Location (City, State) ✅
- **Work Location Type** ⭐ NEW (Onsite/Remote/Hybrid)
- Employment Type (Full-time, etc.) ✅
- Experience Level ✅

### Tab 3: Compensation
- Median Salary (show BLS reference)
- Salary Min/Max (if we keep these)
- Required Proficiency % ✅

### Tab 4: Requirements
- Education Level ✅
- Work Experience ✅
- On-Job Training ✅
- **Requirements** (if we add this field)
- **Benefits** (if we add this field)

### Tab 5: SOC Classification
- Current SOC Code ✅
- **AI SOC Suggestion** ✅ DONE
- O*NET Data Preview (read-only)

### Tab 6: Skills
- Required Skills (from taxonomy) ✅
- **Skills Extractor Integration** ⭐ NEW
- Skill Weights

### Tab 7: Assessments
- View Current Assessment
- Edit Questions
- Manage Sections
- Weighting System

### Tab 8: Role Details
- **Core Responsibilities** ⭐ CARD EDITOR
- **Day-to-Day Tasks** ⭐ CARD EDITOR
- **Tools & Technology** ⭐ CARD EDITOR

### Tab 9: SEO & Metadata
- URL Slug ✅
- SEO Title ✅
- Meta Description ✅
- **OG Image** ⭐ NEW
- **OG Title** ⭐ NEW
- **OG Description** ⭐ NEW
- **AI Generate SEO** ⭐ NEW

---

## 📊 FIELD USAGE MATRIX

| Field | DB | Editor | Card | Detail | Priority |
|-------|----|----|------|--------|----------|
| `short_desc` | ✅ | ❌ | ✅ | ❌ | 🔴 HIGH |
| `long_desc` | ✅ | ❌ | ❌ | ✅ | 🔴 HIGH |
| `work_location_type` | ✅ | ❌ | ❌ | ✅ | 🔴 HIGH |
| `featured_image_url` | ✅ | ❌ | ❌ | ✅ | 🔴 HIGH |
| `tasks` | ✅ | ❌ | ❌ | ✅ | 🟡 MEDIUM |
| `tools_and_technology` | ✅ | ❌ | ❌ | ✅ | 🟡 MEDIUM |
| `job_type` | ✅ | ✅ | ✅ | ✅ | 🔴 HIGH (fix pre-pop) |
| `core_responsibilities` | ✅ | ✅ | ❌ | ✅ | 🟡 MEDIUM (fix editor) |

---

## ✅ NEXT STEPS

1. **Verify orphaned fields** - Check if description tab fields map to database
2. **Add missing fields** - short_desc, work_location_type, featured_image_url
3. **Fix pre-population** - Ensure all fields load current values
4. **Build card editors** - For responsibilities, tasks, tools
5. **Remove unused fields** - Clean up company details tab
6. **Test end-to-end** - Verify all changes reflect on user-facing pages

---

**Status:** Ready for Phase 2 Implementation  
**Last Updated:** October 9, 2025 11:55 PM
