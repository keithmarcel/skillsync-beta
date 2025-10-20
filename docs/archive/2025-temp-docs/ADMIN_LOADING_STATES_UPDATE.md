# Admin Tools Loading States Standardization

## Summary
Updated admin tools to use consistent loading components matching the main app:
- **PageLoader** for full-page loading states
- **InlineSpinner** for inline/button loading states  
- **Skeleton** components where appropriate (matching homepage pattern)

## Changes Made

### ✅ Admin Layout (`/src/app/admin/layout.tsx`)
**Before:**
```tsx
<Loader2 className="h-8 w-8 animate-spin" />
```

**After:**
```tsx
<PageLoader text="Loading Admin..." />
```

**Impact:** Consistent loading experience when entering admin area

### Remaining Updates Needed

#### 1. Assessment Pages
**Files to update:**
- `/src/app/admin/assessments/generate/page.tsx` - Multiple Loader2 instances
- `/src/app/admin/assessments/[id]/quiz/page.tsx` - Loading states
- `/src/app/admin/assessments/[id]/quiz/edit/page.tsx` - Save button spinner

**Pattern:**
```tsx
// Replace this:
<Loader2 className="h-8 w-8 animate-spin" />

// With this:
<PageLoader text="Loading..." />

// For inline/button spinners:
<Loader2 className="h-4 w-4 mr-2 animate-spin" />

// With this:
<InlineSpinner size={16} />
```

#### 2. Analytics Page (`/src/app/admin/analytics/page.tsx`)
**Current:**
```tsx
<div className="text-lg font-medium">Loading analytics...</div>
```

**Should be:**
```tsx
<PageLoader text="Loading analytics..." />
```

#### 3. Entity Detail Pages
**Files:**
- `/src/app/admin/companies/[id]/page.tsx`
- `/src/app/admin/occupations/[id]/page.tsx`
- `/src/app/admin/providers/[id]/page.tsx`

**Current:**
```tsx
return <div>Loading...</div>;
```

**Should be:**
```tsx
return <PageLoader text="Loading [Entity]..." />;
```

#### 4. Admin Dashboard (`/src/app/admin/page.tsx`)
**Already uses Skeleton** ✅ - This is correct!

The dashboard properly uses the Skeleton component for loading states, matching the homepage pattern.

## Component Reference

### PageLoader
```tsx
import { PageLoader } from '@/components/ui/loading-spinner'

<PageLoader text="Loading..." />
```
- Full-page loading with diamond spinner
- Centered with padding
- Custom text message

### InlineSpinner  
```tsx
import { InlineSpinner } from '@/components/ui/loading-spinner'

<InlineSpinner size={20} />
```
- Small circular spinner
- For buttons and inline use
- Configurable size

### Skeleton
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-4 w-full" />
```
- For placeholder loading states
- Used in dashboard and homepage
- Multiple variants available

## Testing Checklist

- [x] Admin layout loading state
- [ ] Assessment generation page
- [ ] Quiz edit page loading
- [ ] Analytics page loading
- [ ] Entity detail pages loading
- [ ] All Loader2 imports removed
- [ ] Consistent spinner sizes
- [ ] Proper loading text messages

## Notes

- The admin dashboard already correctly uses Skeleton components
- Homepage uses custom skeleton animations (not ShadcnUI Skeleton)
- Our custom PageLoader/InlineSpinner components are the standard
- Loader2 from lucide-react should be completely removed from admin tools

## Files Updated

### Completed
- ✅ `/src/app/admin/layout.tsx` - PageLoader for auth loading

### Pending
- ⏳ Assessment pages (3 files)
- ⏳ Analytics page (1 file)  
- ⏳ Entity detail pages (3 files)
- ⏳ EntityDetailView component (1 file)

## Impact

**User Experience:**
- Consistent loading indicators across admin and main app
- Professional diamond spinner instead of basic circular
- Descriptive loading messages
- Better visual feedback

**Code Quality:**
- Single source of truth for loading components
- Easier to maintain and update
- Consistent patterns across codebase
