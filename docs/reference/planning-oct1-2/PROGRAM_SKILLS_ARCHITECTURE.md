# Program Skills & Gap-Based Recommendations Architecture

## Overview

Complete pipeline connecting CIP codes → SOC codes → Skills → Programs → User Recommendations based on assessment results.

---

## Part 1: Program Skills Enrichment

### **Data Flow:**
```
CIP Code (Program) → Related SOC Codes → O*NET Skills → Program Skills
     ↓
Course Descriptions → AI Skill Extraction → Additional Skills
     ↓
Combined & Deduplicated → Program Skill Profile
```

### **Implementation:**

#### Step 1: CIP to SOC Mapping
```typescript
// Use CIP-SOC crosswalk (already in our database)
async function getRelatedSOCsForCIP(cipCode: string): Promise<string[]> {
  const { data } = await supabase
    .from('cip_soc_crosswalk')
    .select('soc_code')
    .eq('cip_code', cipCode)
    .order('relevance', { ascending: false })
    .limit(5); // Top 5 most relevant SOCs
  
  return data?.map(d => d.soc_code) || [];
}
```

#### Step 2: Inherit Skills from SOC Codes
```typescript
async function inheritSkillsFromSOCs(socCodes: string[]): Promise<Skill[]> {
  const allSkills = [];
  
  for (const socCode of socCodes) {
    // Get job for this SOC
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('soc_code', socCode)
      .single();
    
    if (job) {
      // Get skills for this job (already populated via O*NET)
      const { data: jobSkills } = await supabase
        .from('job_skills')
        .select('*, skills(*)')
        .eq('job_id', job.id);
      
      allSkills.push(...jobSkills.map(js => ({
        ...js.skills,
        inherited_from_soc: socCode,
        weight: js.weight
      })));
    }
  }
  
  // Deduplicate and average weights
  return deduplicateSkills(allSkills);
}
```

#### Step 3: AI Course Description Analysis
```typescript
async function extractSkillsFromCourses(
  programId: string,
  courseDescriptions: string[]
): Promise<Skill[]> {
  
  const prompt = `Analyze these course descriptions and identify skills taught:

${courseDescriptions.join('\n\n')}

Match skills to our taxonomy. Return JSON array:
[{
  "skill_name": "Python Programming",
  "confidence": 0.9,
  "evidence": "Course covers Python fundamentals"
}]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });
  
  const extractedSkills = JSON.parse(response.choices[0].message.content);
  
  // Match to existing skills in database
  return matchToTaxonomy(extractedSkills);
}
```

#### Step 4: Combine & Store
```typescript
async function enrichProgramWithSkills(programId: string) {
  const program = await getProgram(programId);
  
  // Get skills from CIP → SOC inheritance
  const socCodes = await getRelatedSOCsForCIP(program.cip_code);
  const inheritedSkills = await inheritSkillsFromSOCs(socCodes);
  
  // Get skills from course descriptions
  const courseSkills = await extractSkillsFromCourses(
    programId,
    program.courses.map(c => c.description)
  );
  
  // Combine and deduplicate
  const allSkills = deduplicateSkills([...inheritedSkills, ...courseSkills]);
  
  // Save to program_skills table
  for (const skill of allSkills) {
    await supabase.from('program_skills').upsert({
      program_id: programId,
      skill_id: skill.id,
      weight: skill.weight,
      source: skill.inherited_from_soc ? 'CIP_SOC_INHERITANCE' : 'COURSE_ANALYSIS',
      confidence: skill.confidence || 1.0
    });
  }
  
  return allSkills;
}
```

---

## Part 2: Skill Gap → Program Matching

### **Data Flow:**
```
User Takes Assessment
     ↓
Assessment Engine Calculates Skill Gaps
     ↓
Gap Analysis: Required Skills - User's Skills = Gaps
     ↓
Match Programs: Find programs teaching gap skills
     ↓
Rank by Match Quality (60%+ threshold)
     ↓
Surface Top Recommendations
```

### **Implementation:**

#### Step 1: Calculate Skill Gaps
```typescript
interface SkillGap {
  skill_id: string
  skill_name: string
  required_level: number // 0-100
  user_level: number // 0-100
  gap: number // required - user
  importance: 'critical' | 'important' | 'helpful'
}

async function calculateSkillGaps(
  assessmentId: string
): Promise<SkillGap[]> {
  
  // Get assessment results
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*, job:jobs(id, soc_code)')
    .eq('id', assessmentId)
    .single();
  
  // Get required skills for job
  const { data: requiredSkills } = await supabase
    .from('job_skills')
    .select('*, skills(*)')
    .eq('job_id', assessment.job.id);
  
  // Get user's skill results
  const { data: userSkills } = await supabase
    .from('assessment_skill_results')
    .select('*')
    .eq('assessment_id', assessmentId);
  
  const gaps: SkillGap[] = [];
  
  for (const required of requiredSkills) {
    const userResult = userSkills.find(us => us.skill_id === required.skill_id);
    const userLevel = userResult?.score_pct || 0;
    const requiredLevel = required.proficiency_threshold || 70;
    
    if (userLevel < requiredLevel) {
      gaps.push({
        skill_id: required.skill_id,
        skill_name: required.skills.name,
        required_level: requiredLevel,
        user_level: userLevel,
        gap: requiredLevel - userLevel,
        importance: required.importance_level
      });
    }
  }
  
  // Sort by importance and gap size
  return gaps.sort((a, b) => {
    if (a.importance !== b.importance) {
      return a.importance === 'critical' ? -1 : 1;
    }
    return b.gap - a.gap;
  });
}
```

#### Step 2: Match Programs to Gaps
```typescript
interface ProgramMatch {
  program_id: string
  program_name: string
  provider_name: string
  match_score: number // 0-100
  skills_covered: string[] // Which gap skills this program teaches
  skills_not_covered: string[] // Which gaps remain
  coverage_pct: number // % of gaps covered
}

async function findProgramsForGaps(
  gaps: SkillGap[],
  options: {
    minMatchThreshold?: number
    maxResults?: number
    preferredModality?: string
  } = {}
): Promise<ProgramMatch[]> {
  
  const {
    minMatchThreshold = 60,
    maxResults = 10,
    preferredModality
  } = options;
  
  // Get gap skill IDs
  const gapSkillIds = gaps.map(g => g.skill_id);
  
  // Find programs that teach these skills
  const { data: programSkills } = await supabase
    .from('program_skills')
    .select('program_id, skill_id, programs(*)')
    .in('skill_id', gapSkillIds);
  
  // Group by program
  const programMap = new Map<string, {
    program: any,
    skills: string[]
  }>();
  
  for (const ps of programSkills || []) {
    if (!programMap.has(ps.program_id)) {
      programMap.set(ps.program_id, {
        program: ps.programs,
        skills: []
      });
    }
    programMap.get(ps.program_id)!.skills.push(ps.skill_id);
  }
  
  // Calculate match scores
  const matches: ProgramMatch[] = [];
  
  for (const [programId, data] of programMap) {
    const skillsCovered = data.skills;
    const skillsNotCovered = gapSkillIds.filter(id => !skillsCovered.includes(id));
    const coveragePct = (skillsCovered.length / gapSkillIds.length) * 100;
    
    // Weight by importance
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const gap of gaps) {
      const weight = gap.importance === 'critical' ? 3 :
                    gap.importance === 'important' ? 2 : 1;
      totalWeight += weight;
      
      if (skillsCovered.includes(gap.skill_id)) {
        weightedScore += weight;
      }
    }
    
    const matchScore = (weightedScore / totalWeight) * 100;
    
    if (matchScore >= minMatchThreshold) {
      matches.push({
        program_id: programId,
        program_name: data.program.name,
        provider_name: data.program.provider?.name || 'Unknown',
        match_score: Math.round(matchScore),
        skills_covered: skillsCovered,
        skills_not_covered: skillsNotCovered,
        coverage_pct: Math.round(coveragePct)
      });
    }
  }
  
  // Sort by match score
  matches.sort((a, b) => b.match_score - a.match_score);
  
  return matches.slice(0, maxResults);
}
```

#### Step 3: Enhanced Ranking with Metadata
```typescript
function enhanceRanking(
  matches: ProgramMatch[],
  userPreferences: {
    location?: string
    maxCost?: number
    preferredModality?: string
    timeframe?: string
  }
): ProgramMatch[] {
  
  return matches.map(match => {
    let bonusScore = 0;
    
    // Location bonus
    if (userPreferences.location && match.program.location === userPreferences.location) {
      bonusScore += 5;
    }
    
    // Cost bonus
    if (userPreferences.maxCost && match.program.cost <= userPreferences.maxCost) {
      bonusScore += 5;
    }
    
    // Modality bonus
    if (userPreferences.preferredModality && match.program.modality === userPreferences.preferredModality) {
      bonusScore += 5;
    }
    
    // Trusted partner bonus
    if (match.program.provider?.is_trusted_partner) {
      bonusScore += 10;
    }
    
    return {
      ...match,
      match_score: Math.min(100, match.match_score + bonusScore)
    };
  }).sort((a, b) => b.match_score - a.match_score);
}
```

---

## Part 3: User Experience Flow

### **Assessment Results Page:**

```typescript
// After user completes assessment
async function showAssessmentResults(assessmentId: string) {
  // 1. Calculate overall readiness
  const readiness = await calculateRoleReadiness(assessmentId);
  
  // 2. Identify skill gaps
  const gaps = await calculateSkillGaps(assessmentId);
  
  // 3. Find matching programs
  const programs = await findProgramsForGaps(gaps, {
    minMatchThreshold: 60,
    maxResults: 5
  });
  
  return {
    readiness_score: readiness.overall_pct,
    readiness_band: readiness.band, // 'role_ready', 'building_proficiency', 'needs_development'
    skill_gaps: gaps,
    recommended_programs: programs,
    next_steps: generateNextSteps(readiness, gaps, programs)
  };
}
```

### **UI Components:**

**1. Skill Gap Visualization**
```tsx
<SkillGapChart>
  {gaps.map(gap => (
    <SkillBar
      skill={gap.skill_name}
      required={gap.required_level}
      current={gap.user_level}
      gap={gap.gap}
      importance={gap.importance}
    />
  ))}
</SkillGapChart>
```

**2. Program Recommendations**
```tsx
<ProgramRecommendations>
  <h2>Programs to Close Your Skill Gaps</h2>
  {programs.map(program => (
    <ProgramCard
      name={program.program_name}
      provider={program.provider_name}
      matchScore={program.match_score}
      skillsCovered={program.skills_covered.length}
      totalGaps={gaps.length}
      badge={program.match_score >= 80 ? 'Excellent Match' : 'Good Match'}
    />
  ))}
</ProgramRecommendations>
```

**3. Learning Path**
```tsx
<LearningPath>
  <Step status="complete">Take Assessment</Step>
  <Step status="current">Review Skill Gaps</Step>
  <Step status="pending">Enroll in Program</Step>
  <Step status="pending">Build Skills</Step>
  <Step status="pending">Retake Assessment</Step>
  <Step status="pending">Achieve Role Readiness</Step>
</LearningPath>
```

---

## Database Schema Updates

```sql
-- Program skills (many-to-many)
CREATE TABLE program_skills (
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  weight DECIMAL(3,2) DEFAULT 0.5,
  source VARCHAR(50), -- 'CIP_SOC_INHERITANCE' or 'COURSE_ANALYSIS'
  confidence DECIMAL(3,2) DEFAULT 1.0,
  PRIMARY KEY (program_id, skill_id)
);

-- CIP to SOC crosswalk (if not exists)
CREATE TABLE IF NOT EXISTS cip_soc_crosswalk (
  cip_code VARCHAR(10),
  soc_code VARCHAR(10),
  relevance DECIMAL(3,2), -- 0-1 score
  PRIMARY KEY (cip_code, soc_code)
);

-- Program recommendations tracking
CREATE TABLE program_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id),
  program_id UUID REFERENCES programs(id),
  match_score INTEGER,
  skills_covered TEXT[],
  recommended_at TIMESTAMP DEFAULT NOW(),
  user_clicked BOOLEAN DEFAULT false,
  user_enrolled BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_program_skills ON program_skills(program_id, skill_id);
CREATE INDEX idx_cip_soc ON cip_soc_crosswalk(cip_code);
CREATE INDEX idx_recommendations ON program_recommendations(assessment_id);
```

---

## Implementation Phases

### **Phase 1: Program Skills Enrichment** (Week 1)
- [ ] Build CIP → SOC mapping service
- [ ] Implement skill inheritance from SOC codes
- [ ] Create AI course description analyzer
- [ ] Build program enrichment pipeline
- [ ] Test with 10 sample programs

### **Phase 2: Gap Matching Algorithm** (Week 2)
- [ ] Implement skill gap calculator
- [ ] Build program matching algorithm
- [ ] Add weighted scoring by importance
- [ ] Implement 60% match threshold
- [ ] Test matching accuracy

### **Phase 3: User Experience** (Week 3)
- [ ] Design assessment results page
- [ ] Build skill gap visualization
- [ ] Create program recommendation cards
- [ ] Implement learning path UI
- [ ] Add enrollment tracking

### **Phase 4: Optimization** (Week 4)
- [ ] Add caching for program matches
- [ ] Implement recommendation tracking
- [ ] A/B test match thresholds
- [ ] Optimize query performance
- [ ] Analytics dashboard

---

## Success Metrics

**Program Enrichment:**
- ✅ 100% of programs have skills assigned
- ✅ Average 15-25 skills per program
- ✅ 80%+ accuracy in skill matching

**Gap Matching:**
- ✅ 60%+ match threshold maintained
- ✅ Average 3-5 programs recommended per assessment
- ✅ 90%+ of gaps covered by top 3 programs

**User Engagement:**
- ✅ 70%+ click-through on recommendations
- ✅ 30%+ enrollment conversion
- ✅ 50%+ retake assessment after program completion

---

## API Endpoints

```typescript
// Enrich program with skills
POST /api/admin/programs/{id}/enrich-skills

// Get program recommendations for assessment
GET /api/assessments/{id}/program-recommendations

// Track recommendation interaction
POST /api/program-recommendations/{id}/track-click

// Get learning path for user
GET /api/users/{id}/learning-path
```

---

## Testing Strategy

**Unit Tests:**
- CIP → SOC mapping accuracy
- Skill inheritance deduplication
- Gap calculation logic
- Match score calculation

**Integration Tests:**
- End-to-end enrichment pipeline
- Assessment → recommendations flow
- Program enrollment tracking

**User Acceptance Tests:**
- Recommendations make sense to users
- Match scores align with expectations
- Programs actually teach gap skills
