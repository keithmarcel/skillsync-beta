# What's Next: CIP-SOC-Skills Pipeline

## ✅ Completed (Sept 30, 2025)

### Day 1: CIP Data Foundation
- ✅ Imported 1,949 CIP codes from NCES
- ✅ Imported 5,903 CIP-SOC crosswalk mappings
- ✅ Database tables populated and validated

### Day 2: CIP Assignment & Admin Polish
- ✅ All 223 programs have CIP codes
- ✅ AI-generated short descriptions (13-15 words)
- ✅ Admin UI improvements (CIP column, helpText, Select fixes)
- ✅ Featured programs filter fixed
- ✅ Global OpenAI configuration (gpt-4o-mini)

---

## 🎯 Next: Day 3 - Skills Extraction Pipeline

### Goal
Extract skills for all programs using the CIP → SOC → Skills pipeline

### The Flow
```
Program (CIP Code) 
  ↓
CIP-SOC Crosswalk (get related SOC codes)
  ↓
Job Skills (get skills for each SOC)
  ↓
Aggregate & Rank Skills
  ↓
Select Top 8 Skills
  ↓
Insert into program_skills table
```

### Implementation Steps

#### 1. Create Skills Extraction Service
**File:** `/src/lib/services/program-skills-extraction.ts`

```typescript
export async function extractSkillsForProgram(programId: string) {
  // 1. Get program CIP code
  // 2. Look up SOC codes from crosswalk
  // 3. Get skills for each SOC from job_skills
  // 4. Aggregate and deduplicate
  // 5. Rank by frequency + importance
  // 6. Select top 8
  // 7. Insert into program_skills
}
```

**Ranking Algorithm:**
- Frequency: How many SOCs require this skill? (40% weight)
- Importance: O*NET skill importance rating (40% weight)
- Relevance: Match to program discipline (20% weight)

#### 2. Create Batch Processing Script
**File:** `/scripts/extract-program-skills.js`

- Process all 223 programs
- Show progress with skill counts
- Handle programs with no SOC mappings
- Validate skill data exists

#### 3. Admin UI for Skills Management
**Location:** `/admin/programs/[id]` - Skills tab

- Show extracted skills (read-only initially)
- Display skill weights/importance
- Future: Allow manual curation (add/remove skills)

#### 4. Validation & Testing
- Verify all programs have 5-8 skills
- Check skill quality and relevance
- Test program-job matching queries

### Expected Results
- ✅ All 223 programs have skills in `program_skills` table
- ✅ Average 5-8 skills per program
- ✅ Skills sourced from O*NET/Lightcast taxonomy
- ✅ Skills weighted by importance and frequency

### Timeline
**Estimated:** 1 day (6-8 hours)
- 2 hours: Build extraction service
- 2 hours: Create batch script
- 2 hours: Run and validate
- 2 hours: Admin UI updates

---

## 🚀 Future Phases (After Day 3)

### Phase 2: Program-Job Matching (Week 2)
**Goal:** Show "Related Jobs" and "Related Programs" based on shared skills

**Features:**
- Jaccard similarity algorithm
- Match threshold: 70% for "Strong Match"
- Related jobs on program detail pages
- Related programs on job detail pages

**Database Functions:**
```sql
get_related_jobs_for_program(program_id, threshold)
get_related_programs_for_job(job_id, threshold)
```

### Phase 3: Skills Gap Analysis (Week 3)
**Goal:** Show users what skills they need to learn

**Features:**
- Calculate: `job_skills - program_skills`
- Visual gap chart
- Prioritize by skill importance
- Recommend programs to fill gaps
- Track user progress

**UI Components:**
- `<SkillsGapChart />` - Visual representation
- `<LearningPathRecommendations />` - Suggested programs
- User dashboard with progress tracking

### Phase 4: Skills-Based Assessments (Week 4)
**Goal:** Generate targeted assessments based on program/job skills

**Features:**
- Extend `llm_generate_quiz` to accept skill lists
- Generate questions for specific skills
- Weight questions by skill importance
- Program-specific assessments
- Job-specific assessments

**Integration:**
- "Test Your Skills" button on program pages
- "Assess Readiness" button on job pages
- Results tied to skills proficiency
- Recommendations based on gaps

---

## 📊 Success Metrics

### Day 3 Complete When:
- [ ] All 223 programs have skills populated
- [ ] Average 5-8 skills per program
- [ ] Skills ranked by importance
- [ ] Admin can view skills in detail form
- [ ] Skills count auto-updates via trigger

### Phase 2 Complete When:
- [ ] Related jobs show on all program pages
- [ ] Related programs show on all job pages
- [ ] Match scores >= 70% threshold
- [ ] < 500ms query performance

### Phase 3 Complete When:
- [ ] Skills gap visible on job pages
- [ ] Program recommendations accurate
- [ ] Gap visualization clear and actionable
- [ ] User dashboard shows progress

### Phase 4 Complete When:
- [ ] Skills-based quizzes generate in < 10s
- [ ] Questions target specific skills
- [ ] Results show skill proficiency
- [ ] Recommendations based on gaps

---

## 🔧 Technical Debt & Nice-to-Haves

### High Priority
- [ ] Fix TypeScript errors in queries.ts (assessment-related)
- [ ] Implement proper authentication (remove mock user)
- [ ] Add RLS policies for program_skills table
- [ ] Create indexes for performance (cip_code, skills joins)

### Medium Priority
- [ ] Bulk operations in admin (multi-select, batch edit)
- [ ] Provider admin permissions (scoped access)
- [ ] Audit logging for admin actions
- [ ] Export/import functionality

### Low Priority
- [ ] Dark mode support
- [ ] Advanced search/filtering
- [ ] Analytics dashboard
- [ ] Email notifications

---

## 📁 Key Documentation

### Current Docs
- `/docs/skill-sync-technical-architecture.md` - Main technical doc (UPDATED)
- `/docs/CIP_PIPELINE_IMPLEMENTATION.md` - Detailed CIP pipeline plan
- `/docs/CIP_ASSIGNMENT_STRATEGY.md` - AI assignment approach
- `/docs/CIP_ASSIGNMENT_GUIDE.md` - Usage guide
- `/docs/REPOSITORY_CLEANUP_2025-09-30.md` - Cleanup summary

### Reference Docs
- `/docs/reference/cip_scaffolding.md` - CIP-SOC pipeline architecture
- `/docs/reference/hubspot-import-guide.md` - HubSpot import process
- `/docs/reference/skills-taxonomy-architecture.md` - Skills taxonomy design

### Scripts
- `/scripts/import-cip-data.js` - CIP codes import (DONE)
- `/scripts/assign-cips-batch.js` - CIP assignment (DONE)
- `/scripts/generate-short-descriptions.js` - Descriptions (DONE)
- `/scripts/extract-program-skills.js` - Skills extraction (TODO)

---

## 🎯 Immediate Next Steps

1. **Review this document** - Confirm approach and priorities
2. **Start Day 3** - Build skills extraction service
3. **Test with sample programs** - Validate before batch processing
4. **Run batch extraction** - Process all 223 programs
5. **Update admin UI** - Show skills in detail form

**Ready to start Day 3?** 🚀
