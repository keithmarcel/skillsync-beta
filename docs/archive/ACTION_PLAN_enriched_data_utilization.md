# ACTION PLAN: Enriched Data Utilization Across SkillSync

**Date:** January 30, 2025  
**Priority:** HIGH  
**Status:** READY FOR IMPLEMENTATION  
**Branch:** Create new branch `feature/ai-enriched-assessments` when ready

---

## 📖 CONTEXT & CURRENT STATE

### **What We Just Accomplished:**
We successfully integrated CareerOneStop API into SkillSync's occupation enrichment pipeline. After extensive debugging and API endpoint discovery, we now have:

1. **Working CareerOneStop API Integration**
   - Fixed endpoint structure (requires O*NET format codes: `29-1141.00` not `29-1141`)
   - Successfully retrieving occupation details, tasks, tools/technology, and LMI data
   - Proper Bearer token authentication working
   - Comprehensive error handling and logging

2. **Enhanced Database Schema**
   - Added 6 new fields to `jobs` table: `onet_code`, `bright_outlook`, `bright_outlook_category`, `video_url`, `tasks` (JSONB), `tools_and_technology` (JSONB)
   - Migration created and applied to LOCAL database
   - Index created on `onet_code` for performance

3. **Updated Services**
   - `CareerOneStopApiService` - Complete rewrite with working endpoints
   - `OccupationEnrichmentService` - Enhanced to map COS data to database
   - `BLSApiService` - Already working with national wage data

4. **Data Strategy Decision**
   - Using **National data only** (regional unavailable for most occupations)
   - All wage/outlook data labeled as "National Average" or "(National)"
   - Consistent baseline across all occupations

### **Where We Are Now:**
- ✅ Local database has all new fields and working enrichment pipeline
- ⚠️ Remote Supabase database needs migration push
- ❌ AI assessment generation NOT using enriched occupation data
- ❌ UI components NOT displaying new enriched fields (tasks, tools, bright outlook, videos)
- ❌ Admin tools NOT showing/managing new enriched data

### **What This Action Plan Covers:**
This document provides complete implementation details for:
1. **Database Sync** - Pushing migration to remote Supabase
2. **AI Enhancement** - Making assessments use REAL occupation tasks and tools
3. **UI Updates** - Displaying all enriched data to users
4. **Admin Tools** - Enabling management of enriched fields

### **Why This Matters:**
- **AI Impact:** Assessments will test on ACTUAL job tasks and REAL tools (massive quality improvement)
- **User Value:** Job seekers see what they'll actually do and what tools they'll use
- **Data Transparency:** Clear "National" labels build trust
- **Admin Control:** Visibility into enrichment status and data quality

---

## 🎯 EXECUTIVE SUMMARY

**Current State:**
- ✅ Database schema enhanced with 6 new CareerOneStop fields
- ✅ API services working and retrieving comprehensive occupation data
- ✅ Enrichment pipeline ready to populate database
- ❌ AI assessment generation NOT using enriched data
- ❌ UI components NOT displaying new enriched fields
- ❌ Admin tools NOT showing/managing new data

**Required Actions:**
1. **Database Sync** - Push migration to remote Supabase
2. **AI Enhancement** - Update assessment generation to use enriched data
3. **UI Updates** - Display all available enriched data to users
4. **Admin Tools** - Enable management of enriched fields

---

## 1️⃣ DATABASE SYNC STATUS

### **Current Situation:**
- Local database has new migration applied ✅
- Remote Supabase needs migration push ⚠️

### **Action Required:**

```bash
# Push migration to remote Supabase
npx supabase db push

# Or if using dashboard, run this SQL:
```

```sql
-- Add CareerOneStop enrichment fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS onet_code TEXT,
ADD COLUMN IF NOT EXISTS bright_outlook TEXT,
ADD COLUMN IF NOT EXISTS bright_outlook_category TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS tasks JSONB,
ADD COLUMN IF NOT EXISTS tools_and_technology JSONB;

-- Add index
CREATE INDEX IF NOT EXISTS idx_jobs_onet_code ON public.jobs(onet_code);
```

### **Verification:**
After pushing, verify with:
```bash
npx supabase db diff --linked
# Should show "No schema differences detected"
```

---

## 2️⃣ AI ASSESSMENT GENERATION ENHANCEMENT

### **Current Problem:**
The AI context generation in `/src/lib/services/enhanced-ai-context.ts` uses placeholder data and doesn't leverage our enriched occupation data from CareerOneStop.

### **Files to Update:**

#### **A. Enhanced AI Context Service**
**File:** `/src/lib/services/enhanced-ai-context.ts`

**Current Issues:**
- Line 210-238: `getMarketIntelligence()` returns mock data
- Line 243-260: `getCompanyContext()` returns mock data
- Missing: Integration with actual database occupation data

**Required Changes:**

```typescript
/**
 * Get market intelligence from enriched occupation data
 */
export async function getMarketIntelligence(
  socCode: string,
  skillName: string,
  region: string = 'Tampa-St. Petersburg'
): Promise<MarketIntelligence> {
  
  // Fetch enriched occupation data from database
  const { data: occupation } = await supabase
    .from('jobs')
    .select('*')
    .eq('soc_code', socCode)
    .eq('job_kind', 'occupation')
    .single()

  if (!occupation) {
    // Fallback to patterns if no data
    return getFallbackMarketIntelligence(socCode, region)
  }

  // Use CareerOneStop bright outlook data
  const currentDemand = occupation.bright_outlook === 'Bright' ? 'high' : 'moderate'
  const trendDirection = occupation.bright_outlook === 'Bright' ? 'rising' : 'stable'

  // Parse wage data
  const medianWage = occupation.median_wage_usd || 50000
  const salaryRange = `$${Math.round(medianWage * 0.8).toLocaleString()} - $${Math.round(medianWage * 1.2).toLocaleString()}`

  // Extract industries from tasks/tools if available
  const primaryIndustries = extractIndustriesFromTasks(occupation.tasks)

  return {
    currentDemand,
    salaryRange,
    trendDirection,
    primaryIndustries,
    emergingRequirements: extractEmergingRequirements(occupation.tools_and_technology),
    region
  }
}

/**
 * Extract industries from task data
 */
function extractIndustriesFromTasks(tasks: any[]): string[] {
  if (!tasks || tasks.length === 0) return ['Technology', 'Healthcare', 'Finance']
  
  // Analyze task descriptions for industry keywords
  const taskText = tasks.map(t => t.TaskDescription || '').join(' ').toLowerCase()
  
  const industries: string[] = []
  if (taskText.includes('healthcare') || taskText.includes('patient')) industries.push('Healthcare')
  if (taskText.includes('technology') || taskText.includes('software')) industries.push('Technology')
  if (taskText.includes('financial') || taskText.includes('accounting')) industries.push('Finance')
  if (taskText.includes('education') || taskText.includes('teaching')) industries.push('Education')
  
  return industries.length > 0 ? industries : ['General Business']
}

/**
 * Extract emerging requirements from tools/technology
 */
function extractEmergingRequirements(tools: any[]): string[] {
  if (!tools || tools.length === 0) return ['Digital transformation', 'Remote collaboration']
  
  // Extract modern tools/tech as emerging requirements
  return tools
    .slice(0, 3)
    .map(t => t.ToolName || t.TechnologyName || '')
    .filter(Boolean)
}
```

#### **B. Enhanced Prompt Generation**

Update the `generateEnhancedAIContext()` function to include actual occupation data:

```typescript
export async function generateEnhancedAIContext(
  socCode: string,
  skillName: string,
  onetData: any,
  marketData: MarketIntelligence,
  companyData: CompanyContext,
  sessionId?: string
): Promise<string> {

  // Fetch full occupation data including CareerOneStop enrichment
  const { data: occupation } = await supabase
    .from('jobs')
    .select('*')
    .eq('soc_code', socCode)
    .eq('job_kind', 'occupation')
    .single()

  const enhancedPrompt = `
LAYERED INTELLIGENCE ASSESSMENT GENERATION

AUTHORITATIVE FOUNDATION (O*NET ${socCode}):
- Skill: ${skillName} (Government Importance: ${onetData.importance}/5.0)
- Work Activities: ${onetData.workActivities?.slice(0, 3).join(', ') || 'Standard occupational tasks'}
- Knowledge Areas: ${onetData.knowledge?.slice(0, 3).join(', ') || 'Domain expertise required'}
- Education Level: ${occupation?.education_level || onetData.jobZone?.education || 'Post-secondary education'}
- Experience Level: ${onetData.jobZone?.experience || 'Moderate experience'}

CAREERONESTOP ENRICHMENT (Government-Verified):
- Occupation: ${occupation?.title || 'Not available'}
- Career Outlook: ${occupation?.employment_outlook || 'Stable (National)'}
- Bright Outlook: ${occupation?.bright_outlook || 'No'} ${occupation?.bright_outlook_category ? `(${occupation.bright_outlook_category})` : ''}
- Typical Training: ${occupation?.education_level || 'Not specified'}
- O*NET Code: ${occupation?.onet_code || socCode}

REAL-WORLD TASKS (from CareerOneStop):
${occupation?.tasks ? 
  occupation.tasks.slice(0, 5).map((t: any, i: number) => 
    `${i + 1}. ${t.TaskDescription} (Importance: ${t.DataValue}/5.0)`
  ).join('\n') : 
  'Standard occupational tasks'}

TOOLS & TECHNOLOGY (from CareerOneStop):
${occupation?.tools_and_technology ? 
  occupation.tools_and_technology.slice(0, 8).map((t: any) => 
    `- ${t.ToolName || t.TechnologyName}`
  ).join('\n') : 
  'Standard industry tools'}

REAL-TIME MARKET INTELLIGENCE:
- Current Demand: ${marketData.currentDemand} (trending ${marketData.trendDirection})
- Salary Range: ${marketData.salaryRange} (National Average)
- Industry Focus: ${marketData.primaryIndustries.slice(0, 3).join(', ')}
- Emerging Requirements: ${marketData.emergingRequirements.slice(0, 2).join(', ')}

COMPANY-SPECIFIC CONTEXT:
- Role Level: ${companyData.roleLevel} (${companyData.teamSize} team management)
- Industry: ${companyData.industry} (${companyData.regulatoryEnvironment})
- Success Metrics: ${companyData.performanceMetrics.slice(0, 2).join(', ')}
- Organization Values: ${companyData.organizationValues.slice(0, 2).join(', ')}

ASSESSMENT PRECISION REQUIREMENTS:
This assessment must achieve surgical precision in skills gap identification using REAL GOVERNMENT DATA from O*NET and CareerOneStop.

CRITICAL OUTCOMES:
1. EDUCATION MAPPING ACCURACY: Questions must reveal precise competency gaps so SkillSync can connect job seekers with the RIGHT programs.

2. EMPLOYER CONFIDENCE: If someone shows proficient, organizations must have complete confidence they've been tested on ACTUAL job tasks (see Real-World Tasks above).

3. REAL-WORLD APPLICATION: Test actual job performance capabilities using the specific tools and technologies listed above. Focus on skills that differentiate qualified vs unqualified candidates.

4. GOVERNMENT DATA AUTHORITY: Leverage the authoritative O*NET + CareerOneStop data to create questions that reflect REAL occupation requirements, not theoretical knowledge.

DYNAMIC DIFFICULTY CALIBRATION:
- Calculated Difficulty: ${calculateDynamicDifficulty(onetData.importance, marketData.currentDemand, companyData.roleLevel, 'medium')}/100
- Question Complexity: Create scenarios that match ${companyData.roleLevel} responsibilities
- Performance Focus: Test ability to ${companyData.performanceMetrics[0] || 'deliver results'}
- Industry Context: ${companyData.industry} environment

UNIQUE SKILLSYNC ALGORITHM:
- Government authority (O*NET + CareerOneStop) + Market reality (real-time data)
- ACTUAL occupation tasks + REAL tools/technology requirements
- Regional workforce priorities + Company-specific requirements  
- Dynamic difficulty scaling + Performance correlation tracking

Generate questions that test competency on the ACTUAL TASKS and TOOLS listed above. Create SkillSync's unique "Skills Gap Precision Engine" - the first assessment system that combines authoritative government data with real-time market intelligence.

Question Format: Multiple choice, scenario-based, outcome-focused
Context: ${companyData.industry} industry, ${companyData.roleLevel} level
Validation: Must differentiate competent vs incompetent performance on REAL job tasks
Education Impact: Gaps identified must map to specific program recommendations
`

  return enhancedPrompt
}
```

---

## 3️⃣ UI COMPONENT UPDATES

### **A. Occupation Detail Page**
**File:** `/src/app/(main)/jobs/[id]/page.tsx`

**Current State:**
- Displays: title, description, wage, skills
- Missing: tasks, tools, bright outlook, video, employment outlook label

**Required Additions:**

```typescript
{/* Add after Key Stats section (around line 294) */}

{/* Bright Outlook Badge */}
{job.bright_outlook === 'Bright' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
    <div className="text-yellow-600">
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    </div>
    <div>
      <div className="font-semibold text-yellow-900">Bright Outlook Occupation</div>
      <div className="text-sm text-yellow-700">{job.bright_outlook_category}</div>
    </div>
  </div>
)}

{/* Employment Outlook with National Label */}
{job.employment_outlook && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="text-sm font-medium text-blue-900">Career Outlook</div>
    <div className="text-blue-700">{job.employment_outlook}</div>
    <div className="text-xs text-blue-600 mt-1">Based on national workforce data</div>
  </div>
)}

{/* Typical Tasks Section */}
{job.tasks && job.tasks.length > 0 && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>Typical Tasks & Responsibilities</CardTitle>
      <CardDescription>Day-to-day activities in this occupation</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3">
        {job.tasks.slice(0, 8).map((task: any, index: number) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-teal-700">{index + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-700">{task.TaskDescription}</p>
              {task.DataValue && (
                <span className="text-xs text-gray-500">Importance: {task.DataValue}/5.0</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)}

{/* Tools & Technology Section */}
{job.tools_and_technology && job.tools_and_technology.length > 0 && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>Tools & Technology</CardTitle>
      <CardDescription>Software and equipment commonly used</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {job.tools_and_technology.slice(0, 12).map((tool: any, index: number) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-sm font-medium text-gray-900">
              {tool.ToolName || tool.TechnologyName}
            </div>
            {tool.Category && (
              <div className="text-xs text-gray-500 mt-1">{tool.Category}</div>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}

{/* CareerOneStop Video */}
{job.video_url && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>Career Video</CardTitle>
      <CardDescription>Learn more about this occupation</CardDescription>
    </CardHeader>
    <CardContent>
      <a 
        href={job.video_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
        </svg>
        Watch Career Video on CareerOneStop
      </a>
    </CardContent>
  </Card>
)}
```

### **B. Update Wage Display**

Find the wage display section (around line 292) and update:

```typescript
<div>
  <div className="text-sm opacity-80">Median Salary</div>
  <div className="text-xl font-bold">${job.median_wage_usd?.toLocaleString()}</div>
  {job.job_kind === 'occupation' && (
    <div className="text-xs opacity-70 mt-1">National Average</div>
  )}
</div>
```

---

## 4️⃣ ADMIN TOOLS UPDATES

### **File:** `/src/app/admin/occupations/page.tsx`

**Required Changes:**

1. **Update Table Columns** to show new fields:

```typescript
// Add to column definitions
{
  key: 'bright_outlook',
  label: 'Outlook',
  render: (value: string) => value === 'Bright' ? (
    <Badge className="bg-yellow-100 text-yellow-800">Bright</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600">Standard</Badge>
  )
},
{
  key: 'onet_code',
  label: 'O*NET Code',
  render: (value: string) => (
    <span className="font-mono text-xs">{value || 'N/A'}</span>
  )
},
{
  key: 'tasks',
  label: 'Tasks',
  render: (value: any[]) => (
    <span className="text-sm text-gray-600">
      {value?.length || 0} tasks
    </span>
  )
},
{
  key: 'tools_and_technology',
  label: 'Tools',
  render: (value: any[]) => (
    <span className="text-sm text-gray-600">
      {value?.length || 0} tools
    </span>
  )
}
```

2. **Add Enrichment Status Indicator:**

```typescript
// Show which occupations have been enriched
{
  key: 'enrichment_status',
  label: 'Enriched',
  render: (_, row) => {
    const isEnriched = row.onet_code && row.tasks && row.tasks.length > 0
    return isEnriched ? (
      <Badge className="bg-green-100 text-green-800">✓ Enriched</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-600">Basic</Badge>
    )
  }
}
```

---

## 5️⃣ IMPLEMENTATION CHECKLIST

### **Phase 1: Database (IMMEDIATE)**
- [ ] Push migration to remote Supabase
- [ ] Verify schema sync with `npx supabase db diff --linked`
- [ ] Test enrichment pipeline on remote database

### **Phase 2: AI Enhancement (HIGH PRIORITY)**
- [ ] Update `getMarketIntelligence()` to use real occupation data
- [ ] Add helper functions for extracting industries/tools
- [ ] Update `generateEnhancedAIContext()` with enriched data
- [ ] Add Supabase imports to enhanced-ai-context.ts
- [ ] Test AI generation with enriched data

### **Phase 3: UI Updates (HIGH PRIORITY)**
- [ ] Add bright outlook badge to occupation pages
- [ ] Add "(National Average)" label to wage displays
- [ ] Add "(National)" label to employment outlook
- [ ] Create Tasks & Responsibilities section
- [ ] Create Tools & Technology section
- [ ] Add CareerOneStop video link
- [ ] Update TypeScript interfaces for new fields

### **Phase 4: Admin Tools (MEDIUM PRIORITY)**
- [ ] Add new columns to admin occupation table
- [ ] Add enrichment status indicator
- [ ] Update detail views to show all enriched fields
- [ ] Add manual enrichment trigger button

### **Phase 5: Testing (BEFORE PRODUCTION)**
- [ ] Test end-to-end enrichment pipeline
- [ ] Verify AI uses enriched data in prompts
- [ ] Verify UI displays all new fields correctly
- [ ] Test admin tools show/edit enriched data
- [ ] Verify national labels appear correctly

---

## 📋 ESTIMATED EFFORT

- **Database Sync:** 15 minutes
- **AI Enhancement:** 2-3 hours
- **UI Updates:** 3-4 hours
- **Admin Tools:** 2-3 hours
- **Testing:** 2 hours

**Total:** 9-12 hours of development work

---

## 🎯 SUCCESS CRITERIA

1. ✅ Remote database has all new fields
2. ✅ AI assessment generation uses actual occupation tasks/tools in prompts
3. ✅ Users see tasks, tools, bright outlook, and videos on occupation pages
4. ✅ All wage/outlook data clearly labeled as "National"
5. ✅ Admin tools display and manage all enriched fields
6. ✅ Enrichment pipeline populates all fields correctly

---

## 🚨 CRITICAL NOTES

1. **Database First:** Must push migration to remote before testing
2. **AI Impact:** Enhanced AI context will dramatically improve assessment quality
3. **User Value:** Tasks and tools provide real job preview
4. **National Labels:** Critical for data transparency and user trust
5. **Admin Visibility:** Admins need to see enrichment status to manage data quality

---

**Next Step:** Push database migration to remote Supabase and begin AI enhancement.
