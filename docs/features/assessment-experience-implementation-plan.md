# Assessment Experience Implementation Plan

**Epic:** Complete End-to-End Assessment Experience  
**Priority:** CRITICAL  
**Estimated Time:** 10-14 hours  
**Dependencies:** Programs Catalog (for recommendations)

---

## 🎯 OBJECTIVE

Build complete assessment experience from taking quiz → viewing results → getting recommendations → revisiting past assessments.

---

## 📋 CURRENT STATE

### What Exists ✅
- Quiz taking flow (`/assessments/quiz/[socCode]/page.tsx`)
- Resume upload flow
- Assessment proficiency engine (scoring)
- My Assessments page (list view)

### What's Missing ❌
- Assessment results page (CRITICAL GAP)
- Program recommendations on results
- "Submit to Company" flow (for featured roles)
- Revisit past assessment results
- Certifications display

---

## 🔧 IMPLEMENTATION TASKS

### 1. Assessment Results Page (4-5 hours) **CRITICAL**
**File:** `/src/app/(main)/assessments/[id]/results/page.tsx`

**Layout Design:**
```
┌─────────────────────────────────────┐
│ Role Readiness Score: 85%          │
│ [Progress Ring Visualization]       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Skills Breakdown                    │
│ ✅ Proficient (12 skills)          │
│ ⚠️  Gaps (3 skills)                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [CONDITIONAL CONTENT]               │
│                                     │
│ IF Featured Role + Score >= Required:│
│   → "Submit to Company" CTA         │
│                                     │
│ IF Gaps Identified:                 │
│   → Recommended Programs            │
│   → Relevant Certifications         │
│                                     │
│ IF High Score (No Gaps):            │
│   → Congratulations message         │
│   → Related programs (optional)     │
│   → Certifications (optional)       │
└─────────────────────────────────────┘
```

**Implementation:**
- [ ] Create results page component
- [ ] Fetch assessment data by ID
- [ ] Display role readiness score with visualization
- [ ] Show skills breakdown (proficient vs gaps)
- [ ] Implement conditional logic:
  - Featured role + high score → Submit CTA
  - Gaps identified → Programs + Certs
  - High score + no gaps → Congrats + optional resources
- [ ] Store results for later viewing
- [ ] Add "Retake Assessment" button

---

### 2. Program Recommendations (3-4 hours)
**File:** `/src/components/assessment/ProgramRecommendations.tsx`

**Logic:**
```typescript
if (skillGaps.length > 0) {
  // Match programs that teach gap skills
  const programs = await matchProgramsToGaps(skillGaps)
  
  // Rank by relevance (% of gaps covered)
  const rankedPrograms = rankByRelevance(programs, skillGaps)
  
  // Display top 5-10 programs
  return <ProgramsList programs={rankedPrograms} />
}
```

- [ ] Create program recommendations component
- [ ] Integrate with program-matching service
- [ ] Display program cards with:
  - Program name, provider
  - Skills covered (highlight gaps)
  - Cost, duration, format
  - "Learn More" / "Request Info" CTA
- [ ] Add filtering (online/in-person, cost range)

---

### 3. Certifications Display (2-3 hours)
**File:** `/src/components/assessment/CertificationRecommendations.tsx`

**Data Source:** CareerOneStop certifications cache

- [ ] Fetch certifications by SOC code
- [ ] Display certification cards:
  - Certification name
  - Issuing organization
  - Cost, exam details
  - Relevance to role
- [ ] Link to external certification info

---

### 4. "Submit to Company" Flow (3-4 hours) **NEW FEATURE**
**Files:**
- `/src/components/assessment/SubmitToCompany.tsx`
- `/src/app/api/assessments/submit-to-company/route.ts`

**Flow:**
```
User clicks "Submit to Company"
  ↓
Confirm modal (user info, score)
  ↓
Store submission in database
  ↓
Send notification email to company
  ↓
Show success message
  ↓
Company sees submission in their dashboard
```

**Implementation:**
- [ ] Create submission component with modal
- [ ] API route to store submission
- [ ] Database table: `company_submissions`
  - assessment_id, user_id, company_id, job_id
  - score, submitted_at, status
- [ ] Email notification (Supabase or SendGrid)
- [ ] Success confirmation UI

---

### 5. My Assessments - Results View (2-3 hours)
**File:** `/src/app/(main)/assessments/page.tsx` (update existing)

**Current:** Lists assessments  
**Add:** Click to view past results

- [ ] Add "View Results" link to each assessment card
- [ ] Link to `/assessments/[id]/results`
- [ ] Show assessment date, score preview
- [ ] Add status badges (Submitted, In Progress, Complete)

---

### 6. AI Quiz Generation Testing (2-3 hours)
**Verify existing AI pipeline works with enriched data**

- [ ] Test quiz generation for 5 occupations
- [ ] Verify questions use enriched data:
  - Tasks from CareerOneStop
  - Tools/technology (if available)
  - Company-specific requirements (featured roles)
- [ ] Test question quality and relevance
- [ ] Verify weighting system accuracy
- [ ] Test admin quiz editing

---

## 📊 CONDITIONAL LOGIC MATRIX

| Scenario | Featured Role? | Score | Display |
|----------|---------------|-------|---------|
| 1 | Yes | >= Required | Submit to Company CTA |
| 2 | Yes | < Required | Programs + Certs for gaps |
| 3 | No (Occupation) | High (90%+) | Congrats + Optional programs |
| 4 | No (Occupation) | Medium/Low | Programs + Certs for gaps |

---

## 🧪 TESTING CHECKLIST

### Assessment Taking
- [ ] Take quiz for featured role
- [ ] Take quiz for occupation
- [ ] Upload resume for assessment
- [ ] Verify scoring calculation

### Results Page
- [ ] View results immediately after assessment
- [ ] Results display correctly for featured role
- [ ] Results display correctly for occupation
- [ ] Program recommendations match gaps
- [ ] Certifications display correctly
- [ ] Submit to Company works (featured roles)

### My Assessments
- [ ] Past assessments listed
- [ ] Click to view past results
- [ ] Results persist correctly
- [ ] Can retake assessment

---

## 📦 DELIVERABLES

1. ✅ Complete assessment results page
2. ✅ Program recommendations based on gaps
3. ✅ Certifications display
4. ✅ Submit to Company flow (featured roles)
5. ✅ View past assessment results
6. ✅ AI quiz generation tested and verified

---

## 🚀 SUCCESS CRITERIA

- User completes assessment → Sees comprehensive results
- Skill gaps → Relevant program recommendations
- High score on featured role → Can submit to company
- Past assessments → Can revisit results anytime
- All flows tested and working

---

**Status:** Not Started  
**Dependencies:** Programs catalog must be complete first  
**Next Action:** Create assessment results page component
