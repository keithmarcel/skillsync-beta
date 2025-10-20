# Skills Import Quickstart Guide

## Overview

This guide walks through importing the comprehensive skills taxonomy (Lightcast + O*NET) to enable skills-first architecture.

---

## Prerequisites

### 1. Lightcast API Access (Primary Source)

**Register at:** https://skills.emsidata.com/

1. Create free account
2. Get Client ID and Client Secret
3. Add to `.env.local`:
```bash
LIGHTCAST_CLIENT_ID=your_client_id
LIGHTCAST_CLIENT_SECRET=your_client_secret
```

### 2. O*NET API Access (Backup Source)

**Already configured** - credentials in `.env.local.example`:
```bash
ONET_API_USERNAME=biskamplified
ONET_API_PASSWORD=4737fxr
```

---

## Import Process

### Option A: Lightcast Only (Recommended for Speed)

**Time:** ~30 minutes
**Result:** 30,000+ skills

```bash
node scripts/import-lightcast-skills.js
```

**What it does:**
- Authenticates with Lightcast API
- Fetches all skills from Open Skills taxonomy
- Deduplicates by `lightcast_id`
- Imports to `skills` table with `source='LIGHTCAST'`

### Option B: O*NET Only (Fallback)

**Time:** ~2-3 hours (rate limited: 20 req/min)
**Result:** 1,000-2,000 skills

```bash
node scripts/import-onet-skills.js
```

**What it does:**
- Gets all SOC codes from `cip_soc_crosswalk`
- Calls O*NET API for each SOC
- Fetches Skills + Knowledge + Abilities
- Filters generic skills
- Deduplicates by `onet_id`
- Imports to `skills` table with `source='ONET'`

### Option C: Both (Best Coverage)

**Time:** ~3-4 hours
**Result:** 30,000+ skills with O*NET mapping

```bash
# Run Lightcast first (faster)
node scripts/import-lightcast-skills.js

# Then O*NET for backup/mapping
node scripts/import-onet-skills.js
```

---

## Verification

Check import success:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { count: total } = await supabase.from('skills').select('*', { count: 'exact', head: true });
  const { count: lightcast } = await supabase.from('skills').select('*', { count: 'exact', head: true }).eq('source', 'LIGHTCAST');
  const { count: onet } = await supabase.from('skills').select('*', { count: 'exact', head: true }).eq('source', 'ONET');
  
  console.log('Total skills:', total);
  console.log('Lightcast:', lightcast);
  console.log('O*NET:', onet);
}
check();
"
```

Expected output:
```
Total skills: 30000+
Lightcast: 30000+
O*NET: 1000-2000
```

---

## Next Steps

After skills import completes:

1. **Rewrite Program Extraction**
   - Update `src/lib/services/program-skills-extraction.ts`
   - Change from: CIP → SOC → Jobs → Skills
   - Change to: CIP → SOC → O*NET API → Skills

2. **Run Program Skills Extraction**
   ```bash
   node scripts/extract-program-skills-v2.js
   ```

3. **Verify Results**
   - All 223 programs should have skills
   - Check `program_skills` table count
   - Test assessment recommendations

---

## Troubleshooting

### Lightcast Authentication Fails

**Error:** `Authentication failed: 401`

**Fix:**
- Verify `LIGHTCAST_CLIENT_ID` and `LIGHTCAST_CLIENT_SECRET` in `.env.local`
- Check credentials at https://skills.emsidata.com/

### O*NET Rate Limiting

**Error:** `429 Too Many Requests`

**Fix:**
- Script already has 3-second delays
- If still failing, increase delay in `import-onet-skills.js`
- O*NET limit: 20 requests/minute

### Import Hangs

**Cause:** Supabase connection pool doesn't close

**Fix:**
- Let it run (it will complete)
- Or add `process.exit(0)` at end of script
- Or use Ctrl+C after seeing "Import Complete"

---

## Architecture Impact

### Before Import:
- 34 skills (from 38 jobs)
- 113 programs with skills (51%)
- Jobs-centric architecture

### After Import:
- 30,000+ skills (comprehensive taxonomy)
- 223 programs with skills (100%)
- Skills-centric architecture ✅

---

## Cost & Time

| Source | Time | Cost | Skills |
|--------|------|------|--------|
| Lightcast | 30 min | Free | 30,000+ |
| O*NET | 2-3 hrs | Free | 1,000-2,000 |
| Both | 3-4 hrs | Free | 30,000+ |

**Recommended:** Start with Lightcast, add O*NET if needed for mapping.

---

## Support

**Documentation:**
- Lightcast: https://skills.emsidata.com/docs
- O*NET: https://services.onetcenter.org/reference

**Issues:**
- Check `/docs/COMPREHENSIVE_REVIEW_2025-09-30.md` for architecture details
- Review `/docs/ARCHITECTURE_REVIEW_2025-09-30.md` for implementation plan
