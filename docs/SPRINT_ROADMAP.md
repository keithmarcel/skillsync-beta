# SkillSync Sprint Roadmap

**Updated:** October 2, 2025 - 7:00 PM  
**Current Sprint:** Multi-Stakeholder Platform - Sprint 1 In Progress  
**Status:** 🎉 Backend Complete + Account Settings Complete

## 🎯 **MAJOR MILESTONE: Backend Complete**

**Completed October 1-2, 2025:**
- ✅ **O*NET Skills Pipeline** - 30/30 occupations (100%)
- ✅ **Question Bank System** - 4,771 questions generated
- ✅ **Program Enrichment** - 222/222 programs (100%)
- ✅ **CIP→SOC→Skills Pipeline** - Fully validated
- ✅ **Assessment Flow** - Test assessment created (79% score)
- ✅ **Gap Matching** - 60% threshold validated
- ✅ **Three-Layer Weighting** - Question + Skill + Market demand
- ✅ **Admin Skills Page** - Search, filter, pagination (34,863 skills)

**Test Results:**
- ✅ Question Bank: 6/7 tests passing
- ✅ Program Matching: 4/4 tests passing
- ✅ Integration Tests: All passing
- ✅ CIP→SOC→Skills: Validated with 222 programs

**Production Ready:**
- ✅ All data populated (30 occupations, 4,771 questions, 222 programs)
- ✅ All pipelines validated and working
- ✅ All core services implemented
- ✅ Comprehensive documentation complete

---

## 🚀 NEXT PHASE: Multi-Stakeholder Platform (3-4 Weeks)

**Objective:** Transform SkillSync into three-sided marketplace before assessment UI work

**Stakeholders:**
1. Job Seekers (existing)
2. Employers (new - invite qualified candidates)
3. Education Providers (new - manage programs, receive RFIs)

**See:** `docs/features/PRE_ASSESSMENT_FEATURES.md` for complete specifications

### Sprint 1: Foundation (Week 1) - 5-6 days
**Branch:** `feature/multi-role-user-auth` + `feature/user-account-settings`

**Multi-Role User Management (Days 1-4):**
- [ ] Database schema updates (profiles, roles, invitations)
- [ ] Super Admin invitation system
- [ ] Provider Admin dashboard (programs CRUD)
- [ ] Employer Admin dashboard (roles CRUD, candidates view)
- [ ] RLS policies for role-based access
- [ ] Account limits enforcement (max programs, max roles)

**User Account Settings (Days 5-6):** ✅ **COMPLETE**
- [x] Settings page (`/account-settings`)
- [x] Profile management (name, LinkedIn, bio - required for invitations)
- [x] Avatar upload system (2MB max, 335x335 min, JPG/PNG/WebP)
- [x] Notification preferences (7 settings with database integration)
- [x] Change email flow (Supabase auth confirmation)
- [x] Delete account flow (type-to-confirm)
- [x] Give Feedback system (emoji + message)

**Mockups Required:**
- Provider Admin dashboard layout
- Employer Admin dashboard layout
- Admin invitation form
- User settings page (all sections)
- Avatar upload component

**Deliverable:** Provider/Employer admins can be invited and manage their content

---

### Sprint 2: Core Features (Week 2) - 5-6 days
**Branch:** `feature/employer-invitations` + `feature/notification-center`

**Employer Invitation System (Days 1-4):**
- [ ] Proficiency threshold per role (default 85%)
- [ ] Qualified candidates view (employer dashboard)
- [ ] Send invitation flow (application URL + message)
- [ ] Assessment visibility logic (auto-visible if >= threshold)
- [ ] Privacy setting: "Visible to employers" (default: ON)
- [ ] Invitation tracking and status

**Notification Center (Days 5-6):**
- [ ] Header notification icon with unread badge
- [ ] Dropdown: Recent 5 invitations
- [ ] Full invitations page (`/invitations`)
- [ ] Tabs: Active, Archived
- [ ] Actions: View Application, Decline, Archive
- [ ] Mark as read functionality

**Mockups Required:**
- Employer qualified candidates table
- Send invitation modal
- User notification dropdown
- User invitations page (tabs, cards)
- Invitation card component

**Deliverable:** Complete employer-to-candidate invitation workflow

**✅ Decisions Approved:**
- Flow: Option B - Auto-visible with opt-out
- Threshold: Dual (display 90%, visibility 85%)
- Privacy: User setting to opt-out (default: ON)

---

### Sprint 3: Enhancements (Week 3) - 5-6 days
**Branch:** `feature/company-profile-management` + `feature/program-details-page` + `feature/homepage-snapshot-redesign`

**Company Profile Management (Days 1-2):**
- [ ] Provider settings page (`/provider/settings`)
- [ ] Employer settings page (`/employer/settings`)
- [ ] Logo upload (companies & schools)
- [ ] Meta information (headquarters, size, founded, website, social)
- [ ] Branding settings

**Program Details Page (Days 3-4):**
- [ ] Program details page (`/programs/[id]`)
- [ ] Skills taught display (from program_skills)
- [ ] Related occupations (via CIP→SOC)
- [ ] RFI form (name, email, phone, message)
- [ ] Email notifications to provider
- [ ] Skills overlap visualization

**Homepage Snapshot Redesign (Days 5-6):**
- [ ] Redesigned snapshot section
- [ ] Interactive graphs (skill radar, progress timeline)
- [ ] Dark theme sections
- [ ] Data aggregation (assessments, invitations, programs)
- [ ] Quick actions (retake, browse, view invitations)

**Mockups Required:**
- Provider/Employer settings pages
- Program details page layout
- RFI form design
- Homepage snapshot complete redesign
- Graph specifications (what data, what type)

**Deliverable:** Complete user experience with all touchpoints

---

### Sprint 4: Polish & Demo Prep (Week 4) - 3-4 days
**Branch:** `feature/assessment-ui-redesign` + `feature/mock-user-generation`

**Assessment UI Update (Days 1-2):**
- [ ] Polish assessment taking experience
- [ ] Improved question navigation
- [ ] Better progress indicators
- [ ] Review screen before submit
- [ ] Mobile responsive improvements

**Mock User Generation (Day 3):**
- [ ] Script: `scripts/generate-mock-users.js`
- [ ] 20-30 realistic users with avatars
- [ ] Varied assessment scores (60-95%)
- [ ] Different occupations
- [ ] Flag: `is_mock_user = true`
- [ ] Easy purge capability

**Integration Testing (Day 4):**
- [ ] End-to-end testing all flows
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Final polish

**Mockups Required:**
- Assessment page redesign
- Navigation and progress UI

**Deliverable:** Demo-ready application with mock data

---

### UI Polish Tasks (Throughout All Sprints)

**Custom Spinner Component:**
- [ ] Install: `spinners-react` package
- [ ] Replace all loading spinners with SpinnerInfinity or SpinnerDiamond
- [ ] Use teal color (#0694A2) to match brand
- [ ] Consistent sizing across app
- [ ] Reference: `docs/features/ui-nice-to-haves.md`

**Homepage Dashboard CTA Cards:**
- [ ] Add images above card content (per new mockup)
- [ ] Update card layout to accommodate images
- [ ] Ensure responsive on mobile
- [ ] Mockup required before implementation

---

## 📅 DAY-BY-DAY ROADMAP (ARCHIVED)

### **TUESDAY (Jan 30) - Programs Catalog + Assessment Foundation**
**Goal:** Programs Complete + Start Assessment Experience  
**Time:** 12-14 hours (FULL DAY)

#### Morning (6-7 hours) **CRITICAL PATH**
- [x] **Programs Catalog - FOUNDATION COMPLETE** (6-7 hours)
  - [x] CIP-to-SOC crosswalk service (1 hour) ✅
  - [x] Import programs - 223 from HubSpot (2 hours) ✅
  - [x] Map to SOC codes via CIP (1 hour) ✅
  - [ ] Skills-to-programs matching engine (2 hours) - Waiting for skills import
  - [ ] Test program recommendations (1 hour) - Pending

#### Afternoon (6-7 hours)
- [ ] **Assessment Results Page** (4-5 hours) **CRITICAL** ⬅️ CURRENT FOCUS
  - Create results page component
  - Display score + skills breakdown
  - Conditional logic (Submit to Company / Programs / Congrats)
  - Store results for revisiting
- [ ] **Program Recommendations UI** (2-3 hours)
  - Display recommended programs
  - Show certifications
  - Test matching

**End of Day:** Programs complete, Assessment results working

---

### **WEDNESDAY (Jan 31) - Admin Dashboards + RFI + Final Features**
**Goal:** ALL Features Complete by 11:50 PM  
**Time:** 14-16 hours (FULL DAY + NIGHT)

#### Morning (6-7 hours) **ADMIN FEATURES**
- [ ] **Company Admin Dashboard** (3 hours)
  - View candidate submissions
  - Manage featured roles (CRUD)
  - Basic analytics
- [ ] **Provider Admin Dashboard** (2 hours)
  - Manage programs (CRUD)
  - View RFI submissions
- [ ] **Role-Based Access Control** (2 hours)
  - Role assignment tables
  - RLS policies
  - Dynamic navigation

#### Afternoon (4-5 hours) **RFI + FINAL FEATURES**
- [ ] **RFI Form + HubSpot** (3-4 hours)
  - RFI form component
  - Database storage
  - HubSpot API integration
  - Email notifications
- [ ] **Submit to Company Flow** (2 hours)
  - Submission component
  - API route + database
  - Email notification

#### Evening (4-5 hours) **INTEGRATION + TESTING**
- [ ] **My Assessments - Results View** (1 hour)
  - Link to view past results
- [ ] **Chamber Admin Dashboard** (2-3 hours) **REQUIRED**
  - Aggregate analytics view
  - Partner performance metrics
  - Regional insights (Pinellas County)
- [ ] **Quick Integration Testing** (2 hours)
  - Test all flows end-to-end
  - Fix critical bugs
  - Verify all features work

**End of Day (11:50 PM):** APP READY FOR QA ✅

---

### **THURSDAY (Feb 1) - QA, POLISH & DECK**
**Goal:** Production-Ready + Demo Deck  
**Time:** 8-10 hours

#### Morning (4-5 hours) **QA**
- [ ] **Comprehensive Testing**
  - User journey: browse → assess → results → programs → submit
  - Company admin: submissions, manage roles
  - Provider admin: programs, RFIs
  - Chamber admin: analytics
  - RFI form: submit → HubSpot → email
  - Fix all bugs found

#### Afternoon (4-5 hours) **POLISH + DECK**
- [ ] **Final Polish** (2-3 hours)
  - UI/UX refinements
  - Mobile responsiveness
  - Performance check
  - Console cleanup
- [ ] **Demo Deck Creation** (2-3 hours)
  - Create presentation slides
  - Screenshots of key features
  - Value proposition
  - Demo flow script

**End of Day:** DEMO READY ✅

---

### **FRIDAY (Feb 2) - DEMO DAY** 🎯
- Final smoke test
- Run through demo
- Present to stakeholders
- Gather feedback

---

## 📋 IMPLEMENTATION PLANS (Reference)

Detailed implementation plans created:
1. **Programs Catalog** - `/docs/features/programs-catalog-implementation-plan.md`
2. **Assessment Experience** - `/docs/features/assessment-experience-implementation-plan.md`
3. **User Roles** (Post-Launch) - `/docs/features/user-roles-implementation-plan.md`

---

## ⚠️ SCOPE - EVERYTHING REQUIRED FOR DEMO

### IN SCOPE (Must Complete by Wed 11:50 PM)
✅ Programs catalog with CIP/SOC mapping  
✅ Assessment results page  
✅ Program recommendations  
✅ Submit to Company flow  
✅ My Assessments results view  
✅ **Company admin dashboard** (view submissions, manage roles)  
✅ **Provider admin dashboard** (manage programs, view RFIs)  
✅ **Chamber admin dashboard** (aggregate analytics) **REQUIRED**  
✅ **RFI form + HubSpot integration**  
✅ **Role-based access control**

### OUT OF SCOPE (Post-Demo)
❌ Advanced analytics/reporting  
❌ Bulk operations  
❌ Email campaign automation  
❌ Advanced filtering

**Rationale:** EVERYTHING needed for Friday demo must work by Wednesday night.

---

## 🎯 SUCCESS CRITERIA

**By Wednesday 11:50 PM (App Ready for QA):**
- [ ] All 30 occupations enriched
- [ ] 200+ programs in catalog
- [ ] Complete assessment experience working
- [ ] User can: browse → assess → get results → see programs → submit to company
- [ ] Company admin can: view submissions, manage roles
- [ ] Provider admin can: manage programs, view RFIs
- [ ] **Chamber admin can: view aggregate analytics**
- [ ] RFI form works with HubSpot integration
- [ ] All critical features working

**By Thursday Night (Demo Ready):**
- [ ] All bugs fixed
- [ ] UI polished and professional
- [ ] Demo deck created
- [ ] Demo flow practiced

---

## 📊 ESTIMATED HOURS

| Day | Tasks | Hours |
|-----|-------|-------|
| **Tuesday** | Programs + Assessment Results | 12-14 |
| **Wednesday** | Admin Dashboards + RFI + Chamber + Testing | 14-16 |
| **Thursday** | QA + Polish + Demo Deck | 8-10 |
| **Friday** | DEMO DAY | - |
| **TOTAL** | **2-Day Build Sprint** | **34-40 hours** |

**Realistic:** ⚠️ AGGRESSIVE but achievable with focused work  
**Critical:** Must hit Wednesday 11:50 PM deadline for QA readiness

---

## 🚀 LAUNCH CHECKLIST

### Pre-Launch
- [ ] All features tested
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Documentation complete

### Demo Day (Friday, Feb 2)
- [ ] Final smoke test
- [ ] Run through demo flow
- [ ] Present to stakeholders
- [ ] Showcase all features
- [ ] Gather feedback

---

**Start fresh Tuesday morning - 48 hours to build!** ⚡
