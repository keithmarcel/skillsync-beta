# Role Editor UX Audit & Enhancement Plan

**Date:** October 9, 2025 11:50 PM  
**Status:** Investigation & Planning  
**Priority:** High - Foundation for employer self-service

---

## 🎯 Core Objective

Transform the admin role editor into a **comprehensive, employer-ready self-service tool** that:
1. Shows all existing data from the database (never empty fields when data exists)
2. Allows intuitive overrides of O*NET/BLS baseline data
3. Provides clear context about what's being edited
4. Matches 1:1 with user-facing role cards and detail pages
5. Offers AI assistance at appropriate touchpoints

---

## 📋 INVESTIGATION TASKS

### Task 1: Data Field Audit
**Goal:** Map every field in the editor to its user-facing counterpart

#### Admin Editor Fields → User-Facing Mapping

| Admin Field | User-Facing Location | Data Source | Currently Populated? | Notes |
|-------------|---------------------|-------------|---------------------|-------|
| **BASIC INFO TAB** |
| Job Title | Card + Detail Header | Manual | ✅ | |
| Company | Card + Detail Header | Manual | ✅ | |
| Category | Card Badge | Manual | ✅ | |
| Location | Card | Manual | ❓ | Need to check |
| Employment Type | Card (Full-time badge) | Manual | ❌ | **ISSUE: Empty in editor but shows on card** |
| Experience Level | Detail Page | Manual | ❓ | Need to check |
| Salary Min/Max | ❓ | Manual | ❓ | **QUESTION: How does this relate to median?** |
| SOC Code | Not visible to users | O*NET | ✅ | Backend only |
| **DESCRIPTION TAB** |
| Job Description | ❓ | Manual | ❓ | **Where does this appear?** |
| Key Responsibilities | ❓ | Manual | ❓ | **Where does this appear?** |
| Requirements | ❓ | Manual | ❓ | **Where does this appear?** |
| Benefits | ❓ | Manual | ❓ | **Where does this appear?** |
| **SKILLS TAB** |
| Required Skills | Detail Page - Skills Section | soc_skills table | ❓ | Should show curated skills |
| **ASSESSMENTS TAB** |
| Assessment Config | Not visible | quiz_questions table | ❓ | Need assessment management |
| **COMPANY DETAILS TAB** |
| Core Responsibilities | Detail Page - Cards | O*NET enrichment | ❓ | Should be list items |
| Growth Opportunities | ❓ | Manual | ❓ | **Where does this appear?** |
| Team Structure | ❓ | Manual | ❓ | **Where does this appear?** |
| Work Environment | ❓ | Manual | ❓ | **Where does this appear?** |
| Travel Requirements | ❓ | Manual | ❓ | **Where does this appear?** |
| Performance Metrics | ❓ | Manual | ❓ | **Where does this appear?** |
| Training Provided | ❓ | Manual | ❓ | **Where does this appear?** |
| **MISSING FROM EDITOR** |
| Featured Image | Detail Page Hero | featured_image_url | ❓ | **No upload interface** |
| Day-to-Day Tasks | Detail Page - Cards | O*NET tasks | ❓ | **Not in editor** |
| Tools & Technology | Detail Page - Cards | O*NET tools | ❓ | **Not in editor** |
| Short Description | Card | short_desc field | ❓ | **Not in editor** |
| Long Description | Detail Page | long_desc field | ❓ | **Not in editor** |

**ACTION ITEMS:**
- [ ] Review featured role card component to list all displayed fields
- [ ] Review role detail page to list all displayed fields
- [ ] Check database schema for all job table columns
- [ ] Identify orphaned fields (in editor but not displayed)
- [ ] Identify missing fields (displayed but not in editor)

---

## 🔍 CRITICAL ISSUES IDENTIFIED

### Issue 1: Empty Fields When Data Exists
**Problem:** Employment Type shows "Full-time" on card but editor field is empty  
**Root Cause:** Editor not pre-populating with existing database values  
**Impact:** Users can't see what's currently set, risk of accidental overwrites  
**Solution:** Always populate form fields with current database values

### Issue 2: Salary Confusion
**Problem:** Editor has min/max salary, but detail page shows median salary  
**Questions:**
- Is median calculated from min/max? `(min + max) / 2`
- Is median coming from BLS data? (likely)
- Should employers override median directly or via min/max?
- What happens if they set min/max but BLS median exists?

**Recommendation:** 
- Show BLS median as read-only reference
- Allow override with custom median OR min/max range
- Calculate median from range if both provided
- Priority: Custom median > Calculated median > BLS median

### Issue 3: Education Requirement Mismatch
**Problem:** Editor shows dropdown (High School, Certificate, etc.) but detail page shows "High school diploma or equivalent" (BLS text)  
**Solution:** Show BLS text as read-only, allow override with custom text

### Issue 4: No Context in Header
**Problem:** User doesn't know which role they're editing when navigating tabs  
**Current:** Generic "Edit Role" with back button  
**Proposed:** 
```
Admin > Roles > Edit: Administrative Assistant (Honeywell)
```
Or sticky header showing role title + company

### Issue 5: AI Buttons Misaligned with Content
**Problems:**
- "Analyze Job Description and Suggest Skills" button is on Skills tab but analyzes Description tab
- No AI assistance for actual job description writing
- SOC suggestion buried at bottom instead of near SOC field

**Solution:** Pair AI features with relevant tabs

---

## 🎨 UX ENHANCEMENT PROPOSALS

### Enhancement 1: Pre-Population System
**Requirement:** Every field should show existing data from database

**Implementation:**
```typescript
// In useAdminEntity hook
const defaultRole: Job = {
  // Instead of null/empty defaults, fetch from database
  employment_type: role?.employment_type || null,
  experience_level: role?.experience_level || null,
  // ... all fields
}
```

**Visual Indicator:**
- Fields with O*NET/BLS data: Show info icon with "From O*NET" tooltip
- Fields with custom overrides: Show badge "Custom"
- Empty fields: No indicator

### Enhancement 2: Contextual Header
**Option A - Breadcrumb:**
```
Admin / Roles / Edit: Administrative Assistant
```

**Option B - Sticky Header Card:**
```
┌─────────────────────────────────────────┐
│ Editing: Administrative Assistant       │
│ Company: Honeywell                      │
│ Status: Published | Last updated: 2h ago│
└─────────────────────────────────────────┘
```

### Enhancement 3: Alert Banner
**Location:** Below tabs, above content  
**Content:** 
```
ℹ️ You're editing live data. Changes will be reflected immediately after saving.
```

**Variant for O*NET roles:**
```
ℹ️ This role uses O*NET baseline data. You can override any field with custom values.
```

### Enhancement 4: Reorganize AI Features

**Current Layout:**
- Basic Info → SOC Code (bottom)
- Basic Info → AI SOC Suggestion (separate field)
- Skills → "Analyze Job Description and Suggest Skills" button

**Proposed Layout:**

**Basic Info Tab:**
```
┌─ Job Title ─────────────────────────┐
│ Administrative Assistant            │
└─────────────────────────────────────┘

┌─ SOC Code ──────────────────────────┐
│ 43-6014.00                          │
│ [🤖 AI Suggest SOC Code]            │
│ Get AI recommendations based on     │
│ job title and description           │
└─────────────────────────────────────┘
```

**Description Tab:**
```
┌─ Job Description ───────────────────┐
│ [Text area]                         │
│ [🤖 Generate with AI]               │
└─────────────────────────────────────┘

┌─ Key Responsibilities ──────────────┐
│ [Text area]                         │
│ [🤖 Generate with AI]               │
└─────────────────────────────────────┘
```

**Skills Tab:**
```
┌─ Required Skills ───────────────────┐
│ [Skill chips]                       │
│ [🤖 Extract Skills from Description]│
│ [🔧 Open Skills Extractor]          │
└─────────────────────────────────────┘
```

### Enhancement 5: Card-Based O*NET Data Management

**For:** Core Responsibilities, Tasks, Tools & Technology

**Current:** Text areas or arrays  
**Proposed:** Drag-and-drop card list

```
┌─ Core Responsibilities ─────────────────────┐
│                                              │
│  ☰ 1. Operate telephone switchboard...      │
│     [Edit] [Delete]                          │
│                                              │
│  ☰ 2. Answer inquiries from callers...      │
│     [Edit] [Delete]                          │
│                                              │
│  ☰ 3. Greet visitors and callers...         │
│     [Edit] [Delete]                          │
│                                              │
│  [+ Add New Responsibility]                  │
└──────────────────────────────────────────────┘
```

**Features:**
- Drag handle (☰) for reordering
- Inline edit mode
- Delete confirmation
- Add new items
- Order persists to database
- Reflects immediately on detail page

### Enhancement 6: Featured Image Management

**Add to Basic Info or new Media tab:**

```
┌─ Featured Image ────────────────────┐
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │   [Current Image Preview]    │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  [Upload New Image]  [Remove]        │
│                                      │
│  Recommended: 1200x630px, max 2MB    │
└──────────────────────────────────────┘
```

### Enhancement 7: Split Skills & Assessments

**Current:** One tab  
**Proposed:** Two tabs

**Skills Tab:**
```
┌─ Required Skills ───────────────────────────┐
│ [Search skills...]                          │
│                                              │
│ Selected Skills (8):                         │
│ • Communication  [Edit Weight] [Remove]      │
│ • Customer Service  [Edit Weight] [Remove]   │
│ • Microsoft Office  [Edit Weight] [Remove]   │
│                                              │
│ [🤖 Extract Skills from Description]         │
│ [🔧 Open Skills Extractor for SOC 43-6014]  │
└──────────────────────────────────────────────┘
```

**Assessments Tab:**
```
┌─ Role Assessment ───────────────────────────┐
│ Status: Active                               │
│ Questions: 25                                │
│ Sections: 5                                  │
│ Last Updated: 2 days ago                     │
│                                              │
│ [View/Edit Assessment]                       │
│ [Generate New Assessment]                    │
│                                              │
│ Assessment Sections:                         │
│ 1. Communication Skills (5 questions)        │
│ 2. Technical Proficiency (5 questions)       │
│ 3. Problem Solving (5 questions)             │
│ 4. Customer Service (5 questions)            │
│ 5. Situational Judgment (5 questions)        │
└──────────────────────────────────────────────┘
```

### Enhancement 8: SEO & Metadata Enhancements

**Add OG Tags:**
```
┌─ SEO & Metadata ────────────────────────────┐
│                                              │
│ URL Slug:                                    │
│ /roles/administrative-assistant-honeywell    │
│ ⚠️ Changing this will break existing links   │
│                                              │
│ SEO Title (60 chars):                        │
│ Administrative Assistant at Honeywell        │
│                                              │
│ Meta Description (160 chars):                │
│ Join Honeywell as an Administrative...      │
│                                              │
│ OG Image URL:                                │
│ https://...                                  │
│                                              │
│ OG Title:                                    │
│ Administrative Assistant - Honeywell         │
│                                              │
│ OG Description:                              │
│ Exciting opportunity to join our team...    │
│                                              │
│ [🤖 Generate SEO Content with AI]           │
│ Analyzes all role data to create optimized  │
│ SEO title, description, and OG tags         │
└──────────────────────────────────────────────┘
```

**URL Slug Validation:**
- Check uniqueness before save
- Show error if slug exists
- Suggest alternatives

---

## 📊 TAB REORGANIZATION PROPOSAL

### Current Tabs
1. Basic Information
2. Job Description
3. Skills and Assessments
4. Company-Specific Details
5. SEO and Metadata

### Proposed Tabs

#### 1. **Overview** (Renamed from Basic Information)
- Job Title
- Company
- Category
- Location
- Employment Type
- Experience Level
- Status (Published/Draft)
- Featured Image Upload
- Short Description (for card)
- Long Description (for detail page)

#### 2. **Compensation & Requirements**
- Salary Range (Min/Max)
- Median Salary (calculated or BLS)
- Education Requirement
- Work Experience Required
- Certifications
- Benefits

#### 3. **SOC Classification**
- Current SOC Code
- SOC Title
- AI SOC Suggestion Tool
- O*NET Data Preview (read-only)

#### 4. **Job Description**
- Full Job Description
- Key Responsibilities (list with drag-drop)
- Requirements (list with drag-drop)
- Day-to-Day Tasks (O*NET, editable cards)
- AI Generation Tools

#### 5. **Skills**
- Required Skills (searchable, from taxonomy)
- Skill Weights
- Skills Extractor Integration
- Extract from Description Tool

#### 6. **Assessments**
- View Current Assessment
- Edit Questions
- Manage Sections
- Weighting System
- Generate New Assessment

#### 7. **Role Details** (Renamed from Company-Specific)
- Core Responsibilities (O*NET, editable cards)
- Tools & Technology (O*NET, editable cards)
- Work Environment
- Growth Opportunities
- Team Structure
- Travel Requirements
- Performance Metrics
- Training Provided

#### 8. **SEO & Metadata**
- URL Slug (with validation)
- SEO Title
- Meta Description
- OG Image
- OG Title
- OG Description
- AI Generation Tool

---

## 🔧 TECHNICAL IMPLEMENTATION PLAN

### Phase 1: Data Audit & Mapping (Day 1)
**Tasks:**
- [ ] Review `src/app/(main)/jobs/[id]/page.tsx` (role detail page)
- [ ] Review role card component
- [ ] Document all displayed fields
- [ ] Check `jobs` table schema
- [ ] Create field mapping spreadsheet
- [ ] Identify data flow: O*NET → DB → UI

### Phase 2: Pre-Population System (Day 2)
**Tasks:**
- [ ] Update `useAdminEntity` to fetch all existing data
- [ ] Ensure form fields populate with current values
- [ ] Add visual indicators for data sources (O*NET vs Custom)
- [ ] Test with existing roles

### Phase 3: UI Enhancements (Days 3-4)
**Tasks:**
- [ ] Add contextual header/breadcrumb
- [ ] Add alert banner
- [ ] Reorganize AI buttons
- [ ] Move SOC suggestion near SOC field
- [ ] Add field descriptions/help text

### Phase 4: Tab Reorganization (Days 5-6)
**Tasks:**
- [ ] Implement new tab structure
- [ ] Move fields to appropriate tabs
- [ ] Add missing fields (image upload, short desc, etc.)
- [ ] Remove/archive unused fields

### Phase 5: Card-Based Editors (Days 7-8)
**Tasks:**
- [ ] Build drag-drop card component
- [ ] Implement for Core Responsibilities
- [ ] Implement for Tasks
- [ ] Implement for Tools & Technology
- [ ] Add inline editing
- [ ] Connect to database

### Phase 6: Skills Integration (Day 9)
**Tasks:**
- [ ] Connect to skills taxonomy (not Lightcast)
- [ ] Add search functionality
- [ ] Integrate Skills Extractor
- [ ] Add "Open Skills Extractor for SOC" button
- [ ] Show current curated skills

### Phase 7: Assessment Management (Day 10)
**Tasks:**
- [ ] Build assessment viewer
- [ ] Show questions by section
- [ ] Enable editing
- [ ] Add weighting controls
- [ ] Generate new assessment flow

### Phase 8: SEO Enhancements (Day 11)
**Tasks:**
- [ ] Add OG tag fields
- [ ] Implement URL slug validation
- [ ] Build AI SEO generator
- [ ] Test slug uniqueness

### Phase 9: Image Management (Day 12)
**Tasks:**
- [ ] Add image upload component
- [ ] Show current image preview
- [ ] Implement remove functionality
- [ ] Connect to storage (Supabase Storage)

### Phase 10: Testing & Polish (Day 13)
**Tasks:**
- [ ] Test all fields save correctly
- [ ] Verify user-facing changes reflect immediately
- [ ] Test with company admin role
- [ ] Polish UI/UX
- [ ] Add loading states
- [ ] Add success/error messages

---

## 🎯 SUCCESS CRITERIA

### For Super Admins:
- [ ] Can edit any role with full context
- [ ] See all existing data pre-populated
- [ ] Override O*NET data easily
- [ ] Manage assessments comprehensively
- [ ] Control SEO and metadata

### For Company Admins (Future):
- [ ] Can edit only their company's roles
- [ ] Same comprehensive interface
- [ ] Can't access other companies' data
- [ ] Can manage their role assessments
- [ ] Can customize O*NET baseline

### For User-Facing Experience:
- [ ] All edits reflect immediately on cards
- [ ] All edits reflect immediately on detail pages
- [ ] No orphaned data (everything editable is displayed)
- [ ] No missing data (everything displayed is editable)
- [ ] SEO metadata works correctly
- [ ] Images display properly

---

## 📝 QUESTIONS FOR KEITH

1. **Salary Logic:** Should median be calculated from min/max, or should employers set it directly?

2. **Unused Fields:** If fields like "Growth Opportunities" aren't displayed anywhere, should we:
   - Remove them entirely?
   - Keep them in "Additional Details" tab for future use?
   - Add them to detail page?

3. **Skills Taxonomy:** Confirm we should use `soc_skills` table (curated) not Lightcast (30k+ skills)?

4. **Assessment Scope:** Should employers be able to:
   - Edit individual questions?
   - Change question weights?
   - Add custom questions?
   - Or just select from pre-generated assessments?

5. **URL Slugs:** Should we support custom slugs or keep GUIDs for stability?

6. **Company Admin Access:** What features should be disabled/hidden for company admins vs super admins?

---

## 🚀 NEXT STEPS

**Immediate:**
1. Review this document with Keith
2. Answer outstanding questions
3. Prioritize phases
4. Begin Phase 1: Data Audit

**This Week:**
- Complete data audit
- Implement pre-population system
- Add contextual header
- Reorganize AI buttons

**Next Week:**
- Tab reorganization
- Card-based editors
- Skills integration
- Assessment management

---

**Document Status:** Draft for Review  
**Last Updated:** October 9, 2025 11:50 PM
