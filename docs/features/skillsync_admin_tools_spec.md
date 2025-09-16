# SkillSync Admin Tools – Extended Spec for Full Entity Data

## 📝 Prompt for Claude Sonnet 4

You are to build the SkillSync Admin Tools as described below. Before creating any code or database actions, you **must review the current SkillSync Supabase schema, RLS (Row-Level Security) policies, and app build** to ensure connections are proper and consistent. Any new properties or tables should be created only if they logically extend the current build. All mock data must live only in the database, never in code.

The Admin Tools UI must be **responsive, intuitive, and follow current SkillSync design patterns** (tables, drilldowns, dialogs, media upload, relationships). Ensure all entities a learner sees (Companies, Featured Roles, High-Demand Occupations, Education Providers, Programs, Assessments) can be fully viewed and edited in Admin Tools. Each admin role should only see scoped data per RLS (Super Admin = global, Company Admin = company only, Provider Admin = provider only).

Deliverable: Implement Admin Tools that provide a complete content management view for all user-facing entities, matching the details learners see in Program Details cards, Role Details cards, and Occupation cards. Support safe data management (explicit Save/Cancel, dirty state guard), destructive actions (confirmation dialogs, type-to-confirm for deletes), and strong security (Supabase RLS enforcement, scoped views, no mock data in code). Support AI assessment generation via pipeline, saving results into DB with status=draft for review. Ensure consistency, reusability, and no duplication of data structures.

---

## 🔎 Entities & Fields to Manage

### 1. **Companies**
Admin must be able to edit everything users see in company cards or role detail screens:
- Name
- Logo
- Profile image (used in models, hero banners, etc.)
- Company description / overview
- Website / external link(s)
- Featured flag (trusted partner badge)
- Attached featured roles (list with inline add/remove)

---

### 2. **Featured Roles**
Admin must be able to edit **all fields visible to learners** (see prototype job detail card【61†source】):
- Role title
- SOC code
- Employer (FK → Company)
- Summary / Role overview
- Employment type (Full-time, Part-time, Contract)
- Category (Skilled Trades, Business, Tech, etc.)
- Required proficiency % (readiness threshold)
- Median salary (regional or national)
- Location
- Skills list (5–8, with ability to add/remove)
- Responsibilities (list of bullet points)
- Education requirements
- Trusted partner badge toggle
- Attached assessment(s)

**Acceptance Criteria (Gherkin)**
- **Given** I am a Super Admin  
  **When** I view a Featured Role detail  
  **Then** I can edit title, SOC code, employer, summary, category, required proficiency score, salary, location, skills, responsibilities, education requirements, trusted partner badge, and attached assessments.  
- **When** I save changes  
  **Then** the updates persist in the DB and update the learner-facing role detail card.

---

### 3. **High-Demand Occupations**
Fields to manage (from prototype & Booklet【61†source】【56†source】):
- Occupation title
- SOC code
- Summary / occupation overview
- Avg earnings (national / regional)
- Growth outlook (%)
- Projected open positions
- Typical education requirements
- Core skills list
- Common responsibilities
- Related job titles
- Linked programs
- Linked featured roles
- Attached assessment(s)

**Acceptance Criteria (Gherkin)**
- **Given** I am a Super Admin  
  **When** I view an Occupation detail  
  **Then** I can edit SOC code, title, overview, salary, growth outlook, open positions, education requirements, skills, responsibilities, related titles, linked programs, linked roles, and attached assessments.

---

### 4. **Education Providers**
Fields:
- Provider name
- Logo
- Website / about link
- Description
- Programs offered (linked table)
- Featured flag

**Acceptance Criteria (Gherkin)**
- **Given** I am a Super Admin  
  **When** I view a Provider detail  
  **Then** I can edit name, logo, about link, description, featured flag, and manage attached programs.

---

### 5. **Education Programs**
Programs must mirror **Program Details card**【61†source】: 
- Program name
- Credential type (Certificate, A.S., A.A., Bachelor’s, etc.)
- Format (Online, Hybrid, In-Person)
- Duration
- Provider (FK → Education Provider)
- Summary / description
- Skills provided (list of skills mapped to SOC)
- Link to program page (external URL)
- Featured flag
- About School link

**Acceptance Criteria (Gherkin)**
- **Given** I am a Super Admin  
  **When** I view a Program detail  
  **Then** I can edit program name, credential type, format, duration, summary, skills list, external links, featured flag, and provider relationship.

---

### 6. **Assessments**
Assessments should support both content and metadata:
- Assessment name
- Linked occupation(s) / SOC code(s)
- Linked role(s) if specific
- Question bank (full editing: prompt, type, choices, answer, weight, order)
- Workflow status (draft / published)
- AI pipeline button to generate draft assessments
- Usage rollup (where this assessment is applied: which roles, which companies)

**Acceptance Criteria (Gherkin)**
- **Given** I am a Super Admin  
  **When** I view an Assessment detail  
  **Then** I can edit its name, linked occupations, linked roles, workflow status, and question bank.  
- **When** I run the AI pipeline  
  **Then** a draft assessment is created and stored in the DB with editable questions.  
- **When** I check Usage rollup  
  **Then** I see all linked roles and companies that apply this assessment.

---

## 🧭 Admin UI Requirements

### Table Views (per entity)
- Show all key user-facing fields in the grid, not just identifiers.  
  Example: Program grid shows **Program Name, Provider, Format, Duration, Featured, Skills Count**.  
- Bulk actions: feature/unfeature, archive, publish.

### Drilldown Detail Views
- Tabs per entity (Overview, Media, Skills, Relationships, Metadata, History).
- Every field a learner can see must be editable in the admin view.  
- Save/Cancel explicit. Dirty state guard.  

### Relationships
- Add/remove links between entities in **Relationships tab**:
  - Programs ↔ Occupations
  - Roles ↔ Companies
  - Roles ↔ Assessments
  - Providers ↔ Programs

### Media
- Upload/replace images/logos with validation (format, size).
- Preview before save.

---

## ✅ Acceptance Criteria (General Pattern)
- **Given** I am a Super Admin  
  **When** I view any entity detail  
  **Then** I can edit every field visible to learners.  
- **When** I click Save  
  **Then** changes persist in DB and update the learner-facing cards and detail views.  
- **When** I attempt a destructive action  
  **Then** I must confirm via dialog before proceeding.

---

## 🚨 Non-Negotiables
- No field duplication between Admin DB and learner-facing DB: all data must come from the same tables.  
- No mock data in code: seed any placeholder content inside DB tables.  
- Supabase RLS must scope correctly so that:  
  - Super Admin sees global view.  
  - Company Admin sees only their company + roles.  
  - Education Provider Admin sees only their institution + programs.

