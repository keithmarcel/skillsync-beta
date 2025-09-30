# Database Design Recommendation: Unified Jobs Table

## Current State Analysis

### Schema Issues
- **Enum Mismatch**: Local schema uses `'high_demand'`, remote uses `'occupation'`
- **Missing Columns**: No proper support for labor market data (growth rates, job openings, education requirements)
- **Inconsistent Associations**: Featured roles need companies, occupations need SOC codes

### Data Types
1. **Featured Roles** (`job_kind = 'featured_role'`)
   - Company-specific positions
   - Require `company_id` association
   - Focus on specific employer opportunities
   - May have custom job descriptions

2. **High Demand Occupations** (`job_kind = 'occupation'`)
   - Labor market data from BLS/O*NET
   - Require `soc_code` for standardization
   - Include employment projections, growth rates
   - Education/training requirements

## Recommended Solution: Enhanced Unified Table

### Why Unified Approach?
✅ **Pros:**
- Single source of truth for all job-related data
- Consistent skill associations across job types
- Simplified queries and maintenance
- Better search/filtering capabilities
- Future-proof for additional job types

❌ **Cons:**
- Some nullable columns
- Slightly more complex validation logic

### Enhanced Schema Design

```sql
CREATE TABLE public.jobs (
  -- Core identification
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_kind job_kind NOT NULL, -- 'featured_role' | 'occupation'
  title text NOT NULL,
  
  -- Classification
  category text,
  soc_code text, -- Required for occupations
  is_featured boolean DEFAULT false,
  
  -- Company association (featured roles only)
  company_id uuid REFERENCES companies(id),
  
  -- Job details
  job_type text,
  long_desc text,
  featured_image_url text,
  
  -- Location
  location_city text,
  location_state text,
  
  -- Compensation
  median_wage_usd numeric,
  
  -- Labor market data (occupations)
  employment_outlook text,
  education_level text,
  work_experience text,
  on_job_training text,
  job_openings_annual integer,
  growth_rate_percent numeric,
  
  -- Skills
  skills_count integer DEFAULT 0,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT chk_featured_role_has_company 
    CHECK ((job_kind = 'featured_role' AND company_id IS NOT NULL) OR job_kind = 'occupation'),
  CONSTRAINT chk_occupation_has_soc 
    CHECK ((job_kind = 'occupation' AND soc_code IS NOT NULL) OR job_kind = 'featured_role')
);
```

### Data Integrity Rules
1. **Featured Roles** MUST have `company_id`
2. **Occupations** MUST have `soc_code`
3. **Labor market fields** only populated for occupations
4. **Company-specific fields** only for featured roles

### Migration Strategy
1. Fix enum mismatch (`high_demand` → `occupation`)
2. Add missing columns with proper defaults
3. Add constraints for data integrity
4. Update existing data to set `is_featured` flags
5. Update import scripts to use correct enum values

### Query Patterns
```sql
-- Featured Roles
SELECT * FROM jobs 
WHERE job_kind = 'featured_role' 
AND is_featured = true;

-- High Demand Occupations
SELECT * FROM jobs 
WHERE job_kind = 'occupation' 
AND growth_rate_percent > 0;

-- All Jobs with Skills
SELECT j.*, array_agg(s.name) as skills
FROM jobs j
LEFT JOIN job_skills js ON j.id = js.job_id
LEFT JOIN skills s ON js.skill_id = s.id
GROUP BY j.id;
```

## Implementation Steps

1. **Apply Migration** - Run schema updates
2. **Update Import Scripts** - Fix enum values and add new data fields
3. **Update Queries** - Enhance getFeaturedRoles() and getHighDemandOccupations()
4. **Update UI Components** - Handle new data fields in job cards
5. **Test Data Flow** - Verify both job types display correctly

This unified approach provides the flexibility to support both job types while maintaining data integrity and performance.
