# Admin Tools Schema Update Analysis
**Date:** 2025-09-30  
**Purpose:** Ensure admin tools support new programs schema fields

---

## Current State Analysis

### ✅ Existing Admin Tools (Working)
1. **Programs Management** (`/admin/programs`)
   - List view with table
   - Edit/Create program forms
   - Status toggle (draft/published)
   - Delete functionality

2. **Education Providers** (`/admin/providers`)
   - List view with table (schools)
   - Edit/Create provider forms
   - View programs by provider

3. **Sidebar Navigation**
   - Programs (super_admin, provider_admin)
   - Education Providers (super_admin)

---

## New Schema Fields (Added in Migrations)

### Programs Table Extensions

| Field | Type | Purpose | Admin UI Needed? |
|-------|------|---------|------------------|
| `program_id` | TEXT | External identifier (HubSpot Record ID or generated) | ✅ Display only (read-only) |
| `catalog_provider` | TEXT | 'Direct' or 'Bisk Amplified' | ✅ Display + Filter |
| `discipline` | TEXT | Business, Technology, Healthcare, etc. | ✅ Edit + Filter |
| `long_desc` | TEXT | Full program overview | ✅ Edit (WYSIWYG) |
| `program_guide_url` | TEXT | External guide URL | ✅ Edit |
| `is_featured` | BOOLEAN | Featured Programs tab control | ✅ Toggle |
| `featured_image_url` | TEXT | Hero image for detail pages | ✅ Upload |
| `skills_count` | INTEGER | Cached count (auto-updated) | ✅ Display only (read-only) |
| `created_at` | TIMESTAMPTZ | Creation timestamp | ✅ Display only |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | ✅ Display only |

---

## Required Admin UI Updates

### 1. Programs List Page (`/admin/programs/page.tsx`)

#### Current Columns
- Program Name
- Provider
- Type
- Format
- Duration
- CIP Code
- Status (toggle)

#### **Recommended Additions**
- **Catalog Provider** (filter dropdown: Direct, Bisk Amplified)
- **Discipline** (filter dropdown: Business, Technology, Healthcare, etc.)
- **Featured** (toggle switch like status)
- **Skills Count** (display only, shows linked skills)
- **Created Date** (sortable)

#### **Question 1: Column Priority**
Which columns are most important for the list view? Should we:
- A) Add all new fields as columns
- B) Add only Featured toggle + Catalog Provider filter
- C) Keep current columns, add filters in header

---

### 2. Program Detail/Edit Page (`/admin/programs/[id]/page.tsx`)

#### Current Tabs
1. **Basic Information**
   - Name, Provider, Type, Format, Duration, CIP Code

2. **Program Details**
   - Short Description, Program URL

#### **Recommended Tab Structure**

**Option A: Extend Existing Tabs**
1. **Basic Information** (add fields)
   - ✅ Existing fields
   - ➕ Discipline (dropdown)
   - ➕ Catalog Provider (dropdown: Direct, Bisk Amplified)
   - ➕ Program ID (read-only, display only)
   - ➕ Featured (toggle)

2. **Program Details** (add fields)
   - ✅ Short Description (existing)
   - ➕ Long Description (WYSIWYG editor)
   - ✅ Program URL (existing)
   - ➕ Program Guide URL (new field)

3. **Media** (new tab)
   - Featured Image Upload
   - Image preview
   - Image URL field

4. **Skills** (new tab)
   - Skills Count (read-only)
   - Link to Skills Management
   - View linked skills (future: CIP-SOC pipeline)

5. **Metadata** (new tab)
   - Created At (read-only)
   - Updated At (read-only)
   - Status history (future)

**Option B: Consolidated Tabs**
1. **Basic Information**
   - All core fields including discipline, catalog provider, featured flag

2. **Content**
   - Short desc, long desc, URLs, featured image

3. **Skills & Metadata**
   - Skills count, timestamps, status

#### **Question 2: Tab Organization**
Which tab structure makes more sense for admin workflow?
- A) Option A (5 tabs - more organized, matches jobs admin)
- B) Option B (3 tabs - simpler, consolidated)
- C) Different structure (please specify)

---

### 3. TypeScript Interface Updates

#### Current Interface (queries.ts)
```typescript
export interface Program {
  id: string;
  school_id: string | null;
  name: string;
  program_type: string | null;
  format: string | null;
  duration_text: string | null;
  short_desc: string | null;
  program_url: string | null;
  cip_code: string | null;
  status: 'draft' | 'published' | 'archived';
  school?: School;
  skills?: ProgramSkill[];
}
```

#### **Required Updates**
```typescript
export interface Program {
  id: string;
  school_id: string | null;
  name: string;
  program_id: string;                    // ✅ NEW
  program_type: string | null;
  format: string | null;
  duration_text: string | null;
  short_desc: string | null;
  long_desc: string | null;              // ✅ NEW
  discipline: string | null;             // ✅ NEW
  catalog_provider: string | null;       // ✅ NEW
  program_url: string | null;
  program_guide_url: string | null;      // ✅ NEW
  cip_code: string | null;
  is_featured: boolean;                  // ✅ NEW
  featured_image_url: string | null;     // ✅ NEW
  skills_count: number;                  // ✅ NEW
  status: 'draft' | 'published' | 'archived';
  created_at: string;                    // ✅ NEW
  updated_at: string;                    // ✅ NEW
  school?: School;
  skills?: ProgramSkill[];
}
```

---

### 4. New Admin Features Needed

#### A. Bulk Operations
Should we add bulk actions for programs?
- Mark multiple as featured
- Change catalog provider
- Assign discipline
- Publish/unpublish multiple

#### **Question 3: Bulk Operations**
Are bulk operations needed now, or can we defer to later?

---

#### B. Featured Programs Management
Do you want a dedicated view for managing featured programs?
- Separate page: `/admin/programs/featured`
- Filter on main page: "Show Featured Only"
- Both

#### **Question 4: Featured Programs View**
How should admins manage featured programs?
- A) Filter on main programs page
- B) Dedicated featured programs page
- C) Both (filter + dedicated page)

---

#### C. Catalog Provider Distinction
How should admins interact with catalog providers?
- Can admins change catalog provider after creation?
- Should Bisk Amplified programs be read-only?
- Should Direct programs have different permissions?

#### **Question 5: Catalog Provider Permissions**
- A) All admins can edit all programs regardless of catalog provider
- B) Bisk Amplified programs are read-only (imported from HubSpot)
- C) Different permissions based on catalog provider

---

#### D. Skills Management Integration
The `skills_count` field is auto-updated via trigger when skills are linked. Do you want:
- View-only skills count in program admin
- Link to separate skills management page
- Inline skills editor in program detail page

#### **Question 6: Skills Management**
How should admins manage program skills?
- A) View-only count, manage skills elsewhere
- B) Inline skills editor in program detail page
- C) Dedicated skills management page with program linking

---

### 5. Schools/Providers Admin Updates

#### Current State
- Schools table has: id, name, logo_url, about_url, city, state
- 19 new schools created from HubSpot import

#### **Question 7: Schools Management**
Do schools need any new fields to support the new programs?
- School type (Community College, University, Training Provider, etc.)
- Catalog affiliation (Direct, Bisk Amplified partner)
- Featured flag for schools
- Other?

---

## Recommended Implementation Priority

### Phase 1: Critical Updates (Do Now)
1. ✅ Update Program TypeScript interface
2. ✅ Add new fields to program detail form
3. ✅ Add Featured toggle to programs list
4. ✅ Add Discipline dropdown to program form
5. ✅ Add Catalog Provider display/filter

### Phase 2: Enhanced Features (Next)
1. Featured image upload component
2. Long description WYSIWYG editor
3. Skills count display
4. Timestamps display

### Phase 3: Advanced Features (Later)
1. Bulk operations
2. Dedicated featured programs view
3. Skills management integration
4. Advanced filtering

---

## Design System Consistency

### Existing Patterns to Follow
1. **Table Component**: `AdminTable` with search, sort, filters
2. **Detail View**: `EntityDetailView` with tabs
3. **Form Fields**: Consistent field types (TEXT, TEXTAREA, SELECT, TOGGLE)
4. **Colors**: Teal primary (#0694A2), consistent with main app
5. **Icons**: Lucide React icons

### New Components Needed
1. **Image Upload Component** (for featured_image_url)
2. **WYSIWYG Editor** (for long_desc) - or use TEXTAREA for now?
3. **Read-Only Field Component** (for program_id, skills_count, timestamps)

#### **Question 8: Rich Text Editor**
For `long_desc`, should we:
- A) Use simple TEXTAREA (quick, no dependencies)
- B) Add WYSIWYG editor (better UX, needs library)
- C) Markdown editor (middle ground)

---

## Summary of Questions

Please answer these to guide implementation:

1. **Column Priority**: Which new fields should appear in programs list table?
2. **Tab Organization**: 5 tabs (organized) or 3 tabs (consolidated)?
3. **Bulk Operations**: Needed now or defer?
4. **Featured Programs View**: Filter, dedicated page, or both?
5. **Catalog Provider Permissions**: Edit all, read-only Bisk, or different permissions?
6. **Skills Management**: View-only, inline editor, or separate page?
7. **Schools Management**: Any new fields needed for schools?
8. **Rich Text Editor**: TEXTAREA, WYSIWYG, or Markdown?

---

## Next Steps After Answers

1. Update TypeScript interfaces
2. Implement chosen tab structure
3. Add new form fields with proper validation
4. Update list view with new columns/filters
5. Add image upload component (if needed)
6. Test all CRUD operations with new fields
7. Update documentation

---

## Files to Modify

### TypeScript Interfaces
- `/src/lib/database/queries.ts` - Update Program interface

### Admin Pages
- `/src/app/admin/programs/page.tsx` - List view updates
- `/src/app/admin/programs/[id]/page.tsx` - Detail form updates

### Components (if needed)
- `/src/components/admin/ImageUpload.tsx` - New component
- `/src/components/admin/ReadOnlyField.tsx` - New component
- `/src/components/admin/RichTextEditor.tsx` - New component (optional)

### Hooks (if needed)
- `/src/hooks/useProgramSkills.ts` - New hook for skills management

---

## Technical Notes

- All new fields are already in database (migrations applied ✅)
- Triggers are in place for auto-updating skills_count and updated_at
- Featured flag constraint requires featured_image_url when is_featured = true
- Program_id is unique and required (generated for existing programs)
