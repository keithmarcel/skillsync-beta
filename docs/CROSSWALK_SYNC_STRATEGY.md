# CIP-SOC Crosswalk Sync Strategy

## Problem

The NCES CIP-SOC crosswalk data sometimes maps occupations to generic or outdated CIP codes that don't match what education providers actually use in their programs.

**Example:**
- NCES maps "Construction Managers" (SOC 11-9021.00) → CIP 46.0000 (Construction Trades, General)
- But real programs use CIP 52.2001 (Construction Management)
- Result: No programs show up for Construction Manager roles

## Solution: Automated Sync Script

### Script: `sync-crosswalk-with-programs.js`

**What it does:**
1. Analyzes actual programs in the database
2. Finds CIP codes that programs actually use
3. Updates crosswalk to match real-world program data
4. Removes obsolete mappings that have no programs

**When to run:**
- After importing new programs
- After updating program CIP codes
- When you notice crosswalk mismatches
- Periodically (monthly) to keep in sync

**How to run:**
```bash
node scripts/sync-crosswalk-with-programs.js
```

## Strategy

### 1. Trust Provider Data
- Education providers know their CIP codes better than NCES
- Use actual program CIP codes as source of truth
- NCES is a starting point, not gospel

### 2. Automatic Alignment
- Script matches job titles to program names
- Adds CIP codes from matching programs
- Removes CIP codes with no programs
- Tags synced mappings with `source: 'program_sync'`

### 3. Manual Override Support
- Manual mappings (not from NCES or sync) are preserved
- Allows for custom mappings when needed
- Script only removes NCES-sourced mappings

## Data Flow

```
Programs (CIP codes from providers)
    ↓
Sync Script (analyzes & matches)
    ↓
CIP-SOC Crosswalk (updated)
    ↓
getRelatedPrograms() (finds programs)
    ↓
User sees relevant programs ✅
```

## Maintenance

### Adding New Programs
1. Import programs with correct CIP codes from provider
2. Run sync script
3. Crosswalk automatically updates

### Removing Programs
1. Delete/unpublish programs
2. Run sync script
3. Obsolete mappings automatically removed

### Quality Checks
- Monitor programs with no crosswalk matches
- Review SOC codes with no program matches
- Verify CIP codes are accurate from providers

## Future Enhancements

### Automated Triggers
- Run sync script automatically when programs are imported
- Webhook on program CIP code changes
- Scheduled monthly sync job

### Machine Learning
- Analyze program descriptions to suggest CIP codes
- Learn from user interactions (which programs users select)
- Improve matching algorithm over time

### Admin Interface
- View crosswalk mappings
- See which programs match each SOC
- Manual override interface
- Bulk import/export

## Best Practices

1. **Always get CIP codes from providers** - They're the experts
2. **Run sync after bulk imports** - Keep crosswalk current
3. **Don't manually fix one-off issues** - Use the script
4. **Monitor empty states** - Indicates missing mappings
5. **Trust the automation** - System adapts as data changes

## Related Files

- `/scripts/sync-crosswalk-with-programs.js` - Sync script
- `/scripts/create-cip-soc-table.sql` - Initial NCES import
- `/src/lib/database/queries.ts` - getRelatedPrograms() function
- `/docs/features/CROSSWALK_IMPLEMENTATION_PLAN.md` - Overall plan
