# Role Editor Architecture - Shared Component Strategy

**Created:** October 16, 2025 3:47 AM  
**Updated:** October 21, 2025 9:35 PM  
**Status:** ✅ Implemented  
**Goal:** Create unified role editing experience for Admin and Employer contexts

---

## Executive Summary

The role editor is a complex 6-tab form that allows creation and editing of featured roles. Currently exists only in admin tools (`/admin/roles/[id]`). We need to surface this same experience to employers (`/employer/roles/[id]`) with context-appropriate styling and permissions.

**Key Principle:** Admin tools are the source of truth. Any functional improvements made to admin flow automatically extend to employer flow unless explicitly overridden.

---

## Current State: Admin Role Editor

### Location
- **File:** `/src/app/admin/roles/[id]/page.tsx` (1083 lines)
- **Component:** Uses `EntityDetailView` with tab configuration
- **Route:** `/admin/roles/[id]` (id can be 'new' for creation)

### Tab Structure (6 Tabs)
1. **Basic Information**
   - Title, SOC Code, Company, Category
   - Job Type, Work Location Type
   - Location (City, State)
   - Median Wage

2. **Details & Description**
   - Short Description
   - Long Description
   - Core Responsibilities
   - Tasks (JSON array)
   - Tools & Technology (JSON array)
   - Related Job Titles (array)

3. **Skills & Requirements**
   - SOC Skills Extractor (AI-powered)
   - Manual Skills Selector
   - Skills list with weights
   - Education Level
   - Work Experience
   - On-the-Job Training

4. **Assessment & Proficiency** ✅ (EMPLOYER-602, 603, 613 - Oct 21, 2025)
   - Required Proficiency % (for "Ready" status) - IMPLEMENTED
   - Visibility Threshold % (when role appears in employer dashboard) - IMPLEMENTED
   - Retake Cooldown Toggle (24-hour cooldown per role) - IMPLEMENTED
   - Quiz assignment

5. **SEO & Metadata**
   - SEO Title
   - Meta Description
   - OG Title
   - OG Description
   - OG Image
   - Slug

6. **Advanced Settings**
   - Featured Image URL
   - Video URL
   - O*NET Code
   - Bright Outlook
   - Employment Outlook
   - Growth Rate
   - Job Openings Annual
   - Application URL

### Key Features
- **Draft/Publish workflow** via `status` field
- **AI-powered tools** (SOC suggestion, skills extraction)
- **Drag-and-drop** card editors for tasks/tools
- **Real-time validation**
- **Unsaved changes tracking**
- **Company filtering** for company admins

---

## Target State: Employer Role Editor

### Requirements

#### 1. **Component Reusability**
- Extract tab configuration into shared config
- Use variant prop to differentiate admin vs employer styling
- Keep business logic centralized

#### 2. **Routing**
- **Edit existing:** `/employer/roles/[id]/edit`
- **Create new:** `/employer/roles/new`
- Breadcrumbs for navigation back to Listed Roles tab

#### 3. **Breadcrumb Pattern**
**Edit Flow:**
```
Employer Dashboard > Listed Roles > Edit: [Role Title]
```

**Create Flow:**
```
Employer Dashboard > Listed Roles > Create New Role
```

#### 4. **Draft/Publish Workflow**
- **Draft State:** `status = 'draft'` or `is_published = false`
- Employers can save partial drafts
- Draft roles show in Listed Roles table with badge
- Cannot publish until all required fields complete
- Publish button disabled with tooltip explaining missing fields

#### 5. **Permission Differences**

| Feature | Admin | Employer |
|---------|-------|----------|
| Edit any company's roles | ✅ | ❌ (only own) |
| Change company field | ✅ | ❌ (locked) |
| Delete roles | ✅ | ✅ (own only) |
| Access all tabs | ✅ | ✅ (same tabs) |
| AI tools | ✅ | ✅ (same tools) |

#### 6. **Required Fields for Publishing**
**Minimum Required:**
- Title
- SOC Code
- Company (auto-filled for employers)
- Category
- Short Description
- Long Description
- At least 1 skill

**Recommended (not blocking):**
- Featured Image
- Median Wage
- Location
- Education Level

#### 7. **Styling Differences**

| Element | Admin | Employer |
|---------|-------|----------|
| Container | Admin panel style | Main app style (teal theme) |
| Header | Admin breadcrumbs | Employer breadcrumbs |
| Buttons | Admin colors | Teal (#0d9488, hover #036672) |
| Save behavior | Save & Stay | Save & Stay |
| Cancel behavior | Back to list | Back to Listed Roles tab |

---

## Implementation Strategy

### Phase 1: Extract Shared Configuration
**Goal:** Create reusable tab configuration

**Files to Create:**
- `/src/lib/role-editor-config.tsx` - Tab definitions, field configs
- `/src/components/shared/RoleEditor.tsx` - Wrapper component with variants

**Approach:**
```typescript
// role-editor-config.tsx
export const getRoleEditorTabs = (context: 'admin' | 'employer', options) => {
  // Return tab configuration with context-specific adjustments
  return tabs.map(tab => ({
    ...tab,
    fields: tab.fields.filter(field => 
      context === 'admin' || !field.adminOnly
    )
  }))
}
```

### Phase 2: Create Employer Route
**Files to Create:**
- `/src/app/(main)/employer/roles/[id]/page.tsx` - Employer edit page
- `/src/app/(main)/employer/roles/new/page.tsx` - Employer create page

**Reuse:**
- Same `useAdminEntity` hook (rename to `useRoleEntity`?)
- Same validation logic
- Same save/delete handlers
- Same AI tools

### Phase 3: Breadcrumb Integration
**Update:**
- `/src/components/ui/breadcrumb.tsx` - Ensure supports employer context
- Add breadcrumb to employer role editor header

### Phase 4: Draft Badge in Listed Roles
**Update:**
- `/src/components/employer/employer-roles-table-v2.tsx`
- Add draft badge to role title or status column
- Filter or show drafts based on requirements

---

## Decisions Made (October 16, 2025)

### 1. Component Reusability ✅
**Decision:** Extract shared configuration into reusable component with variant prop
**Rationale:** Employer features will expand rapidly (AI tools, enhancements). Single source of truth prevents divergence and reduces maintenance burden. FAANG best practice: DRY principle with context-aware variants.

### 2. Permissions ✅
**Decision:** 
- Super Admin: Can edit ANY company's roles
- Company Admin: Can only edit their own company's roles
- Company field: Auto-populated from `profile.company_id`, hidden for employers
**Rationale:** Security through RLS + UI enforcement. Employers never see/change company field.

### 3. Draft/Publish Workflow ✅
**Decision:** Use `is_published` boolean for draft state
- `is_published = false` → Draft (can save partial data)
- `is_published = true` → Published (visible to job seekers)
- Draft roles show in Listed Roles table with "Draft" badge
- Publish button disabled until all required fields complete
- Dialog shows missing required fields when attempting to publish incomplete role
**Rationale:** Boolean is simpler than tri-state. Keeps `status` field for other purposes. Allows incremental progress.

### 4. Breadcrumb Pattern ✅
**Decision:** Follow main app pattern (jobs/[id] details pages)
- Edit: `Employer Dashboard > Listed Roles > Edit: [Role Title]`
- Create: `Employer Dashboard > Listed Roles > Create New Role`
- Actions (Save, Publish, Delete) in breadcrumb area like admin tools
**Rationale:** Consistent with existing UX patterns. Users already familiar with this navigation.

### 5. Required Fields for Publishing ✅
**Decision:** ALL fields required EXCEPT SEO tab (but encouraged via AI generator)
**Tabs Required:**
- ✅ Basic Information (all fields)
- ✅ Descriptions (short + long)
- ✅ Skills (minimum 1 skill)
- ✅ Assessments (auto-generated from skills)
- ✅ Role Details (responsibilities, tasks, tools)
- ⚠️ SEO & Metadata (optional but has AI generator to make it easy)
**Rationale:** Complete roles provide better job seeker experience. AI tools make completion fast. SEO optional to avoid friction, but encouraged.

### 6. Tab Structure ✅
**Decision:** Employers see same 6 tabs as admin (no "Advanced" tab found in current code)
**Tabs:**
1. Basic Information
2. Descriptions
3. Skills
4. Assessments
5. Role Details
6. SEO & Metadata
**Rationale:** Employers need full control. AI tools make complex tasks simple. No need to hide functionality.

### 7. Routing Pattern ✅
**Decision:** Use query params to match employer dashboard pattern
- Edit: `/employer?tab=roles&action=edit&id=[roleId]`
- Create: `/employer?tab=roles&action=new`
- Alternative: Create dedicated routes `/employer/roles/[id]` and `/employer/roles/new` for cleaner URLs
**Recommendation:** Use dedicated routes (`/employer/roles/[id]`, `/employer/roles/new`) - FAANG best practice for:
- Better SEO
- Cleaner URLs
- Easier deep linking
- Standard Next.js patterns
- Can still navigate back to `?tab=roles` after save

---

## Technical Considerations

### Database
- `jobs` table has both `status` field and `is_published` boolean
- **Use `is_published` for draft/publish workflow** (simpler boolean logic)
- `status` can be used for other purposes (archived, etc.)
- Draft: `is_published = false`
- Published: `is_published = true`

### Permissions
- Check `profile.company_id` matches `job.company_id`
- RLS policies already enforce company_id filtering
- No additional security needed

### Performance
- Large form with many fields
- Consider lazy loading tabs
- Debounce autosave for drafts

### Testing
- Test with Power Design account
- Verify draft → publish flow
- Verify required field validation
- Test breadcrumb navigation

---

## Success Criteria

✅ Employer can create new role from scratch  
✅ Employer can edit existing roles  
✅ Employer can save drafts (partial completion)  
✅ Employer cannot publish until required fields complete  
✅ Draft roles show in Listed Roles with badge  
✅ Breadcrumbs work for navigation  
✅ All AI tools work in employer context  
✅ Styling matches employer dashboard theme  
✅ Admin and employer editors stay in sync  
✅ Changes to admin editor automatically extend to employer  

---

## Implementation Plan

### Phase 1: Extract Shared Configuration (Day 1)
**Goal:** Create reusable role editor configuration

**Files to Create:**
1. `/src/lib/role-editor-config.tsx` - Tab definitions, field configs, validation rules
2. `/src/components/shared/RoleEditorForm.tsx` - Shared form component with variants

**Approach:**
```typescript
// role-editor-config.tsx
export const getRoleEditorTabs = (context: 'admin' | 'employer', options: {
  companies: Company[],
  skills: Skill[],
  profile: Profile,
  isNew: boolean
}) => {
  const tabs = [
    // Basic Information tab
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        // Company field - hidden for employers
        context === 'admin' ? {
          key: 'company_id',
          label: 'Company',
          type: EntityFieldType.SELECT,
          required: true,
          disabled: options.profile?.company_id ? true : false,
          options: options.companies.map(c => ({ value: c.id, label: c.name }))
        } : null,
        // ... other fields
      ].filter(Boolean)
    },
    // ... other tabs
  ]
  
  return tabs
}

export const validateRoleForPublish = (role: Job): { valid: boolean, missing: string[] } => {
  const missing: string[] = []
  
  // Basic Information
  if (!role.title) missing.push('Job Title')
  if (!role.soc_code) missing.push('SOC Code')
  if (!role.company_id) missing.push('Company')
  if (!role.category) missing.push('Category')
  if (!role.job_type) missing.push('Employment Type')
  if (!role.work_location_type) missing.push('Work Location')
  if (!role.location_city) missing.push('City')
  if (!role.location_state) missing.push('State')
  if (!role.education_level) missing.push('Education Requirements')
  if (!role.median_wage_usd) missing.push('Median Salary')
  if (!role.required_proficiency_pct) missing.push('Required Proficiency Score')
  if (!role.visibility_threshold_pct) missing.push('Visibility Threshold')
  if (!role.featured_image_url) missing.push('Featured Image')
  
  // Descriptions
  if (!role.short_desc) missing.push('Short Description')
  if (!role.long_desc) missing.push('Full Job Description')
  
  // Skills (check via API or assume validated)
  // Will need to check if role has at least 1 skill
  
  // Role Details
  if (!role.core_responsibilities || role.core_responsibilities.length === 0) {
    missing.push('Core Responsibilities')
  }
  if (!role.tasks || role.tasks.length === 0) {
    missing.push('Day-to-Day Tasks')
  }
  if (!role.tools_and_technology || role.tools_and_technology.length === 0) {
    missing.push('Tools & Technology')
  }
  
  return {
    valid: missing.length === 0,
    missing
  }
}
```

### Phase 2: Create Employer Routes (Day 2)
**Goal:** Implement employer-specific role editing pages

**Files to Create:**
1. `/src/app/(main)/employer/roles/[id]/page.tsx` - Edit existing role
2. `/src/app/(main)/employer/roles/new/page.tsx` - Create new role

**Key Features:**
- Use same `useAdminEntity` hook (or rename to `useRoleEntity`)
- Apply employer styling (teal theme)
- Add breadcrumbs with back navigation
- Show "You're editing live data" alert
- Auto-populate `company_id` from `profile.company_id`
- Validate before publish
- Show dialog with missing fields if publish attempted on incomplete role

**Example Structure:**
```typescript
// /src/app/(main)/employer/roles/[id]/page.tsx
'use client'

import { RoleEditorForm } from '@/components/shared/RoleEditorForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/ui/breadcrumb'

export default function EmployerRoleEditPage({ params }: { params: { id: string } }) {
  const { profile } = useAuth()
  const router = useRouter()
  const isNew = params.id === 'new'
  
  const handleSave = async (data: Job) => {
    // Ensure company_id is set
    data.company_id = profile.company_id
    // Save logic
  }
  
  const handleCancel = () => {
    router.push('/employer?tab=roles')
  }
  
  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Employer Dashboard', href: '/employer' },
          { label: 'Listed Roles', href: '/employer?tab=roles' },
          { label: isNew ? 'Create New Role' : 'Edit Role' }
        ]}
      />
      
      <RoleEditorForm
        roleId={isNew ? null : params.id}
        context="employer"
        companyId={profile.company_id}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
```

### Phase 3: Update Listed Roles Table (Day 2)
**Goal:** Add draft badge and edit navigation

**Files to Update:**
1. `/src/components/employer/employer-roles-table-v2.tsx`
2. `/src/lib/employer-roles-table-config.tsx`

**Changes:**
- Add "Draft" badge to role title when `is_published = false`
- Update "Edit Role" action to navigate to `/employer/roles/[id]`
- Update "Add New Role" button to navigate to `/employer/roles/new`
- Show draft count in metrics

**Example:**
```typescript
// In employer-roles-table-config.tsx
{
  key: 'title',
  label: 'Role Title',
  render: (value: string, row: any) => (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{value}</span>
      {!row.is_published && (
        <Badge className="bg-gray-200 text-gray-700">Draft</Badge>
      )}
    </div>
  )
}
```

### Phase 4: Publish Validation Dialog (Day 3)
**Goal:** Prevent publishing incomplete roles

**Files to Create:**
1. `/src/components/employer/PublishValidationDialog.tsx`

**Features:**
- Check all required fields before publish
- Show dialog listing missing fields
- Provide links to specific tabs with missing data
- Only allow publish when all required fields complete

**Example:**
```typescript
<Dialog open={showValidation} onOpenChange={setShowValidation}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Cannot Publish Role</DialogTitle>
      <DialogDescription>
        The following required fields are missing:
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-2">
      {missingFields.map(field => (
        <div key={field} className="text-sm text-red-600">
          • {field}
        </div>
      ))}
    </div>
    <DialogFooter>
      <Button onClick={() => setShowValidation(false)}>
        Continue Editing
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Phase 5: Testing & Polish (Day 3)
**Goal:** Ensure everything works end-to-end

**Test Scenarios:**
1. ✅ Create new role as employer (all fields empty)
2. ✅ Save draft (partial completion)
3. ✅ Return to edit draft
4. ✅ Attempt to publish incomplete role (see validation dialog)
5. ✅ Complete all required fields
6. ✅ Publish role successfully
7. ✅ Edit published role
8. ✅ Unpublish role
9. ✅ Delete role
10. ✅ Verify role appears/disappears for job seekers based on publish status

**Test Account:**
- Email: employeradmin-powerdesign@skillsync.com
- Password: ssbipass
- Company: Power Design

---

## Next Steps

### Immediate (This Session)
1. ✅ Document architecture and decisions
2. ⏳ Update ROLE_EDITOR_ARCHITECTURE.md with final decisions
3. ⏳ Commit documentation

### Next Session
1. Extract shared role editor configuration
2. Create employer role editor routes
3. Update Listed Roles table with draft badge
4. Implement publish validation
5. Test end-to-end with Power Design account

---

*Status: Architecture finalized, ready for implementation*
*Updated: October 16, 2025 3:56 AM*
