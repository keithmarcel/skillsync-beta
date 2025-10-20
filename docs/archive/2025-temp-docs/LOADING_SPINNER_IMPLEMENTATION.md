# Loading Spinner Implementation

**Created:** October 3, 2025  
**Package:** `spinners-react`  
**Component:** `/src/components/ui/loading-spinner.tsx`

## Overview
Unified loading spinner component using SkillSync's teal color palette (#0694A2). Replaces all custom CSS spinners throughout the application for consistency.

## Installation
```bash
npm install spinners-react
```

## Component API

### LoadingSpinner
Main spinner component with customization options.

```typescript
interface LoadingSpinnerProps {
  size?: number          // Default: 60
  color?: string         // Default: '#0694A2' (teal)
  text?: string          // Optional loading text
  className?: string     // Additional CSS classes
  variant?: 'infinity' | 'circular'  // Default: 'infinity'
}
```

### PageLoader
Convenience wrapper for full-page loading states.

```typescript
<PageLoader text="Loading Featured Roles" />
```

### InlineSpinner
Small spinner for inline use (buttons, etc.).

```typescript
<InlineSpinner size={20} />
```

## Usage Examples

### Basic Page Loader
```typescript
import { PageLoader } from '@/components/ui/loading-spinner'

{loading ? (
  <PageLoader text="Loading Data" />
) : (
  // Your content
)}
```

### Custom Spinner
```typescript
import { LoadingSpinner } from '@/components/ui/loading-spinner'

<LoadingSpinner 
  size={80}
  color="#0694A2"
  text="Processing..."
  variant="infinity"
/>
```

### Inline Spinner
```typescript
import { InlineSpinner } from '@/components/ui/loading-spinner'

<Button disabled={loading}>
  {loading ? <InlineSpinner size={16} /> : 'Submit'}
</Button>
```

## Files Updated

### Main Application Pages
- ✅ `/src/app/(main)/jobs/page.tsx` - Featured roles loading
- ✅ `/src/app/(main)/programs/page.tsx` - Programs loading
- ✅ `/src/components/ui/data-table.tsx` - Table loading states

### Remaining Files (33 total with animate-spin)
Admin pages and other components still need updating:
- `/src/components/admin/EntityDetailView.tsx` (6 instances)
- `/src/app/admin/assessments/generate/page.tsx` (3 instances)
- `/src/app/(main)/assessments/[id]/analyzing/page.tsx` (2 instances)
- And 30 more files...

## Migration Pattern

### Before (Old CSS Spinner)
```typescript
<div className="flex flex-col items-center justify-center py-16">
  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0694A2] rounded-full animate-spin mb-4"></div>
  <p className="text-sm text-gray-600 font-normal">Loading...</p>
</div>
```

### After (New Component)
```typescript
import { PageLoader } from '@/components/ui/loading-spinner'

<PageLoader text="Loading..." />
```

## Color Palette
- **Primary:** #0694A2 (Teal) - Main spinner color
- **Secondary:** rgba(6, 148, 162, 0.2) - Faded teal for infinity spinner
- **Background:** #F3F4F6 (Gray-200) - For circular variant

## Variants

### Infinity Spinner (Default)
- Uses `SpinnerInfinity` from spinners-react
- Smooth, modern animation
- Best for page-level loading
- Size: 60px default

### Circular Spinner
- CSS-based fallback
- Traditional spinning circle
- Best for inline/button use
- Size: 20px default for inline

## Benefits
1. **Consistency:** Same spinner across entire app
2. **Brand Alignment:** Uses SkillSync teal color
3. **Professional:** Smooth animations from spinners-react
4. **Maintainable:** Single component to update
5. **Accessible:** Includes optional text labels

## Next Steps
- [ ] Update remaining 30+ files with old spinners
- [ ] Add to admin panel pages
- [ ] Update assessment flow pages
- [ ] Update auth pages
- [ ] Document in style guide

## Related Components
- **PageLoader** - Full page loading state
- **InlineSpinner** - Button/inline loading
- **DataTable** - Table loading state
- **EmptyState** - No data state (different from loading)

---

**Status:** ✅ Core implementation complete, migration in progress  
**Last Updated:** October 3, 2025
