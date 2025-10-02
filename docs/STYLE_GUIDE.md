# SkillSync Design System & Style Guide

**Version:** 1.0  
**Last Updated:** October 2, 2025  
**Purpose:** Comprehensive style guide for consistent UI/UX across SkillSync main app

---

## 🎨 Brand Identity

### Primary Brand Color
**Teal:** `#0694A2` (RGB: 6, 148, 162)
- Primary actions, active states, brand elements
- Navbar, buttons, links, highlights

### Supporting Colors
**Teal Variants:**
- `teal-100`: `#D5F5F6` - Light backgrounds, borders, hover states
- `teal-500`: `#0694A2` - Primary brand color
- `teal-600`: `#047481` - Darker variant for hover states

**Dark Teal:**
- `#114B5F` - Page headers, hero sections, dark backgrounds

---

## 📝 Typography

### Font Family
**Primary:** Geist Sans
**Fallback:** Inter, system sans-serif

```css
font-family: 'Geist', 'Inter', sans-serif;
```

### Type Scale & Hierarchy

**H1 - Page Titles**
```css
font-size: 30px;
line-height: 36px;
font-weight: 700 (bold);
color: white (on dark backgrounds) or #0A0A0A (on light);
```
Usage: Main page headers, hero titles

**H2 - Section Headers**
```css
font-size: 24px;
line-height: 32px;
font-weight: 600 (semibold);
color: #0A0A0A;
```
Usage: Section titles, card headers

**H3 - Subsection Headers**
```css
font-size: 18px;
line-height: 28px;
font-weight: 600 (semibold);
color: #0A0A0A;
```
Usage: Card titles, subsection headers

**Body Text**
```css
font-size: 16px;
line-height: 24px;
font-weight: 400 (normal);
color: #0A0A0A;
```
Usage: Paragraphs, descriptions, general content

**Small Text**
```css
font-size: 14px;
line-height: 20px;
font-weight: 400 (normal);
color: #6B7280 (gray-500);
```
Usage: Captions, helper text, metadata

**Tiny Text**
```css
font-size: 12px;
line-height: 16px;
font-weight: 400 (normal);
color: #6B7280;
```
Usage: Labels, badges, timestamps

### Usage Guidelines

**DO:**
- Use H1 once per page (page title)
- Maintain hierarchy (H1 → H2 → H3)
- Use consistent line heights for readability
- Use gray-500 (#6B7280) for secondary text

**DON'T:**
- Skip heading levels (H1 → H3)
- Use multiple H1s on same page
- Use font sizes outside the scale
- Use pure black (#000000) - use #0A0A0A instead

---

## 🎨 Color System

### Primary Palette

**Teal (Brand)**
```
teal-100: #D5F5F6  - Backgrounds, borders
teal-500: #0694A2  - Primary actions
teal-600: #047481  - Hover states
```

**Dark Teal (Headers)**
```
#114B5F - Page headers, hero sections
```

**Neutrals**
```
white: #FFFFFF     - Backgrounds, cards
gray-50: #F9FAFB   - Light backgrounds
gray-100: #F3F4F6  - Borders, dividers
gray-200: #E5E7EB  - Inactive borders
gray-300: #D1D5DB  - Borders
gray-500: #6B7280  - Secondary text
gray-700: #374151  - Body text
gray-900: #111827  - Headings
black: #0A0A0A     - Primary text
```

### Semantic Colors

**Success**
```
bg: green-100 (#DCFCE7)
text: green-800 (#166534)
border: green-200
```
Usage: Success messages, completed states

**Warning**
```
bg: orange-100 (#FFEDD5)
text: orange-800 (#9A3412)
border: orange-200
```
Usage: Warning messages, attention needed

**Error**
```
bg: red-100 (#FEE2E2)
text: red-800 (#991B1B)
border: red-200
```
Usage: Error messages, destructive actions

**Info**
```
bg: blue-100 (#DBEAFE)
text: blue-800 (#1E40AF)
border: blue-200
```
Usage: Informational messages

### Color Usage Guidelines

**DO:**
- Use teal (#0694A2) for all primary actions
- Use gray-50 (#F9FAFB) for page backgrounds
- Use white (#FFFFFF) for card backgrounds
- Use semantic colors consistently (green = success, red = error)
- Maintain sufficient contrast (WCAG AA minimum)

**DON'T:**
- Use pure black (#000000) - use #0A0A0A
- Mix different shades of teal arbitrarily
- Use colors outside the defined palette
- Use low-contrast color combinations

---

## 🔘 Buttons

### Button Variants

**Primary (Teal)**
```tsx
className="bg-[#0694A2] hover:bg-[#0694A2]/90 text-white"
```
Usage: Primary actions, CTAs, submit buttons

**Secondary (Outline)**
```tsx
className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
```
Usage: Secondary actions, cancel buttons

**Outline Teal (Special)**
```tsx
className="border border-[#D5F5F6] bg-transparent text-[#D5F5F6] hover:bg-teal-500 hover:text-white"
```
Usage: Buttons on dark backgrounds (page headers)

**Ghost**
```tsx
className="hover:bg-gray-50 text-gray-700"
```
Usage: Tertiary actions, icon buttons

**Destructive**
```tsx
className="bg-red-600 hover:bg-red-700 text-white"
```
Usage: Delete, remove, destructive actions

### Button Sizes

**Default**
```tsx
className="h-10 px-4 py-2"
```

**Small**
```tsx
className="h-8 px-3 py-1.5 text-sm"
```

**Large**
```tsx
className="h-12 px-6 py-3 text-lg"
```

### Button States

**Disabled**
```tsx
disabled={true}
className="opacity-50 cursor-not-allowed"
```

**Loading**
```tsx
<Button disabled>
  <SpinnerInfinity size={20} color="#FFFFFF" />
  Loading...
</Button>
```

### Button Usage Guidelines

**DO:**
- Use primary buttons for main actions
- Use outline buttons for secondary actions
- Include loading states for async actions
- Use consistent sizing within same context
- Add icons to clarify action (optional)

**DON'T:**
- Use more than one primary button in same area
- Use destructive variant for non-destructive actions
- Forget disabled states for invalid actions
- Use buttons for navigation (use Link instead)

---

## 📦 Cards

### Card Structure

**Standard Card**
```tsx
<Card className="rounded-xl border bg-white">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="p-6">
    Content
  </CardContent>
</Card>
```

### Card Variants

**Default**
```
border: 1px solid #E5E7EB
background: white
border-radius: 12px (rounded-xl)
padding: 24px (p-6)
```

**Hover State**
```
hover:shadow-md
transition-shadow
```

**Interactive Card (Clickable)**
```
cursor-pointer
hover:shadow-lg
hover:border-teal-500
transition-all
```

### Card Usage Guidelines

**DO:**
- Use consistent padding (p-6 = 24px)
- Use rounded-xl for border radius
- Group related content in cards
- Use white background on gray-50 page
- Add hover states for interactive cards

**DON'T:**
- Use cards within cards (avoid nesting)
- Use inconsistent border radius
- Forget hover states for clickable cards
- Use colored backgrounds (keep white)

---

## 📊 Tables

### Table Structure

**Container**
```tsx
<div className="w-full rounded-xl border border-[#E5E5E5] bg-[#FCFCFC] p-2 overflow-x-auto">
  <table className="w-full border-collapse">
    {/* content */}
  </table>
</div>
```

### Table Styles

**Header**
```
background: #F9FAFB
color: #114B5F
font-size: 12px
font-weight: 600 (semibold)
text-transform: uppercase
letter-spacing: 0.05em
border-bottom: 1px solid #E5E7EB
padding: 24px (py-6 px-6)
```

**Row**
```
border-bottom: 1px solid #E5E7EB
hover:bg-gray-50/50
padding: 24px (py-6 px-6)
```

**Cell**
```
font-size: 14px
font-weight: 400 (normal)
color: #0A0A0A
```

### Table Usage Guidelines

**DO:**
- Use consistent padding (py-6 px-6)
- Add hover states to rows
- Use uppercase headers with letter-spacing
- Make tables responsive (overflow-x-auto)
- Use consistent border colors

**DON'T:**
- Use tables for layout (use CSS Grid/Flexbox)
- Forget mobile responsiveness
- Use inconsistent cell padding
- Omit hover states

---

## 📝 Forms & Inputs

### Input Styles

**Default Input**
```tsx
<Input 
  className="h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
  placeholder="Enter text..."
/>
```

**Search Input**
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
  <Input 
    className="pl-10 h-10"
    placeholder="Search..."
  />
</div>
```

**Select Dropdown**
```tsx
<Select>
  <SelectTrigger className="h-10 border-gray-300">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Form Layout

**Form Group**
```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <label className="text-sm font-medium">Label</label>
    <Input />
    <p className="text-sm text-gray-500">Helper text</p>
  </div>
</div>
```

### Form Usage Guidelines

**DO:**
- Use consistent input height (h-10 = 40px)
- Add focus states (teal ring)
- Include labels for all inputs
- Add helper text when needed
- Use placeholder text appropriately

**DON'T:**
- Use inputs without labels
- Forget focus states
- Use inconsistent heights
- Omit validation states

---

## 🏷️ Badges

### Badge Variants

**Default**
```tsx
<Badge variant="default">Label</Badge>
// bg-gray-100, text-gray-800
```

**Success**
```tsx
<Badge variant="success">Active</Badge>
// bg-green-100, text-green-800
```

**Warning**
```tsx
<Badge variant="warning">Pending</Badge>
// bg-orange-100, text-orange-800
```

**Error**
```tsx
<Badge variant="error">Error</Badge>
// bg-red-100, text-red-800
```

**Info**
```tsx
<Badge variant="info">Info</Badge>
// bg-blue-100, text-blue-800
```

### Badge Usage Guidelines

**DO:**
- Use semantic variants consistently
- Keep text short (1-2 words)
- Use for status indicators
- Use for categories/tags

**DON'T:**
- Use badges for long text
- Mix badge styles arbitrarily
- Use as buttons (use Button instead)

---

## 📐 Layout & Spacing

### Container Widths

**Main App Container**
```
max-w-[1280px]
mx-auto
px-6
```

**Admin Container**
```
max-w-[1280px]
mx-auto
px-6
```

**Full Width**
```
w-full
```

### Spacing Scale

**Tailwind Spacing (4px base)**
```
space-y-2:  8px
space-y-4:  16px
space-y-6:  24px
space-y-8:  32px
space-y-12: 48px

gap-2:  8px
gap-4:  16px
gap-6:  24px
gap-8:  32px
```

### Common Spacing Patterns

**Page Layout**
```
py-8: 32px top/bottom padding
space-y-6: 24px between sections
```

**Card Padding**
```
p-6: 24px all sides
```

**Button Spacing**
```
gap-4: 16px between buttons
px-4 py-2: 16px horizontal, 8px vertical
```

### Layout Usage Guidelines

**DO:**
- Use consistent container widths
- Use space-y for vertical spacing
- Use gap for flexbox/grid spacing
- Maintain 24px between major sections
- Use responsive padding (px-4 sm:px-6)

**DON'T:**
- Use arbitrary spacing values
- Mix spacing patterns
- Forget mobile responsiveness
- Use margin when padding is appropriate

---

## 🎭 Component Patterns

### Page Header (Dark Background)

**Structure:**
```tsx
<div className="bg-[#114B5F] py-8">
  <div className="max-w-[1280px] mx-auto px-6">
    <h1 className="text-white font-bold text-[30px] leading-[36px]">
      Page Title
    </h1>
    <p className="text-teal-50 text-base font-normal">
      Subtitle or description
    </p>
  </div>
</div>
```

**Usage:**
- Every main page should have this header
- Use white text on dark teal background
- Include subtitle for context
- Add buttons in "split" variant if needed

### Sticky Tabs

**Structure:**
```tsx
<StickyTabs 
  tabs={[
    { id: 'tab1', label: 'Tab 1', isActive: true },
    { id: 'tab2', label: 'Tab 2', isActive: false }
  ]}
  onTabChange={(id) => handleTabChange(id)}
/>
```

**Styling:**
- Sticky below navbar (top-24)
- Teal active state (#0694A2)
- Gray inactive state
- 24px padding above/below
- Border-bottom separator

### Breadcrumbs

**Structure:**
```tsx
<Breadcrumb items={[
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Current Page' }
]} />
```

**Styling:**
- ChevronRight separators
- Teal-100 text color
- Hover states on links
- Last item not clickable

### Loading States

**Spinner (New Standard)**
```tsx
import { SpinnerInfinity } from 'spinners-react';

<SpinnerInfinity 
  size={50} 
  thickness={100} 
  speed={100} 
  color="#0694A2"
  secondaryColor="rgba(6, 148, 162, 0.2)"
/>
```

**Skeleton (For Content)**
```tsx
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />
```

### Empty States

**Structure:**
```tsx
<div className="text-center py-12">
  <p className="text-gray-500 text-lg">No items found</p>
  <p className="text-gray-400 text-sm mt-2">
    Try adjusting your filters
  </p>
  <Button className="mt-4">Add New Item</Button>
</div>
```

---

## 🎨 Component Usage Guidelines

### When to Create New Components

**DO Create Components For:**
- Reusable UI patterns (buttons, cards, inputs)
- Complex interactions (modals, dropdowns, tabs)
- Repeated layouts (page headers, tables)
- Shared business logic (data tables, forms)

**DON'T Create Components For:**
- One-off layouts
- Simple div wrappers
- Overly specific use cases
- Premature abstraction

### Component File Structure

```
/src/components/
  /ui/              # Reusable UI components
  /admin/           # Admin-specific components
  /[feature]/       # Feature-specific components
```

### Component Naming

**DO:**
- Use PascalCase (Button, DataTable)
- Be descriptive (UserProfileCard, not Card)
- Include variant in name if needed (PrimaryButton)

**DON'T:**
- Use generic names (Component, Item)
- Use abbreviations (Btn, Tbl)
- Use underscores or hyphens

---

## 🚫 Common Mistakes to Avoid

### shadcn/ui Components

**PROBLEM:** New shadcn components default to black/white theme

**SOLUTION:** Always customize after importing
```tsx
// ❌ DON'T use default
<Button>Click Me</Button>

// ✅ DO customize colors
<Button className="bg-[#0694A2] hover:bg-[#0694A2]/90 text-white">
  Click Me
</Button>
```

### Color Consistency

**❌ DON'T:**
```tsx
// Random colors
<div className="bg-blue-500">
<Button className="bg-purple-600">
```

**✅ DO:**
```tsx
// Brand colors
<div className="bg-[#0694A2]">
<Button className="bg-[#0694A2] hover:bg-[#0694A2]/90">
```

### Typography

**❌ DON'T:**
```tsx
// Arbitrary sizes
<h1 className="text-4xl">
<p className="text-base">
```

**✅ DO:**
```tsx
// Defined scale
<h1 className="text-[30px] leading-[36px] font-bold">
<p className="text-base leading-6">
```

### Spacing

**❌ DON'T:**
```tsx
// Arbitrary margins
<div className="mt-7 mb-5">
```

**✅ DO:**
```tsx
// Consistent spacing
<div className="space-y-6">
```

---

## 📱 Responsive Design

### Breakpoints

```
sm: 640px   - Small tablets
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
2xl: 1536px - Large desktops
```

### Mobile-First Approach

**DO:**
```tsx
// Start mobile, add desktop
<div className="px-4 sm:px-6 lg:px-8">
<h1 className="text-2xl md:text-3xl lg:text-[30px]">
```

**DON'T:**
```tsx
// Desktop-first (harder to maintain)
<div className="px-8 md:px-6 sm:px-4">
```

### Responsive Patterns

**Stack on Mobile, Row on Desktop**
```tsx
<div className="flex flex-col md:flex-row gap-4">
```

**Hide on Mobile**
```tsx
<div className="hidden md:block">
```

**Show Only on Mobile**
```tsx
<div className="block md:hidden">
```

---

## ✅ Checklist for New Features

Before building any new feature or page:

### Design
- [ ] Review this style guide
- [ ] Check for existing components to reuse
- [ ] Confirm colors match brand palette
- [ ] Verify typography scale is followed
- [ ] Ensure spacing is consistent

### Implementation
- [ ] Use teal (#0694A2) for primary actions
- [ ] Customize shadcn components (no black/white defaults)
- [ ] Add hover states to interactive elements
- [ ] Include loading states for async actions
- [ ] Add empty states for no data scenarios

### Responsive
- [ ] Test on mobile (320px minimum)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1280px+)
- [ ] Use mobile-first approach
- [ ] Verify touch targets (min 44px)

### Accessibility
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Labels for all form inputs
- [ ] Alt text for images

---

## 🔗 Quick Reference

### Most Used Classes

**Containers:**
```
max-w-[1280px] mx-auto px-6
```

**Cards:**
```
rounded-xl border bg-white p-6
```

**Buttons:**
```
bg-[#0694A2] hover:bg-[#0694A2]/90 text-white px-4 py-2 rounded-lg
```

**Headers:**
```
bg-[#114B5F] py-8
text-white font-bold text-[30px] leading-[36px]
```

**Spacing:**
```
space-y-6 (24px between sections)
gap-4 (16px between items)
p-6 (24px padding)
```

### Color Hex Codes

```
Teal Primary: #0694A2
Teal Light:   #D5F5F6
Dark Teal:    #114B5F
Black:        #0A0A0A
Gray-50:      #F9FAFB
Gray-500:     #6B7280
```

---

*This style guide should be referenced for ALL new features, pages, and components in the SkillSync main app. Consistency is key to a professional, polished user experience.*
