# Programs Catalog Implementation Plan

**Epic:** Complete Education Provider Catalog with CIP/SOC Mapping  
**Priority:** CRITICAL - Blocks Assessment Experience  
**Estimated Time:** 8-12 hours  
**Dependencies:** None (can start immediately)

---

## 🎯 OBJECTIVE

Build complete programs catalog with accurate skills/SOC mapping so assessment results can recommend relevant programs for skill gaps.

---

## 📋 REQUIREMENTS

### Data Source
- BISC Amplified Portfolio CSV (200+ programs)
- CIP codes for each program
- Skills associated with each program
- SOC codes mapped via CIP crosswalk

### Key Relationships
```
Assessment → Skill Gaps → Required Skills → Programs (via skills match)
Programs → CIP Codes → SOC Codes → Jobs
Programs → Skills → Jobs (reverse search)
```

---

## 🔧 IMPLEMENTATION TASKS

### 1. CIP API Integration & Crosswalk (3-4 hours)
**File:** `/src/lib/services/cip-api.ts`

- [ ] Research CIP data sources (NCES IPEDS, manual crosswalk)
- [ ] Implement CIP-to-SOC crosswalk lookup
- [ ] Create CIP data enrichment service
- [ ] Test CIP code validation

**Deliverable:** Service that maps CIP codes to SOC codes

---

### 2. Programs Data Import (2-3 hours)
**File:** `/src/lib/services/program-import.ts`

- [ ] Parse BISC Amplified Portfolio CSV
- [ ] Map CSV columns to database schema
- [ ] Enrich programs with CIP data
- [ ] Associate programs with SOC codes (via CIP)
- [ ] Import into database

**Database Check:**
- Verify `programs` table has CIP code field
- Verify `program_skills` junction table exists
- Verify `program_soc_codes` relationship

---

### 3. Skills-to-Programs Matching Engine (3-4 hours)
**File:** `/src/lib/services/program-matching.ts`

**Core Algorithm:**
```typescript
function matchProgramsToGaps(skillGaps: Skill[]): Program[] {
  // 1. Get required skills from gaps
  // 2. Find programs that teach those skills
  // 3. Rank by relevance (% of gaps covered)
  // 4. Filter by location/availability
  // 5. Return top matches
}
```

- [ ] Implement gap-to-program matching
- [ ] Add relevance scoring (% of gaps covered)
- [ ] Implement reverse search (programs → skills → jobs)
- [ ] Add filtering (location, cost, duration)

---

### 4. Programs Admin Tools (2-3 hours)
**File:** `/src/app/admin/programs/page.tsx`

- [ ] Provider can add/edit programs
- [ ] CIP code selection with autocomplete
- [ ] Skills association interface
- [ ] SOC code mapping display
- [ ] Bulk import interface

---

### 5. Programs Display Pages (Already exist - verify)
**Files:**
- `/src/app/(main)/programs/page.tsx` - Browse all programs
- `/src/app/(main)/programs/[id]/page.tsx` - Program details

- [ ] Test programs listing page
- [ ] Verify program detail page shows:
  - Skills taught
  - Jobs prepared for (via SOC)
  - Provider info
  - Cost, duration, format
- [ ] Test search by skills
- [ ] Test filtering

---

## 📊 DATABASE SCHEMA

### Verify Existing Tables
```sql
-- programs table
- id, title, description, provider_id
- cip_code (TEXT) -- ADD IF MISSING
- duration_weeks, cost, format
- created_at, updated_at

-- program_skills (junction)
- program_id, skill_id
- relevance_score

-- program_soc_codes (junction) -- CREATE IF MISSING
- program_id, soc_code
- via_cip_crosswalk (BOOLEAN)
```

---

## 🧪 TESTING CHECKLIST

- [ ] Import 200+ programs successfully
- [ ] CIP-to-SOC mapping accurate
- [ ] Skills-to-programs matching works
- [ ] Reverse search (programs → jobs) works
- [ ] Admin can add/edit programs
- [ ] Programs display correctly on browse page
- [ ] Program details show all relationships

---

## 📦 DELIVERABLES

1. ✅ 200+ programs in database
2. ✅ CIP-to-SOC crosswalk functional
3. ✅ Skills-to-programs matching engine
4. ✅ Admin tools for program management
5. ✅ Programs pages displaying correctly

---

## 🚀 SUCCESS CRITERIA

- User takes assessment → Gets skill gaps → Sees relevant programs
- Programs accurately map to SOC codes via CIP
- Reverse search shows which jobs a program prepares for
- Admin can manage programs easily
- All 200+ programs have complete data

---

**Status:** Not Started  
**Next Action:** Research CIP API options and create crosswalk service
