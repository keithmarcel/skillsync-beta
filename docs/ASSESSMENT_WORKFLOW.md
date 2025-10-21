# Assessment Workflow & Data Integrity

**Last Updated:** October 21, 2025  
**Status:** ✅ Production Ready

---

## Overview

This document defines the complete assessment workflow from employer role setup through learner assessment to homepage display. This workflow ensures data integrity across the entire pipeline.

---

## The Complete Flow

### 1. Employer Sets Requirements

**Location:** Role creation/editing (Admin CMS)  
**Field:** `jobs.required_proficiency_pct`  
**Values:** Typically 75%, 90%, or 95%  
**Purpose:** Defines the proficiency threshold for "role ready" status

```sql
-- Example: Business Development Manager requires 90% proficiency
UPDATE jobs 
SET required_proficiency_pct = 90 
WHERE id = '590fac62-9993-48b1-8f98-dbe316aa8f8e';
```

**Display Locations:**
- Featured job cards
- Job details page
- Assessment intro page

---

### 2. Learner Takes Assessment

**Location:** `/assessments/[id]/quiz/[quizId]` or `/assessments/resume/[jobId]`  
**Process:**
1. Learner answers skill-based questions
2. System calculates `score_pct` for each skill
3. System assigns `band` based on score:
   - `proficient`: 80%+ (Ready)
   - `building`: 60-79% (Almost There)
   - `developing`: <60% (Developing)

---

### 3. Assessment Pipeline Calculates Status

**Location:** Assessment creation/analysis  
**Logic:** Uses `required_proficiency_pct` from job

```javascript
// Calculate overall readiness
const avgScore = skillScores.reduce((sum, s) => sum + s.score_pct, 0) / skillScores.length;

// Determine status_tag based on JOB'S required proficiency
let status_tag = 'needs_development';
if (avgScore >= job.required_proficiency_pct) {
  status_tag = 'role_ready';
} else if (avgScore >= job.required_proficiency_pct - 15) {
  status_tag = 'close_gaps';
}
```

**Critical:** `status_tag` is calculated ONCE during assessment and stored. It is the single source of truth.

---

### 4. Results Display

**Location:** `/assessments/[id]/results`  
**Data Used:**
- `assessment.readiness_pct` - Overall score
- `assessment.status_tag` - Role readiness status
- `job.required_proficiency_pct` - Threshold for comparison
- `assessment_skill_results.band` - Individual skill proficiency

**Display Logic:**
```typescript
// CORRECT: Use status_tag directly
if (assessment.status_tag === 'role_ready') {
  return "You're role ready!";
}

// WRONG: Don't recalculate with hardcoded thresholds
if (assessment.readiness_pct >= 80) { // ❌ NEVER DO THIS
  return "You're role ready!";
}
```

---

### 5. My Assessments Page

**Location:** `/my-assessments`  
**Display:** Assessment cards with badges

**Badge Logic:**
```typescript
const getStatusBadge = (readiness: number, status: string) => {
  // Use status_tag ONLY - it's already calculated correctly
  if (status === 'role_ready') {
    return <Badge>Role Ready</Badge>;
  } else if (status === 'close_gaps') {
    return <Badge>Close</Badge>;
  } else {
    return <Badge>Developing</Badge>;
  }
};
```

**Skill Gaps Calculation:**
```typescript
// Use NEW standardized enum values
const skillsGaps = assessment.skill_results?.filter(
  sr => sr.band === 'developing' || sr.band === 'building'
).length || 0;
```

---

### 6. Homepage Snapshot

**Location:** `/` (Homepage)  
**Hook:** `useSnapshotData.ts`

**Metrics Calculated:**

1. **Roles You're Ready For:**
   ```typescript
   const rolesReadyFor = assessments.filter(
     a => a.status_tag === 'role_ready'
   ).length;
   ```

2. **Skill Mastery:**
   - Tracks HIGHEST proficiency for each unique skill
   - Each skill counted ONCE across all assessments
   ```typescript
   const skillProficiency = new Map();
   assessments.forEach(a => {
     a.skill_results?.forEach(sr => {
       const existing = skillProficiency.get(sr.skill_id);
       if (!existing || sr.score_pct > existing.score) {
         skillProficiency.set(sr.skill_id, {
           name: sr.skill?.name,
           band: sr.band,
           score: sr.score_pct
         });
       }
     });
   });
   ```

3. **Skill Breakdown:**
   ```typescript
   const proficient = Array.from(skillProficiency.values())
     .filter(s => s.band === 'proficient').length;
   const building = Array.from(skillProficiency.values())
     .filter(s => s.band === 'building').length;
   const developing = Array.from(skillProficiency.values())
     .filter(s => s.band === 'developing').length;
   ```

---

## Data Integrity Rules

### ✅ DO:

1. **Use `status_tag` as single source of truth** for role readiness
2. **Use `required_proficiency_pct`** from job when calculating status
3. **Use standardized enum values:** `proficient`, `building`, `developing`
4. **Track highest proficiency** when aggregating skills across assessments
5. **Include skill relation** in queries: `skill:skills(name)`

### ❌ DON'T:

1. **Don't use hardcoded thresholds** (e.g., `readiness >= 80`)
2. **Don't recalculate status** in UI - use stored `status_tag`
3. **Don't use old enum values** (`building_proficiency`, `needs_development`, `needs_dev`)
4. **Don't count skill instances** - count unique skills at highest proficiency
5. **Don't mix employer proficiency with learner proficiency**

---

## Enum Standard

| Database/Code | UI Label | Score Range | Description |
|--------------|----------|-------------|-------------|
| `proficient` | **Ready** | 80%+ | Ready to use skill professionally |
| `building` | **Almost There** | 60-79% | Building proficiency |
| `developing` | **Developing** | 0-59% | Developing the skill |

---

## Status Tag Standard

| Value | Meaning | Calculation |
|-------|---------|-------------|
| `role_ready` | Meets job requirement | `readiness_pct >= required_proficiency_pct` |
| `close_gaps` | Close to requirement | `readiness_pct >= required_proficiency_pct - 15` |
| `needs_development` | Below requirement | `readiness_pct < required_proficiency_pct - 15` |

---

## Common Pitfalls

### Pitfall 1: Hardcoded Thresholds
```typescript
// ❌ WRONG - Ignores job's required_proficiency_pct
if (readiness >= 80) {
  return "Role Ready";
}

// ✅ CORRECT - Uses status_tag
if (status_tag === 'role_ready') {
  return "Role Ready";
}
```

### Pitfall 2: Old Enum Values
```typescript
// ❌ WRONG - Old enum values
sr.band === 'building_proficiency'
sr.band === 'needs_development'

// ✅ CORRECT - New standardized values
sr.band === 'building'
sr.band === 'developing'
```

### Pitfall 3: Counting Skill Instances
```typescript
// ❌ WRONG - Counts every instance
const proficient = assessments.flatMap(a => 
  a.skill_results.filter(sr => sr.band === 'proficient')
).length;

// ✅ CORRECT - Tracks highest per skill
const skillProficiency = new Map();
assessments.forEach(a => {
  a.skill_results?.forEach(sr => {
    const existing = skillProficiency.get(sr.skill_id);
    if (!existing || sr.score_pct > existing.score) {
      skillProficiency.set(sr.skill_id, { ...sr });
    }
  });
});
```

---

## Testing Checklist

- [ ] Employer can set `required_proficiency_pct` on roles
- [ ] Assessment calculates `status_tag` using job's requirement
- [ ] Results page displays correct badge based on `status_tag`
- [ ] My Assessments page shows correct badges
- [ ] Homepage "Roles Ready For" matches `status_tag` count
- [ ] Skill breakdown uses highest proficiency per skill
- [ ] No duplicate skills across proficiency categories
- [ ] All enum values are standardized

---

## Related Documentation

- [Enum Standardization](./ENUM_STANDARDIZATION.md) - Complete enum migration details
- [Skills Architecture](./SKILLS_ARCHITECTURE_CHANGE.md) - Overall skills system design
- [Project Status](./PROJECT_STATUS.md) - Current project state

---

**Maintained by:** Keith Marcel  
**Last Verified:** October 21, 2025
