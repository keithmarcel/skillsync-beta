# Crosswalk Feature - Follow-Up Tasks

**Created:** October 20, 2025 9:52 PM  
**Status:** Post-Implementation Enhancements  
**Priority:** Medium (Post-Launch)

---

## Overview

The core crosswalk feature is **complete and ready for production**. This document outlines optional enhancements and extensions for future iterations based on user feedback and usage patterns.

---

## 1. UI Simplification - Program Cards

### Current State
Program cards on detail pages use the full `FeaturedProgramCard` component with:
- School logo
- Program name
- Program type badge
- Format badge
- Duration
- Description
- Skills callout (optional)
- Favorite button
- Multiple action buttons

### Proposed Simplification

**Goal:** Streamline program cards for better scannability and focus on key information.

**Suggested Changes:**
1. **Reduce visual complexity**
   - Smaller school logo (or remove if not critical)
   - Single CTA button instead of multiple actions
   - Shorter descriptions (truncate to 2 lines)

2. **Emphasize key info**
   - Program name (larger, bold)
   - Credential type (badge)
   - Duration (prominent)
   - School name (secondary)

3. **Remove or simplify**
   - Skills callout (may be redundant in crosswalk context)
   - Favorite button (move to detail page only)
   - Format badge (combine with duration)

**Example Simplified Layout:**
```
┌─────────────────────────────────┐
│ [Small Logo]  School Name       │
│                                  │
│ Program Name (Bold, Large)      │
│ [Certificate] • 6 months        │
│                                  │
│ Brief description text...       │
│                                  │
│ [Learn More →]                  │
└─────────────────────────────────┘
```

**Files to Update:**
- `/src/components/ui/featured-program-card.tsx` - Create simplified variant
- `/src/app/(main)/jobs/[id]/page.tsx` - Use simplified variant in crosswalk sections
- `/src/app/(main)/program-matches/[assessmentId]/page.tsx` - Consider using simplified variant

**Estimated Effort:** 2-3 hours

---

## 2. Assessment Results - Crosswalk Integration

### Current State
Assessment results page (`/my-assessments/[id]/results`) shows:
- Overall proficiency score
- Skill-by-skill breakdown
- Identified gaps
- **Mock data for recommended programs**

### Goal
Replace mock program recommendations with real crosswalk data based on:
1. Skills gaps identified in assessment
2. Programs that teach those specific skills
3. Relevance scoring based on skill overlap

### Implementation Plan

**Phase 1: Data Integration (2-3 hours)**

1. **Update Assessment Results Query**
   - File: `/src/lib/database/queries.ts`
   - Add function: `getGapFillingPrograms(skillIds[], limit)`
   - Query `program_skills` junction for programs teaching gap skills
   - Calculate relevance score based on skill overlap

2. **Update Results Page**
   - File: `/src/app/(main)/my-assessments/[id]/results/page.tsx`
   - Replace mock program data with real query
   - Pass gap skill IDs to query function
   - Display programs sorted by relevance

**Phase 2: Enhanced Matching (3-4 hours)**

1. **Skill Gap Analysis**
   - Identify which skills are "needs_development" or "building"
   - Weight programs by how many gap skills they address
   - Prioritize programs that fill multiple gaps

2. **Program Filtering**
   - Filter by program level (Certificate vs Degree)
   - Consider user's current education level
   - Show "Quick Wins" (short certificates) vs "Long-term" (degrees)

3. **Personalized Recommendations**
   - "Top 3 Programs to Close Your Gaps"
   - "Skills You'll Gain" callout for each program
   - Progress indicator: "This program addresses 5 of your 8 skill gaps"

**Phase 3: UI Enhancements (2 hours)**

1. **Gap-Focused Display**
   ```
   Your Skill Gaps:
   ❌ Strategic Planning (Needs Development)
   ❌ Budget Management (Building)
   ❌ Team Leadership (Building)
   
   Recommended Programs:
   ┌─────────────────────────────────────┐
   │ MBA in Business Administration      │
   │ ✅ Addresses 3 of your skill gaps   │
   │ • Strategic Planning                │
   │ • Budget Management                 │
   │ • Team Leadership                   │
   └─────────────────────────────────────┘
   ```

2. **Actionable CTAs**
   - "Start Learning" button
   - "Save for Later" option
   - "Compare Programs" feature

**Files to Update:**
- `/src/lib/database/queries.ts` - Add `getGapFillingPrograms()`
- `/src/app/(main)/my-assessments/[id]/results/page.tsx` - Replace mock data
- `/src/components/ui/gap-filling-program-card.tsx` - New component (optional)

**Estimated Effort:** 7-9 hours total

---

## 3. Relevance Scoring Enhancement

### Current State
Programs are limited to top 30 but not sorted by relevance - just limited by the junction table order.

### Proposed Enhancement

**Add Relevance Scoring Algorithm:**

1. **Factors to Consider:**
   - CIP-SOC crosswalk strength (primary vs secondary match)
   - Program level matching job requirements
   - Skills overlap percentage
   - Program completion rate (if available)
   - School reputation/accreditation
   - Local availability

2. **Scoring Formula:**
   ```typescript
   relevanceScore = 
     (cipSocStrength * 0.4) +
     (levelMatch * 0.2) +
     (skillsOverlap * 0.3) +
     (localAvailability * 0.1)
   ```

3. **Implementation:**
   - Add `relevance_score` calculation in `getRelatedPrograms()`
   - Sort by score descending
   - Display score as "Match: 85%" badge

**Files to Update:**
- `/src/lib/database/queries.ts` - Add scoring logic
- `/src/app/(main)/jobs/[id]/page.tsx` - Display match percentage

**Estimated Effort:** 3-4 hours

---

## 4. Performance Optimization

### Current State
All queries run on every page load (no caching).

### Potential Optimizations

1. **Database Indexes**
   - Add index on `jobs.soc_code`
   - Add index on `program_jobs.job_id`
   - Add composite index on `jobs(job_kind, soc_code, is_published)`

2. **Query Optimization**
   - Batch related queries with Promise.all() (already done)
   - Consider pagination for large result sets
   - Add query result caching (Redis/Vercel KV)

3. **Client-Side Caching**
   - Use React Query for data fetching
   - Cache crosswalk data for 5-10 minutes
   - Invalidate on data mutations

**Estimated Effort:** 4-6 hours

---

## 5. Analytics & Monitoring

### Recommended Tracking

1. **Crosswalk Usage Metrics:**
   - How often users click crosswalk badges
   - Which sections get most engagement
   - Conversion rate: crosswalk click → application

2. **Data Quality Metrics:**
   - % of jobs with 0 crosswalks
   - Average crosswalk count per job
   - % of programs with job matches

3. **User Behavior:**
   - Do users explore related occupations?
   - Do similar roles drive applications?
   - Which program recommendations convert?

**Tools:**
- Vercel Analytics
- PostHog (if implemented)
- Custom event tracking

**Estimated Effort:** 2-3 hours

---

## Priority Recommendations

**High Priority (Do First):**
1. ✅ **Core Crosswalk** - COMPLETE
2. 🔥 **Assessment Results Integration** - High user value
3. 🎨 **UI Simplification** - Improves UX

**Medium Priority (Post-Launch):**
4. **Relevance Scoring** - Nice to have
5. **Performance Optimization** - Monitor first, optimize if needed

**Low Priority (Future):**
6. **Analytics** - Ongoing improvement

---

## Testing Checklist

Before marking complete, verify:

- [ ] HDO detail pages show Featured Roles when SOC matches
- [ ] HDO detail pages show Programs from program_jobs
- [ ] Featured Role detail pages show Related Occupations
- [ ] Featured Role detail pages show Similar Roles
- [ ] Featured Role detail pages show Programs
- [ ] All counts in table match detail page data
- [ ] Empty states display when no matches
- [ ] Links navigate correctly
- [ ] Load More works for programs
- [ ] Responsive layout on mobile
- [ ] No console errors
- [ ] Performance is acceptable (<2s page load)

---

## Notes

- All crosswalks are **fully automatic** - no manual updates needed
- System is **production-ready** as-is
- Follow-up tasks are **enhancements**, not blockers
- Prioritize based on user feedback after launch
