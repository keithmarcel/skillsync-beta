# SkillSync Component Library Documentation

## UI Components Overview

### Core Layout Components

#### **PageHeader** (`/src/components/ui/page-header.tsx`)
**Purpose**: Standardized page header with dynamic content support
**Usage**: Main header for all pages with title, breadcrumbs, and action buttons

```typescript
interface PageHeaderProps {
  variant: 'default' | 'split'
  isDynamic?: boolean
  userName?: string
  isReturningUser?: boolean
  title?: string
  subtitle?: string
  showFavoriteButton?: boolean
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  breadcrumbs?: BreadcrumbItem[]
  assessmentSteps?: AssessmentStep[]
}
```

**Key Features**:
- Dynamic greeting based on user status
- Favorite button with heart icon (rose-500 when active)
- Secondary action button (teal-100 outline)
- Breadcrumb integration
- Assessment stepper integration
- Responsive design

**Design Specs**:
- Max 2 buttons (favorite + secondary action)
- Teal color scheme (#0694A2)
- Container: `max-w-[1280px] mx-auto px-6`

---

#### **StickyTabs** (`/src/components/ui/sticky-tabs.tsx`)
**Purpose**: Reusable sticky tab navigation component
**Usage**: Tabbed navigation that sticks below navbar

```typescript
interface StickyTabsProps {
  tabs: Array<{
    id: string
    label: string
    isActive: boolean
  }>
  onTabChange: (tabId: string) => void
  className?: string
}
```

**Key Features**:
- 24px padding above and below tabs
- Sticky positioning (`top-16 sm:top-24 z-40`)
- Teal active state styling (#0694A2)
- Background matches page color (bg-gray-50)
- Border-bottom separation
- Responsive container width

---

#### **BreadcrumbLayout** (`/src/components/ui/breadcrumb-layout.tsx`)
**Purpose**: Consistent spacing wrapper for pages with breadcrumbs
**Usage**: Wraps page content with standardized breadcrumb spacing

```typescript
interface BreadcrumbLayoutProps {
  items: BreadcrumbItem[]
  children: React.ReactNode
}
```

**Spacing Standards**:
- 40px below PageHeader
- 40px below breadcrumbs
- Separator line (hr)
- 40px below separator
- Content wrapped in `max-w-[1280px]` container

---

### Navigation Components

#### **Navbar** (`/src/components/navbar.tsx`)
**Purpose**: Main application navigation with desktop and mobile variants
**Usage**: Global navigation component

**Desktop Features**:
- Logo and navigation links
- User menu with dropdown
- Give Feedback button

**Mobile Features**:
- Hamburger menu (h-8 icon)
- Bottom sheet drawer (80vh height)
- Navigation links with icons
- Quick actions section
- User info display
- Account actions

**Key Styling**:
- Logo: h-10 (increased from default)
- Hamburger: h-8 (increased from default)
- Drawer: rounded-t-2xl, 80vh height
- Teal active states (#0694A2)

---

#### **UserMenu** (`/src/components/ui/user-menu.tsx`)
**Purpose**: User account dropdown menu
**Usage**: Integrated into navbar for user actions

**Features**:
- User avatar and info display
- Account management links
- Sign out functionality
- Dropdown positioning

---

### Form & Dialog Components

#### **GiveFeedbackDialog** (`/src/components/ui/give-feedback-dialog.tsx`)
**Purpose**: User feedback collection modal
**Usage**: Feedback submission with emoji sentiment selection

```typescript
interface GiveFeedbackDialogProps {
  children?: React.ReactNode
  triggerClassName?: string
}
```

**Features**:
- Emoji sentiment selection (😍 😐 😟)
- Optional text feedback
- Loading states with spinner
- Success/error handling
- Mobile responsive (max-w-95vw)
- Smaller emoji buttons on mobile (w-16 h-16)

**States**:
- `idle` - Default form state
- `submitting` - Loading with spinner
- `success` - Success message with checkmark
- `error` - Error message with retry

---

### Data Display Components

#### **SkillSyncSnapshot** (`/src/components/ui/skillsync-snapshot.tsx`)
**Purpose**: Dashboard metrics and skills visualization
**Usage**: Display user progress and skill proficiency

```typescript
interface SkillSyncSnapshotProps {
  hasAssessments: boolean
  metrics?: {
    rolesReadyFor: number
    overallRoleReadiness: number
    skillsIdentified: number
    gapsHighlighted: number
  }
  skillData?: {
    proficient: number
    building: number
    needsDevelopment: number
  }
}
```

**Features**:
- Empty state for new users
- Metrics cards with progress indicators
- Skills proficiency chart
- Responsive grid layout

---

#### **AssessmentStepper** (`/src/components/ui/assessment-stepper.tsx`)
**Purpose**: Assessment progress visualization
**Usage**: Shows user progress through assessment flow

```typescript
interface AssessmentStepperProps {
  steps: Array<{
    id: string
    label: string
    status: 'completed' | 'current' | 'upcoming'
  }>
}
```

**Features**:
- Circular progress indicators
- Connected step flow
- Status-based styling
- Responsive design

---

### Utility Components

#### **Breadcrumb** (`/src/components/ui/breadcrumb.tsx`)
**Purpose**: Navigation breadcrumb trail
**Usage**: Page hierarchy navigation

```typescript
interface BreadcrumbProps {
  items: Array<{
    label: string
    href?: string
  }>
}
```

**Features**:
- ChevronRight separators
- Teal-100 styling
- Hover states
- Last item non-clickable

---

## Shadcn/UI Base Components

### Form Controls
- **Button** - Primary, secondary, outline, ghost variants
- **Input** - Text input with focus states
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection
- **Label** - Form field labels

### Layout
- **Card** - Content containers with header/content/footer
- **Separator** - Horizontal dividers
- **Sheet** - Slide-out panels (mobile drawer)
- **Dialog** - Modal overlays
- **Tabs** - Tab navigation (different from StickyTabs)

### Data Display
- **Table** - Data tables with header/body/row/cell
- **Badge** - Status indicators and tags
- **Avatar** - User profile images
- **Progress** - Progress bars and indicators

### Feedback
- **Alert** - Status messages
- **Toast** - Notification system
- **Dropdown Menu** - Context menus

## Design System Standards

### Colors
```css
/* Primary Teal */
--primary: #0694A2
--primary-hover: #047481
--primary-light: #D5F5F6 /* teal-100 for outlines */

/* Secondary */
--secondary: #114B5F /* Header blue */

/* Status Colors */
--success: #10B981
--error: #EF4444
--warning: #F59E0B
--info: #3B82F6

/* Grays */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-600: #4B5563
--gray-900: #111827
```

### Typography
```css
/* Headers */
.text-3xl { font-size: 1.875rem; } /* Page titles */
.text-lg { font-size: 1.125rem; }  /* Card titles */
.text-sm { font-size: 0.875rem; }  /* Body text */
.text-xs { font-size: 0.75rem; }   /* Captions */

/* Weights */
.font-bold { font-weight: 700; }     /* Page titles */
.font-semibold { font-weight: 600; } /* Section headers */
.font-medium { font-weight: 500; }   /* Card titles */
```

### Spacing
```css
/* Container */
.container-standard { 
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Vertical Spacing */
.section-gap { margin-bottom: 40px; }
.card-gap { gap: 24px; }
.content-gap { gap: 16px; }
```

### Responsive Breakpoints
```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

## Component Usage Guidelines

### Do's
- Use consistent spacing with design system utilities
- Follow established color patterns (teal primary, gray neutrals)
- Implement proper TypeScript interfaces
- Include loading and error states
- Make components responsive by default
- Use semantic HTML elements

### Don'ts
- Don't hardcode colors - use design tokens
- Don't create components with more than 2 action buttons
- Don't mix styling approaches (stay with Tailwind)
- Don't forget accessibility attributes
- Don't create overly complex prop interfaces

### Component Composition
```typescript
// Good: Composable components
<PageHeader title="Jobs" showFavoriteButton>
  <StickyTabs tabs={jobTabs} onTabChange={handleTabChange} />
</PageHeader>

// Bad: Monolithic components
<JobsPageWithEverything />
```

### State Management
```typescript
// Good: Focused component state
const [isOpen, setIsOpen] = useState(false)

// Bad: Complex state in UI components
const [jobs, setJobs] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
// Business logic should be in custom hooks or context
```

## Missing Components (Opportunities)

### High Priority
1. **ListCard** - Standardize job/program listing cards
2. **DataTable** - Reusable table with sorting/filtering
3. **LoadingState** - Consistent loading indicators
4. **ErrorBoundary** - Error handling wrapper
5. **SearchFilter** - Standardized search/filter UI

### Medium Priority
1. **ActionCard** - Dashboard action cards
2. **MetricCard** - Statistics display cards
3. **SkillBadge** - Skill proficiency indicators
4. **StatusIndicator** - Assessment/job status badges
5. **EmptyState** - No data placeholders

### Component Extraction Candidates
- Job listing cards (repeated 3+ times)
- Program listing cards (repeated 3+ times)
- Assessment question components
- User profile sections
- Navigation menu items
