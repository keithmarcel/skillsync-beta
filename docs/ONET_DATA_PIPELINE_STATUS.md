# O*NET Data Pipeline - Current Status & Action Plan

## 📊 Current State

### **What EXISTS:**

1. **✅ O*NET API Integration**
   - Service: `/src/lib/services/careeronestop-api.ts`
   - Fetches: Tasks, Skills, Knowledge, Abilities, Tools & Technology
   - Status: **Working, but not being used for HDOs**

2. **✅ Occupation Enrichment Service**
   - Service: `/src/lib/services/occupation-enrichment.ts`
   - Orchestrates: BLS + CareerOneStop API calls
   - Caching: Smart cache with expiration
   - Status: **Built, needs to be run for HDOs**

3. **✅ AI Generation Services**
   - Core Responsibilities: `/src/lib/services/generate-core-responsibilities.ts`
   - Related Titles: `/src/lib/services/generate-related-titles.ts`
   - Status: **Available as fallback/supplement**

4. **✅ Skills Enrichment**
   - Service: `/src/lib/services/skills-taxonomy-mapper.ts`
   - Maps: Lightcast → O*NET skills
   - Filters: Generic/low-value skills
   - Status: **Working**

### **What's MISSING:**

1. **❌ O*NET Data for 30 HDO Occupations**
   - Current Coverage: 79% have Core Responsibilities, 66% have Tasks
   - Missing: Tools & Technology (0% coverage)
   - Issue: Enrichment service hasn't been run for these occupations

2. **❌ Automated Pipeline for New Occupations**
   - No automatic enrichment when new occupation is added
   - Manual script execution required

3. **❌ Featured Role Inheritance Logic**
   - Featured roles don't inherit O*NET data from their SOC code
   - Waiting for SOC code refinement (AI-assisted)

---

## 🎯 Action Plan

### **Phase 1: Populate Missing O*NET Data for HDOs** (IMMEDIATE)

**Goal:** Get all 30 occupations to 100% O*NET coverage

**Steps:**
1. Create script to run occupation enrichment for all HDOs
2. Fetch from CareerOneStop API:
   - Tasks & Responsibilities
   - Tools & Technology
   - Education requirements
   - Work experience
3. Supplement with AI where O*NET data is incomplete
4. Cache results in database

**Script to Create:** `scripts/enrich-all-hdo-occupations.js`

**Estimated Time:** 30 minutes (API rate limits)

---

### **Phase 2: Featured Role SOC Code Refinement** (NEXT)

**Goal:** Use AI to validate/refine SOC codes for featured roles

**Current Situation:**
- 8 featured roles have SOC codes assigned
- Some may not be optimal matches
- Need AI to suggest better SOC codes based on job descriptions

**Approach:**
1. AI analyzes featured role title + description
2. Suggests best-fit SOC code from standard taxonomy
3. Admin reviews and approves
4. Once approved, featured role inherits O*NET data from SOC

**Script to Create:** `scripts/ai-refine-featured-role-soc-codes.js`

**Admin Tool Needed:** SOC code review/approval interface

---

### **Phase 3: Admin Override System** (LATER - Admin Tools Phase)

**Goal:** Allow companies to customize O*NET data

**Features Needed:**
1. **View Inherited Data**
   - Show what's coming from O*NET
   - Clear indication of source (O*NET vs Custom)

2. **Override Fields**
   - Edit any field (responsibilities, tasks, tools)
   - Save as company-specific override
   - Maintain link to original O*NET data

3. **Restore Defaults**
   - One-click restore to O*NET baseline
   - Show diff between custom and default

4. **Bulk Operations**
   - Apply overrides to multiple roles
   - Copy customizations between roles

**Database Schema Needed:**
```sql
-- Track which fields are overridden
ALTER TABLE jobs ADD COLUMN data_overrides JSONB DEFAULT '{}';

-- Example structure:
{
  "core_responsibilities": {
    "source": "custom",
    "original": [...],  -- O*NET data
    "custom": [...]     -- Company override
  },
  "tasks": {
    "source": "onet",   -- Still using O*NET
    "original": [...]
  }
}
```

---

## 📋 Current Data Coverage

### **Occupations (30 total):**
- ✅ Core Responsibilities: 79% (24/30)
- ✅ Tasks: 66% (20/30)
- ❌ Tools & Technology: 0% (0/30)
- ✅ Education Level: 100% (30/30) - populated via script
- ✅ Employment Outlook: 100% (30/30) - populated via script

### **Featured Roles (8 total):**
- ❌ Core Responsibilities: 0% (0/8)
- ❌ Tasks: 0% (0/8)
- ❌ Tools & Technology: 0% (0/8)
- ✅ Education Level: 100% (8/8) - populated via script
- ✅ Employment Outlook: 100% (8/8) - populated via script

**Reason:** Featured roles are company-specific and awaiting SOC code refinement before inheriting O*NET data.

---

## 🔄 Recommended Workflow

### **For HDO Occupations (Standard SOC codes):**
```
1. SOC code assigned → Automatic
2. Run enrichment service → Fetch O*NET data
3. Supplement with AI if needed → Fill gaps
4. Cache in database → Store for 90 days
5. Display on occupation page → Show to users
```

### **For Featured Roles (Company-specific):**
```
1. Company creates role → Assigns initial SOC code
2. AI reviews SOC code → Suggests refinements
3. Admin approves SOC code → Locks in classification
4. Inherit O*NET data → From approved SOC
5. Company customizes → Override specific fields
6. Display hybrid data → O*NET + custom
```

---

## 🛠️ Scripts to Create

### **1. Enrich All HDO Occupations** (Priority 1)
```javascript
// scripts/enrich-all-hdo-occupations.js
// - Fetch all occupations with job_kind='occupation'
// - Run occupation enrichment service for each
// - Populate: tasks, core_responsibilities, tools_and_technology
// - Use AI to supplement where O*NET is incomplete
```

### **2. AI SOC Code Refinement** (Priority 2)
```javascript
// scripts/ai-refine-featured-role-soc-codes.js
// - Analyze featured role descriptions
// - Suggest optimal SOC codes
// - Generate confidence scores
// - Output for admin review
```

### **3. Inherit O*NET Data for Featured Roles** (Priority 3)
```javascript
// scripts/inherit-onet-data-for-featured-roles.js
// - For each featured role with approved SOC
// - Copy O*NET data from base occupation
// - Mark as "inherited" not "custom"
// - Allow for future overrides
```

---

## 📝 Database Schema Considerations

### **Current Schema:**
```sql
-- jobs table
core_responsibilities TEXT[]  -- Array of strings
tasks JSONB                   -- Array of task objects
tools_and_technology JSONB    -- Array of tool objects
```

### **Recommended Addition:**
```sql
-- Track data source and overrides
ALTER TABLE jobs ADD COLUMN data_source_metadata JSONB DEFAULT '{
  "core_responsibilities": {"source": "onet", "last_updated": null},
  "tasks": {"source": "onet", "last_updated": null},
  "tools_and_technology": {"source": "onet", "last_updated": null}
}';

-- Track company overrides separately
CREATE TABLE job_data_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  field_name TEXT NOT NULL,
  original_data JSONB,
  custom_data JSONB,
  overridden_at TIMESTAMP DEFAULT NOW(),
  overridden_by UUID REFERENCES auth.users(id),
  UNIQUE(job_id, field_name)
);
```

---

## 🎯 Next Steps

### **Immediate (This Session):**
1. ✅ Document current state (this file)
2. ⏳ Create enrichment script for HDOs
3. ⏳ Run enrichment to get 100% coverage

### **Short Term (Next Session):**
1. Create AI SOC code refinement script
2. Review featured role SOC codes
3. Implement inheritance logic

### **Long Term (Admin Tools Phase):**
1. Build admin override interface
2. Implement data source tracking
3. Create restore defaults functionality
4. Add bulk operations

---

## 📚 Related Documentation

- **BLS API Research:** `/docs/BLS_API_RESEARCH_FINDINGS.md`
- **OEWS Import Guide:** `/docs/OEWS_DATA_IMPORT_GUIDE.md`
- **Phase 1C Completion:** `/docs/PHASE_1C_COMPLETION_SUMMARY.md`
- **HDO Implementation Plan:** `/docs/HDO_PIVOT_IMPLEMENTATION_PLAN.md`

---

## ✅ Decision Log

**Decision 1: Featured Role O*NET Inheritance**
- **When:** After SOC code refinement with AI
- **Why:** Want accurate SOC codes before inheriting data
- **Status:** Deferred to SOC refinement phase

**Decision 2: Admin Override System**
- **When:** Admin Tools phase (Phase 2B)
- **Why:** Core feature but not blocking HDO launch
- **Status:** Logged for future implementation

**Decision 3: HDO Enrichment Priority**
- **When:** Immediate
- **Why:** Needed for complete occupation pages
- **Status:** In progress

---

**Last Updated:** October 9, 2025
**Status:** Action plan defined, ready for implementation
