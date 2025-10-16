# Role Editor Architecture - Shared Component Strategy

**Created:** October 16, 2025 3:47 AM  
**Status:** 🔄 Planning Phase  
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

4. **Assessment & Proficiency**
   - Required Proficiency % (for "Ready" status)
   - Visibility Threshold % (when role appears in searches)
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

## Open Questions

### 1. Component Reusability
- [ ] Extract into shared component or keep separate?
- [ ] Use variant prop or separate implementations?

### 2. Draft Visibility
- [ ] Show drafts in Listed Roles table with badge?
- [ ] Or hide drafts entirely until published?
- [ ] Draft count in metrics?

### 3. Tab Access
- [ ] Should employers see ALL 6 tabs?
- [ ] Any admin-only tabs?
- [ ] Simplified view for employers?

### 4. Field Requirements
- [ ] Confirm minimum required fields for publish
- [ ] Block publish or show warnings?
- [ ] Validation messages location?

### 5. Routing Pattern
- [ ] `/employer/roles/[id]/edit` or `/employer/roles/[id]`?
- [ ] Separate `/new` route or use `[id]` with 'new'?

### 6. Company Field
- [ ] Hide completely for employers?
- [ ] Show as read-only?
- [ ] Auto-populate from profile.company_id?

### 7. Save Behavior
- [ ] Save and stay on page?
- [ ] Save and return to list?
- [ ] Toast notification?

---

## Technical Considerations

### Database
- `jobs` table already has `status` field ('draft' | 'published' | 'archived')
- `is_published` boolean also exists (legacy?)
- Use `status` as source of truth

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

## Next Steps

1. **Answer open questions** (see above)
2. **Extract shared configuration** into `/src/lib/role-editor-config.tsx`
3. **Create RoleEditor component** with admin/employer variants
4. **Implement employer routes** (`/employer/roles/[id]`, `/employer/roles/new`)
5. **Add breadcrumbs** to employer role editor
6. **Update Listed Roles table** to show draft badge
7. **Test end-to-end** with Power Design account
8. **Document** in technical architecture

---

*Status: Awaiting clarification on open questions before implementation*
