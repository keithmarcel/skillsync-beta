# SkillSync

A comprehensive skills assessment and career development platform connecting job seekers, employers, and education providers in Pinellas County, FL.

## 🎯 Features

### For Job Seekers
- **Skills Assessments** - Resume upload or interactive quiz (4,771 questions)
- **Job Matching** - Featured roles + high-demand occupations (30 occupations)
- **Program Recommendations** - 222 educational programs matched to skill gaps
- **Employer Invitations** - Auto-populated based on proficiency threshold
- **Career Dashboard** - Personalized snapshot with interactive charts

### For Employers
- **Qualified Candidates** - Auto-discover candidates meeting proficiency threshold
- **Invitation System** - Direct outreach to pre-qualified talent
- **Skills Validation** - O*NET-compliant assessment results

### For Education Providers
- **Targeted Enrollment** - Match programs to actual skill gaps
- **RFI Management** - Receive inquiries from qualified candidates
- **Partnership Opportunities** - Integration with workforce development

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **Charts:** Recharts for data visualization
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** OpenAI for skills extraction and content generation
- **APIs:** O*NET, BLS, CareerOneStop, Lightcast

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your API keys in `.env.local`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Setup

1. Import the schema from `docs/db/supabase_schema.sql`
2. Import seed data CSVs (when available)
3. Deploy Edge Functions for LLM operations

## 🏗️ Architecture

### Key Components
- **Unified Jobs Table** - `job_kind` enum (featured_role/occupation)
- **Skills Taxonomy** - 34,863 skills (62 O*NET + 34,796 Lightcast)
- **Question Bank** - 4,771 AI-generated questions with 3-layer weighting
- **CIP↔SOC Crosswalk** - Programs→occupations mapping
- **Assessment System** - Deterministic scoring with proficiency bands
- **Program Matching** - 60%+ threshold for quality recommendations

### Data Pipelines
1. **O*NET → Skills** - Standard occupation skills
2. **CIP → SOC → Skills** - Program enrichment
3. **Assessment → Gap → Programs** - Personalized recommendations
4. **Proficiency → Invitations** - Auto-populate employer opportunities

## 📊 Current Status

**Version:** 1.0.0-beta  
**Status:** 🚀 Production Ready

- ✅ All core features implemented
- ✅ 100% data population (30 occupations, 222 programs)
- ✅ Multi-role authentication (job seekers, employers, providers, admins)
- ✅ Homepage redesign with interactive charts
- ✅ Comprehensive testing and documentation

See `/docs/PROJECT_STATUS.md` for detailed status.

## 📚 Documentation

- **Project Status:** `/docs/PROJECT_STATUS.md`
- **Technical Architecture:** `/docs/skill-sync-technical-architecture.md`
- **Sprint Roadmap:** `/docs/SPRINT_ROADMAP.md`
- **Style Guide:** `/docs/STYLE_GUIDE.md`

## 🤝 Contributing

This is a private project for Hire St. Pete/Clearwater. For questions or access, contact the development team.
