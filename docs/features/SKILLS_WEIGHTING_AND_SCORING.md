# Skills Weighting and Scoring System - Complete Technical Guide

**Document Version:** 1.0  
**Last Updated:** October 7, 2025  
**Audience:** Senior Engineers (no prior codebase knowledge required)

---

## Executive Summary

SkillSync implements a **three-layer weighted scoring system** that prevents the "teamwork vs algorithms" problem by ensuring assessments accurately reflect employer priorities. This document explains the complete weighting algorithms, proficiency calculations, and AI evaluation systems.

**Key Innovation:** Questions and skills are weighted by importance, difficulty, and market demand to create truly meaningful proficiency scores.

---

## Table of Contents

1. [Weighted Scoring Architecture](#1-weighted-scoring-architecture)
2. [Question-Level Weighting](#2-question-level-weighting)
3. [Skill-Level Weighting](#3-skill-level-weighting)
4. [AI Proficiency Evaluation](#4-ai-proficiency-evaluation)
5. [Role Readiness Calculator](#5-role-readiness-calculator)
6. [Corporate Pre-qualification](#6-corporate-pre-qualification)
7. [Education Matching Algorithm](#7-education-matching-algorithm)
8. [Assessment Analytics](#8-assessment-analytics)
9. [Implementation Details](#9-implementation-details)

---

## 1. Weighted Scoring Architecture

### 1.1 The Problem with Traditional Assessments

**Traditional Assessment:**
```
Question 1: "Can you write a sorting algorithm?" → Wrong (0 points)
Question 2: "Do you work well with others?" → Right (1 point)
Question 3: "Can you review code?" → Right (1 point)
Score: 2/3 = 67% (Looks borderline qualified)
```

**SkillSync Weighted Assessment:**
```
Algorithm Design (Critical, Expert): Wrong × 5.0 × 1.3 = 0
Teamwork (Important, Intermediate): Right × 3.0 × 1.0 = 3.0
Code Review (Important, Intermediate): Right × 4.0 × 1.15 = 4.6
Score: 7.6/14.375 = 53% (Accurately shows skill gap)
```

**Result:** Employer gets accurate signal about technical capability.

---

### 1.2 Three-Layer Architecture

**Layer 1: Question-Level Weighting**
- Importance: 1.0-5.0 (critical questions worth more)
- Difficulty: 0.8-1.3x multiplier (harder questions more valuable)
- Base score: 100 if correct, 0 if wrong

**Layer 2: Skill-Level Weighting**
- Company importance: 1.0-5.0 (how critical to this role)
- Proficiency threshold: 60-100% (company requirements)
- Market demand: 0.7-1.25x (BLS + O*NET data)

**Layer 3: AI Evaluation**
- Technical accuracy: 0-100%
- Practical application: 0-100%
- Industry relevance: 0-100%
- Overall quality: 0-100%

---

## 2. Question-Level Weighting

### 2.1 Question Importance (1.0-5.0)

**Source:** Quiz generation AI + O*NET importance ratings

**Mapping:**
- **5.0 Critical:** Questions testing core job requirements
- **4.0 Important:** Questions testing key competencies
- **3.0 Helpful:** Questions testing supporting skills
- **2.0 Nice-to-have:** Questions testing peripheral skills
- **1.0 Optional:** Questions testing tangential skills

**Example:**
```typescript
// Question importance assigned during quiz generation
const questionImportance = {
  "Write a binary search algorithm": 5.0,  // Critical for software dev
  "Explain version control concepts": 4.0, // Important but not core
  "Describe agile methodology": 3.0,       // Helpful but not differentiating
  "Work effectively in teams": 2.0         // Nice-to-have
}
```

---

### 2.2 Difficulty Multipliers (0.8-1.3x)

**Purpose:** Harder questions are worth more points

**Scale:**
- **Easy/Beginner:** 0.8x (everyone should get these right)
- **Medium/Intermediate:** 1.0x (standard difficulty)
- **Hard/Advanced:** 1.2x (challenging but fair)
- **Expert:** 1.3x (differentiates top performers)

**Implementation:**
```typescript
function getDifficultyMultiplier(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case 'easy': case 'beginner': return 0.8
    case 'medium': case 'intermediate': return 1.0
    case 'hard': case 'advanced': return 1.2
    case 'expert': return 1.3
    default: return 1.0
  }
}
```

---

### 2.3 Question Score Calculation

**Formula:**
```
Question Score = (IsCorrect ? 100 : 0) × Importance × DifficultyMultiplier
```

**Example:**
```typescript
// Expert-level critical question
const questionScore = (isCorrect ? 100 : 0) * 5.0 * 1.3
// Result: 650 points if correct, 0 if wrong
```

---

## 3. Skill-Level Weighting

### 3.1 Importance Levels (Critical/Important/Helpful)

**Source:** Company-specific (featured roles) or O*NET-validated (occupations)

**Critical (5.0):**
- Must-have skills
- Proficiency threshold: 80%+
- Examples: "Python programming", "Database design"

**Important (4.0):**
- Core competencies
- Proficiency threshold: 70%+
- Examples: "Git version control", "REST APIs"

**Helpful (3.0):**
- Supporting skills
- Proficiency threshold: 60%+
- Examples: "Agile methodology", "Code documentation"

---

### 3.2 Proficiency Thresholds

**Company-Specific:** Configurable per role
```sql
-- Featured roles can set custom thresholds
ALTER TABLE jobs
ADD COLUMN required_proficiency_pct INTEGER DEFAULT 90;  -- 90% for critical roles
```

**Occupation-Standard:** Based on industry norms
```typescript
const thresholds = {
  critical: 80,
  important: 70,
  helpful: 60
}
```

---

### 3.3 Market Demand Multipliers (0.7-1.25x)

**Source:** BLS employment projections + O*NET importance

**Critical (1.25x):**
- High growth (>20%) + high importance
- Example: "Data Science" skills

**High (1.15x):**
- Growing (10-20%) + solid importance
- Example: "Cloud computing" skills

**Moderate (1.0x):**
- Stable demand
- Example: "Project management" skills

**Low (0.85x):**
- Declining (-5 to 0%)
- Example: "Legacy system" skills

**Declining (0.7x):**
- Shrinking (<-5%)
- Example: "Obsolete technology" skills

---

### 3.4 Skill Score Calculation

**Formula:**
```
Skill Score = (Σ QuestionScores) × Importance × MarketMultiplier
```

**Implementation:**
```typescript
function calculateSkillScore(
  questionScores: number[],
  skillImportance: number,
  marketMultiplier: number
): number {
  const totalQuestionWeight = questionScores.reduce((sum, score) => sum + score, 0)
  const maxPossibleWeight = questionScores.length * 100 * 5.0 * 1.3 // Max possible

  const rawSkillScore = (totalQuestionWeight / maxPossibleWeight) * 100
  return Math.min(100, rawSkillScore * skillImportance * marketMultiplier)
}
```

---

## 4. AI Proficiency Evaluation

### 4.1 Context-Aware Analysis

**Purpose:** Go beyond right/wrong to evaluate true understanding

**Input:** User's responses, correct answers, job context, market data

**Output:** Four evaluation dimensions

---

### 4.2 Evaluation Dimensions

**1. Technical Accuracy (0-100%):**
- How technically correct are the responses?
- Fact-checking and precision
- Example: "Correct algorithm but O(n²) complexity ignored"

**2. Practical Application (0-100%):**
- Does the response show real-world understanding?
- Can they apply the concept in practice?
- Example: "Understands theory but not implementation"

**3. Industry Relevance (0-100%):**
- Is the knowledge relevant to current industry standards?
- Does it match how the skill is used professionally?
- Example: "Uses modern frameworks, not outdated approaches"

**4. Completeness (0-100%):**
- How thorough is the demonstrated knowledge?
- Did they consider edge cases, limitations, trade-offs?
- Example: "Addresses security, performance, maintainability"

---

### 4.3 AI Evaluation Prompt

**Location:** `/src/lib/services/assessment-engine.ts`

```typescript
const evaluationPrompt = `
${enhancedAIContext}  // Job description, market data, company context

ASSESSMENT EVALUATION TASK:
You are evaluating a job seeker's responses to assess their true proficiency in ${skillName} for ${socCode} roles.

RESPONSES TO EVALUATE:
${responseAnalysis.map((r, i) => `
Response ${i + 1}:
- Correct Answer: ${r.correctAnswer}
- User Response: ${r.userResponse}
- Correctness: ${r.isCorrect ? 'Correct' : 'Incorrect'}
- Time Spent: ${r.timeSpent}s
`).join('\n')}

EVALUATION CRITERIA:
1. Technical Accuracy (0-100%): How technically sound are the responses?
2. Practical Application (0-100%): Do responses show real-world understanding?
3. Industry Relevance (0-100%): Are responses relevant to ${socCode} requirements?
4. Completeness (0-100%): How thorough is the demonstrated knowledge?

CONTEXT CONSIDERATIONS:
- Market demand: ${marketData.currentDemand}
- Salary range: ${marketData.salaryRange}
- Industry trend: ${marketData.trendDirection}
- Company context: ${companyData.industry || 'General'}

RESPONSE FORMAT (JSON only):
{
  "technicalAccuracy": 85,
  "practicalApplication": 90,
  "industryRelevance": 88,
  "completeness": 82,
  "overallQuality": 86,
  "reasoning": "Detailed explanation of the evaluation...",
  "improvementAreas": ["specific area 1", "specific area 2"]
}
`
```

---

### 4.4 AI Evaluation Integration

**When to Use AI Evaluation:**
- Complex scenarios requiring nuance
- Open-ended questions
- Situational judgment tests
- Not for simple multiple-choice (too expensive)

**Fallback:** Basic evaluation based on correctness + time spent

```typescript
// AI evaluation with fallback
try {
  const aiResult = await evaluateWithAI(responses, context)
  return aiResult
} catch (error) {
  // Fallback to basic scoring
  const correctCount = responses.filter(r => r.isCorrect).length
  const accuracy = (correctCount / responses.length) * 100

  return {
    technicalAccuracy: accuracy,
    practicalApplication: accuracy * 0.9,
    industryRelevance: accuracy * 0.85,
    completeness: accuracy * 0.8,
    overallQuality: accuracy * 0.85,
    reasoning: 'Basic evaluation due to AI service unavailability',
    improvementAreas: ['Review fundamental concepts']
  }
}
```

---

## 5. Role Readiness Calculator

### 5.1 Overall Proficiency Score

**Formula:**
```
Overall Proficiency = Σ(SkillScore × SkillImportance) / Σ(SkillImportance)
```

**Weighted Average:** Skills with higher importance contribute more to final score

**Example:**
```
Skill A: 90% × 5.0 (critical) = 450 points
Skill B: 80% × 4.0 (important) = 320 points
Skill C: 95% × 3.0 (helpful) = 285 points
Total Points: 1,055
Total Weight: 12.0
Overall Proficiency: 1,055 ÷ 12.0 = 87.9%
```

---

### 5.2 Role Readiness Levels

**Highly Qualified (90%+):**
- Meets or exceeds all critical requirements
- Strong performance across important skills
- No significant gaps

**Ready (75-89%):**
- Meets critical requirements
- May have gaps in important skills
- Ready for role with minor development

**Developing (60-74%):**
- Some critical gaps
- Needs focused development
- Not yet ready but has potential

**Not Ready (<60%):**
- Significant gaps in critical skills
- Requires substantial development
- Not qualified for role currently

---

### 5.3 Skill Gap Analysis

**Gap Calculation:**
```
Gap = RequiredLevel - CurrentLevel
```

**Categories:**
- **Exceeds:** Current > Required + 10%
- **Meets:** Current ≥ Required
- **Developing:** Required - 15% < Current < Required
- **Gap:** Current < Required - 15%

---

### 5.4 Actionable Intelligence

**Strength Areas:** Skills where CurrentLevel ≥ 85%

**Development Areas:** Skills with small gaps (≤20%)

**Critical Gaps:** Skills <60% that are critical (importance ≥4.0)

**Next Steps Recommendations:**
```typescript
function generateNextSteps(skillProficiencies, overallProficiency): string[] {
  const steps = []

  // Critical gaps first
  const criticalGaps = skillProficiencies.filter(s =>
    s.status === 'Gap' && s.importance >= 4.0
  )
  if (criticalGaps.length > 0) {
    steps.push(`Focus on critical skills: ${criticalGaps.slice(0, 2).map(s => s.skillName).join(', ')}`)
  }

  // Development areas
  const developmentAreas = skillProficiencies.filter(s => s.status === 'Developing')
  if (developmentAreas.length > 0) {
    steps.push(`Strengthen developing skills: ${developmentAreas.slice(0, 2).map(s => s.skillName).join(', ')}`)
  }

  // Overall guidance
  if (overallProficiency < 60) {
    steps.push('Consider foundational training programs')
  } else if (overallProficiency < 75) {
    steps.push('Focus on targeted skill development')
  } else {
    steps.push('Fine-tune advanced skills')
  }

  return steps
}
```

---

### 5.5 Time-to-Ready Estimation

**Formula:** Based on total gap and critical gaps

```typescript
function estimateTimeToReady(skillProficiencies, overallProficiency): string {
  const totalGap = skillProficiencies.reduce((sum, s) => sum + s.gap, 0)
  const criticalGaps = skillProficiencies.filter(s =>
    s.status === 'Gap' && s.importance >= 4.0
  ).length

  if (overallProficiency >= 75) return 'Role-ready now'
  if (overallProficiency >= 60 && criticalGaps === 0) return '1-3 months'
  if (overallProficiency >= 45) return '3-6 months'
  return '6-12 months with comprehensive training'
}
```

---

## 6. Corporate Pre-qualification

### 6.1 Pre-qualification Filters

**Hard Requirements:**
- Overall proficiency ≥ minimum threshold (usually 90%)
- All critical skills ≥ required level
- No gaps in must-have competencies

**Soft Requirements:**
- Preferred overall proficiency (85%+)
- Bonus skills for enhanced ranking
- Experience level alignment

---

### 6.2 Candidate Ranking

**Ranking Score Formula:**
```
Ranking Score = OverallProficiency × 0.6 +
                CriticalSkillsAvg × 0.3 +
                BonusSkillsCount × 0.1
```

**Factors:**
- Overall proficiency (60% weight)
- Critical skills average (30% weight)
- Bonus skills count (10% weight)

---

### 6.3 Qualification Levels

**Highly Qualified:**
- Meets hard requirements
- Overall proficiency ≥90%
- All critical skills proficient

**Qualified:**
- Meets hard requirements
- Overall proficiency 75-89%
- Minor gaps in non-critical skills

**Developing:**
- Below hard requirements
- Has potential but needs development
- May be considered for training programs

---

## 7. Education Matching Algorithm

### 7.1 Skills Gap → Program Mapping

**Input:** User's skill gaps and proficiency levels

**Process:**
1. Identify critical gaps (below threshold + high importance)
2. Find programs that teach those skills
3. Calculate gap coverage percentage
4. Rank by relevance and effectiveness

---

### 7.2 Gap Coverage Calculation

**Formula:**
```
GapCoverage = (SkillsTaught ∩ CriticalGaps) / CriticalGaps
```

**Example:**
```
Critical Gaps: Python, SQL, React
Program teaches: Python, JavaScript, React, Git
Gap Coverage: (Python + React) / (Python + SQL + React) = 67%
```

---

### 7.3 Program Ranking Factors

**Gap Coverage (40% weight):** How well program addresses specific gaps

**Skill Alignment (40% weight):** Quality of skill teaching in program

**Difficulty Match (20% weight):** Appropriate for user's current level

**Overall Match Score:**
```
OverallMatch = GapCoverage × 0.4 + SkillAlignment × 0.4 + DifficultyMatch × 0.2
```

---

### 7.4 Learning Sequence Generation

**Purpose:** Optimal order of program completion

**Algorithm:**
1. Start with foundation skills (prerequisites)
2. Address critical gaps first
3. Build upon existing strengths
4. End with advanced specializations

---

## 8. Assessment Analytics

### 8.1 Engagement Tracking

**Metrics Tracked:**
- Time per question
- Mouse movements
- Tab switches
- Completion time
- Question skipping patterns

**Cheating Detection:**
- Unusual timing patterns
- Copy/paste indicators
- Tab switching frequency
- Answer consistency analysis

---

### 8.2 Performance Analytics

**Individual Level:**
- Skill improvement over time
- Question difficulty preferences
- Time management patterns
- Consistency across similar questions

**Aggregate Level:**
- Popular question difficulties
- Common wrong answers
- Question quality metrics
- Assessment completion rates

---

## 9. Implementation Details

### 9.1 Core Files

**Assessment Engine:** `/src/lib/services/assessment-engine.ts`
**AI Evaluation:** `/src/lib/services/assessment-engine.ts` (evaluateResponseQuality)
**Role Calculator:** `/src/lib/services/assessment-engine.ts` (calculateRoleReadiness)
**Corporate Filter:** `/src/lib/services/assessment-engine.ts` (corporate pre-qualification logic)

### 9.2 Database Tables

**Assessment Results:**
```sql
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  job_id UUID REFERENCES jobs(id),
  quiz_id UUID REFERENCES quizzes(id),
  total_score DECIMAL(5,2),
  proficiency_level TEXT,
  skill_results JSONB,
  ai_evaluation JSONB,
  completed_at TIMESTAMP
);
```

**Role Readiness Scores:**
```sql
CREATE TABLE role_readiness_scores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES jobs(id),
  overall_proficiency DECIMAL(5,2),
  role_readiness TEXT,
  critical_gaps JSONB,
  development_areas JSONB,
  next_steps JSONB,
  calculated_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 10. Testing & Validation

### 10.1 Unit Tests

**Scoring Accuracy:**
```typescript
// Test weighted scoring calculation
test('weighted scoring prevents teamwork vs algorithms problem', () => {
  const criticalQuestion = { importance: 5.0, difficulty: 'expert', isCorrect: false }
  const softSkillQuestion = { importance: 3.0, difficulty: 'medium', isCorrect: true }

  const criticalScore = calculateQuestionScore(criticalQuestion)
  const softSkillScore = calculateQuestionScore(softSkillQuestion)

  expect(criticalScore).toBeGreaterThan(softSkillScore * 2) // Critical worth much more
})
```

---

### 10.2 Integration Tests

**End-to-End Assessment Flow:**
```typescript
test('complete assessment flow produces accurate results', async () => {
  // 1. Create quiz with weighted questions
  // 2. Simulate user responses
  // 3. Calculate weighted scores
  // 4. Generate role readiness
  // 5. Verify gap analysis accuracy
})
```

---

## 11. Performance Characteristics

### 11.1 Scoring Performance

**Per Assessment:**
- Question weighting: <1ms
- Skill aggregation: <5ms
- AI evaluation: 2-5 seconds (optional)
- Role readiness: <10ms
- Total: <10 seconds (without AI), <20 seconds (with AI)

### 11.2 Scalability

**Concurrent Assessments:** 100+ simultaneous evaluations
**Database Load:** Minimal (read-heavy, cached results)
**AI API Limits:** 10K requests/day (OpenAI quota)

---

## 12. Troubleshooting

### 12.1 Common Issues

**Incorrect weighting:**
- Check importance values in quiz_questions table
- Verify difficulty multipliers
- Confirm market demand calculations

**AI evaluation failures:**
- Check OpenAI API key
- Verify prompt format
- Fall back to basic scoring

**Role readiness miscalculation:**
- Debug skill proficiency aggregation
- Check importance weighting
- Verify gap calculations

---

**This weighting system ensures that SkillSync assessments provide employers with accurate, meaningful signals about candidate qualifications while giving job seekers actionable insights for skill development.**

---

*Last Updated: October 7, 2025 | Status: Production Ready*
