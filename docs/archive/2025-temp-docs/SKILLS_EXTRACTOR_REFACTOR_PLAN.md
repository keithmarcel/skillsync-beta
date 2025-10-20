# Skills Extractor UI Refactor Plan

**Date:** October 8, 2025  
**Status:** Ready for Implementation

---

## Changes Overview

### ✅ **COMPLETED:**
1. Removed Lightcast from SOC Enhancement UI
2. Updated progress indicators (4 steps instead of 5)
3. Changed CareerOneStop label to "Training & Certs"

### 🔄 **TO IMPLEMENT:**

---

## 1. Test Skills Extraction Tab
**Decision:** KEEP IT  
**Reason:** Useful for testing on custom text without SOC codes

**No changes needed** - tab is valuable for testing job descriptions, syllabi, etc.

---

## 2. SOC Code Dropdown with Processing Status

### Current State:
```tsx
<input
  type="text"
  placeholder="Enter SOC Code (e.g., 15-1253.00)"
  value={socCode}
  onChange={(e) => setSocCode(e.target.value)}
/>
```

### Proposed Change:
```tsx
<Select value={socCode} onValueChange={setSocCode}>
  <SelectTrigger>
    <SelectValue placeholder="Select SOC Code" />
  </SelectTrigger>
  <SelectContent>
    {socCodes.map(soc => (
      <SelectItem key={soc.code} value={soc.code}>
        <div className="flex items-center gap-2">
          {soc.hasSkills ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4 text-gray-400" />
          )}
          <span>{soc.code} - {soc.title}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Implementation Steps:
1. Create API endpoint: `/api/admin/skills-extractor/soc-codes`
2. Query `soc_skills` table to check which SOCs have curated skills
3. Return list with processing status
4. Update UI to use dropdown with status indicators

---

## 3. Program Processing Tab

### Purpose:
Extract skills from education programs using CIP codes and syllabi

### Data Sources:
- **CIP Code** → O*NET crosswalk to related SOCs
- **Program Syllabus** → Course descriptions, learning outcomes
- **Program Description** → Overview, objectives
- **Credential Type** → Certificate, Associate, Bachelor, etc.

### Workflow:
```
Program Selection
    ↓
CIP Code Lookup → Related SOCs
    ↓
Syllabus Analysis → Course content
    ↓
OpenAI Extraction → Skills with descriptions
    ↓
Admin Curation → Select 5-8 skills
    ↓
Save to program_skills table
```

### UI Components:
```tsx
<TabsContent value="programs">
  <Card>
    <CardHeader>
      <CardTitle>Program Skills Enhancement</CardTitle>
      <CardDescription>
        Extract skills from education programs using CIP codes and syllabi
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Select> {/* Program dropdown */}
        <SelectItem>Program Name - CIP Code</SelectItem>
      </Select>
      
      <Textarea placeholder="Paste program syllabus or description..." />
      
      <Button>Extract Program Skills</Button>
      
      {/* Results with same curation interface as SOC */}
    </CardContent>
  </Card>
</TabsContent>
```

### Database Schema:
```sql
CREATE TABLE program_skills (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  skill_id UUID REFERENCES skills(id),
  display_order INTEGER,
  is_primary BOOLEAN,
  weight DECIMAL(3,2),
  UNIQUE(program_id, skill_id)
);
```

---

## 4. Bulk Operations Tab

### Current State:
Placeholder with "Coming soon" message

### Proposed Functionality:

#### Option A: Batch SOC Processing
```tsx
<Card>
  <CardTitle>Batch SOC Processing</CardTitle>
  <CardDescription>
    Process multiple SOC codes at once
  </CardDescription>
  
  <MultiSelect>
    {/* Select multiple SOC codes */}
  </MultiSelect>
  
  <Button>Process Selected SOCs</Button>
  
  {/* Progress table showing each SOC's status */}
</Card>
```

#### Option B: Import/Export
```tsx
<Card>
  <CardTitle>Skills Data Management</CardTitle>
  
  <Tabs>
    <Tab value="export">
      <Button>Export All Curated Skills (CSV)</Button>
      <Button>Export SOC Mappings (JSON)</Button>
    </Tab>
    
    <Tab value="import">
      <FileUpload accept=".csv,.json">
        Import Skills from File
      </FileUpload>
    </Tab>
  </Tabs>
</Card>
```

**Recommendation:** Start with Option A (batch processing)

---

## 5. Settings Tab Refactor

### Current State:
Empty placeholder

### Proposed Content:

```tsx
<TabsContent value="settings">
  <div className="space-y-6">
    
    {/* API Configuration */}
    <Card>
      <CardTitle>API Configuration</CardTitle>
      <div className="space-y-4">
        <div>
          <Label>O*NET API Status</Label>
          <Badge>{onetStatus ? 'Connected' : 'Not Configured'}</Badge>
        </div>
        <div>
          <Label>CareerOneStop API Status</Label>
          <Badge>{cosStatus ? 'Connected' : 'Not Configured'}</Badge>
        </div>
        <div>
          <Label>OpenAI API Status</Label>
          <Badge>{openaiStatus ? 'Connected' : 'Not Configured'}</Badge>
        </div>
      </div>
    </Card>
    
    {/* Extraction Settings */}
    <Card>
      <CardTitle>Extraction Settings</CardTitle>
      <div className="space-y-4">
        <div>
          <Label>Skills per SOC (Target)</Label>
          <Input type="number" defaultValue="15" min="10" max="30" />
        </div>
        <div>
          <Label>Auto-approve threshold</Label>
          <Input type="number" defaultValue="85" min="0" max="100" />
          <p className="text-xs text-gray-500">
            Skills with confidence ≥ this value are auto-selected
          </p>
        </div>
        <div>
          <Label>Minimum confidence</Label>
          <Input type="number" defaultValue="60" min="0" max="100" />
          <p className="text-xs text-gray-500">
            Skills below this threshold are filtered out
          </p>
        </div>
      </div>
    </Card>
    
    {/* Statistics */}
    <Card>
      <CardTitle>Extraction Statistics</CardTitle>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-bold">{socCount}</div>
          <div className="text-sm text-gray-500">SOCs Processed</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{skillCount}</div>
          <div className="text-sm text-gray-500">Unique Skills</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{programCount}</div>
          <div className="text-sm text-gray-500">Programs Processed</div>
        </div>
      </div>
    </Card>
    
  </div>
</TabsContent>
```

---

## 6. Curated Skills Review Tab

### Purpose:
View and edit previously curated skills for SOCs and Programs

### Structure:
```tsx
<TabsContent value="review">
  <Tabs defaultValue="soc-skills">
    
    {/* SOC Skills Review */}
    <TabsContent value="soc-skills">
      <Card>
        <CardTitle>Curated SOC Skills</CardTitle>
        
        <Select> {/* SOC dropdown - only processed SOCs */}
          <SelectItem>15-1253.00 - Software Developers</SelectItem>
        </Select>
        
        {selectedSoc && (
          <div>
            <div className="mb-4">
              <Badge>Last Updated: {lastUpdated}</Badge>
              <Badge>{curatedSkills.length} skills curated</Badge>
            </div>
            
            {/* Show ALL extracted skills with curated ones checked */}
            <div className="space-y-2">
              {allExtractedSkills.map(skill => (
                <div className={skill.isCurated ? 'border-green-500' : ''}>
                  <Checkbox 
                    checked={skill.isCurated}
                    onChange={() => toggleSkill(skill.id)}
                  />
                  <span>{skill.name}</span>
                  <Badge>{skill.confidence}%</Badge>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={rerunExtraction}>
                Re-run Extraction
              </Button>
              <Button onClick={saveChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Card>
    </TabsContent>
    
    {/* Program Skills Review */}
    <TabsContent value="program-skills">
      {/* Same structure as SOC skills */}
    </TabsContent>
    
  </Tabs>
</TabsContent>
```

### Key Features:
- View previously curated skills (checked)
- See all extracted skills (unchecked ones available)
- Re-select different skills
- Re-run extraction (overwrites data)
- Separate tabs for SOC vs Program skills

---

## 7. Rename LAiSER to Skills Extractor

### Files to Update:

#### Sidebar Navigation:
**File:** `/src/components/layout/admin-sidebar.tsx`
```tsx
// Change from:
{ name: 'LAiSER AI', href: '/admin/laiser', icon: TestTube }

// To:
{ name: 'Skills Extractor', href: '/admin/skills-extractor', icon: Zap }
```

#### Page Files:
1. Rename directory: `/src/app/(main)/admin/laiser/` → `/src/app/(main)/admin/skills-extractor/`
2. Update page title: "LAiSER Skills Extraction Admin" → "Skills Extractor"
3. Update metadata and descriptions

#### API Routes:
1. Rename: `/src/app/api/admin/laiser/` → `/src/app/api/admin/skills-extractor/`
2. Update all import paths

#### Remove LAiSER References:
- Page titles
- Descriptions
- Comments
- Variable names (keep `laiser` in API response fields for backward compatibility)

### Sidebar Display Issue:
**File:** `/src/app/(main)/admin/laiser/page.tsx`

Add layout wrapper:
```tsx
export default function SkillsExtractorPage() {
  return (
    <AdminLayout> {/* Add this wrapper */}
      <div className="container mx-auto p-6 max-w-6xl">
        {/* existing content */}
      </div>
    </AdminLayout>
  )
}
```

---

## Implementation Priority

### Phase 1 (Immediate):
1. ✅ Remove Lightcast (DONE)
2. Rename LAiSER → Skills Extractor
3. Fix sidebar display

### Phase 2 (High Priority):
4. Add SOC dropdown with status indicators
5. Add Curated Skills Review tab

### Phase 3 (Medium Priority):
6. Refactor Settings tab
7. Update Bulk Operations

### Phase 4 (Future):
8. Add Program Processing tab

---

## Testing Checklist

- [ ] SOC dropdown loads all codes
- [ ] Processing status indicators work
- [ ] Skills curation saves correctly
- [ ] Re-running extraction overwrites data
- [ ] Curated skills review shows correct data
- [ ] Sidebar navigation works
- [ ] All LAiSER references removed
- [ ] API endpoints respond correctly

---

## Notes

- Keep backward compatibility in API responses (`laiser` field names)
- Maintain existing database schema
- Ensure RLS policies work with new features
- Test with multiple user roles (super_admin, etc.)
