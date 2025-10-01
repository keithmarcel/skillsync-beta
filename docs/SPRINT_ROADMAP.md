# SkillSync Sprint Roadmap

**Updated:** October 1, 2025  
**Current Sprint:** Assessment Weighting System + Beta Readiness  
**Status:** Three-layer weighting system complete, ready for testing

**Recent Completion (Oct 1):**
- ✅ Three-layer assessment weighting system implemented
- ✅ Skills taxonomy cleanup (69 generic skills removed)
- ✅ Question-level importance weighting (1.0-5.0)
- ✅ Quiz generation fixes (metadata, answer randomization)
- ✅ Reusable admin components (DestructiveDialog, toast patterns)
- ✅ My Assessments page with real user data

**Current Focus:** Two-track skills mapping complete, ready for O*NET testing

**COMPLETED TODAY:**
- ✅ Three-layer weighting system (question + skill + market demand)
- ✅ Hybrid skills mapper (O*NET + Lightcast + AI)
- ✅ Two-track approach (standard vs featured roles)
- ✅ Documentation consolidated and updated
- ✅ Admin tools with reusable patterns

**RESOLVED:**
- ✅ O*NET mapper working with /summary/ endpoints
- ✅ Answer key randomization fixed (no more all-B quizzes)
- ✅ Question repetition and manager-focus addressed
- ✅ Old skills purged, ready for O*NET pipeline

**TODO:**
- 📋 Apply O*NET pipeline to all 37 occupations
- 📋 Refine AI prompts for better question quality (roadmap item)
- 📋 Fix simulator display issue
- 📋 Test weighted scoring with proper skills

---

## 📅 DAY-BY-DAY ROADMAP

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
