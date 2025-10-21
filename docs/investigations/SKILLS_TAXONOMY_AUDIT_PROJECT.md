# Skills Taxonomy System Audit & Optimization Project

**Created:** October 21, 2025  
**Priority:** P1 - Critical Infrastructure  
**Status:** Not Started  
**Estimated Duration:** 2-3 weeks  
**Owner:** TBD

---

## 🎯 Executive Summary

Comprehensive audit and optimization of the entire skills taxonomy system, including data pipelines, crosswalks, confidence matching, and integration points across the application. This project aims to streamline skills management, eliminate redundancy, and create a unified, automated pipeline for skills currency.

---

## 🔍 Problem Statement

### Current Concerns
1. **Fragmented Skills Sources**: Multiple data sources (Lightcast, O*NET, CareerOneStop, AI) with unclear precedence and integration patterns
2. **Potential Code Redundancy**: Multiple functions for similar operations (getRelatedPrograms, findProgramsForGaps, getGapFillingPrograms)
3. **Inconsistent Matching**: Skills-based matching vs CIP-SOC crosswalk - which to use when?
4. **Data Quality**: No confidence scoring or quality metrics for skill mappings
5. **Legacy Code**: Possible outdated functions and database tables from previous implementations
6. **Manual Processes**: Skills management lacks automation and self-healing capabilities

### Impact
- Programs showing "0 jobs" due to skill ID mismatches
- Assessments showing "0 programs" due to different matching logic
- Unclear data lineage and source of truth
- Difficult to maintain and debug
- Risk of data drift and inconsistency

---

## 📊 Audit Scope

### 1. Skills Data Sources Audit

**Investigate:**
- ✅ **Lightcast (32K+ skills)**: How are they imported? When? How often updated?
- ✅ **O*NET (62 skills)**: Integration points, importance ratings, usage
- ✅ **CareerOneStop**: Real-world tasks, tools, labor market data
- ✅ **AI Enhancement**: Where is AI used to generate/enrich skills?

**Questions:**
- Which source is the "source of truth" for each entity type?
- How do we handle conflicts between sources?
- What's the update/refresh strategy for each source?
- Are there unused or duplicate skills from different sources?

**Deliverable:** Skills data source matrix with precedence rules

---

### 2. Database Schema Audit

**Tables to Review:**
```
✅ skills (35,041 rows)          - Master taxonomy
✅ soc_skills (460 rows)          - SOC → Skills
✅ job_skills (105 rows)          - Featured Roles → Skills  
✅ program_skills (1,843 rows)    - Programs → Skills
✅ assessment_skills              - Assessment → Skills
✅ occupation_skills              - Occupations → Skills (if exists)
✅ cip_soc_crosswalk             - CIP ↔ SOC mappings
```

**Questions:**
- Are all tables actively used?
- Any orphaned or stale data?
- Are foreign key relationships correct?
- Do we need additional indexes for performance?
- Should we consolidate any tables?

**Deliverable:** Database cleanup script + schema optimization recommendations

---

### 3. Skills Pipeline Audit

**Current Pipelines to Document:**

**A. Skills Import Pipeline**
```
External API → Import Script → skills table → Junction tables
```
- Where: `scripts/import-lightcast-skills.ts`, `scripts/import-onet-skills.ts`
- Frequency: Manual
- Validation: ?
- Error handling: ?

**B. Skills Mapping Pipeline**
```
Job/Program → AI Analysis → Skill Extraction → Junction table → Validation
```
- Where: `lib/services/hybrid-skills-mapper.ts`, `lib/services/onet-skills-mapper.ts`
- Triggers: Manual via admin UI
- Confidence scoring: ?

**C. Skills Matching Pipeline**
```
Assessment → Gap Analysis → Program Recommendations
Job → Related Programs
Program → Related Jobs
```
- Where: Multiple files (queries.ts, program-gap-matching.ts, etc.)
- Methods: Skill overlap vs CIP-SOC crosswalk
- Consistency: ❌ Different approaches

**Deliverable:** Complete pipeline documentation with data flow diagrams

---

### 4. Code Redundancy Audit

**Functions to Review:**

**Program Matching:**
- `getRelatedPrograms()` - Uses CIP-SOC crosswalk ✅
- `getGapFillingPrograms()` - Uses skill overlap ❌
- `findProgramsForGaps()` - Uses skill overlap ❌
- `findProgramsBySkillOverlap()` - ?

**Job Matching:**
- `getRelatedJobsForProgram()` - Now uses CIP-SOC ✅
- `getRelatedJobsCountForProgram()` - Now uses CIP-SOC ✅
- `getSimilarRoles()` - ?
- `getRelatedFeaturedRoles()` - ?

**Skills Enrichment:**
- `enrichJobSkills()` - ?
- `enrichProgramSkills()` - ?
- `mapSkillsToJob()` - ?
- `extractSkillsFromDescription()` - ?

**Questions:**
- Can these be consolidated into a unified matching service?
- Which functions are actually used in production?
- Are there deprecated functions still in the codebase?

**Deliverable:** Refactoring plan with function consolidation strategy

---

### 5. Confidence Matching System

**Current State:** ❌ No confidence scoring

**Needed:**
- **Skills → Jobs**: Confidence score (0-100) based on:
  - Source (O*NET importance rating = high confidence)
  - AI extraction (lower confidence, needs validation)
  - Manual curation (highest confidence)
  
- **Skills → Programs**: Confidence score based on:
  - CIP-SOC crosswalk strength (primary/secondary/tertiary)
  - Skill overlap percentage
  - Manual verification status

- **Program → Job Matching**: Combined confidence:
  - CIP-SOC match strength
  - Skill overlap percentage
  - Historical success rate (future)

**Deliverable:** Confidence scoring system design + implementation plan

---

### 6. Integration Points Audit

**Pages Using Skills Data:**
- ✅ My Assessments (program_matches_count)
- ✅ Assessment Results (program recommendations)
- ✅ Programs List (related jobs count)
- ✅ Program Details (related jobs list)
- ✅ Job Details (skills list, related programs)
- ✅ Role Editor (skills management)
- ✅ Skills Snapshot (assessment results)

**Questions:**
- Are all integration points using the same matching logic?
- Are there performance issues with current queries?
- Can we cache or precompute any relationships?

**Deliverable:** Integration points map + performance optimization plan

---

### 7. Data Quality & Validation

**Current Issues:**
- ❌ Skills in program_skills don't overlap with job_skills/soc_skills
- ❌ No validation on skill assignments
- ❌ No data quality metrics or monitoring

**Needed:**
- Data quality dashboard
- Validation rules for skill assignments
- Automated data quality checks
- Alerting for data drift or anomalies

**Deliverable:** Data quality framework + monitoring dashboard

---

## 🎯 Proposed Solutions

### Phase 1: Documentation & Discovery (Week 1)

**Tasks:**
1. Document all skills data sources and import processes
2. Map all skills-related functions and their usage
3. Create data flow diagrams for each pipeline
4. Identify redundant or deprecated code
5. Document current integration points
6. Assess data quality issues

**Deliverables:**
- Complete skills system architecture document
- Function usage matrix
- Data quality report
- Redundancy analysis

---

### Phase 2: Standardization & Cleanup (Week 2)

**Tasks:**
1. **Unified Matching Service**: Create single service for all matching operations
   - `SkillsMatchingService.matchProgramsToJob()`
   - `SkillsMatchingService.matchJobsToProgram()`
   - `SkillsMatchingService.matchProgramsToGaps()`
   - Consistent use of CIP-SOC crosswalk + skill overlap

2. **Confidence Scoring**: Implement confidence system
   - Add `confidence_score` column to junction tables
   - Calculate scores based on source and validation
   - Use scores to filter/rank results

3. **Code Cleanup**: Remove deprecated functions
   - Archive old matching functions
   - Consolidate duplicate logic
   - Update all integration points to use new service

4. **Database Cleanup**: Optimize schema
   - Remove unused tables/columns
   - Add missing indexes
   - Clean up orphaned data
   - Add data validation constraints

**Deliverables:**
- Unified SkillsMatchingService
- Confidence scoring system
- Cleaned codebase
- Optimized database schema

---

### Phase 3: Automation & Monitoring (Week 3)

**Tasks:**
1. **Automated Skills Pipeline**:
   - Scheduled imports from external APIs
   - Automated validation and quality checks
   - Self-healing for common issues
   - Alerting for anomalies

2. **Skills Currency Management**:
   - Track last_updated timestamps
   - Flag stale data
   - Automated refresh workflows
   - Version control for skills data

3. **Monitoring Dashboard**:
   - Data quality metrics
   - Pipeline health status
   - Matching accuracy metrics
   - Performance monitoring

4. **Documentation**:
   - Update all technical docs
   - Create runbooks for common operations
   - Document troubleshooting procedures

**Deliverables:**
- Automated skills pipeline
- Monitoring dashboard
- Complete documentation
- Runbooks

---

## 📋 Investigation Checklist

### Data Sources
- [ ] Document Lightcast import process and frequency
- [ ] Document O*NET integration and usage
- [ ] Document CareerOneStop integration
- [ ] Document AI enhancement workflows
- [ ] Identify source of truth for each entity type
- [ ] Document conflict resolution strategy

### Database
- [ ] Audit all skills-related tables
- [ ] Identify unused or orphaned data
- [ ] Check foreign key relationships
- [ ] Analyze query performance
- [ ] Document schema optimization opportunities

### Code
- [ ] List all skills-related functions
- [ ] Identify redundant functions
- [ ] Map function usage across codebase
- [ ] Identify deprecated code
- [ ] Document refactoring opportunities

### Pipelines
- [ ] Document skills import pipeline
- [ ] Document skills mapping pipeline
- [ ] Document skills matching pipeline
- [ ] Identify automation opportunities
- [ ] Document error handling and validation

### Integration
- [ ] Map all pages using skills data
- [ ] Verify consistent matching logic
- [ ] Identify performance bottlenecks
- [ ] Document caching opportunities

### Quality
- [ ] Assess current data quality
- [ ] Identify validation gaps
- [ ] Design quality metrics
- [ ] Plan monitoring strategy

---

## 🎯 Success Criteria

1. **Single Source of Truth**: Clear documentation of which data source is authoritative for each use case
2. **Unified Matching**: All matching operations use consistent logic (CIP-SOC + confidence scoring)
3. **Code Cleanliness**: No redundant functions, all deprecated code removed
4. **Data Quality**: >95% of skills have valid mappings with confidence scores
5. **Automation**: Skills pipeline runs automatically with monitoring and alerting
6. **Performance**: All skills queries execute in <500ms
7. **Documentation**: Complete technical documentation with runbooks

---

## 📊 Metrics to Track

**Before Audit:**
- Functions with "skills" in name: ~50+
- Skills matching approaches: 2+ (skill overlap vs crosswalk)
- Data quality issues: Unknown
- Manual processes: Multiple
- Documentation coverage: ~60%

**After Audit (Target):**
- Consolidated functions: <20
- Skills matching approaches: 1 (unified service)
- Data quality: >95% confidence-scored
- Automated processes: 100%
- Documentation coverage: 100%

---

## 🚀 Next Steps

1. **Approve Project**: Get stakeholder buy-in for 2-3 week effort
2. **Assign Owner**: Dedicate developer(s) to audit
3. **Create Branch**: `feature/skills-taxonomy-audit`
4. **Start Phase 1**: Begin documentation and discovery
5. **Weekly Check-ins**: Review progress and adjust scope

---

## 📚 Related Documentation

- [Skills Taxonomy Architecture](../features/SKILLS_TAXONOMY_ARCHITECTURE.md)
- [CIP-SOC Crosswalk System](../features/CIP_SOC_CROSSWALK_SYSTEM.md)
- [Skills Weighting and Scoring](../SKILLS_WEIGHTING_AND_SCORING.md)
- [Skills Import Quickstart](../SKILLS_IMPORT_QUICKSTART.md)
- [Skills Mappings and Relationships](../features/SKILLS_MAPPINGS_AND_RELATIONSHIPS.md)

---

## 🔗 User Stories

**SYSTEM-INFRA-906**: Skills Taxonomy System Audit & Optimization  
**Epic**: System Infrastructure  
**Priority**: P1  
**Story Points**: 21 (3 weeks)

**As a** system architect  
**I want** a comprehensive audit of our skills taxonomy system  
**So that** we can eliminate redundancy, improve data quality, and create a unified, automated pipeline

**Acceptance Criteria:**
- [ ] Complete documentation of all skills data sources and pipelines
- [ ] Unified SkillsMatchingService with consistent logic
- [ ] Confidence scoring system implemented
- [ ] Redundant code removed and codebase cleaned
- [ ] Database optimized with quality constraints
- [ ] Automated pipeline with monitoring
- [ ] 100% documentation coverage
