# HubSpot Programs Import Guide

## Overview

This guide documents the complete pipeline for importing HubSpot programs data into SkillSync, including schema extensions, staging tables, and data mapping logic.

---

## Architecture

### Data Flow
```
HubSpot CSV → Staging Table → Programs Table
                    ↓
              Schools Table (auto-create)
```

### Key Components
1. **Schema Extensions** - New columns in `programs` table
2. **Staging Table** - Preserves all CSV data for CIP pipeline
3. **Import Script** - Parses CSV and loads to staging
4. **Mapping Script** - AI-powered data transformation to programs table

---

## Schema Changes

### Programs Table Extensions

| Column | Type | Description |
|--------|------|-------------|
| `program_id` | TEXT UNIQUE | 11-char alphanumeric identifier (HubSpot Record ID or generated) |
| `catalog_provider` | TEXT | Program catalog source: 'Direct', 'Bisk Amplified', etc. |
| `discipline` | TEXT | Program discipline: Business, Technology, Healthcare, etc. |
| `long_desc` | TEXT | Full program overview/description |
| `program_guide_url` | TEXT | External program guide URL |

### Existing Programs Updates
- Generated `program_id` for 5 existing programs (11-char, starts with '3')
- Set `catalog_provider = 'Direct'`
- Assigned disciplines based on program names

---

## CSV Column Mapping

### Core Fields
| HubSpot CSV Column | Programs Table Field | Transformation |
|-------------------|---------------------|----------------|
| Record ID | `program_id` | Direct (11-char numeric) |
| Program Name | `name` | Direct |
| DegreeTypeName | `program_type` | Normalized (Bachelor's, Master's, Certificate, etc.) |
| Discipline | `discipline` | Normalized (Business, Technology, Healthcare, etc.) |
| Program Format | `format` | Direct (Online, Hybrid, On-campus) |
| ProgramDuration | `duration_text` | Direct |
| Overview | `long_desc` | Direct (full text) |
| Overview | `short_desc` | **AI-condensed to ~80-100 chars** |
| University / University Name Sync | `school_id` | Lookup/create in schools table |
| Program Guide URL | `program_guide_url` | Direct |

### Generated Fields
| Field | Value | Logic |
|-------|-------|-------|
| `catalog_provider` | 'Bisk Amplified' | Hardcoded for CSV data |
| `program_url` | Dynamic URL | `https://app.biskamplified.com/amp-programs-overview/{program_id}?portal=explore&partner=amp` |
| `status` | 'published' | Default |

### Staging Fields (Preserved for CIP Pipeline)
- Admission Detail
- Benefits
- What You'll Learn
- Who Should Register
- Why Program
- Curriculum
- Tuition
- Total Credit Hours
- All other CSV columns stored in `raw_data` JSONB

---

## Usage Instructions

### Step 1: Run Database Migrations

```bash
# Apply schema extensions
psql -h <supabase-host> -U postgres -d postgres -f supabase/migrations/20250930000000_extend_programs_schema.sql

# Create staging table
psql -h <supabase-host> -U postgres -d postgres -f supabase/migrations/20250930000001_create_hubspot_staging.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy migration contents
3. Execute

### Step 2: Install Dependencies

```bash
npm install csv-parser
```

### Step 3: Import CSV to Staging

```bash
node scripts/import-hubspot-programs.js docs/csv/hubspot-programs_2025-09-02-2.csv
```

**What this does:**
- Parses CSV with proper handling of embedded commas/quotes
- Inserts all rows into `hubspot_programs_staging`
- Extracts unique universities and creates schools
- Preserves complete CSV data in `raw_data` JSONB

### Step 4: Map Staging to Programs

```bash
node scripts/map-hubspot-programs.js
```

**What this does:**
- Fetches unprocessed staging records
- AI-condenses `Overview` to short description (~80-100 chars)
- Normalizes program types and disciplines
- Generates Bisk Amplified program URLs
- Links to schools via `school_id`
- Marks staging records as processed

---

## AI Summarization Logic

### Short Description Generation

**Target**: 80-100 characters (matching existing patterns)

**Strategy**:
1. Remove HTML tags
2. Extract first sentence if ≤100 chars
3. Truncate at word boundary if longer
4. Focus on key value proposition

**Examples**:
- Input: "This comprehensive program covers project management fundamentals including planning, execution, monitoring, and team leadership. Students will learn Agile methodologies and industry-standard tools."
- Output: "Comprehensive program covering planning, execution, monitoring, and team leadership."

---

## Validation Checklist

After import, verify:

- [ ] All programs have unique `program_id` (11 chars)
- [ ] Existing 5 programs have IDs starting with '3'
- [ ] HubSpot programs have numeric Record IDs
- [ ] All programs linked to valid schools
- [ ] Short descriptions are ~80-100 chars
- [ ] Disciplines are normalized
- [ ] Program URLs are correctly formatted
- [ ] Staging table preserves all CSV data
- [ ] No duplicate programs

---

## Troubleshooting

### Issue: CSV parsing errors
**Solution**: Ensure CSV has proper encoding (UTF-8) and no malformed quotes

### Issue: School not found
**Solution**: Check `university` and `university_name_sync` fields in staging, manually create school if needed

### Issue: Short description too long
**Solution**: Adjust `summarizeOverview()` function in mapping script

### Issue: Duplicate program_id
**Solution**: Check for duplicate Record IDs in CSV, resolve conflicts manually

---

## Future Enhancements

1. **CIP Code Assignment** - Use staging data to assign CIP codes via O*NET crosswalk
2. **Skills Extraction** - Parse "What You'll Learn" and "Curriculum" for skills mapping
3. **Program Recommendations** - Use discipline and skills for job-to-program matching
4. **Automated Updates** - Schedule periodic CSV imports for program catalog updates

---

## Files Reference

### Migrations
- `/supabase/migrations/20250930000000_extend_programs_schema.sql`
- `/supabase/migrations/20250930000001_create_hubspot_staging.sql`

### Scripts
- `/scripts/import-hubspot-programs.js` - CSV import to staging
- `/scripts/map-hubspot-programs.js` - Staging to programs mapping

### Data
- `/docs/csv/hubspot-programs_2025-09-02-2.csv` - Source CSV file

---

## Support

For issues or questions, refer to:
- Schema documentation: `/docs/db/supabase_schema-issues-and-changelog.md`
- CIP pipeline: `/docs/reference/cip_scaffolding.md`
- Technical architecture: `/docs/skill-sync-technical-architecture.md`
