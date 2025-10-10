# O*NET Data Enrichment Pipeline

## Primary Script: `enrich-jobs-onet.js`

This is the **unified, production-ready** script for enriching both Featured Roles and High-Demand Occupations with O*NET data.

### What It Does

1. **Fetches Real O*NET Data** from O*NET Web Services API
   - Tasks and responsibilities
   - Tools and technology

2. **Refines with AI (GPT-4o-mini)**
   - Makes content concise and professional
   - Differentiates strategic responsibilities from tactical tasks
   - Fills gaps (especially tools)

3. **Creates Distinct Content**
   - **Core Responsibilities**: Strategic, outcome-focused (6-8 items)
   - **Day-to-Day Tasks**: Tactical, action-focused (10-12 items)
   - **Tools & Technology**: Industry-standard tools (8-12 items)

### Usage

```bash
# Enrich all jobs (featured roles + occupations)
node scripts/enrich-jobs-onet.js --force

# Enrich only featured roles
node scripts/enrich-jobs-onet.js --featured-roles --force

# Enrich only occupations
node scripts/enrich-jobs-onet.js --occupations --force

# Dry run (preview changes)
node scripts/enrich-jobs-onet.js --dry-run

# Single job by ID
node scripts/enrich-jobs-onet.js --job-id=xxx --force
```

### Flags

- `--force`: Overwrite existing data (required if jobs already have O*NET data)
- `--dry-run`: Preview changes without updating database
- `--job-id=xxx`: Process single job by ID
- `--featured-roles`: Process only featured roles
- `--occupations`: Process only occupations (HDOs)

### Data Quality

**Core Responsibilities** (Strategic/Outcome-focused):
- "Maintain financial accuracy and compliance"
- "Oversee project timelines and deliverables"
- "Ensure team productivity and performance"

**Day-to-Day Tasks** (Tactical/Action-focused):
- "Draft and proofread business correspondence"
- "Schedule appointments and maintain calendars"
- "Organize and file financial documents"

**Tools & Technology**:
- Categorized: Software, Equipment, Technology
- Industry-standard and realistic
- AI fills gaps when O*NET data is incomplete

### Rate Limiting

- 2-second delay between jobs to respect API limits
- ~30 jobs = ~2-3 minutes total runtime

### Environment Variables Required

```env
# O*NET Web Services API
ONET_USERNAME=your_username
ONET_PASSWORD=your_password

# OpenAI API
OPENAI_API_KEY=your_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deprecated Scripts

- `DEPRECATED-enrich-featured-roles-onet.js` - Old featured roles only script
- Use `enrich-jobs-onet.js` instead (unified approach)

## Results

After running the enrichment:
- ✅ Real O*NET data as foundation
- ✅ AI-refined for conciseness and clarity
- ✅ Clear differentiation between responsibilities and tasks
- ✅ Tools coverage filled appropriately
- ✅ Consistent quality across all jobs
