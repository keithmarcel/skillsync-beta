# 4-Day Sprint to Launch

**Target:** Complete by Thursday Night (Jan 31 - Feb 4)  
**Current:** Phases 1-5 Complete ✅  
**Remaining:** Programs + Assessment + Admin Dashboards + RFI + QA

---

## 📅 DAY-BY-DAY ROADMAP

### **FRIDAY (Jan 31) - UI Polish + Programs Foundation**
**Goal:** Clean UI + Start Programs Catalog  
**Time:** 8-10 hours

#### Morning (4 hours)
- [ ] **UI Improvements** (2 hours)
  - Enrich remaining 28 occupations
  - Fix occupation detail page UI
  - Test all enriched data displays
- [ ] **Documentation** (1 hour)
  - Create BLS API docs
  - Create enrichment guide
- [ ] **Cleanup** (1 hour)
  - Delete temp SQL files
  - Final code cleanup

#### Afternoon (4-6 hours)
- [ ] **Programs Catalog - Part 1** (4-6 hours)
  - Research CIP API options
  - Create CIP-to-SOC crosswalk service
  - Start programs data import
  - Test CIP mapping

**End of Day:** UI clean, programs foundation started

---

### **SATURDAY (Feb 1) - Programs Catalog Complete**
**Goal:** 200+ Programs with Skills/SOC Mapping  
**Time:** 10-12 hours

#### Morning (5-6 hours)
- [ ] **Programs Import** (3-4 hours)
  - Import BISC Amplified Portfolio CSV (200+ programs)
  - Enrich with CIP data
  - Map to SOC codes
  - Associate with skills
- [ ] **Matching Engine** (2-3 hours)
  - Build skills-to-programs matcher
  - Test gap-to-program recommendations
  - Implement reverse search (programs → jobs)

#### Afternoon (5-6 hours)
- [ ] **Programs Admin Tools** (2-3 hours)
  - Provider can add/edit programs
  - CIP code selection
  - Skills association interface
- [ ] **AI Quiz Testing** (2-3 hours)
  - Test quiz generation with enriched data
  - Verify question quality
  - Test admin quiz editing
- [ ] **Programs Display** (1 hour)
  - Test programs browse page
  - Verify program details page

**End of Day:** Programs catalog complete, AI tested

---

### **SUNDAY (Feb 2) - Assessment Experience Complete**
**Goal:** End-to-End Assessment Flow Working  
**Time:** 10-14 hours

#### Morning (5-6 hours)
- [ ] **Assessment Results Page** (4-5 hours) **CRITICAL**
  - Create results page component
  - Display score + skills breakdown
  - Implement conditional logic:
    - Featured role + high score → Submit to Company
    - Gaps identified → Programs + Certs
    - High score → Congrats + optional resources
  - Store results for revisiting

#### Afternoon (5-8 hours)
- [ ] **Program Recommendations** (2-3 hours)
  - Integrate program matching
  - Display recommended programs
  - Show certifications
- [ ] **Submit to Company Flow** (2-3 hours)
  - Create submission component
  - API route + database
  - Email notification
- [ ] **My Assessments - Results View** (1-2 hours)
  - Link to view past results
  - Test results persistence

**End of Day:** Complete assessment experience working

---

### **MONDAY (Feb 3) - Admin Dashboards & RFI**
**Goal:** Company/Provider Dashboards + RFI Flow  
**Time:** 10-12 hours

#### Morning (5-6 hours)
- [ ] **Company Admin Dashboard** (3-4 hours)
  - View candidate submissions
  - Manage featured roles (CRUD)
  - Basic company profile editing
  - Simple analytics (views, submissions count)
- [ ] **Provider Admin Dashboard** (2-3 hours)
  - Manage programs (CRUD)
  - View RFI submissions
  - Basic provider profile editing

#### Afternoon (5-6 hours)
- [ ] **RFI Form + Integration** (3-4 hours)
  - Create RFI form component
  - Store submissions in database
  - HubSpot API integration
  - Email notifications (Supabase or SendGrid)
- [ ] **Role-Based Access Control** (2-3 hours)
  - Create role assignment tables
  - RLS policies for companies/providers
  - Dynamic navigation based on role
  - Test access control

**End of Day:** Admin features complete

---

### **TUESDAY (Feb 4) - FINAL QA & POLISH**
**Goal:** Production-Ready Platform  
**Time:** 8-10 hours

#### Morning (4-5 hours)
- [ ] **End-to-End Testing**
  - Test complete user journey:
    1. Browse jobs → Take assessment
    2. View results → Get recommendations
    3. Submit to company (featured roles)
    4. Revisit past assessments
  - Test company admin: view submissions, manage roles
  - Test provider admin: manage programs, view RFIs
  - Test RFI form: submit → HubSpot → email
  - Fix any bugs found

#### Afternoon (4-5 hours)
- [ ] **Final UI/UX/Functionality QA**
  - Visual polish pass
  - Mobile responsiveness check
  - Performance testing
  - Error handling verification
  - Console errors cleanup
- [ ] **Documentation Final Review**
  - Update all docs with final state
  - Create user guides if needed
  - Update README

**End of Day:** LAUNCH READY ✅

---

## 📋 IMPLEMENTATION PLANS (Reference)

Detailed implementation plans created:
1. **Programs Catalog** - `/docs/features/programs-catalog-implementation-plan.md`
2. **Assessment Experience** - `/docs/features/assessment-experience-implementation-plan.md`
3. **User Roles** (Post-Launch) - `/docs/features/user-roles-implementation-plan.md`

---

## ⚠️ SCOPE DECISIONS

### IN SCOPE (Must Complete by Thu)
✅ Programs catalog with CIP/SOC mapping  
✅ Assessment results page  
✅ Program recommendations  
✅ Submit to Company flow  
✅ My Assessments results view  
✅ **Company admin dashboard** (view submissions, manage roles)  
✅ **Provider admin dashboard** (manage programs, view RFIs)  
✅ **RFI form + HubSpot integration**  
✅ **Role-based access control**  
✅ Final QA & polish

### OUT OF SCOPE (Post-Launch)
❌ Chamber admin dashboard (aggregate analytics)  
❌ Advanced analytics/reporting  
❌ Bulk operations  
❌ Email campaign integration

**Rationale:** Core job seeker experience + essential partner tools for launch. Advanced analytics can be added post-launch.

---

## 🎯 SUCCESS CRITERIA

**By Thursday Night:**
- [ ] All 30 occupations enriched
- [ ] 200+ programs in catalog
- [ ] Complete assessment experience working
- [ ] User can: browse → assess → get results → see programs → submit to company
- [ ] Company admin can: view submissions, manage roles
- [ ] Provider admin can: manage programs, view RFIs
- [ ] RFI form works with HubSpot integration
- [ ] All critical bugs fixed
- [ ] UI polished and professional
- [ ] Documentation complete

---

## 📊 ESTIMATED HOURS

| Day | Tasks | Hours |
|-----|-------|-------|
| Friday | UI + Programs Foundation | 8-10 |
| Saturday | Programs Complete + AI | 10-12 |
| Sunday | Assessment Experience | 10-14 |
| Monday | Admin Dashboards + RFI | 10-12 |
| Tuesday | Final QA & Polish | 8-10 |
| **TOTAL** | **Full Sprint** | **46-58 hours** |

**Realistic with focused work:** ✅ Achievable over 4 days  
**Buffer:** Tuesday afternoon is buffer for any overruns

---

## 🚀 LAUNCH CHECKLIST

### Pre-Launch
- [ ] All features tested
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Documentation complete

### Launch Day (Friday, Feb 5)
- [ ] Final smoke test
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Gather initial feedback

---

**Start fresh Friday morning with clear priorities!** 🌅
