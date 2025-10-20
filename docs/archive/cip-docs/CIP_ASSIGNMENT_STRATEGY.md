# CIP Code Assignment Strategy

## Research Findings

### NCES/IPEDS Services
**Conclusion:** ❌ No automated API for CIP assignment

**What NCES Provides:**
- **CIP Directory** - Browse/search existing CIP codes
- **CIP Wizard** - Crosswalk tool for institutions (maps old CIP → new CIP)
- **IPEDS Data** - Download institutional program data (already has CIPs assigned)
- **Search Tool** - Manual keyword search only

**What NCES Does NOT Provide:**
- ❌ API to suggest CIP codes for program names
- ❌ Automated CIP assignment service
- ❌ Machine learning CIP prediction
- ❌ Bulk program-to-CIP matching

### Why No Automated Service Exists
1. **Manual Process:** Institutions assign CIPs themselves when reporting to IPEDS
2. **Human Judgment:** Requires understanding of program content, not just title
3. **Institutional Knowledge:** Schools know their curriculum details
4. **Compliance:** CIP assignment is a regulatory reporting requirement

---

## Our Solution: Hybrid Approach

### Strategy Overview
Combine **AI-assisted suggestions** with **admin review** to assign CIPs efficiently and accurately.

```
Program Name + Description
    ↓
AI Analysis (GPT-4)
    ↓
Top 3 CIP Suggestions with Confidence Scores
    ↓
Admin Review & Selection
    ↓
CIP Code Assigned
```

---

## Implementation Plan

### Phase 1: AI-Assisted CIP Suggestion Service

**Service:** `/src/lib/services/cip-suggestion.ts`

```typescript
interface CIPSuggestion {
  cipCode: string;
  cipTitle: string;
  confidence: number; // 0-100
  reasoning: string;
}

export async function suggestCIPCodes(
  programName: string,
  programDescription?: string,
  programType?: string, // Certificate, Associate's, Bachelor's, etc.
  discipline?: string    // Business, Technology, Healthcare, etc.
): Promise<CIPSuggestion[]> {
  
  // Build context for AI
  const context = `
Program Name: ${programName}
Program Type: ${programType || 'Unknown'}
Discipline: ${discipline || 'Unknown'}
Description: ${programDescription || 'Not provided'}

Task: Suggest the 3 most appropriate CIP 2020 codes for this program.
Consider:
- Program level (certificate, associate, bachelor, etc.)
- Subject matter and discipline
- Specific skills and content areas
- Industry alignment

Return top 3 CIP codes with confidence scores (0-100) and brief reasoning.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a CIP code classification expert. You help assign Classification of Instructional Programs (CIP) codes to educational programs based on NCES CIP 2020 taxonomy.
        
Available CIP codes are in our database. Suggest codes that best match the program's content, level, and discipline.

Format your response as JSON:
{
  "suggestions": [
    {
      "cipCode": "11.0101",
      "cipTitle": "Computer and Information Sciences, General",
      "confidence": 95,
      "reasoning": "Direct match for general computer science program at associate level"
    },
    ...
  ]
}`
      },
      {
        role: "user",
        content: context
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3 // Lower temperature for more consistent results
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result.suggestions;
}
```

---

### Phase 2: Admin UI for CIP Assignment

**Location:** `/admin/programs/[id]` page - Add CIP assignment section

**UI Flow:**
1. Admin clicks "Assign CIP Code" button
2. System shows AI suggestions with confidence scores
3. Admin can:
   - Accept a suggestion (1 click)
   - Search for different CIP manually
   - View CIP details before assigning
4. CIP code saved to `programs.cip_code`

**Component:** `/src/components/admin/CIPAssignment.tsx`

```typescript
<CIPAssignment
  programId={program.id}
  programName={program.name}
  programDescription={program.long_desc || program.short_desc}
  programType={program.program_type}
  discipline={program.discipline}
  currentCIP={program.cip_code}
  onAssign={(cipCode) => updateProgram({ cip_code: cipCode })}
/>
```

**UI Design:**
```
┌─────────────────────────────────────────────────┐
│ CIP Code Assignment                             │
├─────────────────────────────────────────────────┤
│ Current: None assigned                          │
│                                                 │
│ [Get AI Suggestions] [Search Manually]         │
│                                                 │
│ AI Suggestions:                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ ✓ 11.0101 - Computer Science, General      ││
│ │   Confidence: 95%                           ││
│ │   Reasoning: Direct match for CS program    ││
│ │   [Assign This CIP]                         ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ ✓ 11.0701 - Computer Science               ││
│ │   Confidence: 88%                           ││
│ │   [Assign This CIP]                         ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ ✓ 11.0801 - Web Development                ││
│ │   Confidence: 75%                           ││
│ │   [Assign This CIP]                         ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

---

### Phase 3: Batch Processing

**For 223 programs, we need bulk assignment:**

**Script:** `/scripts/assign-cips-batch.js`

```javascript
// Process all programs without CIP codes
async function batchAssignCIPs() {
  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .is('cip_code', null);
  
  console.log(`Processing ${programs.length} programs...`);
  
  for (const program of programs) {
    // Get AI suggestions
    const suggestions = await suggestCIPCodes(
      program.name,
      program.long_desc || program.short_desc,
      program.program_type,
      program.discipline
    );
    
    // Auto-assign if confidence > 90%
    if (suggestions[0].confidence > 90) {
      await supabase
        .from('programs')
        .update({ 
          cip_code: suggestions[0].cipCode,
          cip_assignment_confidence: suggestions[0].confidence,
          cip_assignment_method: 'ai_auto'
        })
        .eq('id', program.id);
      
      console.log(`✓ Auto-assigned ${suggestions[0].cipCode} to "${program.name}"`);
    } else {
      // Flag for manual review
      await supabase
        .from('programs')
        .update({ 
          cip_suggestions: suggestions,
          cip_assignment_method: 'needs_review'
        })
        .eq('id', program.id);
      
      console.log(`⚠ Needs review: "${program.name}"`);
    }
  }
}
```

---

## Validation Strategy

### Validate AI Suggestions Against Database

```typescript
async function validateCIPSuggestion(cipCode: string): Promise<boolean> {
  const { data } = await supabase
    .from('cip_codes')
    .select('cip_code, title')
    .eq('cip_code', cipCode)
    .single();
  
  return !!data; // CIP exists in our database
}
```

### Cross-Reference with Existing Programs

```typescript
// Find similar programs that already have CIPs
async function findSimilarPrograms(programName: string) {
  const { data } = await supabase
    .from('programs')
    .select('name, cip_code, cip_codes(title)')
    .not('cip_code', 'is', null)
    .ilike('name', `%${programName.split(' ')[0]}%`)
    .limit(5);
  
  return data; // Show admin what similar programs used
}
```

---

## Quality Assurance

### Confidence Thresholds

| Confidence | Action | Review Required |
|------------|--------|-----------------|
| 90-100% | Auto-assign | No |
| 75-89% | Suggest (top choice) | Yes |
| 50-74% | Suggest (alternative) | Yes |
| < 50% | Flag for manual search | Yes |

### Manual Review Queue

**Admin Dashboard Section:**
```
Programs Needing CIP Review: 45
- High Confidence (75-89%): 30 programs
- Low Confidence (< 75%): 15 programs

[Review Queue]
```

---

## Cost Estimation

### OpenAI API Costs
- **Model:** GPT-4
- **Tokens per request:** ~500 tokens (input) + 200 tokens (output) = 700 tokens
- **Cost:** ~$0.02 per program
- **Total for 223 programs:** ~$4.50

**Very affordable for one-time assignment!**

---

## Alternative: Manual Search UI

If AI is not desired, provide robust search:

```typescript
<CIPSearch
  onSelect={(cipCode) => assignCIP(cipCode)}
  filters={{
    discipline: program.discipline,
    level: program.program_type
  }}
/>
```

**Search Features:**
- Keyword search across CIP titles
- Filter by 2-digit series (discipline)
- Filter by level (certificate, associate, bachelor)
- Show CIP hierarchy (series → program → specialization)
- Preview CIP description before assigning

---

## Recommended Approach

### Hybrid: AI + Manual Review

1. **Run AI batch** on all 223 programs
2. **Auto-assign** high confidence (>90%) = ~150 programs
3. **Review queue** medium confidence (75-90%) = ~50 programs
4. **Manual search** low confidence (<75%) = ~23 programs

**Timeline:**
- AI batch processing: 10 minutes
- Admin review (high confidence): 1 hour
- Admin search (low confidence): 2 hours
- **Total: 3-4 hours to complete all 223 programs**

**vs. Pure Manual:**
- Search and assign 223 programs manually: 15-20 hours

**ROI:** Save 12-16 hours of admin time for $5 in API costs ✅

---

## Implementation Steps

### Day 2: CIP Assignment (Today)

1. **Morning:** Build AI suggestion service
   - Create `/src/lib/services/cip-suggestion.ts`
   - Test with 5 sample programs
   - Validate suggestions against database

2. **Afternoon:** Build admin UI
   - Add CIP assignment component to program detail page
   - Show AI suggestions with confidence scores
   - Allow manual search fallback

3. **Evening:** Batch process
   - Run AI on all 223 programs
   - Auto-assign high confidence
   - Generate review queue

### Day 3: Skills Extraction

Once CIPs are assigned, proceed with skills pipeline.

---

## Decision Required

**Which approach do you prefer?**

**Option A: AI-Assisted (Recommended)**
- ✅ Fast (3-4 hours total)
- ✅ Accurate (GPT-4 understands program content)
- ✅ Cost-effective ($5)
- ✅ Scalable (works for future programs)
- ⚠️ Requires OpenAI API key

**Option B: Pure Manual**
- ✅ No AI dependency
- ✅ 100% human control
- ❌ Slow (15-20 hours)
- ❌ Not scalable

**Option C: Hybrid (Best of Both)**
- ✅ AI for suggestions
- ✅ Admin reviews and approves
- ✅ Manual search for edge cases
- ✅ Best accuracy + efficiency

**What's your call?** 🚀
