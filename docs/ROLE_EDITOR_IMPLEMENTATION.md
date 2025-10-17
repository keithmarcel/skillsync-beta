# Role Editor Implementation Plan

## Overview
Creating a shared role editor architecture that both admin and employer can use without code duplication.

## Architecture Decision

Instead of extracting the entire 1083-line admin role editor into a shared component (which would be complex and error-prone), we'll use a **simpler, more maintainable approach**:

### Approach: Import and Reuse with Context Wrapper

1. **Keep admin editor as-is** - It's working perfectly, don't touch it
2. **Create employer wrapper** - Import admin editor and wrap it with employer context
3. **Add context-based visibility** - Use props to hide/show fields based on context
4. **Auto-populate company_id** - Employer editor automatically sets company from profile

## Implementation Steps

### Step 1: Enhance EntityDetailView with Context Support

Add optional props to EntityDetailView:
- `hiddenFields`: Array of field keys to hide
- `defaultValues`: Object of default values to auto-populate
- `readOnlyFields`: Array of field keys to make read-only

### Step 2: Create Employer Role Editor

```tsx
// /src/app/(main)/employer/roles/[id]/page.tsx
// Import the admin role editor configuration
import { getRoleEditorTabs } from '@/app/admin/roles/[id]/page'

// Wrap with employer context
- Hide 'company_id' field
- Auto-populate company_id from profile
- Set job_kind to 'featured_role' by default
- Disable job_kind field (employers can only create featured roles)
```

### Step 3: Update Admin Role Editor

Export the tabs configuration function so employer can import it:
```tsx
export function getRoleEditorTabs(options) {
  // Existing tabs configuration
  return tabs
}
```

## Benefits

✅ **Single source of truth** - Admin tabs config is the master
✅ **No code duplication** - Employer imports and reuses
✅ **Easy maintenance** - Update admin, employer gets changes automatically
✅ **Clean separation** - Context determines visibility/behavior
✅ **Type safety** - Shared types and interfaces

## Fields Hidden for Employers

- `company_id` - Auto-populated from their profile
- `job_kind` - Fixed to 'featured_role' (read-only)
- `is_featured` toggle - Super admin only

## Fields Auto-Populated for Employers

- `company_id` - From profile.company_id
- `job_kind` - Always 'featured_role'
- `status` - Starts as 'draft'

## Next Steps

1. ✅ Document architecture decision
2. ⏳ Enhance EntityDetailView with context props
3. ⏳ Export admin tabs configuration
4. ⏳ Create employer role editor wrapper
5. ⏳ Update employer roles table "Add New Role" button
6. ⏳ Test complete flow
