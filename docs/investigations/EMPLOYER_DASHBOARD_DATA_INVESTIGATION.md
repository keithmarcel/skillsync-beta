# Employer Dashboard Data Investigation

**Date:** October 16, 2025 12:21 AM  
**Purpose:** Investigate actual database schema and available data for building employer dashboard  
**Company:** Power Design (test data)

---

## 🔍 Investigation Summary

### Approach
1. Checked actual database schema using `information_schema.columns`
2. Avoided assumptions - queried real column names
3. Verified data availability for all dashboard metrics
4. Documented findings for accurate dashboard implementation

### Key Finding
**Schema mismatch between code assumptions and actual database:**
- Code referenced `city`, `state` → Actual: `hq_city`, `hq_state` (companies)
- Code referenced `location_city`, `location_state` → Actual: `location_city`, `location_state` (jobs)
- Companies table has NO `created_at` column
- Jobs table HAS `created_at` column

---

## 📊 Database Schema (Actual)

### Companies Table
```
id                  uuid
name                text
logo_url            text
is_trusted_partner  boolean
hq_city             text
hq_state            text
revenue_range       text
employee_range      text
industry            text
bio                 text
company_image_url   text
is_published        boolean
custom_quiz_enabled boolean
featured_image_url  text
```

**Note:** NO `created_at` or `updated_at` columns

### Jobs Table (Featured Roles)
```
id                          uuid
job_kind                    USER-DEFINED (enum)
title                       text
soc_code                    text
company_id                  uuid
job_type                    text
category                    text
location_city               text
location_state              text
median_wage_usd             numeric
long_desc                   text
featured_image_url          text
skills_count                integer
is_featured                 boolean
employment_outlook          text
education_level             text
work_experience             text
on_job_training             text
job_openings_annual         integer
growth_rate_percent         numeric
created_at                  timestamp with time zone
updated_at                  timestamp with time zone
status                      text
quiz_id                     uuid
core_responsibilities       text
growth_opportunities        text
team_structure              text
work_environment            text
travel_requirements         text
performance_metrics         text
training_provided           text
onet_code                   text
bright_outlook              text
bright_outlook_category     text
video_url                   text
tasks                       jsonb
tools_and_technology        jsonb
required_proficiency_pct    numeric
application_url             text
visibility_threshold_pct    numeric
short_desc                  text
is_published                boolean
assessments_count           integer
related_job_titles          ARRAY
work_location_type          text
median_wage_manual_override boolean
seo_title                   text
meta_description            text
og_title                    text
og_description              text
og_image                    text
slug                        text
```

### Employer_Invitations Table
```
id                      uuid
user_id                 uuid
company_id              uuid
job_id                  uuid
assessment_id           uuid
proficiency_pct         numeric
application_url         text
message                 text
status                  varchar
is_read                 boolean
invited_at              timestamp without time zone
viewed_at               timestamp without time zone
responded_at            timestamp without time zone
archived_at             timestamp without time zone
archived_by             varchar
created_at              timestamp without time zone
updated_at              timestamp without time zone
is_read_by_employer     boolean
status_before_archive   text
```

### Profiles Table (Candidates)
```
id                          uuid
first_name                  text
last_name                   text
zip                         text
avatar_url                  text
role                        USER-DEFINED
phone                       text
company_name                text
job_title                   text
linkedin_url                text
email                       text
zip_code                    text
agreed_to_terms             boolean
created_at                  timestamp with time zone
updated_at                  timestamp with time zone
admin_role                  text
company_id                  uuid
school_id                   uuid
max_programs                integer
max_featured_programs       integer
max_featured_roles          integer
is_mock_user                boolean
bio                         text
visible_to_employers        boolean
notif_in_app_invites        boolean
notif_in_app_new_roles      boolean
notif_email_new_roles       boolean
notif_email_invites         boolean
notif_email_marketing       boolean
notif_email_security        boolean
notif_all_disabled          boolean
```

---

## 📈 Available Data (Power Design)

### Candidate Activity Sample (Recent 10)
| Status   | Candidate        | Role                                 | Proficiency | Created    | Invited    | Responded  | Read by Employer |
|----------|------------------|--------------------------------------|-------------|------------|------------|------------|------------------|
| sent     | Aaliyah Ramirez  | Mechanical Assistant Project Manager | 91%         | 2025-10-13 | 2025-10-16 | -          | No               |
| applied  | Fatima Nguyen    | Mechanical Project Manager           | 87%         | 2025-10-11 | 2025-10-12 | 2025-10-14 | No               |
| pending  | Naomi Blake      | Mechanical Project Manager           | 96%         | 2025-10-10 | 2025-10-11 | 2025-10-14 | No               |
| sent     | Elias Thorne     | Mechanical Project Manager           | 98%         | 2025-10-12 | 2025-10-13 | -          | No               |
| pending  | Emanuel Highgate | Mechanical Assistant Project Manager | 95%         | 2025-10-13 | -          | -          | No               |
| hired    | Keith Woods      | Mechanical Assistant Project Manager | 92%         | 2025-10-12 | 2025-10-13 | -          | No               |
| hired    | Emanuel Highgate | Mechanical Project Manager           | 97%         | 2025-10-04 | 2025-10-06 | 2025-10-13 | Yes              |
| pending  | Naomi Blake      | Mechanical Assistant Project Manager | 99%         | 2025-10-12 | -          | -          | No               |
| archived | Keith Woods      | Mechanical Project Manager           | 88%         | 2025-10-08 | 2025-10-16 | 2025-10-12 | No               |
| pending  | Aaliyah Ramirez  | Mechanical Project Manager           | 85%         | 2025-10-08 | 2025-10-09 | -          | No               |

### Status Breakdown
- **pending**: 4 candidates (need to send invitation)
- **sent**: 2 candidates (invitation sent, awaiting response)
- **applied**: 1 candidate (responded - applied)
- **hired**: 2 candidates (hired)
- **archived**: 1 candidate (archived)

### Roles
- **Mechanical Project Manager** (d54487a3-8fe0-4de9-ba89-f8c131285138)
- **Mechanical Assistant Project Manager** (7dd7ace3-f5ef-4448-9c71-0070bbdee9b3)

---

## 🎯 Dashboard Metrics Available

### Key Metrics (Metric Cards)
1. **Active Roles** - Count of published featured roles
2. **Total Candidates** - All candidates in pipeline (any status)
3. **Pending Invitations** - Candidates with status='pending' (ready to invite)
4. **Applications Received** - Candidates with status='applied'
5. **Candidates Hired** - Candidates with status='hired'
6. **Invitations Sent** - Candidates with status='sent' (awaiting response)

### Activity Metrics
- **New Candidates (7 days)** - Candidates created in last 7 days
- **New Applications (7 days)** - Applications received in last 7 days
- **Unread Responses** - Candidates who applied/declined but not read by employer

### Per-Role Breakdown
- Candidate count per role
- Status distribution per role
- Performance indicators

---

## 🔧 Queries Created

### 1. Schema Check Query
**File:** `/scripts/check-employer-dashboard-schema.sql`
- Queries `information_schema.columns` for actual column names
- Prevents assumptions and errors

### 2. Dashboard Metrics Query
**File:** `/scripts/get-employer-dashboard-metrics.sql`
- Main metrics (roles, candidates, invitations, applications, hires)
- Breakdown by role
- Recent activity feed (last 10 interactions)
- Uses actual column names from schema investigation

---

## 💡 Key Insights for Dashboard Design

### 1. Status Flow
```
pending → sent → applied/declined → hired/unqualified → archived
```

### 2. Unread Notifications
- Use `is_read_by_employer` flag
- Filter for status IN ('applied', 'declined')
- Show badge count on dashboard

### 3. Activity Feed
- Sort by most recent activity (responded_at, invited_at, or created_at)
- Show candidate name, avatar, role, status, proficiency
- Limit to 10 most recent

### 4. Quick Actions Needed
- "Invite Candidates" (navigate to pending candidates)
- "Review Applications" (navigate to applied candidates)
- "Create New Role" (navigate to role editor)

### 5. Metric Card Icons (Lucide)
- **Active Roles**: Briefcase
- **Total Candidates**: Users
- **Pending Invitations**: Send
- **Applications**: FileText
- **Hired**: UserCheck
- **Invitations Sent**: Mail

---

## 🎨 Design Patterns to Follow

### From SkillSync Snapshot Component
```typescript
// Metric Card Pattern
<Card>
  <CardContent className="flex flex-col p-6">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium">Metric Label</p>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <p className="text-xs text-muted-foreground">Description</p>
  </CardContent>
</Card>
```

### Grid Layout
```typescript
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* 4 metric cards */}
</div>
```

### SkillSync Palette
- **Teal Primary**: #0694A2 (buttons, badges)
- **Teal Hover**: #036672
- **Green Success**: #10B981 (hired, ready)
- **Orange Warning**: #F59E0B (pending, almost there)
- **Red Error**: #EF4444 (declined, unqualified)
- **Gray Neutral**: #6B7280 (muted text)

---

## ✅ Next Steps

1. **Create Dashboard Service**
   - File: `/src/lib/services/employer-dashboard.ts`
   - Functions: `getDashboardMetrics()`, `getRecentActivity()`, `getRoleBreakdown()`

2. **Build Dashboard Component**
   - File: `/src/components/employer/employer-dashboard.tsx`
   - Metric cards (4 columns)
   - Quick actions section
   - Recent activity feed
   - Role performance cards

3. **Ensure Consistency**
   - Use same queries as admin tools
   - Match employer roles table patterns
   - Follow SkillSync design system

---

## 📝 Files Referenced

### Admin Tools (for consistency)
- `/src/app/admin/roles/[id]/page.tsx` - Role editor schema
- `/src/app/admin/companies/[id]/page.tsx` - Company schema
- `/src/components/employer/employer-roles-table.tsx` - Roles table queries

### UI Patterns
- `/src/components/ui/skillsync-snapshot.tsx` - Metric card pattern
- `/src/components/ui/card.tsx` - Card component
- `/src/components/employer/employer-invites-table-v2.tsx` - Invitations table

### Queries
- `/scripts/check-employer-dashboard-schema.sql` - Schema investigation
- `/scripts/get-employer-dashboard-metrics.sql` - Dashboard data queries

---

**Investigation Complete** ✅  
**Ready to Build:** Employer Dashboard with accurate data and consistent patterns
