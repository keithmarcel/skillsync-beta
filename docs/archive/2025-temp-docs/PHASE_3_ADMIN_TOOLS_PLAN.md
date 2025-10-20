# Phase 3: Admin Tools & Customization - Implementation Plan

**Status:** Planning  
**Estimated Effort:** 2-3 days  
**Updated:** October 9, 2025 11:19 PM

---

## 🎯 Overview

Enable companies to customize O*NET data, get AI-powered SOC suggestions, and curate skills using the existing Skills Extractor tool.

---

## Feature 1: Admin O*NET Override System

### **Objective**
Allow companies to customize O*NET data for their featured roles while preserving the baseline.

### **Database Schema**

```sql
-- New table for company overrides
CREATE TABLE job_onet_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- 'core_responsibilities', 'tasks', 'tools_and_technology'
  override_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(job_id, field_name)
);

-- Index for fast lookups
CREATE INDEX idx_job_onet_overrides_job_id ON job_onet_overrides(job_id);

-- RLS policies
ALTER TABLE job_onet_overrides ENABLE ROW LEVEL SECURITY;

-- Employers can manage their own roles' overrides
CREATE POLICY "Employers can manage their role overrides"
  ON job_onet_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN companies c ON j.company_id = c.id
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE j.id = job_onet_overrides.job_id
      AND p.employer_company_id = c.id
    )
  );

-- Super admins can manage all overrides
CREATE POLICY "Super admins can manage all overrides"
  ON job_onet_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );
```

### **Query Logic**

Update `getJobById` to merge overrides:

```typescript
// In queries.ts
export async function getJobById(id: string): Promise<Job | null> {
  // ... existing query ...
  
  // Check for overrides
  const { data: overrides } = await supabase
    .from('job_onet_overrides')
    .select('field_name, override_data')
    .eq('job_id', id)
  
  // Apply overrides to job data
  if (overrides && overrides.length > 0) {
    overrides.forEach(override => {
      data[override.field_name] = override.override_data
    })
  }
  
  return data
}
```

### **Admin UI**

**Location:** `/admin/jobs/[id]/edit` (new page)

**Components:**
1. **Tabs:** Overview | Responsibilities | Tasks | Tools
2. **Each tab shows:**
   - Original O*NET data (read-only, gray background)
   - Override editor (editable, white background)
   - "Reset to O*NET" button
   - "Save Override" button

**Features:**
- Inline editing with rich text
- Add/remove items
- Reorder with drag-and-drop
- Preview mode
- Undo/redo

**Implementation:**
- Use `@dnd-kit/core` for drag-and-drop
- Use `react-quill` or `tiptap` for rich text editing
- Real-time preview in side panel

---

## Feature 2: SOC Auto-Suggest

### **Objective**
AI-powered SOC code recommendations based on job title and description.

### **API Endpoint**

**File:** `src/app/api/admin/suggest-soc/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  const { title, description } = await request.json()
  
  const prompt = `You are an O*NET SOC code expert. Analyze this job and suggest the most appropriate SOC code.

Job Title: ${title}
Description: ${description}

Return JSON with:
{
  "soc_code": "XX-XXXX.XX",
  "soc_title": "Official O*NET title",
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation",
  "alternatives": [
    {"soc_code": "XX-XXXX.XX", "title": "Alternative title", "reason": "Why this might fit"}
  ]
}

Use real O*NET SOC codes. Consider:
- Primary job duties
- Required skills and education
- Industry context
- Level of responsibility`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an O*NET SOC classification expert.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  })
  
  const suggestion = JSON.parse(response.choices[0].message.content)
  return NextResponse.json(suggestion)
}
```

### **Admin UI Integration**

**Location:** Featured Roles admin form (when creating/editing)

**UI Flow:**
1. User enters job title and description
2. "Suggest SOC Code" button appears
3. Click → Loading spinner → AI suggestion appears
4. Show primary suggestion with confidence badge
5. Show 2-3 alternatives in dropdown
6. User can accept suggestion or choose alternative
7. SOC code field auto-fills

**Component:**
```tsx
// src/components/admin/soc-auto-suggest.tsx
<div className="space-y-4">
  <Button onClick={handleSuggest} disabled={loading}>
    {loading ? 'Analyzing...' : '🤖 Suggest SOC Code'}
  </Button>
  
  {suggestion && (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Badge variant={confidenceColor}>{suggestion.confidence}</Badge>
        <span className="font-semibold">{suggestion.soc_code}</span>
        <span>{suggestion.soc_title}</span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{suggestion.reasoning}</p>
      
      {suggestion.alternatives.length > 0 && (
        <details className="mt-4">
          <summary>View alternatives</summary>
          {/* Alternative SOC codes */}
        </details>
      )}
      
      <Button onClick={() => acceptSuggestion(suggestion.soc_code)}>
        Use This SOC Code
      </Button>
    </div>
  )}
</div>
```

---

## Feature 3: Skills Curation via Extractor (SMART REUSE)

### **Objective**
Extend existing Skills Extractor to curate skills for Featured Roles, not just HDOs.

### **Database Changes**

**Already exists:** `soc_skills` table works for both occupations and roles (keyed by SOC code)

**No changes needed!** The existing architecture already supports this.

### **Skills Extractor Enhancements**

**File:** `src/app/admin/skills-extractor/page.tsx`

#### **Enhancement 1: SOC Dropdown Badges**

Update the SOC dropdown to show which jobs use each SOC:

```tsx
// In SOC Enhancement tab
const socOptions = await supabase
  .from('jobs')
  .select('soc_code, title, job_kind, company:companies(name)')
  .not('soc_code', 'is', null)
  .order('soc_code')

// Group by SOC code
const groupedBySoc = socOptions.reduce((acc, job) => {
  if (!acc[job.soc_code]) {
    acc[job.soc_code] = {
      soc_code: job.soc_code,
      occupations: [],
      roles: []
    }
  }
  
  if (job.job_kind === 'occupation') {
    acc[job.soc_code].occupations.push(job.title)
  } else {
    acc[job.soc_code].roles.push({
      title: job.title,
      company: job.company?.name
    })
  }
  
  return acc
}, {})

// Render dropdown with badges
<Select>
  {Object.values(groupedBySoc).map(group => (
    <SelectItem key={group.soc_code} value={group.soc_code}>
      <div className="flex items-center gap-2">
        <span>{group.soc_code}</span>
        {group.occupations.length > 0 && (
          <Badge variant="blue">{group.occupations.length} HDO</Badge>
        )}
        {group.roles.length > 0 && (
          <Badge variant="teal">{group.roles.length} Roles</Badge>
        )}
      </div>
      
      {/* Tooltip on hover showing job titles */}
      <div className="text-xs text-gray-500 mt-1">
        {group.occupations.slice(0, 2).join(', ')}
        {group.roles.length > 0 && ` + ${group.roles.length} company roles`}
      </div>
    </SelectItem>
  ))}
</Select>
```

#### **Enhancement 2: Preview Panel**

Add a "Preview" section showing which jobs will be affected:

```tsx
// When SOC is selected, show affected jobs
{selectedSoc && (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle>Jobs Using This SOC</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {affectedOccupations.map(occ => (
          <div key={occ.id} className="flex items-center gap-2">
            <Badge variant="blue">HDO</Badge>
            <span>{occ.title}</span>
          </div>
        ))}
        
        {affectedRoles.map(role => (
          <div key={role.id} className="flex items-center gap-2">
            <Badge variant="teal">Role</Badge>
            <span>{role.title}</span>
            <span className="text-sm text-gray-500">({role.company.name})</span>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-gray-600 mt-4">
        Curating skills for this SOC will update all {affectedOccupations.length + affectedRoles.length} jobs listed above.
      </p>
    </CardContent>
  </Card>
)}
```

#### **Enhancement 3: Drag-and-Drop Ranking**

**Already exists in Review tab!** Just need to ensure it works for roles too.

**Verify:**
- Review tab shows all jobs using the SOC
- Drag-and-drop reordering works
- Save updates `soc_skills.weight` column
- Changes reflect on both HDO and Featured Role pages

#### **Enhancement 4: Live Preview**

Add a "Preview" button that opens a modal showing how skills will appear:

```tsx
<Button onClick={() => setPreviewOpen(true)}>
  👁️ Preview on Job Page
</Button>

<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Skills Preview</DialogTitle>
    </DialogHeader>
    
    {/* Render skills exactly as they appear on job detail page */}
    <div className="bg-[#114B5F] p-6 rounded-lg">
      <h3 className="text-white font-semibold mb-4">Core Skills</h3>
      <div className="flex flex-wrap gap-2">
        {curatedSkills.map(skill => (
          <span key={skill.id} className="px-4 py-2 rounded-full text-sm bg-[#CCFBF1] text-[#0D5B52] font-semibold">
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

## Implementation Order

### **Day 1: SOC Auto-Suggest (4-5 hours)**
1. Create API endpoint (`/api/admin/suggest-soc`)
2. Build SOC suggestion component
3. Integrate into Featured Roles admin form
4. Test with various job titles
5. Add confidence badges and alternatives

### **Day 2: Skills Extractor Enhancements (4-5 hours)**
1. Add badges to SOC dropdown (HDO vs Roles)
2. Add "Jobs Using This SOC" preview panel
3. Add live preview modal
4. Test with both occupations and roles
5. Verify drag-and-drop ranking works for all

### **Day 3: O*NET Override System (6-7 hours)**
1. Create database migration for `job_onet_overrides`
2. Update `getJobById` query to merge overrides
3. Build admin edit page (`/admin/jobs/[id]/edit`)
4. Implement tabbed interface (Responsibilities | Tasks | Tools)
5. Add drag-and-drop editing
6. Add "Reset to O*NET" functionality
7. Test override persistence and display

---

## Testing Checklist

### **SOC Auto-Suggest**
- [ ] Suggests correct SOC for common job titles
- [ ] Shows confidence levels accurately
- [ ] Provides useful alternatives
- [ ] Handles edge cases (vague titles, new roles)
- [ ] Auto-fills SOC field on acceptance

### **Skills Extractor**
- [ ] Dropdown shows HDO vs Role badges
- [ ] Preview panel lists all affected jobs
- [ ] Drag-and-drop ranking works
- [ ] Changes apply to both HDOs and Roles
- [ ] Live preview matches actual job page display

### **O*NET Override**
- [ ] Overrides save correctly
- [ ] Original O*NET data preserved
- [ ] Overrides display on job detail page
- [ ] Reset to O*NET works
- [ ] Only authorized users can edit
- [ ] Changes reflect immediately

---

## Success Criteria

✅ Companies can customize O*NET data for their roles  
✅ AI suggests accurate SOC codes with confidence levels  
✅ Skills Extractor works for both HDOs and Featured Roles  
✅ Admins can curate and rank top 5-8 skills per SOC  
✅ Preview shows exactly how skills appear on job pages  
✅ All changes persist and display correctly  

---

**Ready to start with Day 1: SOC Auto-Suggest?**
