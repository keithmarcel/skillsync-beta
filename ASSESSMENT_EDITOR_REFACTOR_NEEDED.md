# Assessment Editor Refactor Required

## Issue
The current assessment editor doesn't follow the employer role editor pattern. It needs to be refactored to use `EntityDetailView` like the role editor does.

## Current Implementation
- Custom layout with manual breadcrumb
- Custom tabs implementation
- Inconsistent with role editor UX

## Required Pattern (from Role Editor)
The employer role editor uses:
```tsx
<EntityDetailView
  entity={role}
  entityType="role"
  tabs={[...]}
  onSave={handleSave}
  onDelete={handleDelete}
  backHref="/employer?tab=roles"
  context="employer"
/>
```

This provides:
1. ✅ Breadcrumb component (consistent styling)
2. ✅ Card-based layout
3. ✅ Standardized tabs
4. ✅ Save/Cancel buttons in consistent location
5. ✅ Dirty state tracking
6. ✅ Unsaved changes warning

## Refactor Plan

### Option 1: Use EntityDetailView (Recommended)
**Pros:**
- Consistent with role editor
- Reuses existing patterns
- Less code to maintain

**Cons:**
- Requires adapting assessment data structure to EntityDetailView
- Questions tab needs custom rendering

### Option 2: Create AssessmentDetailView Component
**Pros:**
- Can customize for assessment-specific needs
- Easier to handle questions/analytics tabs

**Cons:**
- Duplicates EntityDetailView logic
- More code to maintain
- Still needs to match visual pattern

## Recommended Approach

Create a wrapper that uses EntityDetailView pattern but allows custom tabs:

```tsx
// src/app/(main)/employer/assessments/[id]/edit/page.tsx
export default function AssessmentEditorPage() {
  const tabs = [
    {
      id: 'basic-info',
      label: 'Basic Info',
      fields: [
        { key: 'title', label: 'Assessment Title', type: 'text', required: true },
        { key: 'job_id', label: 'Associated Role', type: 'select', options: roles },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'required_proficiency_pct', label: 'Required Proficiency', type: 'number' },
        { key: 'status', label: 'Status', type: 'custom', render: renderStatusToggle }
      ]
    },
    {
      id: 'questions',
      label: 'Questions',
      fields: [
        { key: 'questions', label: '', type: 'custom', render: () => <QuestionsTab /> }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      fields: [
        { key: 'analytics', label: '', type: 'custom', render: () => <AnalyticsTab /> }
      ]
    }
  ]

  return (
    <EntityDetailView
      entity={assessment}
      entityType="assessment"
      tabs={tabs}
      onSave={handleSave}
      backHref="/employer?tab=assessments"
      context="employer"
    />
  )
}
```

## Estimated Effort
- **2-3 hours** to refactor properly
- Includes testing and validation

## Benefits
- ✅ Consistent UX across employer features
- ✅ Reuses battle-tested components
- ✅ Automatic breadcrumb/navigation
- ✅ Standardized save/cancel flow
- ✅ Built-in dirty state tracking

## Current Status
- ❌ Not implemented
- Current editor uses custom layout
- Needs full refactor to match pattern
