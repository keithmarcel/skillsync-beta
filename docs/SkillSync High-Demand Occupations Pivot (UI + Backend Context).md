# SkillSync High-DemandOccupations Pivot (UI + Backend Context)

**Status:** In Progress  
**Branch:** `feature/high-demand-occupations-updates`  
**Updated:** October 9, 2025

## Context

SkillSync's High-DemandOccupations (HDO) section is being redefined. Previously, the HDO Tab and HDO Details Page were wired directly into the assessment flow, allowing users to take skills assessments for generic occupations. That behavior is being deprecated in favor of a more data-driven discovery experience that surfaces regional insight and direct crossover with Featured Roles (Hiring Now) posted by employers.

**Key Terminology:**
- **Jobs** = Overarching bucket (includes both Occupations and Roles)
- **Occupations** = High-demand occupations (HDO) - general job outlines, labor market data
- **Roles** = Featured Roles - company-sponsored, employer-paid positions
- **Flow:**Occupations → Roles → Assessments → Role Readiness

This pivot has multiple phases:

Phase 1 — UI and Routing Update (Disconnect HDO from Assessments)

Goal:

Changes:

🧩 UI / Front-End

### HDO Tab (Table View)

**✅ Remove:**
- "Take Assessment" from Actions menu
- "Upload your resume and take a skills assessment" from Actions menu
- Separators in Actions menu
- **AVG Salary** column
- **Role Readiness** column

**✅ Add:**
- **Related Jobs** column
  - Badge display: "4 Open Roles"
  - Click behavior: Navigate to occupation details page with smooth scroll to `#open-roles`
  - Data: Count of Featured Roles with matchingSOC code
  
- **Education & Training** column
  - Badge display: "4 Matches"
  - Click behavior: Navigate to occupation details page with smooth scroll to `#programs`
  - Data: Count of programs with overlapping skills

**📝 Note:** Category/industry column already exists - no changes needed”

HDO Details Page:

Remove assessment entrypoints entirely.

{{ ... }}

Employers Hiring Now – a list of featured roles whose soc_code matches this occupation.

Relevant Programs – based on shared skill overlap.

Career Video – existing CareerOneStop embed remains.

Add the standardized data source citation footer (BLS, CareerOneStop, O*NET).

Ensure all UI action menus (contextual buttons, dropdowns, etc.) exclude “Take Assessment.”

Routing Logic:

HDO items route only to OccupationDetails (not to Assessment).

Featured Roles remain the only entrypoint for assessments.

Phase 2 — Backend / Schema Refactor and Admin Tools Rewiring

Goal:
Migrate all assessment generation, skills extraction, and quiz logic from HDO → Featured Roles, while preserving the original engine for legacy reference and ongoing HDO enrichment.

Changes:

⚙️ Backend / Schema

Duplicate Skills Extractor Engine:

Retain the current HDO-based skills_extractor logic and data structure.

Create a duplicate instance specifically for Featured Roles (e.g., skills_extractor_featured).

Both can use the same BLS/O*NET logic, but must draw SOC codes from different sources:

HDO → high_demand_occupations.soc_code

Featured Roles → featured_roles.soc_code

Featured Roles extractor should allow per-employer customization, pulling their chosen SOC code as the seed for skills extraction.

Schema Updates:

Ensure featured_roles table includes:

soc_code

required_proficiency_threshold

auto_invite_threshold

skills (array or JSONB from skills extractor)

related_program_ids

Add indexes on soc_code to support cross-referencing between Featured Roles and High-Demand Occupations for the overlap logic.

Admin Tools:

Update the Employer Admin dashboard:

Ensure each featured role has an editable SOC Code field.

Validate that all user-facing fields (role title, description, salary, skills, category) are present and editable.

Update system logic so that skills extraction pulls from Featured Role SOC codes instead of HDO ones.

Assessment + Quiz Engine:

No longer triggered from High-Demand Occupations.

Now triggered only from Featured Role detail pages.

Maintain full parity in results storage (assessment_results, skills_snapshot, etc.) so reporting and dashboards remain consistent.

Phase 3 (Later) — Optional Enhancements

(Claude doesn’t need to execute now but should keep in view for future planning)

Introduce a “High-Demand Career Insights” dashboard summarizing which occupations have the strongest crossover with current Featured Roles.

Add recommendation logic: “Based on your completed assessments, here are related high-demand careers and programs.”

Expand data enrichment for HDO using additional BLS APIs (growth rate, projected demand).

Key Outcomes

Once complete:

High-Demand Occupations become an exploratory learning view, not an assessment module.

Featured Roles become the exclusive driver of assessments, skills extraction, and AI quiz generation.

The Skills Extractor Engine supports dual contexts (regional occupations and live roles) with isolated schemas.

The system architecture stays modular, maintaining a clean separation between static labor market data (HDO) and dynamic employer content (Featured Roles).


---

High-Demand Occupation Details Page Requirements

Goal:
Transform each occupation’s detail view into an informational intelligence hub that connects regional labor market data with live employer demand and educational pathways — without any assessment functionality.

Expected Outputs:

Core Content

Occupation Title, Description, and Category

BLS Average Salary (optional, footer-cited only)

Employment Outlook (optional if BLS data exists)

CareerOneStop video embed for that SOC code

Dynamic Overlap Blocks

Employers Hiring Now

Display Featured Roles (Hiring Now jobs) whose soc_code matches the current occupation’s SOC code.

Each entry shows company logo, role title, and “View Details” button linking to the Featured Role detail page.

If no overlap exists, show placeholder text: “No active roles currently match this occupation.”

Relevant Education Programs

Display programs that share overlapping skills with this occupation.

Overlap determined via intersection of skills arrays between programs.skills and occupations.skills.

Each entry includes:

Program Title

Provider Name

Skill Overlap Count (e.g., “8 skills in common”)

“View Program” button linking to Program Details page

If no overlaps found, display: “No matching programs currently available in your region.”

Data Source Footer

Uniform footer on every HDO Details page:

Data source: BLS 2022; CareerOneStop; ONET*
Links open in new tab.

Routing Logic

“View Details” → navigates to HDO Details (/occupations/:socCode).

“View Program” → navigates to Program Details (/programs/:id).

“View Role” → navigates to Featured Role Detail (/jobs/:id).

Technical Expectation:

Introduce a crosswalk view or join table that relates occupations.soc_code → featured_roles.soc_code and occupations.skills → programs.skills.

This crosswalk powers both the Employers Hiring Now and Relevant Education Programs sections dynamically.

No assessments or quizzes may appear on this page.


---

🔹 Acceptance Checklist (Success Signals)

Navigating to any HDO record → never launches an assessment.

HDO tab shows Employer and Program counts based on SOC cross-references.

Featured Role details → launch assessment → writes to assessment_results.

Employer Admin can edit SOC codes and see linked Preferred Programs.

Skills Extractor for Featured Roles operates on role SOC codes, not HDO codes.

Legacy HDO skills data remains untouched and queryable.