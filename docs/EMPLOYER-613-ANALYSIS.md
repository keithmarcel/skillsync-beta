# EMPLOYER-613: Retake Policy Override per Role - Analysis

**Story ID:** EMPLOYER-613  
**Priority:** P2  
**Status:** Not Started  
**Category:** Employer Admin → Listed Roles Tab  
**Type:** UI + Backend

---

## Current State

### Global Retake Cooldown (Implemented)
**Location:** `/src/app/(main)/my-assessments/page.tsx` (lines 251-320)

**Current Implementation:**
- **24-hour cooldown** applies to ALL assessments globally
- Calculated from `analyzed_at` timestamp
- Shows countdown timer: "Retake in Xh"
- Tooltip: "Assessments can only be taken once every 24 hours"
- Role-ready assessments show "View Invites" instead

**Code:**
```typescript
const hoursSinceAnalysis = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60)
const hoursRemaining = Math.max(0, 24 - hoursSinceAnalysis)
const isOnCooldown = hoursRemaining > 0
```

**Limitations:**
- ❌ No per-role customization
- ❌ No employer control
- ❌ Hardcoded 24-hour period
- ❌ No database field to override

---

## Proposed Feature: Per-Role Retake Policy

### Business Requirements

**Use Cases:**
1. **High-stakes roles** (e.g., Senior positions) → Longer cooldown (48-72 hours)
2. **Entry-level roles** → Shorter cooldown (12-24 hours)
3. **Practice assessments** → No cooldown (unlimited retakes)
4. **Seasonal hiring** → Temporary cooldown adjustments

**Employer Benefits:**
- Prevent assessment spam for critical roles
- Allow more retakes for high-volume hiring
- Customize based on role complexity
- Reduce candidate frustration with appropriate policies

---

## Technical Implementation

### 1. Database Schema Changes

**Add field to `jobs` table:**
```sql
ALTER TABLE jobs 
ADD COLUMN retake_cooldown_hours INTEGER DEFAULT 24;

COMMENT ON COLUMN jobs.retake_cooldown_hours IS 
'Hours required between assessment retakes. NULL = use global default (24h), 0 = no cooldown';
```

**Constraints:**
- Allow NULL (use global default)
- Allow 0 (no cooldown)
- Allow positive integers (custom hours)
- Recommended range: 0-168 hours (1 week max)

### 2. UI Changes

**Role Editor (Assessment & Proficiency Tab):**

Add field after `visibility_threshold_pct`:

```typescript
{
  key: 'retake_cooldown_hours',
  label: 'Retake Cooldown Period (hours)',
  type: EntityFieldType.NUMBER,
  required: false,
  placeholder: '24 (default)',
  description: 'Hours required between assessment retakes for this role',
  helpText: (
    <span className="flex items-center gap-1.5 text-xs text-gray-600">
      <svg>...</svg>
      Leave blank for default (24h). Set to 0 for unlimited retakes. Max: 168 hours (1 week)
    </span>
  )
}
```

**Validation:**
- Min: 0 (no cooldown)
- Max: 168 (1 week)
- Default: 24 (if NULL)

### 3. Frontend Logic Changes

**Update My Assessments Page:**

```typescript
// Current (hardcoded 24 hours)
const hoursRemaining = Math.max(0, 24 - hoursSinceAnalysis)

// Proposed (use job's retake policy)
const cooldownPeriod = assessment.job?.retake_cooldown_hours ?? 24
const hoursRemaining = Math.max(0, cooldownPeriod - hoursSinceAnalysis)
const isOnCooldown = cooldownPeriod > 0 && hoursRemaining > 0

// Handle no cooldown case
if (cooldownPeriod === 0) {
  // Show "Retake Quiz" immediately, no cooldown
}
```

**Update Query:**
```typescript
const { data: assessments } = await supabase
  .from('assessments')
  .select(`
    *,
    job:jobs(
      id, 
      title, 
      soc_code, 
      job_kind, 
      required_proficiency_pct,
      retake_cooldown_hours,  // ADD THIS
      company:companies(name)
    ),
    skill_results:assessment_skill_results(band),
    invitation:employer_invitations(status)
  `)
```

### 4. Backend Validation (Optional)

**Add server-side check in assessment API:**

```typescript
// Before allowing quiz retake
const { data: lastAssessment } = await supabase
  .from('assessments')
  .select('analyzed_at, job:jobs(retake_cooldown_hours)')
  .eq('user_id', userId)
  .eq('job_id', jobId)
  .order('analyzed_at', { ascending: false })
  .limit(1)
  .single()

if (lastAssessment) {
  const cooldownHours = lastAssessment.job.retake_cooldown_hours ?? 24
  const hoursSince = (Date.now() - new Date(lastAssessment.analyzed_at).getTime()) / (1000 * 60 * 60)
  
  if (cooldownHours > 0 && hoursSince < cooldownHours) {
    return { error: 'Retake cooldown period not elapsed' }
  }
}
```

---

## Implementation Checklist

### Phase 1: Database (Required)
- [ ] Create migration: `add_retake_cooldown_to_jobs.sql`
- [ ] Add `retake_cooldown_hours INTEGER DEFAULT 24` column
- [ ] Add column comment
- [ ] Test migration on dev database

### Phase 2: UI (Required)
- [ ] Add field to role editor (admin + employer)
- [ ] Add validation (0-168 range)
- [ ] Add helpText with explanation
- [ ] Update TypeScript interfaces

### Phase 3: Frontend Logic (Required)
- [ ] Update My Assessments cooldown calculation
- [ ] Update query to fetch `retake_cooldown_hours`
- [ ] Handle NULL (use default 24)
- [ ] Handle 0 (no cooldown)
- [ ] Update tooltip text to show custom period

### Phase 4: Backend Validation (Optional - P2)
- [ ] Add server-side cooldown check
- [ ] Return error if cooldown not elapsed
- [ ] Add tests for edge cases

### Phase 5: Testing (Required)
- [ ] Test NULL value (uses default 24h)
- [ ] Test 0 value (no cooldown)
- [ ] Test custom values (12h, 48h, 72h)
- [ ] Test boundary values (0, 168)
- [ ] Test invalid values (negative, > 168)
- [ ] Test UI validation
- [ ] Test cooldown calculation accuracy

---

## Migration SQL

```sql
-- Migration: Add retake cooldown override per role
-- Story: EMPLOYER-613

-- Add retake_cooldown_hours column to jobs table
ALTER TABLE jobs 
ADD COLUMN retake_cooldown_hours INTEGER DEFAULT 24;

-- Add check constraint for valid range
ALTER TABLE jobs
ADD CONSTRAINT check_retake_cooldown_range
CHECK (retake_cooldown_hours IS NULL OR (retake_cooldown_hours >= 0 AND retake_cooldown_hours <= 168));

-- Add column comment
COMMENT ON COLUMN jobs.retake_cooldown_hours IS 
'Hours required between assessment retakes for this role. NULL = use global default (24h), 0 = no cooldown, max 168 (1 week)';

-- Create index for queries filtering by cooldown
CREATE INDEX IF NOT EXISTS idx_jobs_retake_cooldown 
ON jobs(retake_cooldown_hours) 
WHERE retake_cooldown_hours IS NOT NULL;
```

---

## Estimated Effort

**Total:** 4-6 hours

**Breakdown:**
- Database migration: 30 min
- UI field addition: 1 hour
- Frontend logic update: 2 hours
- Testing: 1-2 hours
- Documentation: 30 min

**Dependencies:**
- None (standalone feature)

**Risk:** Low
- Non-breaking change (default maintains current behavior)
- Backward compatible (NULL = 24 hours)
- Optional field (can be added incrementally)

---

## Recommendation

**Priority:** P2 (Nice to have, not critical for MVP)

**Rationale:**
- Current 24-hour global cooldown works for most cases
- Adds complexity for marginal benefit
- Can be added post-MVP based on employer feedback
- No urgent business need identified

**Suggested Timeline:**
- Post-MVP enhancement
- Implement after gathering employer feedback
- Consider if employers request different cooldown periods

**Alternative:**
- Keep global 24-hour cooldown for MVP
- Add this feature in Phase 2 if employers request it
- Document as "future enhancement"

---

## Status

**Current:** Not Started  
**Next Steps:** 
1. Confirm business requirement with stakeholders
2. Validate use cases with employers
3. If approved, create migration and implement UI
4. Otherwise, defer to post-MVP backlog
