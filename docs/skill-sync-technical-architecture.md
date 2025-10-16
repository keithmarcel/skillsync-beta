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
7. [Employer Invitations System](#employer-invitations-system)
8. [Skills Taxonomy & O*NET Integration](#skills-taxonomy--onet-integration)
9. [Assessment Weighting System](#assessment-weighting-system)
10. [API Ecosystem Integration](#api-ecosystem-integration)
11. [Intelligent Caching System](#intelligent-caching-system)
12. [Admin Tools Architecture](#admin-tools-architecture)
13. [AI Content Generation System](#ai-content-generation-system)
14. [Quiz Generation & Assessment](#quiz-generation--assessment)
15. [Common Issues & Solutions](#common-issues--solutions)
16. [Development Workflow](#development-workflow)

## Architecture Overview

### Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Radix UI components
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API Integrations:** BLS API, CareerOneStop API, O*NET API, Lightcast API
- **Caching:** Intelligent TTL-based caching with PostgreSQL
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
│   ├── services/         # API integration services
│   │   ├── bls-api.ts           # BLS API integration
│   │   ├── careeronestop-api.ts # CareerOneStop API integration
│   │   └── occupation-enrichment.ts # Orchestration service
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
  status text DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
  is_featured boolean DEFAULT false,
  -- Government data fields (from O*NET/BLS)
  employment_outlook text,
  education_level text,
  work_experience text,
  on_job_training text,
  job_openings_annual integer,
  growth_rate_percent numeric,
  required_proficiency_pct numeric,
  -- Company-specific fields for featured roles (Phase 5)
  core_responsibilities text,
  growth_opportunities text,
  team_structure text,
  work_environment text CHECK (work_environment IN ('office', 'remote', 'hybrid', 'field', 'mixed')),
  travel_requirements text CHECK (travel_requirements IN ('none', 'minimal', 'occasional', 'frequent', 'extensive')),
  performance_metrics text,
  training_provided text,
  -- Timestamps
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
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
favorites (
  user_id uuid REFERENCES auth.users(id),
  entity_kind text NOT NULL, -- 'job' | 'program'
  entity_id uuid NOT NULL,
  created_at timestamp DEFAULT NOW(),
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

## Employer Invitations System

### Overview

The Employer Invitations System is a comprehensive two-way invitation platform enabling employers to invite qualified candidates to apply for featured roles, and candidates to manage their invitations. This system includes automatic candidate discovery, role-based access control, and comprehensive status tracking.

**Status:** ✅ Candidate UI Complete | ⏸️ Employer UI On Hold

### Architecture Components

#### 1. Database Schema

**employer_invitations Table:**
```sql
CREATE TABLE employer_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  job_id UUID REFERENCES jobs(id) NOT NULL,
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  proficiency_pct NUMERIC NOT NULL,
  application_url TEXT NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  is_read BOOLEAN DEFAULT false,
  invited_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_by VARCHAR(20) CHECK (archived_by IN ('employer', 'candidate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);
```

**Jobs Table Extensions:**
```sql
ALTER TABLE jobs
ADD COLUMN required_proficiency_pct NUMERIC DEFAULT 90,
ADD COLUMN visibility_threshold_pct NUMERIC DEFAULT 85,
ADD COLUMN application_url TEXT;
```

#### 2. Auto-Population System

**Trigger:** Automatically populates qualified candidates when assessments are completed

```sql
CREATE OR REPLACE FUNCTION auto_populate_employer_candidates()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if assessment has readiness_pct and job_id
  IF NEW.readiness_pct IS NOT NULL AND NEW.job_id IS NOT NULL THEN
    -- Get job details
    SELECT company_id, visibility_threshold_pct, application_url
    INTO job_company, threshold, app_url
    FROM jobs WHERE id = NEW.job_id AND job_kind = 'featured_role';
    
    -- If candidate meets threshold, create invitation
    IF NEW.readiness_pct >= threshold THEN
      INSERT INTO employer_invitations (
        user_id, company_id, job_id, assessment_id,
        proficiency_pct, application_url, status
      ) VALUES (
        NEW.user_id, job_company, NEW.job_id, NEW.id,
        NEW.readiness_pct, app_url, 'pending'
      )
      ON CONFLICT (user_id, job_id) 
      DO UPDATE SET proficiency_pct = EXCLUDED.proficiency_pct
      WHERE employer_invitations.proficiency_pct < EXCLUDED.proficiency_pct;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Status Flow

**Candidate View:**
- `sent` → "View Application" button (pending action)
- `applied` → "Applied" badge (marked as applied)
- `declined` → "Declined" badge (declined invitation)
- `archived` → Moved to Archived tab

**Employer View (Ready for Implementation):**
- `pending` → "Invite to Apply" button (qualified, not invited)
- `sent` → "Invite Sent" badge (awaiting response)
- `applied` → "Candidate Applied" badge
- `declined` → "Declined" badge
- `hired` → "Hired" badge
- `unqualified` → "Unqualified" badge
- `archived` → Moved to Archived tab

#### 4. RLS Policies

**Candidates:**
```sql
CREATE POLICY "Users can view own invitations"
ON employer_invitations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own invitations"
ON employer_invitations FOR UPDATE
USING (auth.uid() = user_id);
```

**Employer Admins:**
```sql
CREATE POLICY "Employers can view their company invitations"
ON employer_invitations FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Employers can create invitations"
ON employer_invitations FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

### Service Layer

**Location:** `src/lib/services/employer-invitations.ts`

**Key Functions:**

```typescript
// Candidate Side
export async function getUserInvitations(): Promise<EmployerInvitation[]>
export async function getUserArchivedInvitations(): Promise<EmployerInvitation[]>
export async function markInvitationAsViewed(invitationId: string): Promise<void>
export async function markInvitationAsApplied(invitationId: string): Promise<void>
export async function markInvitationAsDeclined(invitationId: string): Promise<void>
export async function archiveInvitation(invitationId: string): Promise<void>
export async function reopenInvitation(invitationId: string): Promise<void>

// Notification Functions
export async function getRecentInvitations(limit: number): Promise<EmployerInvitation[]>
export async function getUnreadInvitationCount(): Promise<number>
export async function markAllInvitationsAsRead(): Promise<void>

// Employer Side (Ready for UI)
export async function getQualifiedCandidates(filters?: object): Promise<EmployerInvitation[]>
export async function sendInvitation(invitationId: string, message?: string): Promise<void>
export async function markCandidateAsHired(invitationId: string): Promise<void>
export async function markCandidateAsUnqualified(invitationId: string): Promise<void>
```

### UI Components

#### 1. Invitations Page (`/invitations`)

**Features:**
- Active and Archived tabs with URL routing
- Search by company name or role title
- Filter by readiness (Ready, Building Skills) and status
- Bulk actions with multi-select
- Company logos (96px × 96px) in dedicated column
- Consistent status badge sizing

**Component Structure:**
```
src/app/(main)/invitations/
└── page.tsx

src/components/invitations/
├── invitations-table.tsx
├── invitation-row.tsx
├── invitation-filters.tsx
└── bulk-actions-dropdown.tsx
```

#### 2. Notification Dropdown (Navbar)

**Features:**
- Bell icon with unread count badge
- Shows recent 5 invitations
- Figma-matched design (472px width, exact spacing/colors)
- Light gray hover states
- Mark all as read functionality
- Auto-refresh every 30 seconds

**Component Structure:**
```
src/components/ui/
├── notification-dropdown.tsx
└── notification-item.tsx
```

**Design Specifications:**
- Width: 472px
- Padding: 4px with 8px gap

### Invitations V2 Refactor (October 2025)

**Status:** ✅ Complete  
**Documentation:** [INVITATIONS_V2_REFACTOR_COMPLETE.md](./features/INVITATIONS_V2_REFACTOR_COMPLETE.md)

#### Overview
Complete refactor of both employer and job seeker invitation management systems using unified DataTable architecture, proper tab patterns, and consistent UI/UX.

#### Key Improvements

**1. Unified DataTable Architecture**
- Migrated to shared `DataTable` component for consistency
- Created reusable table configurations:
  - `/src/lib/employer-invites-table-config.tsx`
  - `/src/lib/job-seeker-invites-table-config.tsx`
- Eliminated duplicate table implementations

**2. Tab Pattern Standardization**
- **Primary Tabs (StickyTabs)**: Main page navigation, URL-synced
- **Secondary Tabs (shadcn Tabs)**: Sub-content, pill/button style
- Proper visual hierarchy and consistent patterns

**3. Proficiency & Readiness System**
- Combined badges: "Ready | 92%" or "Almost There | 88%"
- Renamed "Building Skills" → "Almost There" across entire codebase
- Centralized logic in `/src/lib/utils/proficiency-helpers.ts`:
  ```typescript
  export function isReady(proficiency: number, requiredProficiency: number = 90): boolean
  export function isAlmostThere(proficiency: number, requiredProficiency: number = 90): boolean
  export function isTopPerformer(proficiency: number, requiredProficiency: number = 90): boolean
  export function getReadinessLabel(proficiency: number, requiredProficiency: number = 90): 'Ready' | 'Almost There'
  export function getProficiencyStatus(proficiency: number, requiredProficiency: number = 90)
  ```

**4. Loading States Optimization**
- Removed skeleton loading on tab switches
- Descriptive loading text with diamond loader
- Consistent `LoadingSpinner` usage

**5. Filter & Search Improvements**
- Context-aware search placeholders
- Fixed Role Readiness filter (proficiency_pct column)
- Status filter mapping ("Position Filled" → unqualified, "Pending" → sent/pending)

**6. Archived Status Handling**
- Shows `status_before_archive` when available
- Falls back to "Archived" badge
- Consistent across both employer and job seeker tables

#### Component Architecture

```
src/
├── lib/
│   ├── employer-invites-table-config.tsx        # Employer table config
│   ├── job-seeker-invites-table-config.tsx      # Job seeker table config
│   └── utils/
│       └── proficiency-helpers.ts                # Centralized proficiency logic
├── components/
│   ├── employer/
│   │   └── employer-invites-table-v2.tsx        # Uses DataTable
│   └── ui/
│       └── data-table.tsx                        # Shared table component
└── app/(main)/
    ├── employer/page.tsx                        # Employer dashboard
    └── invitations/page.tsx                     # Job seeker invitations
```

#### Status Flow (Updated)

**Job Seeker:**
```
sent/pending → View Application button (teal)
applied → Applied badge (teal) with checkmark
declined → Declined badge (red) with X
hired → Hired badge (green) with checkmark
unqualified → Position Filled badge (gray)
archived → Shows status_before_archive or "Archived"
```

**Employer:**
```
pending → Invite to Apply button (teal)
sent → Invite Sent badge (gray)
applied → Applied badge (teal) with checkmark
declined → Declined badge (red) with X
hired → Hired badge (purple)
unqualified → Unqualified badge (white with border)
archived → Shows status_before_archive or "Archived"
```

#### Technical Achievements
- **Code Reduction**: 2 table implementations → 1 shared DataTable
- **Consistency**: Same patterns across employer and job seeker views
- **Maintainability**: Reusable configuration architecture
- **Performance**: Reduced unnecessary re-renders

**See full documentation:** [INVITATIONS_V2_REFACTOR_COMPLETE.md](./features/INVITATIONS_V2_REFACTOR_COMPLETE.md)
- Border: #E5E5E5
- Header: 16px normal weight, #111928
- Items: 14px semibold title, 14px normal message
- Button: 31px height, 10px font, #036672 border/text
- Footer buttons: 34px height, 12px font

#### 3. Actions Menu

**Available Actions:**
- View Application (opens in new tab, marks as viewed)
- Mark as Applied
- Mark as Declined
- Role Details (navigates to `/jobs/{job_id}`)
- Assessment Results (navigates to `/assessments?id={assessment_id}`)
- Archive Invite

**Menu Dividers:**
- After "View Application"
- After "Mark as Declined" (when status is 'sent')
- After "Assessment Results"

### API Endpoints

#### Candidate Endpoints
```
GET    /api/invitations              # Get user invitations
GET    /api/invitations/archived     # Get archived invitations
PATCH  /api/invitations/[id]         # Update invitation status
POST   /api/invitations/bulk         # Bulk actions
GET    /api/invitations/notifications # Recent notifications
```

#### Employer Endpoints (Ready for UI)
```
GET    /api/employer/candidates           # Get candidate pool
GET    /api/employer/candidates/archived  # Get archived candidates
PATCH  /api/employer/candidates/[id]      # Update candidate status
POST   /api/employer/candidates/bulk      # Bulk actions
```

### Key Features

#### Auto-Population
- Trigger: `trigger_auto_populate_employer_candidates`
- Automatically adds qualified candidates to employer pool
- Threshold: 85% proficiency (visibility_threshold_pct)
- Creates `pending` status invitations

#### Role Readiness Badges
- **90%+** → "Ready" (green)
- **85-89%** → "Building Skills" (orange)
- **<85%** → Not shown to employers

#### Search & Filters
- Fuzzy search on company name and role title
- Filter by readiness (All, Ready, Building Skills)
- Filter by status (All, Pending, Applied, Declined)
- Combine multiple filters

#### Bulk Actions
- Multi-select with checkboxes
- Archive multiple invitations at once
- Clear selection after action
- Visual feedback during processing

### Integration Points

#### 1. Assessment System
- Auto-population trigger on assessment completion
- Proficiency scores determine visibility
- Assessment results linked to invitations

#### 2. Jobs System
- Featured roles have proficiency thresholds
- Application URLs copied to invitations
- Job details accessible from invitations

#### 3. Companies System
- Company logos displayed in invitations table
- Company data joined in invitation queries
- Employer admin access scoped by company

#### 4. User Profiles
- User data required for invitations
- Profile completeness affects invitation quality
- LinkedIn and bio fields used in employer view

### Performance Considerations

- **Caching:** Notification count cached for 30 seconds
- **Pagination:** Large invitation lists paginated
- **Indexes:** Composite indexes on (user_id, status), (company_id, status)
- **RLS Optimization:** Policies use indexed columns

### Security Features

- **RLS Policies:** Strict row-level security for all operations
- **Role-Based Access:** Candidates and employers have separate permissions
- **Data Validation:** Status enum validation, unique constraints
- **Audit Trail:** Timestamps for all status changes

### Testing

**Database Tests:** `scripts/test-invitations-db.js`
- Table access and joins
- RLS policy enforcement
- Unique constraints
- Status enum validation
- Count queries

**Test Data:** `scripts/seed-invitation-test-data.js`
- 14 test invitations
- 5 mock candidates
- 3 mock companies
- Various proficiency levels

### Future Enhancements

1. **Email Notifications:** Send emails when invitations are sent
2. **Real-time Updates:** WebSockets/Supabase Realtime for live updates
3. **Employer Dashboard:** Complete employer UI implementation
4. **Enhanced Analytics:** Invitation metrics and reporting
5. **Mobile App Integration:** Native mobile support

### Documentation

- **Implementation Guide:** `docs/features/EMPLOYER_INVITATIONS_IMPLEMENTATION.md`
- **Testing Guide:** `docs/features/INVITATIONS_TESTING_GUIDE.md`
- **Feature Summary:** `docs/features/INVITATIONS_FEATURE_SUMMARY.md`
- **Commit Checklist:** `COMMIT_CHECKLIST.md`

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

## Assessment Weighting System

### Overview

The Assessment Weighting System implements three-layer weighted scoring to ensure assessments accurately reflect job requirements and market demand. This prevents the "teamwork vs algorithms" problem where generic soft skills are weighted equally with critical technical competencies.

### Three-Layer Architecture

**Layer 1: Question-Level Weighting**
- Each question assigned importance score (1.0-5.0)
- Based on skill criticality and difficulty
- Critical skills: 5.0, Important: 4.0, Helpful: 3.0
- Difficulty adjustment: Expert +0.5, Beginner -0.5

**Layer 2: Skill-Level Weighting**
- Company-specific importance (for featured roles)
- O*NET importance ratings (for occupations)
- Proficiency thresholds per skill

**Layer 3: Market Demand Multipliers** (Future)
- Critical skills (high growth): 1.25x
- Declining skills: 0.7x
- Based on O*NET + BLS data

### Database Schema

**Skills Table:**
```sql
ALTER TABLE skills
ADD COLUMN onet_importance DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN is_assessable BOOLEAN DEFAULT true;
```

**Quiz Questions Table:**
```sql
ALTER TABLE quiz_questions
ADD COLUMN importance DECIMAL(3,1) DEFAULT 3.0;
```

### Weighted Scoring Calculation

**Question Score:**
```typescript
questionScore = isCorrect ? 100 : 0
weightedQuestionScore = questionScore × questionImportance × difficultyMultiplier

// Difficulty multipliers
easy/beginner: 0.8
medium/intermediate: 1.0
hard/expert: 1.3
```

**Skill Score:**
```typescript
totalWeightedScore = Σ(weightedQuestionScore)
totalPossibleWeight = Σ(100 × importance × difficulty)
skillScore = (totalWeightedScore / totalPossibleWeight) × 100
```

**Overall Readiness:**
```typescript
overallProficiency = Σ(skillScore × skillImportance) / Σ(skillImportance)
```

### Implementation Files

- `src/lib/services/assessment-engine.ts` - Core weighted scoring
- `src/lib/services/quiz-generation.ts` - Question importance assignment
- `src/app/api/assessments/analyze/route.ts` - API integration
- `src/lib/services/skills-taxonomy-mapper.ts` - Generic skill filtering
- `src/lib/services/hybrid-skills-mapper.ts` - Two-track skills mapping

### Two-Track Skills Mapping Strategy

**Track 1: Standard Occupations (SOC Codes)**
- **Source:** O*NET API (government validated)
- **Scope:** Broad, universal skills applicable across companies
- **Filtering:** Remove only truly generic abilities (Near Vision, English Language)
- **Keep:** Domain knowledge (Economics, Programming, Engineering)
- **Use Case:** HDO quizzes for general job seekers
- **Example:** Software Developers → Python, Java, SQL, Algorithms, Data Structures

**Track 2: Featured Roles (Company-Specific)**
- **Source:** Lightcast + AI + Job Description parsing
- **Scope:** Hyper-specific to company's tech stack and requirements
- **Filtering:** Minimal - include vendor-specific if relevant
- **Use Case:** Corporate pre-qualification assessments
- **Example:** "Senior React Developer at Acme Corp" → React, TypeScript, AWS, GraphQL, Jest

**Track 3: Education Programs (CIP Codes)**
- **Source:** Inherit from target SOC codes + program course descriptions
- **Scope:** Skills taught in program curriculum
- **Matching:** CIP → SOC → Skills + Course keyword matching
- **Use Case:** Program recommendations based on skill gaps
- **Example:** "Computer Science BS" → Skills from SOC 15-1252.00 + "Data Structures" course

### Skills Taxonomy Cleanup

**Generic Skills Excluded (for Standard Occupations):**
- Physical abilities (Near Vision, Manual Dexterity, Far Vision)
- Basic communication (English Language, Speaking, Writing, Speech Clarity)
- Cognitive abilities (Oral Comprehension, Deductive Reasoning)
- Generic soft skills (Customer Service, Active Listening)
- Vendor-specific products (Amazon S3, Microsoft Azure) - reserved for featured roles

**Domain Skills Retained:**
- Technical knowledge (Programming, Databases, Cloud Computing)
- Professional skills (Project Management, Financial Analysis)
- Industry-specific (Healthcare Procedures, Legal Research)

**Result:** Universal, assessable skills for standard occupations; customizable for featured roles

### Question Bank System

**Purpose:** Enable dynamic assessment assembly with anti-cheating features

**Architecture:**
```
Phase 1: Build Question Bank (Admin)
├─ Generate 10-15 questions per skill
├─ Store with is_bank_question = true
└─ Result: 100-150 questions per occupation

Phase 2: Dynamic Assembly (User)
├─ Select top 5-7 critical/important skills
├─ Random sample 3-4 questions per skill
├─ Total: 20-25 questions
└─ Different questions each time
```

**Database Schema:**
```sql
-- Question bank metadata
ALTER TABLE quiz_questions
ADD COLUMN is_bank_question BOOLEAN DEFAULT false,
ADD COLUMN times_used INTEGER DEFAULT 0,
ADD COLUMN last_used_at TIMESTAMP;

-- User question history (anti-repeat)
CREATE TABLE user_question_history (
  user_id UUID REFERENCES auth.users(id),
  question_id UUID REFERENCES quiz_questions(id),
  assessment_id UUID REFERENCES assessments(id),
  seen_at TIMESTAMP DEFAULT NOW(),
  was_correct BOOLEAN,
  PRIMARY KEY (user_id, question_id, assessment_id)
);
```

**Key Functions:**
- `generateQuestionBank(jobId)` - Create comprehensive question pool
- `selectTopSkills(jobId, maxSkills)` - Pick critical/important skills only
- `getRandomQuestionsForSkill(skillId, count, userId)` - Sample with anti-repeat
- `assembleDynamicAssessment(jobId, userId)` - Build unique assessment
- `recordQuestionHistory(userId, assessmentId, questionIds)` - Track usage

**Benefits:**
- ✅ Large question pool (100-150 per occupation)
- ✅ Short assessments (20-25 questions, 15-20 minutes)
- ✅ Anti-cheating (different questions each time)
- ✅ Focused testing (critical/important skills only)
- ✅ Weighted scoring (still accurate with fewer questions)

**Testing:** Run `node scripts/test-question-bank.js` to validate

### Testing Strategy

**Simulator Scenarios:**
- Building Proficiency: Target 70% (mix of proficient/developing)
- Needs Development: Target 45% (mostly gaps)
- Role Ready: Target 90%+ (all proficient)

**Validation:**
- Critical technical skills weighted higher than soft skills
- Expert questions worth more than beginner questions
- Overall scores reflect true job readiness

## API Ecosystem Integration

### Overview

The API Ecosystem Integration (Phase 5) transforms SkillSync from a static platform into a dynamic, real-time workforce intelligence system. This system integrates with government APIs (BLS, CareerOneStop) to provide accurate regional wage data and local training programs.

### Architecture Components

#### 1. BLS API Service (`/src/lib/services/bls-api.ts`)

**Purpose:** Real-time wage and employment data for Tampa MSA regional accuracy

**Key Features:**
- Tampa MSA focus (Area Code: 45300) for regional relevance
- OEWS (Occupational Employment and Wage Statistics) data integration
- Employment projections (2022-2032) for growth insights
- Intelligent rate limiting (500 requests/day management)
- Batch processing with error handling

**Core Methods:**
```typescript
class BLSApiService {
  async getRegionalWageData(socCode: string): Promise<BLSWageData | null>
  async getBatchWageData(socCodes: string[]): Promise<BLSWageData[]>
  async getEmploymentProjections(socCode: string): Promise<BLSEmploymentProjection | null>
}
```

#### 2. CareerOneStop API Service (`/src/lib/services/careeronestop-api.ts`)

**Purpose:** Training programs and certification data for education pathways

**Key Features:**
- Pinellas County focus (FIPS: 12103) with 50-mile radius
- Training program discovery from local providers
- Certification requirements with exam and cost details
- Provider type mapping (Community College, University, Trade School, Online, Apprenticeship)
- Program type categorization (Certificate, Associate, Bachelor, Master, Apprenticeship)

**Core Methods:**
```typescript
class CareerOneStopApiService {
  async getTrainingPrograms(socCode: string): Promise<CareerOneStopProgram[]>
  async getCertificationRequirements(socCode: string): Promise<CareerOneStopCertification[]>
  async getComprehensiveJobData(socCode: string): Promise<CareerOneStopJobData | null>
}
```

#### 3. Occupation Enrichment Service (`/src/lib/services/occupation-enrichment.ts`)

**Purpose:** Orchestrated API integration with intelligent caching and progress tracking

**Key Features:**
- Batch processing with selection-based workflow
- Real-time progress tracking with ETA calculations
- Cache status monitoring for informed refresh decisions
- Error handling with retry mechanisms
- Force refresh capability for immediate updates
- Automatic cleanup of expired cache entries

**Core Methods:**
```typescript
class OccupationEnrichmentService {
  async enrichOccupation(socCode: string, forceRefresh?: boolean): Promise<EnrichmentResult>
  async enrichOccupationsBatch(socCodes: string[], forceRefresh?: boolean): Promise<EnrichmentResult[]>
  async getEnrichedOccupationData(socCode: string): Promise<OccupationEnrichmentData | null>
  async cleanExpiredCache(): Promise<number>
}
```

### API Integration Patterns

#### Rate Limiting Strategy
```typescript
// BLS API: 500 requests/day limit
const batchSize = this.apiKey ? 50 : 25
for (let i = 0; i < socCodes.length; i += batchSize) {
  // Process batch
  await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
}

// CareerOneStop API: Custom rate limiting
await new Promise(resolve => setTimeout(resolve, 500)) // 500ms between requests
```

#### Error Handling Pattern
```typescript
try {
  const result = await apiCall()
  if (result) {
    await this.cacheData(result)
    return { success: true, data: result }
  }
  return { success: false, error: 'No data returned' }
} catch (error) {
  console.error(`API error: ${error}`)
  return { success: false, error: error.message }
}
```

## Intelligent Caching System

### Overview

The Intelligent Caching System provides enterprise-grade performance optimization with smart refresh cycles based on data volatility patterns. Different data types have different TTL (Time To Live) values based on how frequently they change.

### Cache Architecture

#### TTL Strategy
- **BLS Wage Data:** 90-day TTL (quarterly government data updates)
- **BLS Employment Projections:** 180-day TTL (semi-annual projections)
- **CareerOneStop Programs:** 60-day TTL (semester-based program updates)
- **CareerOneStop Certifications:** 120-day TTL (annual certification cycles)

#### Cache Tables Structure
```sql
-- All cache tables include:
expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL 'X days')
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### Automatic Cleanup Function
```sql
CREATE OR REPLACE FUNCTION clean_expired_occupation_cache()
RETURNS INTEGER AS $$
DECLARE
  total_deleted INTEGER := 0;
  current_deleted INTEGER := 0;
BEGIN
  -- Clean each cache table
  DELETE FROM bls_wage_data WHERE expires_at < NOW();
  GET DIAGNOSTICS current_deleted = ROW_COUNT;
  total_deleted := total_deleted + current_deleted;
  
  -- Repeat for other cache tables...
  RETURN total_deleted;
END;
$$ LANGUAGE plpgsql;
```

### Cache Performance Features

#### Smart Cache Status Monitoring
```typescript
const checkCacheStatus = async (socCode: string) => {
  const now = new Date()
  const blsExpired = !blsData || new Date(blsData.expires_at) < now
  const cosExpired = !cosData || new Date(cosData.expires_at) < now
  
  return { blsWageExpired: blsExpired, cosProgramsExpired: cosExpired }
}
```

#### Background Refresh Capability
- Cache updates happen without user impact
- Progress tracking for long-running operations
- Intelligent refresh decisions based on cache status
- Force refresh option for immediate updates

### Integration with Admin Interface

#### Admin Enrichment Workflow
1. **Selection Phase:** Admin selects occupations from `/admin/occupations`
2. **Cache Check:** System checks cache status for each SOC code
3. **Progress Tracking:** Real-time progress with ETA calculations
4. **Batch Processing:** Efficient API usage with rate limiting
5. **Cache Update:** Fresh data stored with appropriate TTL
6. **UI Refresh:** Admin interface updates with new data

#### Admin Controls
- **Enrich Data Button:** Appears when occupations are selected
- **Force Refresh Checkbox:** Override cache for immediate updates
- **Progress Dialog:** Real-time status with current SOC processing
- **Cache Status Indicators:** Visual feedback on data freshness

## Admin Tools Architecture

### Route Structure

```
src/app/admin/
├── layout.tsx              # Admin layout with navigation
├── page.tsx               # Admin dashboard
├── companies/             # Company management
├── occupations/           # Occupation management (⚠️ TODO: Refactor to match Role Editor)
├── programs/              # Program management
├── roles/                 # Featured role management ✅ COMPLETE
│   ├── page.tsx          # Roles list table
│   └── [id]/page.tsx     # Role editor (6-tab interface)
├── users/                 # User management
├── analytics/             # Analytics dashboard
└── settings/              # System settings
```

### Role Editor Architecture ✅ **PRODUCTION-READY**

**Location:** `/admin/roles/[id]`

#### 6-Tab Interface

1. **Basic Information**
   - All role metadata (title, company, SOC code, location, salary)
   - SOC auto-suggest with O*NET integration
   - Proficiency thresholds (required_proficiency_pct, visibility_threshold_pct)
   - Image upload with validation

2. **Descriptions**
   - Short description (13-15 words, ~95 chars)
   - Long description (detailed role overview)
   - AI generation powered by OpenAI

3. **Skills**
   - Current skills display from SOC taxonomy
   - X-button removal (deletes from soc_skills table)
   - AI Skills Extractor (Lightcast + O*NET)
   - Manual Skills Selector

4. **Assessments**
   - Placeholder for quiz management
   - ⚠️ TODO: Wire up after quiz generation fix

5. **Role Details**
   - Draggable card editors for:
     - Core Responsibilities (strategic, outcome-focused)
     - Day-to-Day Tasks (tactical, action-focused)
     - Tools & Technology (software, equipment, platforms)
   - Add/remove/reorder functionality

6. **SEO & Metadata**
   - SEO fields (seo_title, meta_description)
   - Open Graph tags (og_title, og_description, og_image)
   - URL slug
   - AI SEO Generator (analyzes all tabs)
   - OG image preview with featured image inheritance

#### Key Features

**Dirty State Tracking:**
- Tracks all form changes in `localChanges` state
- Unsaved changes warning on navigation
- Save button enables when changes detected

**Professional UX:**
- Toast notifications (Title Case) for all actions
- DestructiveDialog for delete confirmations
- Proper error handling and user feedback
- Loading states throughout

**Skills Management:**
- Remove skills from SOC taxonomy
- Skills tracked in localChanges, deleted on Save
- Service role key for RLS bypass
- Proper refresh after deletion

**AI Integration:**
- Description generation
- SEO content generation
- Skills extraction from O*NET/Lightcast

**Database Integration:**
- Migration ready: `20251010000004_add_seo_fields_to_jobs.sql`
- Fields: seo_title, meta_description, og_title, og_description, og_image, slug
- Proficiency thresholds: required_proficiency_pct, visibility_threshold_pct

#### Component Architecture

**EntityDetailView Component:**
```typescript
<EntityDetailView
  entity={role}
  entityType="role"
  tabs={tabsConfig}
  onSave={handleSave}
  onDelete={handleDelete}
  onPublish={handlePublish}
  onUnpublish={handleUnpublish}
  onFeatureToggle={handleFeatureToggle}
  backHref="/admin/roles"
  isNew={!role}
/>
```

**Reusable Architecture:**
- Can be extended to employer admin areas
- Tab-based configuration system
- Proper separation of concerns
- Service role key pattern for RLS bypass

**⚠️ TODO NEXT:**
- Fix quiz generation system
- Refactor Occupations Editor to match Role Editor experience
- Wire up Assessments tab after quiz fix

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

## Skills Taxonomy & O*NET Integration

### Overview

The Skills Taxonomy system is a comprehensive pipeline that integrates with the U.S. Department of Labor's O*NET database to populate job-specific skills data. This system serves as the foundation for AI-powered assessment generation and skill-based job matching.

### Architecture Components

#### 1. O*NET API Service (`/src/lib/services/onet-api.ts`)

**Purpose:** Interfaces with O*NET Web Services to fetch occupational data

**Key Features:**
- Fetches Skills, Knowledge, and Abilities data for SOC codes
- Implements intelligent filtering to prioritize professional skills
- Uses weighted selection algorithm (Knowledge: 80%, Abilities: 15%, Skills: 5%)
- Handles API authentication and rate limiting

**Core Methods:**
```typescript
class OnetApiService {
  async getOccupationSkills(socCode: string): Promise<OnetSkill[]>
  private filterGenericSkills(skills: OnetSkill[]): OnetSkill[]
  private selectSkillsWithWeighting(skills, knowledge, abilities): OnetSkill[]
}
```

#### 2. Skills Database Schema

**Skills Table:**
- `id` (UUID) - Primary key
- `name` (text) - Skill name from O*NET
- `onet_id` (text) - O*NET identifier for deduplication
- `category` (text) - Mapped category (Business, Technical, Operations)
- `description` (text) - Detailed skill description
- `source` (text) - Always 'ONET' for pipeline-generated skills

**Job-Skills Relationship Table:**
- `job_id` (UUID) - Foreign key to jobs table
- `skill_id` (UUID) - Foreign key to skills table
- `importance_level` (text) - critical/important/helpful
- `proficiency_threshold` (integer) - 0-100 scale
- `weight` (decimal) - Relative importance for assessments
- `onet_data_source` (text) - skills/knowledge/abilities

#### 3. Skill Deduplication System

**Strategy:** Perfect deduplication using O*NET IDs
- Skills are created once and referenced by multiple jobs
- No duplicate "Administration and Management" entries
- Maintains referential integrity across job-skill relationships

**Implementation:**
```typescript
// Check for existing skill by O*NET ID
const existingSkill = await supabase
  .from('skills')
  .select('*')
  .eq('onet_id', onetSkill.id)
  .single()

if (!existingSkill.data) {
  // Create new skill only if doesn't exist
}
```

### Skills Population Pipeline

#### 1. Admin Interface (`/src/app/admin/skills-data/page.tsx`)

**Features:**
- Real-time progress tracking with estimated completion times
- SOC code management with skills count display
- Individual and bulk population operations
- Skills viewing modal for populated SOC codes

**Progress Tracking:**
- Adaptive time estimation based on actual processing speed
- Visual progress bar with percentage completion
- Current SOC code being processed display
- Success/failure notifications with detailed metrics

#### 2. Population API (`/src/app/api/admin/populate-job-skills/route.ts`)

**Workflow:**
1. Fetch jobs by SOC code (or all jobs if no filter)
2. Skip jobs that already have skills (unless force refresh)
3. Call O*NET API service for each unique SOC code
4. Map O*NET skills to internal taxonomy
5. Create job-skill relationships with importance weighting
6. Return detailed results with success/failure counts

**Error Handling:**
- Graceful handling of SOC codes with no O*NET data
- Detailed logging of API failures and data gaps
- Rollback capability for failed operations

### Intelligent Skill Filtering

#### Generic Skill Exclusion

**Problem:** O*NET includes many generic skills that don't add assessment value
- Basic communication (Speaking, Reading Comprehension)
- Universal abilities (Oral Comprehension, English Language)
- Generic problem-solving (Complex Problem Solving)

**Solution:** Comprehensive filtering system
```typescript
const genericSkillNames = [
  'English Language', 'Speaking', 'Reading Comprehension',
  'Oral Comprehension', 'Oral Expression', 'Written Comprehension',
  'Customer and Personal Service', 'Problem Sensitivity',
  // ... 40+ generic skills filtered out
]
```

#### Weighted Selection Algorithm

**Prioritization Strategy:**
- **Knowledge (80%):** Domain-specific expertise (Administration and Management, Strategic Planning)
- **Abilities (15%):** Relevant cognitive skills (Critical Thinking, but filtered)
- **Skills (5%):** Only essential technical skills

**Benefits:**
- Produces assessment-relevant skills for employers
- Eliminates generic communication skills
- Focuses on differentiating competencies
- Reduces total skills to 10 most important per job

### Integration Points

#### 1. Assessment Generation Pipeline
- Skills serve as input for AI quiz generation
- Importance levels determine question weighting
- Professional skills prioritized over soft skills

#### 2. Job Matching System
- Skills enable semantic job-candidate matching
- Skill overlap calculations for recommendations
- Competency gap analysis for career guidance

#### 3. Analytics & Reporting
- Skills data powers employer insights
- Candidate skill distribution analysis
- Market demand trending by skill category

### Troubleshooting Guide

#### Issue: SOC Codes Getting Skipped
**Root Cause:** All skills filtered out as generic
**Solution:** Review filtering criteria, some SOCs are inherently generic
**Prevention:** Log detailed filtering results for analysis

#### Issue: Duplicate Skills in Database
**Root Cause:** O*NET ID deduplication not working
**Solution:** Check `onet_id` field population and uniqueness constraints
**Prevention:** Always verify deduplication logic in tests

#### Issue: Poor Assessment Quality
**Root Cause:** Generic skills making it through filters
**Solution:** Enhance filtering criteria, adjust weighting algorithm
**Prevention:** Regular review of generated assessments for skill relevance

#### Issue: O*NET API Failures
**Root Cause:** Rate limiting, authentication, or service downtime
**Solution:** Implement exponential backoff, verify credentials
**Prevention:** Monitor API health and implement circuit breakers

### Performance Considerations

- **Batch Processing:** Process multiple SOC codes in parallel where possible
- **Caching:** Cache O*NET responses to reduce API calls
- **Database Optimization:** Use proper indexes on `onet_id` and `soc_code` fields
- **Progress Tracking:** Real-time updates without blocking UI

### Future Enhancements

1. **Manual Skill Override:** Allow admins to add/remove skills per job
2. **Skill Taxonomy Evolution:** Track skill importance changes over time
3. **Industry-Specific Filtering:** Customize filtering by industry vertical
4. **Assessment Feedback Loop:** Use assessment results to refine skill selection

## SOC-Based Quiz System Architecture

### Overview

The SOC-Based Quiz System represents a fundamental architectural shift from job-specific to occupation-based assessments, enabling massive reusability and scalability. One quiz serves hundreds of jobs with the same SOC code, dramatically reducing content creation overhead while maintaining assessment quality.

## Assessment Proficiency Engine Architecture

### Overview

The Assessment Proficiency Engine is the sophisticated sister to the Quiz Generation Engine, transforming raw quiz responses into precise workforce intelligence. This enterprise-grade system serves three critical business functions:

1. **Job Seekers**: True role readiness scoring with actionable gap analysis
2. **Corporations**: 90%+ pre-qualified candidate filtering for admin dashboards  
3. **Education Providers**: Precision-matched program recommendations based on actual skill gaps

### Core Components

#### 1. Assessment Engine Core (`src/lib/services/assessment-engine.ts`)
**Multi-dimensional weighted scoring system:**
- **Weighted Scoring**: Question importance + skill importance + market demand + AI quality
- **AI Proficiency Evaluation**: Context-aware answer analysis beyond simple right/wrong
- **Role Readiness Calculation**: True proficiency scoring with actionable gap analysis
- **Integration with Enhanced AI Context**: Reuses same market intelligence and AI prompts

#### 2. Corporate Pre-qualification System (`src/lib/services/corporate-prequalification.ts`)
**90% threshold filtering for admin dashboards:**
- **Hard Requirements Filtering**: Only candidates meeting minimum proficiency thresholds
- **Soft Requirements Ranking**: Preferred qualifications for enhanced sorting
- **Skill Matching Algorithm**: Precise matching of required vs preferred skills
- **Performance Caching**: 24-hour cache with automatic refresh for instant dashboard loading

#### 3. Education Matching Algorithm (`src/lib/services/education-matching.ts`)
**Precision program recommendations:**
- **Gap Identification**: Prioritizes critical vs helpful skill gaps
- **Program Matching**: Surgical precision matching programs to specific gaps (60%+ match threshold)
- **Learning Sequence Generation**: Optimal learning path recommendations
- **Timeline & Cost Calculation**: Complete learning investment analysis

#### 4. Role Readiness Dashboard (`src/components/assessment/RoleReadinessDashboard.tsx`)
**Enterprise-grade job seeker experience:**
- **Four-Tab Interface**: Overview, Skills Analysis, Gap Analysis, Learning Path
- **Visual Proficiency Display**: Progress bars, badges, and color-coded status
- **Actionable Intelligence**: Specific next steps and improvement recommendations
- **Education Integration**: Direct connection to precision program recommendations

### Core Architecture Components

#### 1. SOC-Based Quiz Schema (`database/migrations/20250126_soc_based_quiz_schema.sql`)

**Database Evolution:** Transforms from job-specific (`quizzes.job_id`) to SOC-based (`quizzes.soc_code`) architecture.

**Key Schema Changes:**
- `quizzes.soc_code`: SOC code for reusability across jobs
- `quizzes.is_standard`: Standard vs company-custom quizzes
- `quizzes.company_id`: NULL for standard, company UUID for custom
- `quiz_sections`: Skills-based organization with question counts
- `quiz_questions`: Enhanced with skill_id, explanation, difficulty, usage tracking
- `assessment_responses`: User response logging with timing data

**Unique Constraints:** `(soc_code, is_standard, company_id)` allows multiple quiz versions

#### 2. AI-Powered Question Generation (`src/lib/services/quiz-generation.ts`)

**Intelligent Content Creation:**
- **40+ Questions per Skill**: Comprehensive question pools
- **Professional Skill Focus**: Eliminates generic competencies
- **Weighted Selection Algorithm**: Knowledge (80%), Abilities (15%), Skills (5%)
- **Context-Aware Generation**: Uses job descriptions for relevance

**Generation Flow:**
```typescript
generateSkillQuestions() → generateQuestionBatch() → OpenAI API → validateAndStore()
```

#### 3. Question Pool & Rotation System

**Smart Assessment Assembly:**
- **15-20 Questions per Assessment**: From 40+ available pool
- **Least Recently Used (LRU) Selection**: Prevents question repetition
- **Randomized Ordering**: Within skill-based sections
- **Cheat Prevention**: Usage count and timestamp tracking

**Rotation Algorithm:**
```typescript
selectAssessmentQuestions(quizId, userId) → LRU ordering → randomize selection → return question IDs
```

#### 4. Typeform-Style Assessment UI (`src/app/(main)/assessments/quiz/[socCode]/page.tsx`)

**Single-Question Flow:**
- **Progress Visualization**: Real-time completion tracking
- **No Right/Wrong Feedback**: Evaluation-focused experience
- **Time Tracking**: Per-question response times
- **Mobile Optimized**: Touch-friendly interactions

**User Journey:**
```
Job Details → Start Assessment → Question Flow → Completion → Results Dashboard
```

#### 5. Admin Management Interface

**Quiz Lifecycle Management:**
- **Quiz Generation Dashboard**: SOC code selection and AI generation
- **Quiz Detail Views**: Sections, questions, analytics tabs
- **Status Management**: Draft → Published → Archived workflow
- **Performance Analytics**: Assessment stats and user insights

**Admin Routes:**
- `/admin/quizzes` - Quiz overview and stats
- `/admin/quizzes/generate` - AI-powered quiz creation
- `/admin/quizzes/[id]` - Detailed quiz management

### Security & Performance

#### Row Level Security (RLS)

**Access Control Policies:**
- **Published Quizzes**: Available to authenticated users
- **Assessment Responses**: Users can only access their own responses
- **Admin Management**: Super admins and company admins based on ownership

**RLS Implementation:**
```sql
-- Users can view published quizzes
CREATE POLICY "Users can view published quizzes" ON quizzes
FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);

-- Assessment responses are private
CREATE POLICY "Users can view own assessment responses" ON assessment_responses
FOR SELECT USING (EXISTS (SELECT 1 FROM assessments a WHERE a.id = assessment_responses.assessment_id AND a.user_id = auth.uid()));
```

#### Performance Optimizations

**Database Indexes:**
- `idx_quizzes_soc_code`: Fast SOC code lookups
- `idx_quiz_questions_skill_id`: Skill-based filtering
- `idx_assessment_responses_assessment`: Response analytics

**Query Optimization:**
- **Batch Question Loading**: Reduces database round trips
- **Assessment Pre-creation**: Improves perceived performance
- **Response Buffering**: Reduces real-time update frequency

### Assessment Analytics & KPIs

#### Real-Time Metrics

**Assessment Completion:**
- **Completion Rate**: (Completed Assessments / Total Started) × 100
- **Average Readiness**: Mean readiness percentage across all users
- **Time to Complete**: Average assessment duration
- **Drop-off Points**: Where users abandon assessments

**Question Performance:**
- **Difficulty Distribution**: Pass rates by question
- **Time per Question**: Average response times
- **Skip Rates**: Questions users struggle with
- **Revision Needs**: Questions requiring updates

#### User Progression Tracking

**Longitudinal Analytics:**
- **Readiness Improvement**: Progress over multiple assessments
- **Skill Gap Closure**: Effectiveness of program recommendations
- **Assessment Frequency**: How often users retake assessments
- **Engagement Patterns**: Time of day, session length, completion rates

### Integration Points

#### Skills Taxonomy Connection

**Assessment-to-Skills Mapping:**
- **Question Skills**: Each question tests specific competencies
- **Result Aggregation**: Skill-level scoring and proficiency bands
- **Gap Analysis**: Identifies skills needing development
- **Program Matching**: Skills drive education recommendations

#### Job Matching Integration

**SOC-Based Assessments:**
- **Universal Applicability**: One assessment serves multiple jobs
- **Readiness Scoring**: Percentage match to job requirements
- **Gap Identification**: Specific skills needing development
- **Program Recommendations**: Targeted education pathways

### Troubleshooting Guide

#### Common Issues

**Quiz Generation Failures:**
- **SOC Code Missing Skills**: Ensure skills are populated via O*NET pipeline
- **OpenAI API Errors**: Check API key and rate limits
- **Duplicate Questions**: Review deduplication logic in generation service

**Assessment Loading Issues:**
- **Question Selection Fails**: Verify quiz has sufficient active questions
- **RLS Permission Denied**: Check user authentication and quiz status
- **Performance Problems**: Review database indexes and query optimization

**Analytics Discrepancies:**
- **Missing Response Data**: Ensure assessment completion triggers result calculation
- **Incorrect Readiness Scores**: Verify skill weighting and aggregation logic
- **Stale Statistics**: Check background job processing for analytics updates

### Future Enhancements

#### Advanced Analytics
- **Predictive Modeling**: Success prediction based on assessment patterns
- **A/B Testing**: Question effectiveness and user engagement experiments
- **Personalization**: Adaptive question difficulty based on user performance

#### Enhanced Security
- **Question Tampering Detection**: Advanced cheat prevention algorithms
- **Session Validation**: Browser fingerprinting and behavior analysis
- **Audit Logging**: Comprehensive admin action tracking

#### Performance Scaling
- **Question Caching**: Redis-based question pool caching
- **Assessment Sharding**: Database partitioning for high-volume scenarios
- **CDN Integration**: Global distribution for international users

### Success Metrics

#### User Engagement KPIs
- **Assessment Conversion**: Jobs viewed → Assessments started → Assessments completed
- **Assessment Quality**: Average readiness scores and improvement trends
- **User Retention**: Return assessment frequency and engagement duration

#### Business Impact Metrics
- **Content Efficiency**: Quizzes created per SOC code vs jobs served
- **Assessment Coverage**: Percentage of jobs with available assessments
- **Program Matching**: Effectiveness of education recommendations

This SOC-based architecture provides the foundation for SkillSync's assessment-driven user experience, enabling scalable, high-quality skill evaluations that power personalized career development pathways.

### Assessment Proficiency Integration

The Assessment Proficiency Engine perfectly integrates with the SOC-Based Quiz System:

**Shared Intelligence:**
- **Enhanced AI Context**: Same market intelligence and AI prompts for consistency
- **Skill Weighting**: Same importance and market demand calculations
- **Lightcast Integration**: Same 32K+ skills taxonomy for evaluation

**Complete Data Flow:**
```
Quiz Generation → Assessment Engine → Corporate Pre-qualification → Education Matching
     ↓                    ↓                      ↓                       ↓
Sophisticated      Weighted Scoring      90% Threshold         Precision Program
Questions          + AI Evaluation       Filtering             Recommendations
```

**Business Value:**
- **Job Seekers**: True role readiness scores with precise learning pathways
- **Corporations**: Only qualified candidates appear in admin dashboards
- **Education Providers**: Programs matched to actual skill gaps, not generic recommendations

**Quality Metrics:**
- **100% Integration Testing**: All 18 critical integration points verified
- **Enterprise Performance**: Cached pre-qualification for instant results
- **Precision Matching**: 60%+ match threshold ensures quality education recommendations
- **AI-Enhanced Evaluation**: Context-aware assessment beyond simple right/wrong scoring

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

## Environment Configuration

### Required Environment Variables

#### Core Application
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (for AI-powered features)
OPENAI_API_KEY=your_openai_api_key
```

#### API Integrations (Phase 5)
```bash
# BLS API Integration
BLS_API_KEY=your_bls_api_key

# CareerOneStop API Integration  
COS_USERID=your_careeronestop_userid
COS_TOKEN=your_careeronestop_token

# O*NET API Integration (existing)
ONET_USERNAME=your_onet_username
ONET_PASSWORD=your_onet_password

# Lightcast API Integration (existing)
LIGHTCAST_CLIENT_ID=your_lightcast_client_id
LIGHTCAST_CLIENT_SECRET=your_lightcast_client_secret
```

#### Development vs Production
```bash
# Development
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

### API Rate Limits & Quotas
- **BLS API:** 500 requests/day (registered users), 25 requests/day (unregistered)
- **CareerOneStop API:** Custom rate limits based on agreement
- **O*NET API:** 20 requests/minute, 200 requests/day
- **Lightcast API:** Based on subscription tier
- **OpenAI API:** Based on usage tier and billing

## Data Architecture & Source of Truth

### API-First Data Model

**Core Principle:** Data comes from APIs, not seed files.

#### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                             │
├─────────────────────────────────────────────────────────────┤
│  1. BLS API          → National wage data                    │
│  2. CareerOneStop    → Tasks, tools, outlook, education      │
│  3. O*NET            → Skills taxonomy (future)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              ENRICHMENT PIPELINE                             │
│  /src/lib/services/occupation-enrichment.ts                  │
├─────────────────────────────────────────────────────────────┤
│  • Orchestrates API calls                                    │
│  • Transforms data to schema                                 │
│  • Populates database fields                                 │
│  • Handles caching & rate limiting                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (Supabase)                         │
│  Table: jobs (job_kind = 'occupation')                       │
├─────────────────────────────────────────────────────────────┤
│  • median_wage_usd        (from BLS)                         │
│  • employment_outlook     (from CareerOneStop)               │
│  • education_level        (from CareerOneStop)               │
│  • tasks                  (from CareerOneStop)               │
│  • tools_and_technology   (from CareerOneStop)               │
│  • bright_outlook         (from CareerOneStop)               │
│  • onet_code              (from CareerOneStop)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION UI                            │
│  • Job listings                                              │
│  • Occupation detail pages                                   │
│  • Assessment generation                                     │
└─────────────────────────────────────────────────────────────┘
```

### Seed Files - Removed (Jan 2025)

**Decision:** Seed files (`seed.sql`, `real_occupation_data.sql`) have been archived and disabled.

**Location:** `supabase/archive/` (for reference only)

**Why Removed:**
1. **Data Integrity** - Seed files deleted enriched API data on `db reset`
2. **Mock Data** - Inserted placeholder values (NULL, "API_NEEDED")
3. **Confusion** - Created ambiguity about source of truth
4. **Production Anti-Pattern** - Production DBs don't use seed files

**Configuration:**
```toml
# supabase/config.toml
[db.seed]
enabled = false  # Seed data disabled
```

### What We Use Instead

#### 1. Schema Migrations Only
**Location:** `supabase/migrations/*.sql`

**Purpose:** Define database structure, not data
- Tables, columns, indexes
- Constraints, relationships
- RLS policies
- **No data inserts**

#### 2. Enrichment Pipeline
**Trigger:** Admin UI → `/admin/occupations` → Select occupations → "Enrich Selected"

**Process:**
1. Select occupations by SOC code
2. Call BLS API for wage data (90-day cache)
3. Call CareerOneStop API for occupation details (60-day cache)
4. Transform and validate data
5. Update database with enriched fields
6. Cache results for performance

**API Endpoints:**
- `POST /api/admin/occupation-enrichment/enrich` - Start enrichment
- `GET /api/admin/occupation-enrichment/progress` - Poll status
- `POST /api/admin/occupation-enrichment/clean-cache` - Clear cache

#### 3. Base SOC Codes
**Source:** Production database (pre-populated)

**What's Included:**
- SOC code (e.g., "13-2011")
- Title (e.g., "Accountants & Auditors")
- Category (e.g., "Finance & Legal")
- Basic description

**What's Populated by Enrichment:**
- Wage data (BLS API)
- Employment outlook (CareerOneStop)
- Education requirements (CareerOneStop)
- Tasks and tools (CareerOneStop)
- Bright outlook status (CareerOneStop)

### Fresh Database Setup

```bash
# 1. Reset database (schema only, no seed data)
npx supabase db reset

# 2. Base SOC codes should already exist in production
# If not, manually insert via Supabase dashboard

# 3. Run enrichment pipeline via admin UI
# Navigate to /admin/occupations
# Select occupations
# Click "Enrich Selected"
```

### Data Validation

**Before Enrichment:**
- SOC code exists
- Title and category present
- Wage/outlook fields are NULL

**After Enrichment:**
- `median_wage_usd` populated (from BLS)
- `employment_outlook` populated (from CareerOneStop)
- `education_level` populated (from CareerOneStop)
- `tasks` JSONB array populated (from CareerOneStop)
- `tools_and_technology` JSONB array populated (from CareerOneStop)
- `bright_outlook` set to 'Bright' or 'No' (from CareerOneStop)

**Verification Query:**
```sql
SELECT 
  title, 
  soc_code, 
  median_wage_usd,
  employment_outlook,
  education_level,
  jsonb_array_length(tasks) as task_count,
  jsonb_array_length(tools_and_technology) as tools_count,
  bright_outlook
FROM jobs 
WHERE job_kind = 'occupation'
AND soc_code = '13-2011';
```

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

---

## Enrichment Pipeline - Production Status (Jan 30, 2025)

### ✅ FULLY OPERATIONAL

**Status:** Production-ready enrichment pipeline successfully deployed and tested.

**Verified Working:**
- BLS API integration → Wage data ($67,920 for Accountants)
- CareerOneStop API integration → Tasks (34 for Accountants), outlook, education
- Database updates → 10+ fields per occupation
- Admin table display → Real-time enriched data
- Progress tracking → Functional with cleanup

**Test Results:**
- SOC 13-2011.00 (Accountants & Auditors): ✅ Complete
- SOC 41-3091.00 (Sales Representatives): ✅ Complete
- Data quality: High accuracy, government-sourced

**Known Limitations:**
- Tools/technology data: Rarely provided by CareerOneStop (removed from UI)
- Regional data: National averages only (BLS regional API not yet integrated)
- Progress polling: Minor UI polish needed

**Next Steps:**
- Enrich remaining 28 occupations
- UI improvements (occupation detail pages)
- Test assessment generation with enriched data

**Key Files:**
- `/src/lib/services/occupation-enrichment.ts` - Main orchestration
- `/src/lib/services/bls-api.ts` - BLS integration
- `/src/lib/services/careeronestop-api.ts` - CareerOneStop integration
- `/src/app/api/admin/occupation-enrichment/` - Admin API routes
- `/src/app/admin/occupations/page.tsx` - Admin UI

---

## HubSpot Programs Import & Admin Tools (Sept 30, 2025)

### ✅ FULLY OPERATIONAL

**Status:** Complete HubSpot programs import and admin tools implementation.

**Implemented Features:**

#### 1. Programs Schema Extension
- Added 10 new fields to programs table:
  - `program_id` (unique identifier from HubSpot or generated)
  - `catalog_provider` (Direct vs Bisk Amplified)
  - `discipline` (Business, Technology, Healthcare, etc.)
  - `long_desc` (full program description)
  - `program_guide_url` (PDF/guide link)
  - `is_featured` (featured programs flag)
  - `featured_image_url` (hero image for detail pages)
  - `skills_count` (auto-updated via trigger)
  - `created_at`, `updated_at` (timestamps with triggers)

#### 2. HubSpot Import Pipeline
- **Imported:** 218 Bisk Amplified programs from HubSpot
- **Created:** 19 new schools from HubSpot data
- **Staging Table:** `hubspot_programs_staging` for data preservation
- **Mapping:** HubSpot Record ID → program_id
- **Processing:** Automatic school creation and program linking

#### 3. Admin Tools Updates
- **Programs List:** Full-width table with new columns
  - Discipline, Catalog Provider, Skills Count
  - Featured toggle (on/off switch)
  - Published toggle (draft/published)
  - Search across all columns
  - Actions dropdown (Edit, View Provider, Delete)
  
- **Program Detail Form:** 5-tab structure
  - Tab 1: Basic Information (name, school, discipline, catalog, type, format, duration, CIP, featured)
  - Tab 2: Program Content (short desc, long desc, program URL, guide URL)
  - Tab 3: Media (featured image URL)
  - Tab 4: Skills (skills count - view only, manual edit ready)
  - Tab 5: Metadata (program_id, created_at, updated_at - read-only)

- **Schools Table:** Added `catalog_affiliation` field
  - Supports one-to-many: School → Multiple catalog providers
  - Example: USF has both Direct and Bisk Amplified programs

#### 4. Data Integrity
- ✅ All 223 programs have unique program_ids
- ✅ Direct programs: 5 (IDs start with '3')
- ✅ Bisk Amplified programs: 218 (numeric IDs from HubSpot)
- ✅ All programs linked to valid schools (23 total)
- ✅ No orphaned records or null constraints
- ✅ Skills_count auto-updates via trigger

#### 5. Admin UI Fixes
- ✅ Search functionality working across all columns
- ✅ Actions dropdown with proper href navigation
- ✅ Featured/Published toggles functional
- ✅ Full-width layout for table data
- ✅ Consistent padding and spacing

**Test Coverage:**
- 35 automated tests (all passing)
- Schema validation (20 columns)
- Data integrity (uniqueness, relationships)
- CRUD operations (create, read, update, delete)
- UI flows (list, search, edit, view, toggle, delete)
- Performance benchmarks (< 1s list, < 500ms search)

**Key Migrations:**
- `20250930000000_extend_programs_schema.sql` - Added 10 new fields
- `20250930000001_create_hubspot_staging.sql` - Staging table
- `20250930000002_align_programs_with_jobs.sql` - Triggers and functions
- `20250930000003_add_school_catalog_affiliation.sql` - School catalog field
- `20250930000004_remove_featured_image_constraint.sql` - Allow featured without image

**Key Files:**
- `/src/lib/database/queries.ts` - Updated Program interface
- `/src/app/admin/programs/page.tsx` - Programs list with toggles
- `/src/app/admin/programs/[id]/page.tsx` - 5-tab detail form
- `/src/components/admin/AdminTable.tsx` - Fixed search and actions
- `/scripts/validate-admin-tools.js` - Validation script
- `/scripts/test-admin-ui-flows.js` - End-to-end UI tests

**Documentation:**
- `/docs/reference/hubspot-import-guide.md` - Import process
- `/docs/reference/admin-tools-schema-update-analysis.md` - Schema analysis
- `/docs/csv/hubspot-programs_2025-09-02-2.md` - Source data mapping

**Next Steps:**
- CIP-SOC-Skills pipeline integration
- Skills management interface
- Bulk operations (future enhancement)
- Provider admin permissions (scoped access)

---

## Day 2 Complete: CIP Codes & Short Descriptions (Sept 30, 2025)

### ✅ CIP Code Assignment

**Status:** All 223 programs have CIP codes assigned

**Implementation:**
1. **CIP Data Import** - 1,949 CIP codes + 5,903 crosswalk mappings from NCES
2. **AI Assignment** - GPT-4o-mini suggests CIP codes based on program content
3. **Manual Fallback** - 3 workforce programs assigned 24.0102 (General Studies)
4. **Admin UI** - CIP codes visible in table, editable in detail form with helpText

**Results:**
- 219 programs: AI/HubSpot assigned CIP codes
- 3 programs: Manual assignment (GED, High School Equivalency, Essential Skills)
- Cost: ~$0.30 for AI suggestions
- Time: ~7.5 minutes batch processing

**Database Fields:**
- `cip_code` - 6-digit CIP code (foreign key to cip_codes table)
- `cip_assignment_confidence` - AI confidence score (0-100)
- `cip_assignment_method` - How assigned: ai_auto, manual, partner_provided
- `cip_approved` - Approval status (all true for testing)
- `cip_suggestions` - JSONB array of AI suggestions

### ✅ Short Descriptions Generation

**Status:** AI-generated short descriptions for all programs

**Implementation:**
- Script: `scripts/generate-short-descriptions.js`
- Model: GPT-4o-mini
- Requirements: 13-15 words, ~95 characters
- Skips programs with existing good descriptions

**Results:**
- Professional, concise descriptions
- Cost: ~$0.30 for all programs
- Time: ~4 minutes

### ✅ Admin UI Improvements

**Fixed Issues:**
1. Select.Item empty string errors - Changed all placeholders to 'none'
2. CIP code visibility - Added to programs table column
3. Featured programs filter - Added `.eq('is_featured', true)` to query
4. helpText support - Shows current CIP assignment below dropdown

**Files Modified:**
- `src/app/admin/programs/page.tsx` - Added CIP column
- `src/app/admin/programs/[id]/page.tsx` - Fixed all Select placeholders
- `src/components/admin/EntityDetailView.tsx` - Added helpText rendering
- `src/lib/database/queries.ts` - Fixed getFeaturedPrograms filter

### ✅ Global OpenAI Configuration

**Centralized Model Selection:**
- Created `src/lib/config/openai.ts`
- Default: gpt-4o-mini (15x cheaper, 20x higher limits)
- All services use centralized config
- Environment override: `OPENAI_MODEL` env var

**Cost Savings:**
- GPT-4: $2.50/1M input tokens
- GPT-4o-mini: $0.15/1M input tokens
- 94% cost reduction

**Key Files:**
- `/src/lib/config/openai.ts` - Centralized config
- `/src/lib/services/cip-suggestion.ts` - CIP assignment
- `/src/lib/services/assessment-engine.ts` - Assessment evaluation
- `/scripts/assign-cips-batch.js` - Batch CIP assignment
- `/scripts/generate-short-descriptions.js` - Description generation

---

## Question Bank System

**Status:** ✅ Complete (October 2, 2025)

### Overview

The Question Bank System enables dynamic assessment assembly with anti-cheating features. Instead of fixed quizzes, assessments are assembled on-the-fly from a large pool of questions.

### Architecture

**Question Pool:**
- 4,771 total questions across 30 occupations
- Average 159 questions per occupation
- 10-15 questions per skill for variety

**Dynamic Assembly:**
1. Select top 5-7 critical/important skills for job
2. Randomly sample 3-4 questions per skill
3. Generate 20-25 question assessment
4. Track user history to prevent repeats

**Anti-Cheating:**
- Large question pools prevent memorization
- Random sampling each attempt
- User question history tracking
- Different questions = can't share answers

### Database Schema

```sql
-- Question bank metadata
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS is_bank_question BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Track user question history
CREATE TABLE IF NOT EXISTS user_question_history (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  seen_at TIMESTAMP DEFAULT NOW(),
  was_correct BOOLEAN,
  PRIMARY KEY (user_id, question_id, assessment_id)
);
```

### Implementation

**Generation:**
- `scripts/generate-all-question-banks.js` - Automated generation for all occupations
- Uses OpenAI (gpt-4o-mini) for question creation
- Answer key randomization (A, B, C, D distribution)
- Individual contributor focus (not management scenarios)

**Assembly:**
- `src/lib/services/question-bank.ts` - Dynamic assembly service
- Skill selection logic (top 5-7 by importance)
- Random sampling with exclusions
- Assessment size validation (20-25 questions)

**Testing:**
- `scripts/test-question-bank.js` - Comprehensive test suite
- Validates schema, selection logic, sampling, anti-repeat

### Key Features

1. **Intelligent Skill Selection** - Top 5-7 critical/important skills only
2. **Random Sampling** - Different questions each time
3. **Anti-Repeat Logic** - Excludes previously seen questions
4. **Size Validation** - Ensures appropriate assessment length
5. **Answer Randomization** - Prevents AI bias (all-B answers)

---

## Program Skills Enrichment

**Status:** ✅ Complete (October 2, 2025)

### Overview

The Program Skills Enrichment system assigns skills to education programs using CIP→SOC→Skills inheritance, enabling precise program-to-gap matching.

### CIP→SOC→Skills Pipeline

**Flow:**
```
Program (CIP Code)
  ↓
Related SOC Codes (21 categories mapped)
  ↓
O*NET Skills (from 30 standard occupations)
  ↓
Deduplicated & Weighted
  ↓
Program Skills (avg 16 per program)
```

**Coverage:**
- 222/222 programs enriched (100%)
- 2,351 total skills assigned
- 21 CIP categories mapped to SOC codes
- Average 16 skills per program

### CIP Category Mappings

```javascript
const CIP_TO_SOC_MAPPING = {
  '09': ['11-1021.00', '13-1082.00'], // Communication
  '11': ['15-1252.00'], // Computer Science
  '13': ['11-1021.00'], // Education
  '19': ['29-1141.00', '29-2061.00'], // Human Development
  '24': ['11-1021.00'], // Liberal Arts
  '31': ['29-1141.00', '29-2061.00'], // Fitness
  '50': ['11-1021.00', '13-1082.00'], // Visual/Performing Arts
  '51': ['29-1141.00', '29-2061.00'], // Health
  '52': ['13-2011.00', '11-1021.00'], // Business
  // ... 21 total categories
};
```

### Database Schema

```sql
-- Program skills (many-to-many)
CREATE TABLE program_skills (
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, skill_id)
);

CREATE INDEX idx_program_skills ON program_skills(program_id, skill_id);
```

### Implementation

**Enrichment:**
- `scripts/enrich-remaining-programs.js` - Batch enrichment script
- `src/lib/services/program-skills-enrichment.ts` - Enrichment service
- Skill inheritance from SOC codes
- Deduplication and weight averaging

**Gap Matching:**
- `src/lib/services/program-gap-matching.ts` - Gap analysis & matching
- Calculates skill gaps from assessment results
- Matches programs teaching gap skills
- Weighted ranking (importance × gap size)
- 60%+ match threshold for quality

**Testing:**
- `scripts/test-program-matching.js` - Validation suite
- Tests gap calculation, matching logic, threshold validation

### Gap-Based Recommendations

**Algorithm:**
```typescript
// Calculate skill gaps
gaps = requiredSkills - userSkills

// Weight by importance and gap size
for each gap:
  weight = importance_weight × (1 + gap_size/100)
  
// Match programs
for each program:
  match_score = Σ(covered_gaps × weight) / Σ(all_gaps × weight) × 100
  
// Filter and rank
recommendations = programs.filter(score >= 60%).sort(desc)
```

**Match Score Components:**
- **Importance Weighting:** Critical (3x), Important (2x), Helpful (1x)
- **Gap Size Weighting:** Larger gaps prioritized
- **Coverage Tracking:** Skills covered vs not covered
- **Quality Threshold:** 60%+ match required

### Key Features

1. **CIP→SOC Mapping** - 21 education categories to occupation codes
2. **Skill Inheritance** - Programs inherit skills from related occupations
3. **Gap Analysis** - Identifies specific skill deficiencies
4. **Weighted Matching** - Prioritizes critical skills and large gaps
5. **Quality Threshold** - Only 60%+ matches recommended

---

## Homepage Dashboard Architecture

### SkillSync Snapshot Component

**Location:** `/src/components/ui/skillsync-snapshot.tsx`

**Purpose:** Personalized career dashboard showing user progress, skills breakdown, and key metrics.

**Data Sources:**
- `useSnapshotData()` - Aggregates assessment metrics and skill proficiency data
- `useFavorites()` - Saved jobs and programs
- `useDashboardData()` - Recent assessment activity

**Key Features:**

1. **Metric Cards** (4 cards in 2x2 grid)
   - Roles You're Ready For
   - Assessments Completed
   - Pending Invitations
   - Skill Mastery percentage

2. **Interactive Donut Chart**
   - Recharts PieChart with inner/outer radius
   - Three proficiency levels: Proficient, Building, Developing
   - Native tooltips with descriptions
   - Center label showing total skills
   - Color-coded legend with percentages

3. **Dynamic Messaging**
   - Encouraging copy adapts to proficiency distribution
   - 4 message variants based on proficiency percentage
   - Personalized skill counts and recommendations

4. **Dark Gradient Theme**
   - Background: `linear-gradient(180deg, #002E3E 0%, #111928 100%)`
   - White text with gray-300 secondary text
   - Teal accent color (#0694A2)

**Data Flow:**
```typescript
getUserAssessments()
  ↓
assessment_skill_results (with RLS)
  ↓
Aggregate by skill_band (proficient, building, needs_dev)
  ↓
Calculate percentages and metrics
  ↓
Render chart + dynamic messaging
```

**RLS Requirements:**
- User must own assessments
- `assessment_skill_results` joined via assessment_id
- Policy: `asr_sel_owner` allows SELECT where user owns assessment

### ListCard Component

**Location:** `/src/components/ui/list-card.tsx`

**Purpose:** Reusable card for displaying saved jobs and programs.

**Props:**
- `title` - Card heading
- `subtitle` - Description text
- `items` - Array of jobs or programs
- `emptyMessage` - Text when no items
- `linkHref` - "View All" link destination

**Features:**
- Displays up to 3 items
- Shows title and metadata (company/school, location)
- "View All" link to full list
- Empty state handling

### Footer Component

**Location:** `/src/components/ui/footer.tsx`

**Purpose:** Global footer with branding and legal links.

**Content:**
- Copyright with dynamic year
- "Powered by Bisk Amplified" branding
- Privacy Policy link (external)
- Terms and Conditions link (external)

**Styling:**
- 64px padding above, 24px below
- Centered text
- Gray-600 text with hover states

### Skeleton Loading States

**Location:** `/src/app/(main)/page.tsx`

**Purpose:** Prevent layout shift during data loading.

**Components:**
- Page header skeleton (teal background)
- 3 action card skeletons
- 4 metric card skeletons
- Dark graph section skeleton
- 2 saved items card skeletons

**Implementation:**
- Matches exact layout dimensions
- Uses `animate-pulse` for animation
- Gray-200/300 colors for light sections
- Gray-700/800 for dark sections

---

## AI Content Generation System

### Overview
SkillSync includes an AI-powered content generation system for creating occupation-specific content using OpenAI GPT-4o-mini.

### Components

**1. Core Responsibilities Generation**
- **Service:** `/src/lib/services/generate-core-responsibilities.ts`
- **API Route:** `/src/app/api/generate-responsibilities/route.ts`
- **Purpose:** Generate 5-7 core responsibilities for occupations
- **Input:** Occupation title, SOC code, tasks, skills
- **Output:** Array of responsibility strings

**2. Related Job Titles Generation**
- **Service:** `/src/lib/services/generate-related-titles.ts`
- **API Route:** `/src/app/api/generate-related-titles/route.ts`
- **Purpose:** Generate 6-8 related job title variations
- **Input:** Occupation title, SOC code
- **Output:** Array of related title strings

**3. Admin Interface**
- **Component:** `/src/components/admin/AIContentTab.tsx`
- **Integration:** Admin occupations edit page
- **Features:**
  - "Generate with AI" buttons for each content type
  - Real-time generation with loading states
  - Manual editing capability
  - One-per-line textarea format

### Database Schema

```sql
-- AI-generated content fields in jobs table
ALTER TABLE public.jobs 
ADD COLUMN core_responsibilities text[],
ADD COLUMN related_job_titles text[];
```

### Usage Pattern

1. **Admin generates content:**
   ```typescript
   // Click "Generate with AI" button
   const response = await fetch('/api/generate-responsibilities', {
     method: 'POST',
     body: JSON.stringify({ occupationTitle, socCode, tasks, skills })
   });
   const { responsibilities } = await response.json();
   ```

2. **Frontend displays content:**
   ```typescript
   // Parse JSON string to array if needed
   let responsibilities = job.core_responsibilities;
   if (typeof responsibilities === 'string') {
     responsibilities = JSON.parse(responsibilities);
   }
   ```

### Bulk Generation Script

**Script:** `/scripts/generate-ai-content.js`

```bash
node scripts/generate-ai-content.js
```

**Features:**
- Processes all occupations missing AI content
- Filters for array vs string types
- Rate limited at 2 seconds per occupation
- Automatic database updates

---

## Quiz Generation & Assessment

### Improved Quiz Generation Prompt

**Updated:** October 8, 2025

The quiz generation system now uses an Instructional Designer persona for better quality questions:

**Key Improvements:**
1. **Persona Context:** Instructional Designer and Workforce Assessment Specialist
2. **Focus:** Job-ready competency assessment (not surface knowledge)
3. **Skill Relevance:** Avoids generic skills (Reading, English, etc.)
4. **Applied Understanding:** Tests practical application, not rote recall
5. **Accessibility:** 10th-12th grade reading level
6. **Cultural Neutrality:** Inclusive and unbiased content

**Service:** `/src/lib/services/quiz-generation.ts`

**Prompt Structure:**
```
You are an Instructional Designer and Workforce Assessment Specialist...

### PERSONA CONTEXT:
- Design questions for job-ready assessments
- Evaluate readiness to perform on the job

### SKILL RELEVANCE:
- Prioritize technical, operational, applied skills
- Avoid passive abilities (reading, speaking, etc.)

### QUESTION STRUCTURE:
- High-quality MCQs testing applied understanding
- 4 answer choices (A-D)
- Randomized correct answers

### OUTPUT FORMAT:
JSON array with stem, choices, correct_answer, explanation
```

### Quiz Database Status

**Current State (October 8, 2025):**
- **Total Quizzes:** 4
- **Quizzes with Questions:** 2 (37 total questions)
- **SOC Code Assignment:** None (all null)

**Action Items:**
1. Assign SOC codes to existing quizzes
2. Generate new quizzes for key occupations
3. Link quizzes to occupation pages

---

## Production Status (October 8, 2025)

### ✅ Complete Systems

| System | Status | Coverage | Details |
|--------|--------|----------|---------|
| O*NET Skills | ✅ Complete | 30/30 (100%) | 376 skills, avg 13 per occupation |
| Question Bank | ✅ Complete | 4,771 questions | All 30 occupations, 159 avg per job |
| Program Enrichment | ✅ Complete | 222/222 (100%) | 2,351 skills, avg 16 per program |
| Test Assessments | ✅ Validated | 1 created | 21 questions, 79% score |
| Gap Matching | ✅ Validated | 3/4 tests pass | 60% threshold working |
| Skills Taxonomy | ✅ Complete | 34,863 skills | 62 O*NET + 34,796 Lightcast |

### Test Results

- **Question Bank:** 6/7 tests passing
- **Program Matching:** 4/4 tests passing
- **Integration Tests:** All passing
- **CIP→SOC→Skills:** Validated with 222 programs

### Recent Updates (October 8, 2025)

**Job Details Page Enhancements:**
- ✅ AI-generated Core Responsibilities display
- ✅ AI-generated Related Job Titles display
- ✅ JSON string parsing for array fields
- ✅ Scrollable card containers (max-h-520px)
- ✅ Hidden scrollbars with custom CSS utility
- ✅ Current Employment metric (BLS employment_2022)
- ✅ Trusted Partners section enabled for occupations
- ✅ Skill description tooltips on hover

**Program Details Page Enhancements:**
- ✅ Trusted Partners section added
- ✅ School logos display (Bisk, SPC, HCC, USF)

**Admin Tools Enhancements:**
- ✅ AI Content tab in occupations edit page
- ✅ Generate with AI buttons for responsibilities and titles
- ✅ Real-time AI generation with loading states
- ✅ Manual editing capability

**Employer Invitations System:**
- ✅ Made assessment_id nullable for demo purposes
- ✅ Seeded 3 Power Design invitations with different statuses
- ✅ Invitation flow: pending → sent → applied

**Quiz Generation Improvements:**
- ✅ Updated prompt with Instructional Designer persona
- ✅ Focus on job-ready competency assessment
- ✅ Improved skill relevance filtering
- ✅ Better accessibility and cultural neutrality

**Database Migrations:**
- ✅ Added core_responsibilities (text[]) to jobs table
- ✅ Added related_job_titles (text[]) to jobs table
- ✅ Made assessment_id nullable in employer_invitations

**Scripts Created:**
- ✅ generate-ai-content.js - Bulk AI content generation
- ✅ populate-bls-data.js - BLS employment data population
- ✅ seed-power-design-invitations.js - Demo invitation data

**Bug Fixes:**
- ✅ Removed duplicate (main)/admin routes
- ✅ Fixed Next.js build conflicts
- ✅ Fixed JSON string vs array handling for AI content

**Next Phase: Quiz Assignment & Generation**

**Pending Tasks:**
1. Assign SOC codes to existing quizzes
2. Generate new quizzes for key occupations
3. Link quizzes to occupation pages
4. Populate BLS employment data for all occupations
5. Generate AI content for remaining occupations

**Documentation:**
- See `docs/PROJECT_STATUS.md` for current status
- See `docs/SPRINT_ROADMAP.md` for sprint progress
- See `docs/STYLE_GUIDE.md` for UI patterns

---

*Last Updated: October 8, 2025 - 11:59 PM*
*Status: AI content generation system complete, job/program details enhanced, invitation system operational*
