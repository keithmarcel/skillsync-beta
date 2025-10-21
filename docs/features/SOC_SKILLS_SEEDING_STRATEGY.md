# SOC Skills Seeding Strategy

## Overview
Comprehensive seeding plan for all 38 current SOC codes (8 featured roles + 30 HDOs) to populate the `soc_skills` table with curated, searchable skills.

## Strategy
1. **O*NET Baseline** - Pull core occupational skills
2. **Lightcast Enhancement** - Add industry-standard tools/tech
3. **Common Tech Stack** - Include widely-used software/platforms
4. **Certifications** - Add relevant professional certifications
5. **Methodologies** - Include frameworks (Agile, Six Sigma, etc.)

## Skill Categories by SOC Code

### Featured Roles (8)

#### 43-6014.00 - Administrative Assistant
**Core Skills:** Microsoft Office, Email Management, Calendar Management, Data Entry, Filing, Customer Service, Phone Etiquette, Meeting Coordination, Travel Arrangements, Document Preparation

**Tech Stack:** Outlook, Excel, Word, PowerPoint, Google Workspace, Zoom, Slack, Salesforce, SAP, Oracle

**Soft Skills:** Communication, Organization, Time Management, Attention to Detail, Multitasking

**Total:** ~25 skills

#### 11-2022.00 - Business Development Manager
**Core Skills:** Sales Strategy, Lead Generation, CRM, Market Research, Proposal Writing, Contract Negotiation, Pipeline Management, Revenue Forecasting

**Tech Stack:** Salesforce, HubSpot, LinkedIn Sales Navigator, Dynamics, Tableau, Power BI, Excel Advanced

**Total:** ~20 skills

#### 11-9021.00 - Construction Managers
**Core Skills:** Project Management, Construction Planning, Budget Management, Schedule Management, Quality Control, Safety Management, Contract Administration

**Tech Stack:** AutoCAD, Revit, Procore, MS Project, Primavera P6, BIM, Bluebeam, PlanGrid

**Certifications:** OSHA 30-Hour, PMP, LEED

**Total:** ~25 skills

#### 13-2051.00 - Financial Analyst
**Core Skills:** Financial Modeling, Financial Reporting, Variance Analysis, Budgeting & Forecasting, Data Analysis, KPI Development

**Tech Stack:** Excel Advanced, SQL, Python, R, Tableau, Power BI, SAP, Oracle, QuickBooks, Bloomberg Terminal

**Total:** ~25 skills

#### 41-1012.00 - Sales Supervisor
**Core Skills:** Team Leadership, Sales Coaching, Performance Management, Sales Training, Territory Management, Sales Reporting

**Tech Stack:** Salesforce, CRM Systems, Excel, Power BI, Sales Analytics

**Total:** ~18 skills

#### 29-2055.00 - Surgical Technologist
**Core Skills:** Surgical Procedures, Sterile Technique, Instrument Handling, Patient Positioning, Surgical Equipment Setup, Infection Control

**Certifications:** CST, BLS, ACLS

**Total:** ~15 skills

### High-Demand Occupations (30)

#### 15-1252.00 - Software Developers
**Core Skills:** Software Development, Programming, Code Review, Debugging, Testing, Version Control, API Development, Database Design

**Tech Stack:** JavaScript, Python, Java, C#, React, Node.js, SQL, Git, Docker, Kubernetes, AWS, Azure, TypeScript, .NET, Angular, Vue.js, MongoDB, PostgreSQL

**Methodologies:** Agile, Scrum, DevOps, CI/CD, TDD, Microservices, RESTful APIs

**Certifications:** AWS Certified, Azure Certified, Google Cloud Certified

**Total:** ~40 skills

#### 13-1082.00 - Project Management Specialists
**Core Skills:** Project Planning, Schedule Management, Budget Management, Risk Management, Stakeholder Management, Resource Allocation, Team Leadership

**Tech Stack:** MS Project, Jira, Asana, Monday.com, Smartsheet, Excel, Confluence, MS Teams, Slack

**Methodologies:** Agile, Scrum, Kanban, Waterfall, Lean, Six Sigma

**Certifications:** PMP, CAPM, CSM, PMI-ACP

**Total:** ~30 skills

#### 29-1141.00 - Registered Nurses
**Core Skills:** Patient Assessment, Medication Administration, Patient Care, IV Therapy, Wound Care, Patient Education, Clinical Documentation, Emergency Response

**Certifications:** RN License, BLS, ACLS, PALS, Specialty Certifications

**Tech Stack:** EHR (Epic, Cerner), Medical Devices, Charting Systems

**Total:** ~20 skills

#### 13-2011.00 - Accountants and Auditors
**Core Skills:** Financial Accounting, Tax Preparation, Auditing, GAAP, Financial Reporting, Account Reconciliation, General Ledger

**Tech Stack:** QuickBooks, SAP, Oracle, Excel, NetSuite, Xero, Tax Software

**Certifications:** CPA, CMA, CIA

**Total:** ~20 skills

## Implementation Plan

### Phase 1: Seed Core Skills (Week 1)
- Run seeding script for all 38 SOC codes
- ~800-1000 total skills added
- Verify no duplicates

### Phase 2: AI Enhancement (Week 2)
- Generate descriptions for skills without them
- Calculate importance weights
- Categorize skills properly

### Phase 3: Validation (Week 3)
- Test manual selector with seeded skills
- Verify crosswalk integrity (jobs ↔ programs ↔ skills)
- Ensure assessment engine compatibility

## Expected Results

**Total Skills in Taxonomy:** ~1,500-2,000 curated skills
**Skills per SOC:** 15-40 (varies by complexity)
**Searchable:** All skills available in manual selector
**Self-Reinforcing:** Pool grows as more HDOs are curated

## Benefits

✅ **Immediate Usability** - Manual selector has comprehensive pool
✅ **Company-Specific** - Can add Salesforce, React, specific tools
✅ **Crosswalk Ready** - All skills work with job-program matching
✅ **Assessment Compatible** - All skills have weights for quizzes
✅ **Enterprise Ready** - Professional, curated taxonomy

## Next Steps

1. Review and approve skill lists
2. Run seeding script
3. Test manual selector
4. Begin curating HDOs with AI extractor
5. Pool grows organically from there

---

**Note:** This is a living document. Skills will be added/refined as companies use the system and provide feedback.
