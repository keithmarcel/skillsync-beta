# Three-Layer Weighting System Implementation

**Status:** In Progress  
**Branch:** `feature/question-level-weighting`  
**Started:** 2025-10-01  
**Target Completion:** 2025-10-01 (Beta)

## Overview

Implementing sophisticated three-layer weighting system to prevent the "teamwork vs algorithms" problem in assessments. This ensures that critical technical skills are weighted appropriately vs generic soft skills.

## Problem Statement

Traditional assessments treat all questions equally:
- Software developer scores 70% overall
- Got "Can you write algorithms?" WRONG
- Got "Do you work well with others?" RIGHT
- **Result:** Looks borderline qualified, but actually lacks critical technical skills

## Solution: Multi-Dimensional Weighting

### Layer 1: Question-Level Weighting
- Each question has importance score (1.0-5.0)
- Critical questions worth more than basic questions
- Based on O*NET skill importance ratings

### Layer 2: Skill-Level Weighting
- Each skill has company-specific importance (1.0-5.0)
- Set by employers for featured roles
- Default to O*NET importance for occupations

### Layer 3: Market Demand Multipliers
- Skills adjusted by market demand (0.7x-1.25x)
- Critical skills (high growth, high demand): 1.25x
- Declining skills (shrinking market): 0.7x
- Based on free O*NET + BLS data

## Implementation Progress

### ✅ Phase 1: Database Schema (COMPLETED)

**Date:** 2025-10-01

**Changes:**
- Added `skills.onet_importance` column (DECIMAL 3,1)
- Added `quiz_questions.importance` column (DECIMAL 3,1, default 3.0)
- Added `skills.is_assessable` flag (BOOLEAN, default true)
- Created indexes for performance

**Migration:** `20251001000000_add_importance_columns.sql`

**Verification:**
```sql
-- Verify columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name IN ('skills', 'quiz_questions') 
AND column_name IN ('onet_importance', 'importance', 'is_assessable');
```

### ✅ Phase 2: Skills Taxonomy Cleanup (COMPLETED)

**Date:** 2025-10-01

**What We Did:**
1. Created `skills-taxonomy-mapper.ts` service
2. Identified 50+ generic skills to exclude
3. Created `remap-job-skills.js` script
4. Removed 69 generic skills from 38 jobs
5. Kept 79 domain-specific assessable skills

**Generic Skills Removed:**
- Physical abilities: Near Vision, Far Vision, Manual Dexterity
- Basic skills: English Language, Reading Comprehension, Active Listening
- Cognitive abilities: Oral Comprehension, Written Expression, Deductive Reasoning
- Soft skills: Customer Service, Social Perceptiveness, Coordination

**Domain Skills Kept:**
- Medicine and Dentistry
- Economics and Accounting
- Production and Processing
- Sales and Marketing
- Law and Government
- Administration and Management
- Psychology
- Transportation
- Public Safety and Security

**Files:**
- `src/lib/services/skills-taxonomy-mapper.ts`
- `scripts/remap-job-skills.js`

**Results:**
```
Total jobs processed: 38
Generic skills removed: 69
Assessable skills kept: 79
```

### 🔄 Phase 3: O*NET Importance Population (IN PROGRESS)

**Date:** 2025-10-01

**Goal:** Populate `onet_importance` column with ratings from O*NET API

**Script:** `scripts/populate-onet-importance.js`

**Process:**
1. Fetch O*NET skills for each SOC code
2. Match skills by name (fuzzy matching)
3. Extract importance rating (1.0-5.0)
4. Update skills table with onet_importance and onet_id

**API Details:**
- Endpoint: `https://services.onetcenter.org/ws/online/occupations/{soc}/skills`
- Auth: Basic (username/password from env)
- Rate limit: 10 requests/second
- Free tier: Sufficient for our needs

**Next Steps:**
1. Run population script
2. Verify importance scores are reasonable
3. Handle skills without O*NET matches (assign default 3.0)

### ⏳ Phase 4: Question-Level Weighting (PENDING)

**Target:** After O*NET population complete

**Changes Needed:**

**1. Quiz Generation (`quiz-generation.ts`):**
```typescript
// When generating questions, assign importance based on skill
const questionImportance = skill.onet_importance || 3.0

await supabase.from('quiz_questions').insert({
  section_id: section.id,
  stem: question.stem,
  choices: question.choices,
  answer_key: question.answer_key,
  difficulty: question.difficulty,
  importance: questionImportance  // NEW: Add importance
})
```

**2. Assessment Engine (`assessment-engine.ts`):**
```typescript
// Calculate question-level weighted score
function calculateQuestionScore(
  isCorrect: boolean,
  questionImportance: number,
  difficultyMultiplier: number
): number {
  const baseScore = isCorrect ? 100 : 0
  return baseScore * questionImportance * difficultyMultiplier
}

// Calculate skill-level weighted score
function calculateSkillScore(
  questionScores: number[],
  skillImportance: number,
  marketMultiplier: number
): number {
  const totalQuestionWeight = questionScores.reduce((sum, score) => sum + score, 0)
  const maxPossibleWeight = questionScores.length * 100 * 5.0 * 1.3
  
  const rawSkillScore = (totalQuestionWeight / maxPossibleWeight) * 100
  return rawSkillScore * skillImportance * marketMultiplier
}
```

**3. Update Response Fetching:**
```typescript
// Fetch quiz responses with question importance
const { data: responses } = await supabase
  .from('quiz_responses')
  .select(`
    *,
    question:quiz_questions(
      id,
      importance,  // NEW: Include importance
      section:quiz_sections(skill_id)
    )
  `)
  .eq('assessment_id', assessmentId)
```

### ⏳ Phase 5: Market Demand Multipliers (PENDING)

**Target:** After question weighting implemented

**Data Sources:**
- O*NET importance ratings (already fetched)
- BLS employment projections (10-year outlook)
- BLS wage data (for context)

**Multiplier Logic:**
```typescript
const marketMultipliers = {
  critical: 1.25,    // High growth (>20%), high demand (50K+ jobs)
  high: 1.15,        // Growing (10-20%), many openings (20K+ jobs)
  moderate: 1.0,     // Stable (0-10%), steady demand
  low: 0.85,         // Declining (-5-0%), limited openings
  declining: 0.7     // Shrinking (<-5%), obsolete skills
}
```

**Implementation:**
1. Create BLS data fetching service
2. Map SOC codes to BLS occupation codes
3. Fetch employment projections
4. Calculate market demand category
5. Apply multipliers in assessment engine

### ⏳ Phase 6: Results Page Visualization (PENDING)

**Target:** After market demand multipliers

**Add to Results Page:**
- Market demand indicators (⭐ High Demand, 📉 Declining, etc.)
- Job count context ("50K+ open positions")
- Growth rate context ("15% projected growth")
- Priority guidance ("High priority for development")

**Design:**
```tsx
<div className="flex items-center gap-2">
  <span className="font-medium">{skill.name}</span>
  <span className="text-sm text-green-600 flex items-center gap-1">
    ⭐ High Demand
  </span>
</div>
<p className="text-xs text-gray-600">
  Critical skill - 50K+ open positions nationally
</p>
```

## Testing Strategy

### Unit Tests
- Question weighting calculations
- Skill weighting calculations
- Market multiplier logic
- Overall readiness calculation

### Integration Tests
- Full assessment flow with weighted scoring
- Simulator scenarios with different skill mixes
- Verify "teamwork vs algorithms" problem is solved

### Test Scenarios

**Scenario 1: Technical Skills Matter**
- 5 algorithm questions (importance: 5.0, market: 1.25x)
- 3 code review questions (importance: 4.0, market: 1.15x)
- 2 teamwork questions (importance: 3.0, market: 1.0x)

**Candidate A:** Gets algorithms wrong, teamwork right
- Expected: ~48% (not qualified)

**Candidate B:** Gets algorithms right, teamwork wrong
- Expected: ~74% (qualified)

**Scenario 2: Market Demand Impact**
- Python (importance: 4.5, market: 1.25x critical)
- COBOL (importance: 4.5, market: 0.7x declining)

**Candidate:** 90% on both
- Python weighted higher in overall score
- Results page shows Python as high-priority skill

## Success Metrics

### Technical Accuracy
- ✅ Question importance scores populated from O*NET
- ✅ Weighted scores differ from raw scores
- ✅ Critical skills weighted higher than soft skills
- ✅ Market demand affects final scores appropriately

### Business Impact
- ✅ "Teamwork vs algorithms" problem solved
- ✅ Employers see accurate technical proficiency
- ✅ Job seekers get honest feedback on marketable skills
- ✅ Assessment results feel "shockingly accurate"

## Files Modified

### New Files
- `src/lib/services/skills-taxonomy-mapper.ts`
- `scripts/remap-job-skills.js`
- `scripts/populate-onet-importance.js`
- `supabase/migrations/20251001000000_add_importance_columns.sql`
- `docs/WEIGHTING_SYSTEM_IMPLEMENTATION.md`

### Modified Files
- `docs/features/assessment-proficiency-engine.md` (updated roadmap)
- `src/lib/services/assessment-engine.ts` (will update for weighting)
- `src/lib/services/quiz-generation.ts` (will update for importance)
- `src/app/(main)/assessments/[id]/results/page.tsx` (will add market indicators)

## Rollback Plan

If weighting causes issues:

1. **Database:** Columns are nullable, won't break existing code
2. **Code:** Falls back to default importance (3.0) if null
3. **Assessments:** Existing assessments still work with raw scores
4. **Migration:** Can drop columns if needed:
```sql
ALTER TABLE skills DROP COLUMN IF EXISTS onet_importance;
ALTER TABLE quiz_questions DROP COLUMN IF EXISTS importance;
ALTER TABLE skills DROP COLUMN IF EXISTS is_assessable;
```

## Next Actions

1. ✅ Apply database migration
2. 🔄 Run O*NET importance population script
3. ⏳ Verify importance scores
4. ⏳ Implement question-level weighting
5. ⏳ Test with simulator
6. ⏳ Add market demand multipliers
7. ⏳ Update results page visualization
8. ⏳ Full end-to-end testing

---

**Last Updated:** 2025-10-01  
**Next Review:** After O*NET population complete
