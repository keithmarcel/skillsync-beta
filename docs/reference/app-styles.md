# SkillSync App Styles Documentation

## Design System Overview

### Color Palette

#### Primary Colors
```css
/* Teal - Primary Brand Color */
--teal-primary: #0694A2;
--teal-hover: #047481;
--teal-light: #D5F5F6;    /* teal-100 for outlines */
--teal-dark: #0F766E;

/* Blue - Secondary/Header Color */
--blue-header: #114B5F;
--blue-light: #E0F2FE;
```

#### Status Colors
```css
--success: #10B981;       /* green-500 */
--success-light: #D1FAE5; /* green-100 */

--error: #EF4444;         /* red-500 */
--error-light: #FEE2E2;   /* red-100 */

--warning: #F59E0B;       /* amber-500 */
--warning-light: #FEF3C7; /* amber-100 */

--info: #3B82F6;          /* blue-500 */
--info-light: #DBEAFE;    /* blue-100 */

--rose: #F43F5E;          /* rose-500 for favorites */
--rose-light: #FFE4E6;    /* rose-100 */
```

#### Neutral Grays
```css
--gray-50: #F9FAFB;       /* Page backgrounds */
--gray-100: #F3F4F6;      /* Card backgrounds */
--gray-200: #E5E7EB;      /* Borders, separators */
--gray-300: #D1D5DB;      /* Disabled states */
--gray-400: #9CA3AF;      /* Placeholder text */
--gray-500: #6B7280;      /* Secondary text */
--gray-600: #4B5563;      /* Body text */
--gray-700: #374151;      /* Headings */
--gray-800: #1F2937;      /* Dark headings */
--gray-900: #111827;      /* Primary text */
```

### Typography Scale

#### Font Sizes
```css
/* Display & Headers */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }    /* 36px - Hero titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }  /* 30px - Page titles */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }       /* 24px - Section headers */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }    /* 20px - Card headers */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }   /* 18px - Large body */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* 16px - Default body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }   /* 14px - Small body */
.text-xs { font-size: 0.75rem; line-height: 1rem; }       /* 12px - Captions */
```

#### Font Weights
```css
.font-light { font-weight: 300; }     /* Light text */
.font-normal { font-weight: 400; }    /* Default body */
.font-medium { font-weight: 500; }    /* Card titles, buttons */
.font-semibold { font-weight: 600; }  /* Section headers */
.font-bold { font-weight: 700; }      /* Page titles, emphasis */
.font-extrabold { font-weight: 800; } /* Hero text */
```

### Spacing System

#### Container & Layout
```css
/* Main Container */
.container-standard {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px; /* px-6 */
}

/* Page Sections */
.section-spacing { margin-bottom: 40px; }    /* py-10 equivalent */
.card-spacing { gap: 24px; }                 /* gap-6 */
.content-spacing { gap: 16px; }              /* gap-4 */
.tight-spacing { gap: 12px; }                /* gap-3 */
```

#### Padding Standards
```css
/* Card Padding */
.card-padding { padding: 24px; }             /* p-6 */
.card-header-padding { padding: 20px 24px; } /* px-6 py-5 */
.card-content-padding { padding: 0 24px 24px; } /* px-6 pb-6 */

/* Button Padding */
.btn-sm-padding { padding: 8px 12px; }       /* px-3 py-2 */
.btn-md-padding { padding: 10px 16px; }      /* px-4 py-2.5 */
.btn-lg-padding { padding: 12px 20px; }      /* px-5 py-3 */
```

#### Margin Standards
```css
/* Vertical Spacing */
.mb-section { margin-bottom: 40px; }         /* mb-10 */
.mb-card { margin-bottom: 24px; }            /* mb-6 */
.mb-content { margin-bottom: 16px; }         /* mb-4 */
.mb-tight { margin-bottom: 12px; }           /* mb-3 */
```

### Component Styles

#### Button Variants
```css
/* Primary Button */
.btn-primary {
  background-color: #0694A2;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;
}
.btn-primary:hover {
  background-color: #047481;
}

/* Secondary Button */
.btn-secondary {
  background-color: white;
  color: #0694A2;
  border: 1px solid #D5F5F6;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background-color: #D5F5F6;
  border-color: #0694A2;
}

/* Outline Button */
.btn-outline {
  background-color: transparent;
  color: #4B5563;
  border: 1px solid #E5E7EB;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-outline:hover {
  background-color: #F9FAFB;
  border-color: #D1D5DB;
}

/* Ghost Button */
.btn-ghost {
  background-color: transparent;
  color: #0694A2;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;
}
.btn-ghost:hover {
  background-color: #D5F5F6;
}
```

#### Card Styles
```css
/* Standard Card */
.card-standard {
  background-color: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}
.card-standard:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Teal Action Card */
.card-teal {
  background-color: #0694A2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 24px;
}
.card-teal .text-secondary {
  color: #B2F5EA; /* teal-200 equivalent */
}
```

#### Form Elements
```css
/* Input Fields */
.input-standard {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-standard:focus {
  outline: none;
  border-color: #0694A2;
  box-shadow: 0 0 0 3px rgba(6, 148, 162, 0.1);
}

/* Textarea */
.textarea-standard {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.textarea-standard:focus {
  outline: none;
  border-color: #0694A2;
  box-shadow: 0 0 0 3px rgba(6, 148, 162, 0.1);
}
```

### Navigation Styles

#### Navbar
```css
/* Desktop Navbar */
.navbar-desktop {
  background-color: white;
  border-bottom: 1px solid #E5E7EB;
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 50;
}

/* Mobile Navbar */
.navbar-mobile {
  background-color: white;
  border-bottom: 1px solid #E5E7EB;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

/* Logo Sizing */
.logo-desktop { height: 40px; }    /* h-10 */
.logo-mobile { height: 40px; }     /* h-10 */

/* Hamburger Menu */
.hamburger-icon { height: 32px; }  /* h-8 */
```

#### Navigation Links
```css
/* Desktop Nav Links */
.nav-link {
  color: #4B5563;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-link:hover {
  color: #0694A2;
  background-color: #D5F5F6;
}
.nav-link.active {
  color: #0694A2;
  background-color: #D5F5F6;
}

/* Mobile Drawer Links */
.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #4B5563;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
  text-decoration: none;
}
.mobile-nav-link:hover {
  color: #0694A2;
  background-color: #D5F5F6;
}
```

#### Tabs
```css
/* Sticky Tabs */
.sticky-tabs {
  background-color: #F9FAFB;
  position: sticky;
  top: 64px; /* Below navbar */
  z-index: 40;
  border-bottom: 1px solid #E5E7EB;
}

/* Tab Button */
.tab-button {
  padding: 8px 4px;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  font-size: 14px;
  color: #6B7280;
  transition: all 0.2s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}
.tab-button:hover {
  color: #374151;
  border-bottom-color: #D1D5DB;
}
.tab-button.active {
  color: #0694A2;
  border-bottom-color: #0694A2;
}
```

### Badge & Status Styles

#### Badges
```css
/* Default Badge */
.badge-default {
  background-color: #F3F4F6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* Success Badge */
.badge-success {
  background-color: #D1FAE5;
  color: #065F46;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* Warning Badge */
.badge-warning {
  background-color: #FEF3C7;
  color: #92400E;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* Error Badge */
.badge-error {
  background-color: #FEE2E2;
  color: #991B1B;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* Teal Badge */
.badge-teal {
  background-color: #D5F5F6;
  color: #0F766E;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
```

### Responsive Design

#### Breakpoints
```css
/* Mobile First Approach */
/* Default: Mobile (320px+) */

@media (min-width: 640px) {  /* sm: Small tablets */
  .container-standard { padding: 0 32px; }
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 768px) {  /* md: Tablets */
  .card-grid { grid-template-columns: repeat(3, 1fr); }
  .navbar-mobile { display: none; }
  .navbar-desktop { display: block; }
}

@media (min-width: 1024px) { /* lg: Laptops */
  .container-standard { padding: 0 48px; }
  .sidebar { display: block; }
}

@media (min-width: 1280px) { /* xl: Desktops */
  .container-standard { padding: 0 24px; }
}
```

#### Mobile Adjustments
```css
/* Mobile Navbar Adjustments */
@media (max-width: 767px) {
  .main-content { padding-top: 48px; }    /* pt-12 */
  .sticky-tabs { top: 64px; }             /* top-16 */
  
  /* Mobile Dialog */
  .dialog-mobile {
    max-width: 95vw;
    margin: 0 auto;
  }
  
  /* Mobile Buttons */
  .btn-mobile {
    width: 64px;  /* w-16 */
    height: 64px; /* h-16 */
  }
}

/* Desktop Adjustments */
@media (min-width: 768px) {
  .main-content { padding-top: 96px; }    /* pt-24 */
  .sticky-tabs { top: 96px; }             /* top-24 */
}
```

### Animation & Transitions

#### Standard Transitions
```css
/* Default Transition */
.transition-default {
  transition: all 0.2s ease-in-out;
}

/* Color Transitions */
.transition-colors {
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

/* Transform Transitions */
.transition-transform {
  transition: transform 0.2s ease-in-out;
}

/* Hover Transforms */
.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-scale:hover {
  transform: scale(1.02);
}
```

#### Loading Animations
```css
/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #E5E7EB;
  border-top: 2px solid #0694A2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Pulse Animation */
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Accessibility Styles

#### Focus States
```css
/* Focus Ring */
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(6, 148, 162, 0.3);
  border-radius: 6px;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #0694A2;
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 100;
}
.skip-link:focus {
  top: 6px;
}
```

#### Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Style Usage Guidelines

### Color Usage
- **Primary Teal (#0694A2)**: Main actions, active states, links
- **Secondary Blue (#114B5F)**: Headers, secondary actions
- **Gray Scale**: Text hierarchy, backgrounds, borders
- **Status Colors**: Success/error/warning feedback
- **Rose (#F43F5E)**: Favorites, love actions

### Typography Hierarchy
1. **Page Titles**: text-3xl, font-bold, text-gray-900
2. **Section Headers**: text-xl, font-semibold, text-gray-800
3. **Card Titles**: text-lg, font-medium, text-gray-900
4. **Body Text**: text-sm, font-normal, text-gray-600
5. **Captions**: text-xs, font-normal, text-gray-500

### Spacing Consistency
- Use 24px (gap-6) for card spacing
- Use 16px (gap-4) for content spacing
- Use 40px (py-10) for section spacing
- Maintain 1280px max-width containers

### Component States
- **Default**: Base styling
- **Hover**: Subtle color/shadow changes
- **Active**: Teal color scheme
- **Disabled**: Gray-300 colors, reduced opacity
- **Loading**: Spinner or skeleton states
- **Error**: Red color scheme with clear messaging
