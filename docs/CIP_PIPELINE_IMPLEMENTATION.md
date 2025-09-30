# CIP Pipeline Implementation Plan - FOCUSED

## Executive Summary

**Goal:** Connect Programs → Skills via CIP codes to enable skills gap analysis and program recommendations.

**Current Status:**
- ✅ Database tables exist (`cip_codes`, `cip_soc_crosswalk`, `programs.cip_code`)
- ❌ No CIP data populated
- ❌ No CIP-SOC mappings
- ❌ Programs don't have CIP codes assigned
- ❌ No program-skills relationships

**Priority:** Get CIP codes, crosswalk data, and skills relationships working FIRST. Other features (matching UI, gap analysis) come later.

---

## Phase 1: Foundation - CIP Data Population (Days 1-2)

### Step 1.1: Populate CIP Codes Table
**Source:** NCES CIP 2020 official taxonomy (free, government data)

```bash
# Download CIP 2020 data
curl -O https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx
```

**Task:** Create import script
```javascript
// scripts/import-cip-codes.js
// Parse Excel → Insert into cip_codes table
// Fields: cip_code, title, level (2-digit, 4-digit, 6-digit)
```

**Expected Result:**
- ~2,000 CIP codes in database
- All levels (2-digit series, 4-digit programs, 6-digit specializations)

---

### Step 1.2: Populate CIP-SOC Crosswalk
**Source:** Same NCES crosswalk file (CIP → SOC mappings)

**Task:** Import crosswalk mappings
```javascript
// scripts/import-cip-soc-crosswalk.js
// Parse Excel → Insert into cip_soc_crosswalk table
// Fields: cip_code, soc_code, source='NCES'
```

**Expected Result:**
- ~5,000+ CIP-SOC mappings
- Each CIP may map to multiple SOCs
- Each SOC may map to multiple CIPs

**Example Mappings:**
```
11.0101 (Computer Science) → 15-1252.00 (Software Developers)
11.0101 (Computer Science) → 15-1211.00 (Computer Systems Analysts)
52.0201 (Business Administration) → 11-3021.00 (Computer Managers)
52.0201 (Business Administration) → 11-1021.00 (General Managers)
```

---

### Step 1.3: Assign CIP Codes to Programs
**Challenge:** Our 223 programs don't have CIP codes yet

**Solution:** Multi-source approach

#### Option A: HubSpot Data (Bisk Amplified programs)
- Check if HubSpot CSV has CIP codes
- Import during HubSpot sync

#### Option B: Manual Assignment (Direct programs)
- Admin UI to assign CIP codes
- Search CIP taxonomy by keyword
- Assign most relevant CIP

#### Option C: AI-Assisted (Fallback)
- Use program name + description
- GPT-4 suggests CIP codes
- Admin reviews and confirms

**Task:** Create admin interface
```typescript
// Admin Programs page → "Assign CIP Code" button
// Search CIP codes by keyword
// Show CIP title and description
// Save to programs.cip_code
```

**Expected Result:**
- All 223 programs have CIP codes
- Validated by admin
- Stored in `programs.cip_code` column

---

## Phase 2: Skills Extraction (Days 3-4)

### Step 2.1: CIP → SOC → Skills Pipeline

**Logic:**
```
1. Program has CIP code (e.g., 11.0101 - Computer Science)
2. Look up CIP in crosswalk → Get SOC codes (15-1252.00, 15-1211.00, etc.)
3. For each SOC code → Get skills from job_skills table
4. Aggregate all skills → Deduplicate
5. Rank by frequency/importance → Select top 8
6. Insert into program_skills table
```

**Service:** `/src/lib/services/cip-skills-extraction.ts`
```typescript
export async function extractSkillsForProgram(programId: string) {
  // 1. Get program CIP code
  const program = await getProgram(programId);
  
  // 2. Get SOC codes from crosswalk
  const socCodes = await getCIPSOCMappings(program.cip_code);
  
  // 3. Get skills for each SOC
  const allSkills = [];
  for (const soc of socCodes) {
    const skills = await getSkillsForSOC(soc.soc_code);
    allSkills.push(...skills);
  }
  
  // 4. Deduplicate and rank
  const rankedSkills = rankSkillsByImportance(allSkills);
  
  // 5. Select top 8
  const topSkills = rankedSkills.slice(0, 8);
  
  // 6. Insert into program_skills
  await insertProgramSkills(programId, topSkills);
  
  return topSkills;
}
```

---

### Step 2.2: Skills Ranking Algorithm

**Criteria for "Top 8":**
1. **Frequency:** How many SOCs require this skill?
2. **Importance:** Skill weight from O*NET (already in our data)
3. **Relevance:** Match to program discipline
4. **Uniqueness:** Differentiate from generic skills

**Scoring Formula:**
```typescript
skillScore = (frequency * 0.4) + (importance * 0.4) + (relevance * 0.2)
```

**Example for Computer Science (CIP 11.0101):**
```
Top 8 Skills:
1. Programming (appears in 5/5 SOCs, importance: 4.5)
2. Software Development (appears in 4/5 SOCs, importance: 4.3)
3. Database Management (appears in 3/5 SOCs, importance: 4.0)
4. Systems Analysis (appears in 4/5 SOCs, importance: 3.8)
5. Problem Solving (appears in 5/5 SOCs, importance: 3.5)
6. Algorithm Design (appears in 3/5 SOCs, importance: 4.2)
7. Data Structures (appears in 3/5 SOCs, importance: 4.0)
8. Version Control (appears in 4/5 SOCs, importance: 3.2)
```

---

### Step 2.3: Batch Processing

**Admin Interface:**
```typescript
// /admin/programs page
<Button onClick={enrichAllPrograms}>
  Enrich All Programs with Skills
</Button>

// Shows progress:
// "Processing 45/223 programs... (20%)"
// "Computer Science → 8 skills added"
// "Business Administration → 8 skills added"
```

**API Endpoint:**
```typescript
// /api/admin/enrich-program-skills
POST /api/admin/enrich-program-skills
{
  "programIds": ["uuid1", "uuid2", ...] // or "all"
}

Response:
{
  "processed": 223,
  "successful": 220,
  "failed": 3,
  "errors": [
    { "programId": "uuid", "error": "No CIP code assigned" }
  ]
}
```

---

## Phase 3: Validation & Testing (Day 5)

### Test Cases

#### 3.1 Data Integrity
- [ ] All CIP codes valid (match NCES taxonomy)
- [ ] All crosswalk mappings valid (CIP and SOC exist)
- [ ] All programs have CIP codes
- [ ] All programs have 5-8 skills
- [ ] No duplicate program-skill relationships

#### 3.2 Skills Quality
- [ ] Skills are relevant to program discipline
- [ ] No generic skills (e.g., "Communication" unless specific)
- [ ] Skills match O*NET/Lightcast taxonomy
- [ ] Skills have proper weights

#### 3.3 Performance
- [ ] CIP lookup < 100ms
- [ ] Skills extraction < 2s per program
- [ ] Batch processing 223 programs < 10 minutes

---

## Handling Edge Cases

### Unmapped CIPs
**Problem:** Program has CIP code not in crosswalk

**Solution:**
1. **Check parent CIP:** Use 4-digit or 2-digit series
   - Example: 11.0199 (Other CS) → Use 11.01 (Computer Science)
2. **Manual mapping:** Admin assigns SOC codes directly
3. **AI suggestion:** GPT-4 suggests relevant SOCs based on program description
4. **Flag for review:** Mark program as "needs manual review"

**Admin UI:**
```typescript
// Show warning in admin
⚠️ CIP code 11.0199 not found in crosswalk
Options:
- Use parent CIP (11.01)
- Manually assign SOC codes
- AI suggest SOC codes
- Skip for now
```

---

### Multiple SOC Mappings
**Problem:** CIP maps to 10+ SOCs (too many skills)

**Solution:**
1. **Filter by relevance:** Match SOC to program type
   - Example: Business Admin (Associate's) → Entry-level SOCs only
2. **Limit SOCs:** Use top 5 most relevant SOCs
3. **Admin override:** Let admin select which SOCs to use

---

### No Skills Found
**Problem:** SOC has no skills in our database

**Solution:**
1. **Fetch from O*NET:** Real-time API call
2. **Use related SOC:** Find similar occupation
3. **Manual entry:** Admin adds skills
4. **Flag for enrichment:** Queue for O*NET sync

---

## Skills Gap Matching Threshold

### Recommendation: **70% for "Strong Match"**

**Rationale:**
- User takes assessment → Identifies skills gaps
- Recommend programs that cover **70%+ of missing skills**
- This ensures program is highly relevant to their needs

**Tiered Thresholds:**
```typescript
const MATCH_THRESHOLDS = {
  EXCELLENT: 0.85,  // 85%+ → "Excellent match for your goals"
  STRONG: 0.70,     // 70-84% → "Strong match"
  GOOD: 0.50,       // 50-69% → "Good match"
  FAIR: 0.30        // 30-49% → "May help with some skills"
  // Below 30% → Don't show
}
```

**Example:**
```
User Assessment Results:
- Missing Skills: [Programming, Database, Web Dev, Cloud, Security]
- Total: 5 skills

Program: "Full Stack Web Development"
- Covers: [Programming, Database, Web Dev, Cloud]
- Match: 4/5 = 80% → "Excellent match"

Program: "Cybersecurity Fundamentals"
- Covers: [Security, Programming]
- Match: 2/5 = 40% → "May help with some skills"
```

---

## Success Metrics

### Phase 1 Complete When:
- [ ] 2,000+ CIP codes in database
- [ ] 5,000+ CIP-SOC mappings
- [ ] 223/223 programs have CIP codes
- [ ] CIP assignment UI working

### Phase 2 Complete When:
- [ ] 223/223 programs have skills
- [ ] Average 5-8 skills per program
- [ ] Skills ranked by importance
- [ ] Batch enrichment working

### Phase 3 Complete When:
- [ ] All tests passing
- [ ] Data quality validated
- [ ] Performance benchmarks met
- [ ] Admin can re-enrich anytime

---

## Timeline

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Import CIP codes & crosswalk | Tables populated |
| 2 | Build CIP assignment UI | Programs have CIPs |
| 3 | Build skills extraction service | Pipeline working |
| 4 | Batch process all programs | All programs have skills |
| 5 | Testing & validation | Production ready |

**Total: 5 days to complete CIP-Skills foundation**

---

## Files to Create

### Scripts
- [ ] `/scripts/import-cip-codes.js`
- [ ] `/scripts/import-cip-soc-crosswalk.js`
- [ ] `/scripts/validate-cip-data.js`

### Services
- [ ] `/src/lib/services/cip-skills-extraction.ts`
- [ ] `/src/lib/services/cip-lookup.ts`
- [ ] `/src/lib/services/skills-ranking.ts`

### API Routes
- [ ] `/src/app/api/admin/enrich-program-skills/route.ts`
- [ ] `/src/app/api/admin/assign-cip-code/route.ts`

### Admin UI
- [ ] Update `/src/app/admin/programs/page.tsx` - Add "Enrich Skills" button
- [ ] Update `/src/app/admin/programs/[id]/page.tsx` - Add CIP code search
- [ ] Create `/src/components/admin/CIPCodeSearch.tsx`

### Tests
- [ ] `/tests/services/cip-skills-extraction.test.ts`
- [ ] `/tests/api/enrich-program-skills.test.ts`

---

## Next Immediate Action

**Step 1:** Download NCES CIP-SOC Crosswalk
```bash
cd /Users/keithmarcel/CascadeProjects/skillsync-beta
mkdir -p data/cip
curl -o data/cip/CIP2020_SOC2018_Crosswalk.xlsx \
  https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx
```

**Step 2:** Create import script
```bash
npm install xlsx  # For Excel parsing
```

**Ready to start?** 🚀
