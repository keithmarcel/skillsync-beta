# Enum Standardization - SkillSync

**Date:** October 21, 2025  
**Status:** 🔴 Critical - Needs immediate fix  
**Migration:** `20251021000000_standardize_skill_band_enum.sql`

---

## Problem

We have inconsistent enum naming across the database, code, and UI, causing bugs where skill proficiency levels don't display correctly.

### Current Inconsistencies

**Database (`skill_band` enum):**
```sql
'proficient'           -- ✅ Consistent
'building_proficiency' -- ❌ Too verbose, inconsistent with code
'needs_development'    -- ❌ Too verbose, inconsistent with code
```

**Code Expectations:**
```typescript
// Different files expect different values:
'proficient'     // ✅ Consistent everywhere
'building'       // ❌ Doesn't match DB
'needs_dev'      // ❌ Doesn't match DB
'developing'     // ❌ Doesn't match DB
```

**User-Facing Labels:**
```typescript
"Ready"         // ✅ Clear (matches "Roles You're Ready For")
"Almost There"  // ✅ Clear
"Developing"    // ✅ Clear
```

---

## Solution

### Standardized Enum Values

**Database (`skill_band` enum):**
```sql
CREATE TYPE skill_band AS ENUM (
  'proficient',   -- 80%+ mastery
  'building',     -- 60-79% building proficiency
  'developing'    -- <60% needs development
);
```

**TypeScript Type:**
```typescript
export type SkillBand = 'proficient' | 'building' | 'developing';
```

**User-Facing Labels:**
```typescript
const SKILL_BAND_LABELS: Record<SkillBand, string> = {
  proficient: 'Ready',        // Matches "Roles You're Ready For"
  building: 'Almost There',
  developing: 'Developing'
};
```

**Score Thresholds:**
```typescript
const SKILL_BAND_THRESHOLDS = {
  proficient: 80,   // 80%+ = Ready
  building: 60,     // 60-79% = Almost There
  developing: 0     // 0-59% = Developing
};
```

---

## Migration Plan

### Step 1: Run Database Migration ✅
```bash
# Migration file: supabase/migrations/20251021000000_standardize_skill_band_enum.sql
# This will:
# 1. Create new enum with standardized values
# 2. Migrate existing data (building_proficiency → building, needs_development → developing)
# 3. Replace old enum with new one
```

### Step 2: Update Code References

**Files to Update:**

1. **`src/hooks/useSnapshotData.ts`**
   ```typescript
   // BEFORE:
   if (sr.band === 'building_proficiency') { ... }
   if (sr.band === 'needs_development') { ... }
   
   // AFTER:
   if (sr.band === 'building') { ... }
   if (sr.band === 'developing') { ... }
   ```

2. **`src/lib/database/queries.ts`**
   - Search for any `building_proficiency` or `needs_development`
   - Replace with `building` and `developing`

3. **`scripts/reseed-assessments.js`**
   ```javascript
   // BEFORE:
   let band = 'needs_development'
   if (ss.score_pct >= 60) band = 'building_proficiency'
   
   // AFTER:
   let band = 'developing'
   if (ss.score_pct >= 60) band = 'building'
   ```

4. **Any assessment result displays**
   - Check all components that display skill bands
   - Ensure they use the new values

### Step 3: Update Type Definitions

**`src/types/assessment.ts` or similar:**
```typescript
export type SkillBand = 'proficient' | 'building' | 'developing';

export const SKILL_BAND_CONFIG = {
  proficient: {
    label: 'Ready',
    color: 'green',
    threshold: 80,
    description: 'Ready to use this skill in a professional setting'
  },
  building: {
    label: 'Almost There',
    color: 'yellow',
    threshold: 60,
    description: 'Building proficiency in this skill'
  },
  developing: {
    label: 'Developing',
    color: 'blue',
    threshold: 0,
    description: 'Developing this skill'
  }
} as const;
```

---

## Benefits

1. **Consistency** - Same values everywhere (DB, code, types)
2. **Shorter** - `building` vs `building_proficiency` (easier to type/read)
3. **Clear** - Matches user-facing language
4. **Maintainable** - Single source of truth
5. **Type-safe** - TypeScript can enforce correct values

---

## Testing Checklist

After migration and code updates:

- [ ] Run migration on local database
- [ ] Reseed assessments with new enum values
- [ ] Verify homepage Skills Snapshot shows correct breakdown
- [ ] Check assessment results pages show correct skill bands
- [ ] Verify skill band colors/labels display correctly
- [ ] Test assessment creation with new values
- [ ] Confirm no TypeScript errors
- [ ] Check all skill-related queries work

---

## Rollback Plan

If issues arise:

```sql
-- Revert to old enum values
CREATE TYPE skill_band_old AS ENUM (
  'proficient',
  'building_proficiency',
  'needs_development'
);

-- Migrate data back
ALTER TABLE assessment_skill_results ADD COLUMN band_old skill_band_old;
UPDATE assessment_skill_results
SET band_old = CASE 
  WHEN band::text = 'building' THEN 'building_proficiency'::skill_band_old
  WHEN band::text = 'developing' THEN 'needs_development'::skill_band_old
  ELSE band::text::skill_band_old
END;

ALTER TABLE assessment_skill_results DROP COLUMN band;
ALTER TABLE assessment_skill_results RENAME COLUMN band_old TO band;
DROP TYPE skill_band;
ALTER TYPE skill_band_old RENAME TO skill_band;
```

---

## Related Files

- Migration: `supabase/migrations/20251021000000_standardize_skill_band_enum.sql`
- Hook: `src/hooks/useSnapshotData.ts`
- Script: `scripts/reseed-assessments.js`
- Types: `src/types/assessment.ts` (to be created)

---

**Priority:** 🔴 **CRITICAL** - Fix immediately  
**Effort:** 🟡 **Medium** - 1-2 hours  
**Risk:** 🟢 **Low** - Clear migration path, easy rollback
