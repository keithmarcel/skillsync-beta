# OEWS May 2024 Data Import Guide

## Quick Start

Since BLS OEWS data files are in Excel format and require manual download, follow these steps:

### Step 1: Download OEWS Data Files

Visit: https://www.bls.gov/oes/tables.htm

Download these files:
1. **National Data**: All occupations, national estimates
2. **State Data**: All occupations, Florida (state code 12)
3. **MSA Data**: All occupations, Tampa-St. Petersburg-Clearwater (MSA code 45300)

### Step 2: Use BLS One-Screen Data Search (Easiest Method)

Instead of downloading large files, use the BLS web tool:

1. Go to: https://www.bls.gov/oes/data.htm
2. Click "One-Screen Data Search"
3. Select:
   - **Occupation**: All occupations OR specific SOC codes
   - **Area**: Tampa-St. Petersburg-Clearwater, FL (45300)
   - **Data Type**: Annual median wage, Annual mean wage, Employment
   - **Year**: May 2024

4. Export to Excel
5. Repeat for Florida state and National

### Step 3: Import to Database

We'll create a simplified import script that reads from downloaded Excel/CSV files.

## Alternative: Direct Database Population

For now, we can populate key occupations manually or use the existing occupation enrichment service which already has BLS integration logic.

## Current Status

- ✅ Database schema ready (`bls_wage_data` table exists)
- ✅ Query logic implemented (regional priority)
- ✅ UI updated to display regional data
- ⏳ Awaiting data import

## Next Steps

1. Use BLS One-Screen tool to get Tampa Bay data for top 20 occupations
2. Manually insert into database OR
3. Wait for BLS to provide direct CSV download links
4. Set up annual refresh process

## Manual Insert Example

```sql
INSERT INTO bls_wage_data (
  soc_code, area_code, area_name, median_wage, mean_wage, 
  employment_level, data_year, last_updated, expires_at
) VALUES
  ('13-2011', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 78540, 85320, 12450, 2024, NOW(), '2025-05-01'),
  ('15-1252', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 95680, 102340, 8920, 2024, NOW(), '2025-05-01'),
  ('29-1141', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 75330, 79210, 15680, 2024, NOW(), '2025-05-01');
```

## Automated Solution (Future)

BLS may provide API access or direct CSV downloads in the future. For now, the One-Screen tool is the most reliable method for getting May 2024 regional data.
