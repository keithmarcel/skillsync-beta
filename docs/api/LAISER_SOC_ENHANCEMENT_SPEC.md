# LAiSER SOC Enhancement - Complete Technical Specification

## Executive Summary

**Goal:** Enhance SkillSync's skills intelligence by integrating LAiSER AI for SOC code processing, providing richer skill extraction from government and industry data sources while maintaining admin curation control.

**Business Value:**
- Improve skills accuracy for 30 MVP occupations
- Enable manual quality control during beta phase
- Lay foundation for automated curation scaling
- Enhance quiz generation with better skill intelligence

## Current Architecture Analysis

### Skills System Components
- **Skills Table:** `source` field ('ONET', 'LIGHTCAST', 'ONET/LIGHTCAST')
- **Relationships:** `job_skills`, `program_skills` junction tables
- **Quiz Generation:** OpenAI-powered with existing skill relationships
- **Admin Control:** Manual quiz generation via "Generate Quiz" button

### Data Flow
```
SOC Code → O*NET/Lightcast APIs → Hybrid Skills Mapper → Skill Storage → Quiz Generation
```

## Proposed Architecture Changes

### Enhanced Skills Table Schema
```sql
-- Add curation metadata to existing skills table
ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  curation_status TEXT DEFAULT 'pending_review'
  CHECK (curation_status IN ('auto_approved', 'pending_review', 'admin_approved', 'rejected'));

ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100);

ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  reviewed_at TIMESTAMPTZ;
```

### New Data Flow
```
SOC Code → ONET API + COS API → Rich Text Compilation → LAiSER AI → Skills with Confidence
                                                                 ↓
                                                    Admin Curation (MVP) / Auto-approval (Future)
                                                                 ↓
                                            Approved Skills → Existing Quiz Generation Pipeline
```

## Implementation Components

### 1. API Routes (Server-Side)

#### `/api/admin/laiser/soc-process`
**Method:** POST
**Purpose:** Process SOC code with ONET + COS + LAiSER
**Input:**
```typescript
{
  socCode: string,  // e.g., "15-1253.00"
  includeOnet: boolean = true,
  includeCos: boolean = true
}
```
**Output:**
```typescript
{
  socCode: string,
  occupation: {
    title: string,
    description: string,
    tasks: string[],
    onetData: object,
    cosData: object
  },
  extractedSkills: Array<{
    skill: string,
    level: number,  // 1-12 proficiency scale
    confidence: number,  // 0-100
    knowledge_required: string[],
    tasks: string[],
    source: 'LAISER'
  }>,
  processingTime: number,
  apiCalls: {
    onet: boolean,
    cos: boolean,
    laiser: boolean
  }
}
```

#### `/api/admin/laiser/bulk-curate`
**Method:** POST
**Purpose:** Bulk approve/reject LAiSER extracted skills
**Input:**
```typescript
{
  skillIds: string[],  // Skills to approve
  action: 'approve' | 'reject',
  socCode?: string     // Optional context
}
```

### 2. Client Components

#### SOC Processing Interface
**Location:** `/admin/laiser/soc-enhancement`
**Features:**
- SOC code input field with validation
- Progress indicators (ONET fetch, COS fetch, LAiSER processing)
- Rich text preview from APIs
- Skills extraction results with confidence scores
- Bulk selection controls
- Save mapping button

#### Skills Curation Table
**Features:**
- Status badges: `🟢 Auto-approved`, `🟡 Pending Review`, `✅ Admin Approved`, `❌ Rejected`
- Confidence score display
- Bulk actions: Approve Selected, Reject Selected
- Filter by status/confidence
- Sort by confidence/skill name

### 3. Database Operations

#### Skills Storage Logic
```typescript
// LAiSER extracted skills
const laiserSkill = {
  name: "Python Programming",
  source: "LAISER",
  confidence_score: 92,
  curation_status: "auto_approved", // if confidence >= 85
  // ... other fields
}

// Link to job via existing junction table
await supabase.from('job_skills').insert({
  job_id: jobId,
  skill_id: laiserSkill.id,
  weight: calculateWeight(laiserSkill.confidence, laiserSkill.level),
  importance_level: mapImportanceLevel(laiserSkill.level)
})
```

#### Query Logic for Display
```typescript
// Main app shows only approved skills
const activeSkills = await supabase
  .from('job_skills')
  .select('*, skills(*)')
  .eq('job_id', jobId)
  .eq('skills.curation_status', 'admin_approved')

// Quiz generation can use auto-approved + admin-approved
const quizSkills = await supabase
  .from('job_skills')
  .select('*, skills(*)')
  .eq('job_id', jobId)
  .in('skills.curation_status', ['admin_approved', 'auto_approved'])
```

## UI/UX Design

### SOC Processing Workflow
```
┌─────────────────────────────────────────────────────────┐
│ SOC Code Enhancement Tool                             │
├─────────────────────────────────────────────────────────┤
│ SOC Code: [15-1253.00] [Process]                       │
├─────────────────────────────────────────────────────────┤
│ Step 1: 🔍 Fetching ONET Data... ✅ Complete (1.2s)   │
│ Step 2: 🔍 Fetching COS Data... ✅ Complete (0.8s)    │
│ Step 3: 🤖 Processing with LAiSER... 🔄 Processing    │
│                                                         │
│ Rich Text Preview:                                     │
│ "Develop, create, and modify general computer...      │
├─────────────────────────────────────────────────────────┤
│ Extracted Skills (24 found):                          │
│                                                       │
│ ✅ Python Programming (95%) [AUTO-APPROVED]           │
│ 🟡 Advanced Algorithms (78%) [REVIEW]                 │
│ ✅ Database Design (89%) [AUTO-APPROVED]              │
│ ❌ Vendor Product X (45%) [REJECTED]                  │
│                                                       │
│ [Select All High Confidence] [Approve Selected] [Save]│
└─────────────────────────────────────────────────────────┘
```

### Progress States
- **Loading:** Spinner with descriptive text
- **Success:** Green checkmarks with timing
- **Error:** Red X with error details and retry option
- **Partial Success:** Yellow warning for API failures

## Quality Assurance Strategy

### Confidence Thresholds
```typescript
const CURATION_RULES = {
  auto_approve: 85,    // ≥85% confidence → auto-approved
  admin_review: 60,    // 60-84% confidence → admin review
  reject: 30          // <30% confidence → rejected
}
```

### Validation Checks
- SOC code format validation
- API response validation
- Skills deduplication against existing skills
- Confidence score sanity checks
- Rate limiting for external APIs

## Integration Points

### Existing Systems Compatibility
- **Quiz Generation:** Uses existing OpenAI pipeline with enhanced skills
- **Assessment Engine:** Leverages existing proficiency scoring
- **Admin Interface:** Integrates with existing `/admin` navigation
- **Database:** Uses existing junction tables and relationships

### Future Scaling Considerations
- Confidence thresholds can be adjusted via admin settings
- Multi-admin curation support built-in
- Batch processing for multiple SOC codes
- A/B testing of auto-approved vs manually curated skills

## Testing Strategy

### Unit Tests
- API route response validation
- Skills transformation logic
- Confidence scoring accuracy
- Database operation success

### Integration Tests
- Full SOC processing workflow
- Skills storage and retrieval
- Quiz generation with enhanced skills
- Admin interface interactions

### QA Checklist
- [ ] SOC code processing works for all 30 MVP occupations
- [ ] Skills extraction accuracy meets 90%+ standard
- [ ] Admin curation interface is intuitive
- [ ] Quiz generation works with enhanced skills
- [ ] Performance meets sub-5-second processing target
- [ ] Error handling covers all edge cases

## Migration Strategy

### Phase 1: Parallel Operation (MVP)
- LAiSER runs alongside existing O*NET/Lightcast pipeline
- Admin can compare results and choose best approach
- Gradual rollout occupation by occupation

### Phase 2: Enhanced Default (Post-MVP)
- LAiSER becomes default for new occupations
- Existing occupations can be enhanced on-demand
- Automated curation for high-confidence extractions

### Phase 3: Full Automation (Scale)
- Confidence-based auto-approval for most extractions
- Admin review only for edge cases
- Real-time enhancement of existing occupations

## Risk Mitigation

### Technical Risks
- **API Failures:** Graceful fallback to existing data
- **LAiSER Errors:** Continue with O*NET/Lightcast skills
- **Performance:** Async processing with progress indicators
- **Data Quality:** Admin override capability

### Business Risks
- **Quality Issues:** Manual curation ensures beta success
- **Timeline Delays:** Modular implementation allows phased rollout
- **Cost Overruns:** Rate limiting and caching minimize API costs
- **User Impact:** Zero disruption to existing functionality

## Success Metrics

### Quality Metrics
- Skills accuracy: ≥90% match with expert curation
- Processing time: <5 seconds per SOC code
- API reliability: ≥99% success rate
- Admin satisfaction: Intuitive curation workflow

### Business Metrics
- Enhanced occupations: All 30 MVP occupations processed
- Quiz quality improvement: Measurable via user feedback
- Development velocity: No blocking dependencies
- Scalability: Architecture supports 1000+ occupations

## Next Steps

1. **Schema Migration:** Add curation metadata columns
2. **API Development:** Implement SOC processing routes
3. **UI Implementation:** Build admin interface
4. **Integration Testing:** End-to-end workflow validation
5. **MVP Rollout:** Process first SOC code manually
6. **Iterative Enhancement:** Refine based on real usage

---

**Document Version:** 1.0
**Date:** October 7, 2025
**Status:** Ready for Implementation
**Approver:** Keith Marcel (SkillSync Founder)
