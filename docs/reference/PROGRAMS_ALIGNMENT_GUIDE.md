# Programs Table Alignment - Execution Guide

## 🎯 Objective

Align `programs` table with `jobs` table structure to ensure:
1. ✅ Skills are the central fabric connecting all entities
2. ✅ Featured/All tabs work consistently across jobs and programs
3. ✅ Programs have same capabilities as jobs (featured flag, skills count, etc.)
4. ✅ 1:1 relational parity between programs and jobs

---

## 📊 Current State vs Target State

### Current Programs Table (Missing Fields)
```sql
CREATE TABLE programs (
  id UUID,
  school_id UUID,
  name TEXT,
  program_type TEXT,
  format TEXT,
  duration_text TEXT,
  short_desc TEXT,
  program_url TEXT,
  cip_code TEXT,
  status TEXT,
  -- ❌ Missing: is_featured
  -- ❌ Missing: featured_image_url
  -- ❌ Missing: skills_count
  -- ❌ Missing: created_at, updated_at
);
```

### Target Programs Table (Aligned with Jobs)
```sql
CREATE TABLE programs (
  id UUID,
  school_id UUID,
  name TEXT,
  program_id TEXT UNIQUE,           -- ✅ Added in previous migration
  program_type TEXT,
  format TEXT,
  duration_text TEXT,
  short_desc TEXT,
  long_desc TEXT,                   -- ✅ Added in previous migration
  discipline TEXT,                  -- ✅ Added in previous migration
  catalog_provider TEXT,            -- ✅ Added in previous migration
  program_url TEXT,
  program_guide_url TEXT,           -- ✅ Added in previous migration
  cip_code TEXT,
  is_featured BOOLEAN,              -- ✅ NEW: Featured tab control
  featured_image_url TEXT,          -- ✅ NEW: Hero image
  skills_count INTEGER,             -- ✅ NEW: Cached skills count
  status TEXT,
  created_at TIMESTAMPTZ,           -- ✅ NEW: Audit trail
  updated_at TIMESTAMPTZ            -- ✅ NEW: Auto-updated
);
```

---

## 🚀 Execution Steps

### Step 1: Run Alignment Migration

```bash
# In Supabase Dashboard SQL Editor
# Execute: supabase/migrations/20250930000002_align_programs_with_jobs.sql
```

**What this does:**
- ✅ Adds `is_featured`, `featured_image_url`, `skills_count`, `created_at`, `updated_at`
- ✅ Creates indexes for performance
- ✅ Creates triggers for auto-updating `skills_count` and `updated_at`
- ✅ Adds helper functions: `get_featured_programs()`, `get_programs_with_skills()`
- ✅ Backfills `skills_count` for existing programs

### Step 2: Verify Schema Alignment

```sql
-- Check new columns exist
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'programs'
  AND column_name IN ('is_featured', 'featured_image_url', 'skills_count', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Verify triggers exist
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'programs'
   OR event_object_table = 'program_skills';
```

### Step 3: Update UI Logic

#### Programs Page - Featured Tab
```typescript
// Before (incorrect - no featured programs logic)
const { data: featuredPrograms } = await supabase
  .from('programs')
  .select('*')
  .eq('status', 'published')

// After (correct - filter by is_featured)
const { data: featuredPrograms } = await supabase
  .from('programs')
  .select('*')
  .eq('is_featured', true)
  .eq('status', 'published')
  .order('created_at', { ascending: false })
```

#### Programs Page - All Tab
```typescript
// All programs (includes featured + non-featured)
const { data: allPrograms } = await supabase
  .from('programs')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
```

---

## 🎨 Featured Programs Setup

### Mark Programs as Featured

```sql
-- Example: Set top Bisk Amplified programs as featured
UPDATE programs
SET is_featured = true
WHERE program_id IN (
  '21189348961',  -- MBA Program
  '25716067168',  -- Data Science Master's
  -- Add more program_ids
)
AND status = 'published';
```

### Add Featured Images

```sql
-- Update featured programs with hero images
UPDATE programs
SET featured_image_url = '/assets/programs/mba-hero.jpg'
WHERE program_id = '21189348961';

UPDATE programs
SET featured_image_url = '/assets/programs/data-science-hero.jpg'
WHERE program_id = '25716067168';
```

---

## 🔗 Skills Integration

### Current State
- ✅ `program_skills` junction table exists
- ✅ Foreign keys to `programs` and `skills` tables
- ✅ Weight column for skill emphasis

### Add Skills to Programs

```sql
-- Example: Link program to skills
INSERT INTO program_skills (program_id, skill_id, weight)
SELECT 
  p.id as program_id,
  s.id as skill_id,
  0.9 as weight  -- High emphasis
FROM programs p
CROSS JOIN skills s
WHERE p.program_id = '21189348961'  -- MBA Program
  AND s.name IN ('Strategic Planning', 'Financial Analysis', 'Leadership')
ON CONFLICT DO NOTHING;

-- Skills count auto-updates via trigger!
```

### Verify Skills Count

```sql
-- Check skills count is accurate
SELECT 
  p.name,
  p.skills_count as cached_count,
  COUNT(ps.skill_id) as actual_count
FROM programs p
LEFT JOIN program_skills ps ON p.id = ps.program_id
GROUP BY p.id
HAVING p.skills_count != COUNT(ps.skill_id);  -- Should return 0 rows
```

---

## 📋 Validation Checklist

### Schema Alignment
- [ ] `is_featured` column exists in programs table
- [ ] `featured_image_url` column exists in programs table
- [ ] `skills_count` column exists in programs table
- [ ] `created_at` and `updated_at` columns exist in programs table
- [ ] Indexes created on `is_featured`, `school_id`, `status`

### Triggers & Functions
- [ ] `trigger_update_program_skills_count` exists on `program_skills` table
- [ ] `handle_programs_updated_at` exists on `programs` table
- [ ] `get_featured_programs()` function works
- [ ] `get_programs_with_skills()` function works

### Data Integrity
- [ ] All programs have `created_at` and `updated_at` timestamps
- [ ] Skills count matches actual program_skills count
- [ ] Featured programs have `featured_image_url` set
- [ ] Featured programs appear in Featured tab
- [ ] All programs appear in All tab

### UI Integration
- [ ] Featured Programs tab shows only `is_featured = true`
- [ ] All Programs tab shows all published programs
- [ ] Skills count displays correctly
- [ ] Featured images render on detail pages

---

## 🎯 Success Criteria

### Relational Parity Achieved
- ✅ Programs table structure matches jobs table
- ✅ Skills are central fabric via `program_skills` junction
- ✅ Featured/All tabs work consistently
- ✅ Auto-updating skills count via triggers
- ✅ Audit trail with timestamps

### Three-Stakeholder Value
- ✅ **Job Seekers**: Discover programs via skills gaps
- ✅ **Employers**: See programs teaching required skills
- ✅ **Education Providers**: Programs linked to in-demand skills

---

## 📚 Related Documentation

- **Skills Taxonomy Architecture**: `/docs/reference/skills-taxonomy-architecture.md`
- **HubSpot Import Guide**: `/docs/reference/hubspot-import-guide.md`
- **CIP Pipeline**: `/docs/reference/cip_scaffolding.md`
- **Technical Architecture**: `/docs/skill-sync-technical-architecture.md`

---

## 🚨 Important Notes

1. **Featured Flag**: Only set `is_featured = true` for curated, high-quality programs
2. **Featured Images**: Required for featured programs (constraint enforced)
3. **Skills Count**: Auto-updated by trigger - don't manually update
4. **Timestamps**: `updated_at` auto-updates on any program change
5. **CIP Codes**: Will be used for automatic skills mapping via CIP-SOC pipeline

---

## Next Steps After Alignment

1. ✅ Execute alignment migration
2. ✅ Verify schema changes
3. ✅ Update UI components for Featured/All tabs
4. ✅ Curate featured programs (set flags + images)
5. ✅ Implement CIP-SOC-Skills pipeline
6. ✅ Test job-to-program recommendations
