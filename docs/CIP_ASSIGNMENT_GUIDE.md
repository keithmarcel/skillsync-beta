# CIP Assignment Guide

## Quick Start

### Step 1: Run Migration
```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/20250930000005_add_cip_metadata.sql
```

### Step 2: Add OpenAI API Key
```bash
# Add to .env.local:
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Run Batch Assignment
```bash
npm install openai  # If not already installed
node scripts/assign-cips-batch.js
```

---

## What Happens

### AI Process
1. **Fetches** all programs without CIP codes
2. **Analyzes** each program:
   - Program name
   - Description (long_desc or short_desc)
   - Program type (Certificate, Associate's, etc.)
   - Discipline (Business, Technology, etc.)
3. **Suggests** top 3 CIP codes with confidence scores
4. **Validates** CIP exists in database
5. **Auto-assigns** top suggestion (all approved by default)
6. **Stores** all suggestions for future reference

### Example Output
```
[1/223] Processing: "Full Stack Web Development Certificate"
   🤖 Top suggestion: 11.0801 - Web Page, Digital/Multimedia Design
   📊 Confidence: 95%
   💭 Reasoning: Direct match for web development certificate program
   ✅ Auto-assigned (high confidence)

[2/223] Processing: "Business Administration - Associate's Degree"
   🤖 Top suggestion: 52.0201 - Business Administration and Management
   📊 Confidence: 92%
   💭 Reasoning: Standard business admin associate degree
   ✅ Auto-assigned (high confidence)
```

---

## Database Fields Added

| Field | Type | Purpose |
|-------|------|---------|
| `cip_assignment_confidence` | INTEGER | AI confidence score (0-100) |
| `cip_assignment_method` | TEXT | How assigned: `ai_auto`, `manual`, `partner_provided` |
| `cip_approved` | BOOLEAN | Approval status (default `true` for testing) |
| `cip_suggestions` | JSONB | All AI suggestions stored for reference |

---

## Admin Tools

### CIP Code is Editable
In `/admin/programs/[id]`:
- CIP Code field is a searchable dropdown
- Shows all 1,949 CIP codes from database
- Format: `11.0101 - Computer and Information Sciences, General`
- Admin can change CIP anytime

### Future: Approval Workflow
When `cip_approved` is used:
- Filter programs needing review: `WHERE cip_approved = false`
- Admin reviews AI suggestions
- Approves or changes CIP code
- Sets `cip_approved = true`

---

## Onboarding New Education Partners

### Best Practice: Ask for CIPs Upfront

**When onboarding new schools/programs:**

1. **Request CIP codes** in program data template
2. **Set method** to `partner_provided`
3. **Skip AI** for partner-provided CIPs
4. **Validate** CIPs exist in our database

**Example Template for Partners:**
```csv
program_name,program_type,cip_code,description,duration,url
"Computer Science - AS","Associate's Degree","11.0101","Intro to CS...","2 years","https://..."
"Business Admin - BS","Bachelor's Degree","52.0201","Business fundamentals...","4 years","https://..."
```

**Benefits:**
- ✅ Most accurate (school knows their programs)
- ✅ No AI cost
- ✅ No manual review needed
- ✅ Faster onboarding

---

## Cost & Performance

### Batch Processing
- **Time:** ~4 minutes for 223 programs (1 second per program)
- **Cost:** ~$4-5 for all programs
- **Accuracy:** 90%+ confidence for most programs

### Per-Program Cost
- **GPT-4 tokens:** ~700 tokens per program
- **Cost:** ~$0.02 per program
- **Very affordable** for ongoing use

---

## Validation

### CIP Code Format
- Must be 6-digit: `##.####`
- Example: `11.0101`
- Must exist in `cip_codes` table

### Confidence Levels
- **90-100%:** Exact match, very confident
- **75-89%:** Strong match, confident
- **50-74%:** Reasonable match, some uncertainty
- **Below 50%:** Weak match (rare with good data)

---

## Troubleshooting

### "CIP not found in database"
- AI suggested CIP doesn't exist in our 1,949 codes
- Usually formatting issue (e.g., `11.01` vs `11.0100`)
- Script tries alternative formats automatically
- If fails, program skipped (manual assignment needed)

### "No suggestions returned"
- OpenAI API error or rate limit
- Check API key is valid
- Check internet connection
- Script will skip and continue

### Low Confidence Scores
- Vague program names (e.g., "General Studies")
- Missing descriptions
- Unusual program types
- Still auto-assigned but flagged for potential review

---

## Future Enhancements

### Approval Workflow (When Needed)
```typescript
// Admin dashboard
const programsNeedingReview = await supabase
  .from('programs')
  .select('*')
  .eq('cip_approved', false)
  .lt('cip_assignment_confidence', 90);

// Show review queue with AI suggestions
// Admin can approve or change CIP
```

### Bulk Re-assignment
```bash
# Re-run AI on specific programs
node scripts/assign-cips-batch.js --filter="discipline=Technology"
node scripts/assign-cips-batch.js --filter="confidence<75"
```

### Partner Import Script
```bash
# Import programs with CIPs from partner CSV
node scripts/import-partner-programs.js --file=partner-data.csv
# Automatically sets cip_assignment_method='partner_provided'
```

---

## Next Steps After CIP Assignment

Once all programs have CIP codes:

1. **Day 3:** Extract skills via CIP → SOC → Skills pipeline
2. **Populate** `program_skills` table
3. **Enable** program-job matching
4. **Build** skills gap analysis
5. **Generate** skills-based assessments

**CIP codes are the foundation for everything else!** 🚀
