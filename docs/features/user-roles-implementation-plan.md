# User Roles & Dashboards Implementation Plan

**Epic:** Multi-Role User Management & Dashboards  
**Priority:** MEDIUM (Post-Launch Enhancement)  
**Estimated Time:** 20-30 hours  
**Dependencies:** Assessment Experience Complete

---

## 🎯 OBJECTIVE

Build role-specific experiences for Companies, Education Providers, and Chamber of Commerce with appropriate dashboards and management tools.

---

## 👥 USER ROLES MATRIX

| Role | Access | Features |
|------|--------|----------|
| **Basic User** | Job Seeker | Full SkillSync functionality (jobs, assessments, programs) |
| **Super Admin** | Global | All admin tools + job seeker functionality |
| **Company Admin** | Company-specific | Manage featured roles, view submissions, company profile |
| **Provider Admin** | Provider-specific | Manage programs catalog, view enrollments, provider profile |
| **Chamber Admin** | Aggregate view | Dashboard with partner analytics, job seeker metrics |

---

## 🔧 IMPLEMENTATION TASKS

### 1. Company Admin Dashboard (6-8 hours)
**File:** `/src/app/company/dashboard/page.tsx`

**Features:**
- [ ] View candidate submissions (from assessments)
  - Filter by role, score threshold
  - Sort by date, score
  - View candidate profile & assessment results
- [ ] Manage featured roles (max 10)
  - Add/edit/delete roles
  - Publish/unpublish toggle
  - Set required proficiency threshold
- [ ] Company profile management
  - Upload/change logo
  - Edit "About Company" copy
  - Manage key highlights
  - Update featured image
  - Edit modal content
- [ ] Analytics dashboard
  - Views on featured roles
  - Assessment submissions count
  - Candidate pipeline metrics

**Database:**
```sql
-- company_submissions (already planned in assessment plan)
CREATE TABLE company_submissions (
  id UUID PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  job_id UUID REFERENCES jobs(id),
  score DECIMAL,
  submitted_at TIMESTAMP,
  status TEXT, -- 'new', 'reviewed', 'contacted', 'rejected'
  reviewed_by UUID,
  reviewed_at TIMESTAMP
);
```

---

### 2. Education Provider Admin Dashboard (6-8 hours)
**File:** `/src/app/provider/dashboard/page.tsx`

**Features:**
- [ ] Manage programs catalog
  - Add/edit/delete programs
  - Set program visibility
  - Update program details (cost, duration, format)
  - Manage skills associations
- [ ] Provider profile management
  - Upload/change logo
  - Edit "About School" copy
  - Manage key highlights
  - Update featured image
  - Edit modal content
- [ ] View RFI submissions (Request for Information)
  - See interested students
  - Contact information
  - Programs of interest
- [ ] Analytics dashboard
  - Program views
  - RFI submissions count
  - Popular programs

**Database:**
```sql
-- rfi_submissions (Request for Information)
CREATE TABLE rfi_submissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES schools(id),
  program_id UUID REFERENCES programs(id),
  submitted_at TIMESTAMP,
  user_email TEXT,
  user_phone TEXT,
  message TEXT,
  status TEXT, -- 'new', 'contacted', 'enrolled', 'declined'
  hubspot_contact_id TEXT, -- HubSpot integration
  sendgrid_email_id TEXT -- Email tracking
);
```

---

### 3. RFI Form & HubSpot Integration (4-5 hours)
**Files:**
- `/src/components/programs/RFIForm.tsx`
- `/src/app/api/rfi/submit/route.ts`
- `/src/lib/services/hubspot-api.ts`

**Flow:**
```
User clicks "Request Info" on program
  ↓
RFI Form modal opens
  ↓
User fills: name, email, phone, message
  ↓
Submit → Store in database
  ↓
Send to HubSpot (create/update contact)
  ↓
Email to provider (Supabase or SendGrid)
  ↓
Email to BISC (notification)
  ↓
Success confirmation
```

**Implementation:**
- [ ] Create RFI form component
- [ ] API route to handle submission
- [ ] HubSpot API integration
  - Create/update contact
  - Add to specific list
  - Track program interest
- [ ] Email notifications
  - To provider (program-specific)
  - To BISC (aggregate notification)
  - Use Supabase Auth email or SendGrid
- [ ] Store submission in database
- [ ] Success/error handling

---

### 4. Chamber of Commerce Dashboard (5-6 hours)
**File:** `/src/app/chamber/dashboard/page.tsx`

**Features:**
- [ ] Aggregate analytics
  - Total job seekers using SkillSync
  - Assessments completed
  - Programs viewed
  - Company submissions
- [ ] Partner performance
  - Company partners: featured roles, submissions
  - Education partners: programs, RFIs
  - Engagement metrics
- [ ] Regional insights
  - Pinellas County job seeker demographics
  - Popular occupations
  - Skills gaps identified
  - Program enrollment trends
- [ ] Export reports (CSV/PDF)

**Data Sources:**
- Aggregate queries across all tables
- Filter by Pinellas County (location-based)
- Time-range filtering (last 30/60/90 days)

---

### 5. Role-Based Access Control (RLS) (3-4 hours)
**File:** `/supabase/migrations/YYYYMMDD_role_based_access.sql`

**Policies:**
```sql
-- Companies can only see their own data
CREATE POLICY "Companies see own data"
ON company_submissions
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM company_admins WHERE user_id = auth.uid()
));

-- Providers can only see their own data
CREATE POLICY "Providers see own data"
ON rfi_submissions
FOR SELECT
USING (provider_id IN (
  SELECT provider_id FROM provider_admins WHERE user_id = auth.uid()
));

-- Chamber sees aggregate (all data)
CREATE POLICY "Chamber sees all"
ON company_submissions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chamber_admin'
));
```

**Implementation:**
- [ ] Create role assignment tables
  - `company_admins` (user_id, company_id)
  - `provider_admins` (user_id, provider_id)
  - `chamber_admins` (user_id, chamber_id)
- [ ] Update profiles table with role field
- [ ] Create RLS policies for each role
- [ ] Test access control

---

### 6. Navigation & Role Detection (2-3 hours)
**File:** `/src/components/layout/Navigation.tsx`

**Logic:**
```typescript
const userRole = await getUserRole(user.id)

switch(userRole) {
  case 'basic_user':
    // Show: Jobs, Programs, Assessments, Dashboard
  case 'company_admin':
    // Show: Company Dashboard, Manage Roles, Submissions
  case 'provider_admin':
    // Show: Provider Dashboard, Manage Programs, RFIs
  case 'chamber_admin':
    // Show: Chamber Dashboard, Analytics, Reports
  case 'super_admin':
    // Show: Everything + Admin Tools
}
```

- [ ] Implement role detection
- [ ] Dynamic navigation based on role
- [ ] Redirect to appropriate dashboard on login
- [ ] Prevent unauthorized access

---

## 🧪 TESTING CHECKLIST

### Company Admin
- [ ] Can view candidate submissions
- [ ] Can manage featured roles (CRUD)
- [ ] Can edit company profile
- [ ] Cannot see other companies' data
- [ ] Analytics display correctly

### Provider Admin
- [ ] Can manage programs (CRUD)
- [ ] Can view RFI submissions
- [ ] Can edit provider profile
- [ ] Cannot see other providers' data
- [ ] Analytics display correctly

### Chamber Admin
- [ ] Can view aggregate analytics
- [ ] Can see all partner data
- [ ] Can export reports
- [ ] Regional filtering works

### RFI Flow
- [ ] Form submission works
- [ ] HubSpot integration works
- [ ] Emails sent correctly
- [ ] Data stored in database

---

## 📦 DELIVERABLES

1. ✅ Company admin dashboard with submissions & role management
2. ✅ Provider admin dashboard with programs & RFI management
3. ✅ Chamber admin dashboard with aggregate analytics
4. ✅ RFI form with HubSpot & email integration
5. ✅ Role-based access control (RLS policies)
6. ✅ Dynamic navigation based on user role

---

## 🚀 SUCCESS CRITERIA

- Each role sees only appropriate data
- Companies can manage roles and view submissions
- Providers can manage programs and view RFIs
- Chamber sees aggregate analytics
- RFI submissions flow to HubSpot and email
- All access control tested and secure

---

## 📋 DEFERRED (Post-Launch)

These features are important but not critical for initial launch:
- Advanced analytics dashboards
- Bulk operations (bulk program import, bulk role publishing)
- Custom reporting
- Email campaign integration
- Advanced filtering/search

---

**Status:** Not Started  
**Priority:** Post-Launch Enhancement  
**Dependencies:** Assessment experience must be complete first  
**Next Action:** Scope can be refined based on launch timeline
