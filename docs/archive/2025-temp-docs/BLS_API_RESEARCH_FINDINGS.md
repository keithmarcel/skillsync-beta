# BLS API Research Findings - OEWS Data Access

## Research Date: October 9, 2025

### Key Finding: OEWS Data May Not Be Available Through BLS Time Series API

After extensive research, I've discovered that **OEWS (Occupational Employment and Wage Statistics) data appears to NOT be available through the BLS Public Data API** (the time series API we've been trying to use).

## Evidence:

1. **BLS API Documentation**
   - The BLS Public Data API is designed for "published historical time series data"
   - Common datasets mentioned: CPS (Current Population Survey), CES (Current Employment Statistics), QCEW (Quarterly Census)
   - **OEWS is notably absent from API examples and documentation**

2. **OEWS Data Access Methods**
   - BLS provides OEWS data through:
     - Web tables (https://www.bls.gov/oes/tables.htm)
     - One-Screen Data Search (JavaScript-based query tool)
     - **Flat files/text files** on download server
   - No mention of API access in OEWS documentation

3. **Series ID Format Issues**
   - Our attempted series IDs (e.g., `OEUM45300000000013201104`) return "Series does not exist"
   - This suggests OEWS data is not structured as time series in the API database

## Alternative Data Access Methods:

### Option 1: OEWS Flat Files (Recommended)
- **Source:** https://download.bls.gov/pub/time.series/oe/
- **Format:** CSV/Text files with all OEWS data
- **Coverage:** National, State, and Metropolitan area data
- **Update Frequency:** Annual (May each year)
- **Pros:** Complete dataset, reliable, official source
- **Cons:** Requires parsing flat files, not real-time API

### Option 2: QCEW Data (Alternative)
- **Source:** Quarterly Census of Employment and Wages
- **API Available:** Yes, through BLS API
- **Coverage:** Industry-specific employment and wages by area
- **Pros:** Available through API, quarterly updates
- **Cons:** Industry-based, not occupation-based like OEWS

### Option 3: Web Scraping OEWS Tables
- **Source:** https://www.bls.gov/oes/current/oes_45300.htm (Tampa MSA)
- **Pros:** Most current data, occupation-specific
- **Cons:** Fragile, against TOS, requires maintenance

## Recommended Implementation:

### Immediate Solution: Use OEWS Flat Files

1. **Download May 2024 OEWS Data Files**
   - National: `https://www.bls.gov/oes/special.requests/oesm24nat.zip`
   - State: `https://www.bls.gov/oes/special.requests/oesm24st.zip`
   - MSA: `https://www.bls.gov/oes/special.requests/oesm24ma.zip`

2. **Parse and Import to Database**
   - Extract wage data by SOC code and area
   - Store in our `bls_wage_data` cache table
   - Include area_code, area_name, median_wage, data_year

3. **Update Schedule**
   - Run import script annually when new May data is released
   - Cache data with 1-year expiration
   - Fallback to previous year if current year not available

### Implementation Steps:

```javascript
// scripts/import-oews-data.js
// 1. Download OEWS flat files
// 2. Parse CSV data
// 3. Filter for Tampa MSA (45300), Florida (12), National
// 4. Insert into bls_wage_data table with proper area codes
// 5. Set expires_at to 1 year from data release date
```

## Database Schema (Already Exists):

```sql
CREATE TABLE bls_wage_data (
  id UUID PRIMARY KEY,
  soc_code TEXT NOT NULL,
  area_code TEXT NOT NULL,  -- '45300' for Tampa, '12' for FL, '0000' for National
  area_name TEXT NOT NULL,
  median_wage DECIMAL(10,2),
  mean_wage DECIMAL(10,2),
  employment_level INTEGER,
  data_year INTEGER,        -- 2024
  last_updated TIMESTAMP,
  expires_at TIMESTAMP      -- Set to 1 year from release
);
```

## Regional Data Priority (Unchanged):

1. Tampa-St. Petersburg-Clearwater MSA (area_code: 45300)
2. Florida State (area_code: 12)
3. National (area_code: 0000)

Query logic:
```sql
SELECT * FROM bls_wage_data 
WHERE soc_code = '13-2011' 
  AND area_code IN ('45300', '12', '0000')
ORDER BY 
  CASE area_code 
    WHEN '45300' THEN 1 
    WHEN '12' THEN 2 
    ELSE 3 
  END
LIMIT 1;
```

## Benefits of This Approach:

1. ✅ **Official BLS Data** - Same source, just different access method
2. ✅ **May 2024 Data** - Most current available
3. ✅ **Regional Priority** - Tampa → Florida → National
4. ✅ **Reliable** - No API rate limits or series ID issues
5. ✅ **Complete Coverage** - All occupations and areas
6. ✅ **Annual Updates** - Matches OEWS release schedule

## Action Items:

1. [ ] Create OEWS flat file import script
2. [ ] Download May 2024 OEWS data files
3. [ ] Parse and import Tampa MSA, Florida, and National data
4. [ ] Update occupation enrichment service to use cached data
5. [ ] Set up annual refresh process
6. [ ] Update documentation to reflect flat file approach

## Conclusion:

While the BLS API is excellent for time series data (CPI, unemployment, etc.), **OEWS data is not available through it**. The official method is to use OEWS flat files, which are published annually and provide complete, reliable data for all occupations and geographic areas.

This is actually a **better solution** than the API because:
- No rate limits
- Complete dataset at once
- More reliable (no series ID format issues)
- Official BLS distribution method for OEWS

---

**Next Step:** Create import script to load May 2024 OEWS flat files into our database cache.
