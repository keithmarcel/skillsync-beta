# Dynamic CIP-SOC Crosswalk - Deployment Instructions

## Quick Setup (5 minutes)

### Step 1: Create the Table

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard/project/rzpywoxtrclvodpiqiqq/editor
2. Click "SQL Editor"
3. Copy contents of `scripts/create-cip-soc-table.sql`
4. Paste and click "Run"
5. Verify: Should see "CIP-SOC crosswalk table created successfully!"

**Option B: Via CLI**
```bash
psql $DATABASE_URL < scripts/create-cip-soc-table.sql
```

### Step 2: Populate with Data

```bash
node scripts/populate-cip-soc-crosswalk.js
```

Expected output:
```
✅ Cleared existing data
✅ Inserted 25 mappings
📊 Summary by Match Strength:
  Primary: 18
  Secondary: 7
  Tertiary: 0
```

### Step 3: Verify It Works

```bash
# Test the dynamic crosswalk
node -e "
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  // Check table exists
  const { count } = await supabase
    .from('cip_soc_crosswalk')
    .select('*', { count: 'exact', head: true });
  
  console.log('✅ CIP-SOC mappings:', count);
  
  // Test a query
  const { data } = await supabase
    .from('cip_soc_crosswalk')
    .select('*')
    .eq('soc_code', '15-1252.00')
    .limit(5);
  
  console.log('✅ Software Developer CIP codes:', data?.length);
}

test().catch(console.error);
"
```

### Step 4: Deploy Code

```bash
# Commit and push
git add -A
git commit -m "Deploy dynamic CIP-SOC crosswalk"
git push origin feature/crosswalk-implementation

# Merge to main when ready
```

---

## What Changed

### Before (Static):
- ❌ `program_jobs` junction table with hardcoded relationships
- ❌ Required manual regeneration after CIP changes
- ❌ Not scalable

### After (Dynamic):
- ✅ `cip_soc_crosswalk` table with NCES data
- ✅ Automatic updates when CIP codes change
- ✅ Fully scalable

### How It Works:
1. Job has SOC code (e.g., `15-1252.00` for Software Developers)
2. Query `cip_soc_crosswalk` for matching CIP codes
3. Query `programs` with those CIP codes
4. Calculate relevance scores
5. Return top 30 programs

---

## Troubleshooting

### "Table already exists"
✅ Good! Skip Step 1, go to Step 2.

### "No CIP codes found for SOC X"
- Run: `node scripts/populate-cip-soc-crosswalk.js`
- Add more mappings to the script if needed

### "0 programs showing"
- Verify programs have CIP codes: 
  ```sql
  SELECT COUNT(*) FROM programs WHERE cip_code IS NOT NULL;
  ```
- Verify CIP codes match crosswalk:
  ```sql
  SELECT DISTINCT p.cip_code 
  FROM programs p
  JOIN cip_soc_crosswalk c ON p.cip_code = c.cip_code
  LIMIT 10;
  ```

### Migration conflicts
- Ignore migration errors - use SQL script instead
- The table creation is idempotent (safe to run multiple times)

---

## Adding More CIP-SOC Mappings

Edit `scripts/populate-cip-soc-crosswalk.js`:

```javascript
const CIP_SOC_MAPPINGS = [
  // Add your mappings here
  { 
    cip_code: '52.0201', 
    cip_title: 'Business Administration', 
    soc_code: '11-1021.00', 
    soc_title: 'General Managers', 
    match_strength: 'primary' 
  },
  // ... more mappings
];
```

Then rerun:
```bash
node scripts/populate-cip-soc-crosswalk.js
```

---

## Optional: Remove Old Junction Table

After verifying dynamic crosswalk works:

```sql
-- Backup first (optional)
CREATE TABLE program_jobs_backup AS SELECT * FROM program_jobs;

-- Drop old table
DROP TABLE IF EXISTS program_jobs CASCADE;
```

---

## Testing Checklist

- [ ] Table created successfully
- [ ] 25+ CIP-SOC mappings loaded
- [ ] HDO table shows program counts
- [ ] Detail pages show programs
- [ ] Match percentages display
- [ ] No console errors
- [ ] Performance acceptable (<2s page load)

---

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify environment variables are set
4. Test queries directly in SQL Editor

**Ready to ship!** 🚀
