# Quick Start Guide - Next Development Session

**Last Updated:** October 2, 2025 - 4:13 AM  
**Current Status:** Backend 100% Complete, Ready for Multi-Stakeholder Platform Phase  
**Next Phase Duration:** 3-4 weeks (4 sprints)

---

## 🎯 What We're Building

**Objective:** Transform SkillSync from single-user assessment tool into **three-sided marketplace**

**Stakeholders:**
1. **Job Seekers** - Take assessments, receive employer invitations, find programs
2. **Employers** - Post roles, view qualified candidates, send invitations
3. **Education Providers** - Manage programs, receive RFIs, track leads

---

## 📚 Documentation Structure

### Start Here
1. **SPRINT_ROADMAP.md** - 4-sprint plan with daily breakdown
2. **PRE_ASSESSMENT_FEATURES.md** - All 9 features overview
3. **FEATURE_SYNTHESIS_AND_PRIORITY.md** - Strategic analysis and dependencies

### Detailed Specs (Read Before Building)
4. **MULTI_ROLE_AUTH_SPEC.md** - User roles, invitations, dashboards
5. **EMPLOYER_INVITATIONS_SPEC.md** - Candidate discovery, invitation flow
6. **UI_IMPROVEMENTS.md** - Spinner component, CTA cards

---

## ✅ Approved Decisions

### Employer Invitation Flow
**Decision:** Option B - Auto-visible with opt-out
- Users automatically visible to employers if score >= 85%
- Privacy setting to opt-out (default: ON)
- No manual submission required

### Proficiency Threshold
**Decision:** Dual threshold system
- **Display Threshold: 90%** - User sees "Role Ready" badge
- **Visibility Threshold: 85%** - Employer can see candidate
- User Experience:
  - <85%: "Keep Learning" (not visible)
  - 85-89%: "Building Proficiency" (visible to employers)
  - 90%+: "Role Ready" (visible to employers)

### Notification System
**Decision:** Start with Supabase, migrate to SendGrid later if needed

### Account Limits
**Decision:**
- Provider Admin: 300 programs max, 50 featured max
- Employer Admin: 10 featured roles max
- Super Admin: No limits
- All configurable per account

---

## 🚀 Sprint 1: Start Here (Week 1)

**Duration:** 5-6 days  
**Branches:** `feature/multi-role-user-auth` + `feature/user-account-settings`

### Day 1-4: Multi-Role User Management

**Database First:**
```sql
-- Update profiles table
ALTER TABLE profiles
ADD COLUMN role VARCHAR DEFAULT 'user',
ADD COLUMN company_id UUID REFERENCES companies(id),
ADD COLUMN school_id UUID REFERENCES schools(id),
ADD COLUMN linkedin_url TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN max_programs INTEGER,
ADD COLUMN max_featured_programs INTEGER,
ADD COLUMN max_featured_roles INTEGER;

-- Create admin_invitations table
CREATE TABLE admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role VARCHAR NOT NULL,
  company_id UUID REFERENCES companies(id),
  school_id UUID REFERENCES schools(id),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  status VARCHAR DEFAULT 'pending'
);
```

**Then Build:**
1. Invitation service (send, accept, validate)
2. RLS policies (provider/employer scoped access)
3. Super Admin invitation UI
4. Provider Admin dashboard (`/provider`)
5. Employer Admin dashboard (`/employer`)
6. Invitation acceptance page

**Mockups Required Before Starting:**
- [ ] Provider Admin dashboard layout
- [ ] Employer Admin dashboard layout
- [ ] Admin invitation form
- [ ] Invitation acceptance page
- [ ] Invitation email template

### Day 5-6: User Account Settings

**Build:**
1. Settings page (`/settings`)
2. Profile section (name, LinkedIn)
3. Avatar upload (Supabase Storage)
4. Notification preferences
5. Privacy settings (employer visibility)
6. Change email/password flows

**Mockups Required:**
- [ ] Settings page layout (all sections)
- [ ] Avatar upload component
- [ ] Notification preferences UI

---

## 🔑 Critical Reminders

### Before Starting ANY Feature:
1. ✅ **Get mockups first** - Don't build without them
2. ✅ **Create feature branch** - Never work on main
3. ✅ **Read detailed spec** - See MULTI_ROLE_AUTH_SPEC.md, etc.
4. ✅ **Test before commit** - Verify everything works
5. ✅ **Get approval before merge** - Show progress first

### During Development:
- Commit frequently with clear messages
- Test with multiple user roles
- Verify RLS policies (security critical)
- Check mobile responsive
- No console errors

### Testing Strategy:
Create test accounts for all roles:
- Super Admin: keith-woods@bisk.com (existing)
- Provider Admin: test-provider@example.com
- Employer Admin: test-employer@example.com
- Basic User: test-user@example.com

---

## 📊 Progress Tracking

### Sprint 1: Foundation ⏳
- [ ] Multi-role user management
- [ ] User account settings

### Sprint 2: Core Features ⏳
- [ ] Employer invitation system
- [ ] Notification center

### Sprint 3: Enhancements ⏳
- [ ] Company profile management
- [ ] Program details page with RFI
- [ ] Homepage snapshot redesign

### Sprint 4: Polish ⏳
- [ ] Assessment UI update
- [ ] Mock user generation
- [ ] Integration testing

### UI Polish (Anytime) ⏳
- [ ] Custom spinner component (spinners-react)
- [ ] Dashboard CTA cards with images

---

## 🚨 Known Issues (Deferred)

### Admin Tools
1. **Skills table pagination overflow** - Table scrolls into empty space
   - Status: Deferred to future session
   - Not blocking current work
   - All other admin tools functional

2. **Recent Activity widget** - May show "System" instead of user names
   - Status: Minor issue, schema cache join problem
   - Core functionality works
   - Not blocking

---

## 📁 File Locations

### Documentation
- `/docs/features/` - All feature specs
- `/docs/SPRINT_ROADMAP.md` - Sprint plan
- `/docs/COMPLETE_SYSTEM_STATUS.md` - Current system state

### Backend
- `/src/lib/services/` - Business logic services
- `/src/lib/database/queries.ts` - Database queries
- `/src/hooks/` - React hooks

### Frontend
- `/src/app/(main)/` - User-facing pages
- `/src/app/admin/` - Super Admin tools
- `/src/app/provider/` - Provider Admin (to create)
- `/src/app/employer/` - Employer Admin (to create)
- `/src/components/` - Reusable components

### Scripts
- `/scripts/` - Database scripts, migrations, utilities

---

## 🎬 First Steps in Next Session

1. **Review all documentation** (30 min)
   - Read SPRINT_ROADMAP.md
   - Read MULTI_ROLE_AUTH_SPEC.md
   - Understand dependencies

2. **Request mockups** (before coding)
   - Provider Admin dashboard
   - Employer Admin dashboard
   - Admin invitation form
   - User settings page
   - Avatar upload component

3. **Create branch**
   ```bash
   git checkout -b feature/multi-role-user-auth
   ```

4. **Start with database**
   - Create migration file
   - Update profiles table
   - Create admin_invitations table
   - Test locally

5. **Build incrementally**
   - Backend services first
   - RLS policies next
   - Frontend components last
   - Test continuously

---

## 💡 Key Context from Memories

### Existing Systems to Integrate With:
- ✅ **Assessment Proficiency Engine** - 90% threshold filtering already exists
- ✅ **Skills Gap Precision Engine** - Lightcast + O*NET hybrid
- ✅ **Question Bank System** - 4,771 questions across 30 occupations
- ✅ **Program Enrichment** - 222 programs with CIP→SOC→Skills mapping
- ✅ **Corporate Pre-qualification** - Already filters 90%+ candidates

### Alignment with Previous Specs:
- Company Admins = Employer Admins (max 10 featured roles) ✅
- Provider Admins (max 300 programs) ✅
- Draft/publish workflow exists for roles ✅
- AI pipeline for skills exists ✅

---

## 🎯 Success Metrics

**After 4 Sprints:**
- [ ] 4 user roles working (user, super_admin, provider_admin, employer_admin)
- [ ] Provider/Employer dashboards functional
- [ ] Invitation system complete (send, receive, respond)
- [ ] Notification center with header icon
- [ ] User settings with avatar upload
- [ ] Program details with RFI form
- [ ] Homepage redesigned with graphs
- [ ] 20-30 mock users for demos
- [ ] All features mobile responsive
- [ ] Zero security vulnerabilities (RLS tested)

**Then:** Return to assessment testing and final UI integration

---

*This guide provides everything needed to start the next development session with full context. All decisions are documented and approved.*
