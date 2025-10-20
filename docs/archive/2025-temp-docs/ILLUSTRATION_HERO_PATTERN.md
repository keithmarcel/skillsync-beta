# Illustration Hero Component Pattern

**Created:** October 3, 2025  
**Component:** `/src/components/ui/illustration-hero.tsx`

## Purpose
Reusable hero component that displays an illustration image with a title in a teal container below. Used consistently across tabbed pages for visual hierarchy and branding.

## Source Sans Pro Font Fix

### Problem
Tailwind CSS was overriding custom `font-family` declarations in inline styles.

### Solution
Use Tailwind's built-in font utility class instead of inline styles.

```typescript
// ❌ DOESN'T WORK - Gets overridden by Tailwind
style={{ fontFamily: "'Source Sans Pro', sans-serif" }}

// ✅ WORKS - Uses Tailwind's configured font class
className="font-source-sans-pro"
```

### Complete Typography Pattern
```typescript
className="text-[#F9FAFB] font-bold text-[24px] leading-[32px] font-source-sans-pro"
```

## Component Usage

### Basic Implementation
```typescript
import { IllustrationHero } from '@/components/ui/illustration-hero'

<IllustrationHero 
  imageSrc="/assets/heroimage_featured-roles.svg"
  imageAlt="See Who's Hiring Now"
  title="See Who's Hiring Now"
/>
```

### Props Interface
```typescript
interface IllustrationHeroProps {
  imageSrc: string    // Path to SVG illustration
  imageAlt: string    // Alt text for accessibility
  title: string       // Page title displayed in teal container
  className?: string  // Optional additional classes
}
```

## Design Specifications

### Image Container
- **Height:** 286.76px
- **Border Radius:** 12px 12px 0px 0px (rounded top corners)
- **Object Fit:** contain (shows full illustration without cropping)
- **Display:** block with lineHeight: 0 (prevents gaps)
- **Margin Bottom:** -4px (eliminates gap with title container)

### Title Container
- **Background:** #114B5F (dark teal)
- **Border Radius:** 0px 0px 12px 12px (rounded bottom corners)
- **Min Height:** 56px
- **Padding:** 12px 20px (py-3 px-5)
- **Alignment:** Left-aligned text, vertically centered

### Typography
- **Font Family:** Source Sans Pro (via `font-source-sans-pro` class)
- **Font Size:** 24px
- **Line Height:** 32px
- **Font Weight:** 700 (bold)
- **Color:** #F9FAFB (off-white)

## Current Implementations

### Jobs Page (`/jobs`)
- **Hiring Now Tab:**
  - Image: `/assets/heroimage_featured-roles.svg`
  - Title: "See Who's Hiring Now"

- **High-Demand Tab:**
  - Image: `/assets/heroimage_high-demand-occupations.svg`
  - Title: "Explore High-Demand Occupations"

### Programs Page (`/programs`)
- **Featured Programs Tab:**
  - Image: `/assets/heroimage_featured-programs.svg`
  - Title: "Discover Featured Programs"

- **All Programs Tab:**
  - Image: `/assets/heroimage_all-programs.svg`
  - Title: "Browse All Programs"

## Future Usage

When adding IllustrationHero to new pages:

1. **Create SVG illustration** (286.76px height recommended)
2. **Place in** `/public/assets/heroimage_[page-name].svg`
3. **Import component:**
   ```typescript
   import { IllustrationHero } from '@/components/ui/illustration-hero'
   ```
4. **Add to page:**
   ```typescript
   <IllustrationHero 
     imageSrc="/assets/heroimage_[page-name].svg"
     imageAlt="[Descriptive alt text]"
     title="[Page Title]"
   />
   ```

## Key Technical Details

### Gap Prevention
The negative margin (`marginBottom: '-4px'`) on the image container is critical to eliminate the gap between the illustration and the teal title container. This gap appears due to inline image rendering.

### Font Override Solution
Always use `font-source-sans-pro` Tailwind class rather than inline styles. The Tailwind configuration has Source Sans Pro properly set up, and using the utility class ensures it won't be overridden by other CSS.

### Responsive Considerations
- Component is full-width by default
- Image uses `object-contain` to maintain aspect ratio
- Text remains readable at all viewport sizes
- Consider adding responsive font sizes for mobile if needed

## Related Components
- **PageHeader** - Uses same `font-source-sans-pro` pattern
- **TitleHero** - Legacy component being replaced by IllustrationHero
- **StickyTabs** - Often used in conjunction with IllustrationHero

---

**Last Updated:** October 3, 2025  
**Status:** ✅ Production Ready
