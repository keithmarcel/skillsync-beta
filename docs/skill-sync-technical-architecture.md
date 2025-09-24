# SkillSync Technical Architecture & Implementation Guide

## Overview

This document provides comprehensive technical documentation for the SkillSync application, covering architecture patterns, implementation details, and troubleshooting guides to prevent issues like the recent favoriting system problems.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema & Relationships](#database-schema--relationships)
3. [API Patterns & RPC Functions](#api-patterns--rpc-functions)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Authentication & Authorization](#authentication--authorization)
7. [Favoriting System Implementation](#favoriting-system-implementation)
8. [Admin Tools Architecture](#admin-tools-architecture)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Development Workflow](#development-workflow)

## Architecture Overview

### Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Radix UI components
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel/Netlify
- **Testing:** Vitest, Testing Library

### Application Structure

```
src/
├── app/                    # Next.js app router
│   ├── (main)/            # Main application routes
│   ├── admin/             # Admin panel routes
│   └── api/               # API routes (if any)
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix)
│   ├── admin/            # Admin-specific components
│   └── [feature]/        # Feature-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── database/         # Database queries & schemas
│   ├── supabase/         # Supabase configuration
│   └── [utility]/        # Other utilities
└── types/                 # TypeScript type definitions
```

## Database Schema & Relationships

### Core Tables

#### Jobs Table
```sql
jobs (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  job_kind job_kind NOT NULL, -- 'featured_role' | 'occupation'
  category text,
  soc_code text,
  company_id uuid REFERENCES companies(id),
  location_city text,
  location_state text,
  median_wage_usd numeric,
  long_desc text,
  featured_image_url text,
  skills_count integer,
  -- Extended fields for UI support
  education_requirements text,
  projected_open_positions integer,
  job_growth_outlook text,
  core_responsibilities jsonb,
  related_job_titles jsonb,
  proficiency_score integer,
  -- Pipeline integration fields
  onet_updated_at timestamp,
  bls_updated_at timestamp,
  data_source text DEFAULT 'manual',
  created_at timestamp,
  updated_at timestamp
)
```

#### Companies Table
```sql
companies (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  is_published boolean DEFAULT true,
  logo_url text,
  company_image text,
  hq_city text,
  hq_state text,
  revenue_range text,
  employee_range text,
  industry text,
  bio text,
  is_trusted_partner boolean DEFAULT false
)
```

#### Favorites Table
```sql
favorites (
  user_id uuid REFERENCES auth.users(id),
  entity_kind text NOT NULL, -- 'job' | 'program'
  entity_id uuid NOT NULL,
  created_at timestamp,
  PRIMARY KEY (user_id, entity_kind, entity_id)
)
```

### Job Kind Enum
```sql
CREATE TYPE job_kind AS ENUM ('featured_role', 'occupation');
```

### Key Relationships

1. **Jobs ↔ Companies:** Jobs can belong to companies (featured roles) or be standalone (occupations)
2. **Users ↔ Favorites:** Users can favorite both jobs and programs
3. **Jobs ↔ Skills:** Many-to-many relationship via job_skills table

## API Patterns & RPC Functions

### RPC Function Pattern

All database queries use Supabase RPC functions for security and performance:

```sql
-- RPC Function Template
CREATE OR REPLACE FUNCTION function_name()
RETURNS TABLE (...) -- Explicit return type
LANGUAGE sql
SECURITY DEFINER              -- Run with elevated privileges
SET search_path = public      -- Explicit schema
AS $$
  -- Query logic here
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION function_name() TO authenticated;
```

### Critical RPC Functions

#### get_favorite_jobs_with_company()
**Purpose:** Retrieve user's favorite jobs with company data
**Key Logic:**
```sql
SELECT j.*, row_to_json(c.*) as company
FROM jobs j
JOIN favorites f ON j.id = f.entity_id
LEFT JOIN companies c ON j.company_id = c.id
WHERE f.user_id = auth.uid()
  AND f.entity_kind = 'job'
  AND j.job_kind IN ('featured_role', 'occupation');
```

**Filtering Logic:** Allows jobs without companies (occupations) OR jobs from published companies

#### get_favorite_programs_with_school()
**Purpose:** Retrieve user's favorite programs with school data
**Pattern:** Similar to jobs but for programs table

## Component Architecture

### Component Organization

#### Page Components (`src/app/*/page.tsx`)
- Handle routing and data loading
- Use custom hooks for state management
- Render layout components

#### Feature Components (`src/components/[feature]/`)
- Self-contained feature logic
- Receive data via props
- Handle user interactions

#### UI Components (`src/components/ui/`)
- Reusable, stateless components
- Based on Radix UI primitives
- Consistent styling with Tailwind

### Data Flow Pattern

```
Page Component
├── Loads data (useEffect + hooks)
├── Manages local state
└── Renders Feature Components
    ├── Receive data via props
    ├── Handle user interactions
    └── Call action handlers
        └── Update global state via hooks
```

## State Management

### Hook-Based State Management

#### useFavorites Hook
**Location:** `src/hooks/useFavorites.ts`
**Purpose:** Centralized favoriting state management
**Pattern:**
```typescript
const useFavorites = () => {
  const [state, setState] = useState(initialState);

  const fetchFavorites = useCallback(async () => {
    // Data fetching logic
  }, []);

  const addFavorite = useCallback(async () => {
    // Add logic with error handling
  }, []);

  return { state, actions };
};
```

#### useEffect Dependencies
```typescript
useEffect(() => {
  if (user?.id) {
    fetchFavorites(user.id);
  }
}, [user?.id, fetchFavorites]); // Include all dependencies
```

### Data Fetching Pattern

```typescript
const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const data = await apiCall();
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}, []);
```

## Authentication & Authorization

### Supabase Auth Integration

#### Client-Side Auth
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();
```

#### Server-Side Auth
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function Page() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
}
```

### Row Level Security (RLS)

#### Favorites Table RLS
```sql
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Favoriting System Implementation

### Architecture

```
Database Layer
├── RPC Functions (get_favorite_jobs_with_company)
└── Table Structure (favorites, jobs, companies)

API Layer
├── Database Queries (getUserFavoriteJobs)
└── Filtering Logic (published companies + job types)

State Management
├── useFavorites Hook (centralized state)
└── Local State (loading, error, data)

UI Layer
├── Page Components (jobs/programs pages)
├── Data Tables (sorting, filtering)
└── Action Handlers (add/remove favorites)
```

### Critical Filtering Logic

**The Issue:** High-demand occupations were filtered out because they have no company
**The Fix:** Allow jobs without companies OR jobs from published companies

```typescript
const publishedJobs = data?.filter((job: Job) => {
  // Allow high-demand occupations (no company) or jobs from published companies
  return !job.company_id || job.company?.is_published;
}) || [];
```

### Job Type Handling

```typescript
// Featured Roles: Have companies, need category mapping
if (job.job_kind === 'featured_role') {
  category = getProperCategory(job);
}

// Occupations: No company, use database category
return job.category || 'General';
```

## Admin Tools Architecture

### Route Structure

```
src/app/admin/
├── layout.tsx              # Admin layout with navigation
├── page.tsx               # Admin dashboard
├── companies/             # Company management
├── occupations/           # Occupation management
├── programs/              # Program management
├── roles/                 # Featured role management
├── users/                 # User management
├── analytics/             # Analytics dashboard
└── settings/              # System settings
```

### Component Patterns

#### Entity Management Pages
```typescript
// Pattern for CRUD pages
export default function EntityPage() {
  const { data, loading } = useAdminEntity();

  return (
    <AdminLayout>
      <EntityTable
        data={data}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </AdminLayout>
  );
}
```

#### Admin Hooks Pattern

```typescript
const useAdminEntity = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    // API calls with error handling
  }, []);

  const createEntity = useCallback(async (data) => {
    // Create logic
  }, []);

  return { data, loading, actions };
};
```

## Common Issues & Solutions

### Favoriting System Issues

#### Issue: High-demand occupations not showing in favorites
**Root Cause:** Filtering logic excluded jobs without companies
**Solution:** Update filtering to allow `!job.company_id || job.company?.is_published`
**Prevention:** Test both job types when implementing filtering

#### Issue: RPC function fails with "Failed to fetch"
**Root Cause:** Network issues or incorrect environment configuration
**Solution:** Verify Supabase URL/keys, check network connectivity
**Prevention:** Always test RPC functions directly in Supabase dashboard

### Job Details Page Issues

#### Issue: Missing data fields for occupations vs featured roles
**Root Cause:** Database schema didn't support all required UI fields
**Solution:** Extended jobs table with occupation-specific fields (projected_open_positions, job_growth_outlook, education_requirements, core_responsibilities, related_job_titles)
**Prevention:** Always verify schema supports all UI requirements before implementation

#### Issue: Favoriting button not updating state
**Root Cause:** Missing proper state management integration
**Solution:** Use existing useFavorites hook with proper isFavorite checking and add/remove actions
**Prevention:** Always integrate with existing state management patterns

### Database Schema Issues

#### Issue: Column doesn't exist errors
**Root Cause:** Schema assumptions without verification
**Solution:** Always check `information_schema.columns` before migrations
**Prevention:** Use schema verification queries in all migrations

### Authentication Issues

#### Issue: RLS policies blocking legitimate access
**Root Cause:** Overly restrictive policies
**Solution:** Review and test RLS policies with different user roles
**Prevention:** Include auth testing in development workflow

### Component State Issues

#### Issue: Stale data after mutations
**Root Cause:** Missing dependency arrays in useEffect/useCallback
**Solution:** Include all dependencies and use proper memoization
**Prevention:** ESLint rules for exhaustive-deps

## Development Workflow

### Feature Development Process

1. **Planning**
   - Create feature branch from main
   - Document requirements and edge cases

2. **Implementation**
   - Follow established patterns
   - Test incrementally
   - Update documentation

3. **Testing**
   - Unit tests for utilities
   - Integration tests for features
   - Manual testing for UI flows

4. **Code Review**
   - Self-review against patterns
   - Update this documentation if needed

5. **Merge Process**
   - Create backup branches
   - Test merge locally
   - Push with comprehensive commit messages

### Code Quality Standards

#### Naming Conventions
- **Components:** PascalCase (UserProfile, DataTable)
- **Hooks:** camelCase with 'use' prefix (useFavorites)
- **Functions:** camelCase (getUserFavoriteJobs)
- **Files:** kebab-case (user-profile.tsx)

#### Error Handling
```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('User-friendly message');
}
```

#### Database Queries
- Always use RPC functions for security
- Include proper error handling
- Test queries in Supabase dashboard first

#### Component Props
```typescript
interface ComponentProps {
  requiredProp: string;
  optionalProp?: number;
  onAction: (data: DataType) => void;
}
```

## Troubleshooting Checklist

### When Favoriting Doesn't Work

1. **Check Console:** Any "Failed to fetch" errors?
2. **Verify RPC:** Test function directly in Supabase dashboard
3. **Check Filtering:** Does the job have a company? Is it published?
4. **Review State:** Is useFavorites hook updating correctly?
5. **Test Network:** Can you add favorites (INSERT works)?

### When Admin Tools Break

1. **Check Auth:** Is user properly authenticated as admin?
2. **Verify RLS:** Do policies allow the operation?
3. **Test API:** Can you perform the operation directly?
4. **Check Hooks:** Are admin hooks loading data correctly?

### When Components Don't Render

1. **Check Props:** Are all required props provided?
2. **Verify State:** Is loading/error state handled?
3. **Test Data:** Does the data match expected structure?
4. **Check Dependencies:** Any missing useEffect dependencies?

## Migration Safety

### Database Migration Pattern

```sql
-- Safe migration template
BEGIN;

-- Check if already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM migrations WHERE name = 'migration_name') THEN
    RAISE NOTICE 'Migration already executed';
    RETURN;
  END IF;

  -- Migration logic here
  -- ALTER TABLE, CREATE FUNCTION, etc.

  -- Record completion
  INSERT INTO migrations (name) VALUES ('migration_name');
END $$;

COMMIT;
```

### Rollback Procedures

1. **Code Rollback:** `git reset --hard <commit>`
2. **Database Rollback:** Create reverse migration
3. **Data Recovery:** Restore from backups if needed

## Performance Considerations

### Database Optimization

- Use indexes on frequently queried columns
- Prefer RPC functions over client-side filtering
- Implement pagination for large datasets

### Frontend Optimization

- Use React.memo for expensive components
- Implement proper loading states
- Debounce search inputs
- Use virtualization for large lists

## Security Best Practices

### Authentication
- Always verify user sessions server-side
- Use RLS policies for data access control
- Implement proper session management

### Data Validation
- Validate inputs on both client and server
- Use TypeScript for type safety
- Sanitize user-generated content

### API Security
- Use RPC functions instead of direct table access
- Implement rate limiting where appropriate
- Log security-relevant events

---

## Quick Reference

### Most Common Issues

1. **Favoriting not working:** Check filtering logic allows jobs without companies
2. **Admin access denied:** Verify RLS policies and user roles
3. **Data not loading:** Check RPC functions and network connectivity
4. **Components not rendering:** Verify props and state management

### Key Files to Check

- `src/lib/database/queries.ts` - Database operations
- `src/hooks/useFavorites.ts` - State management
- `src/app/(main)/jobs/page.tsx` - Main UI logic
- Database migrations in `database/migrations/`

### Emergency Contacts

- Check recent commits for similar issues
- Review this document for known solutions
- Test RPC functions directly in Supabase dashboard

This guide should prevent the need to "start from scratch" when investigating future issues. Always update this document when implementing new patterns or discovering new issues.
