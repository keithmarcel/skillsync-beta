# 3-Day Sprint to Launch

**Target:** Complete by Wednesday Night (Jan 31 - Feb 2)  
**Current:** Phases 1-5 Complete ✅  
**Remaining:** Programs Catalog + Assessment Experience + Final QA

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

### **MONDAY (Feb 3) - FINAL QA & POLISH**
**Goal:** Production-Ready Platform  
**Time:** 6-8 hours

#### Morning (3-4 hours)
- [ ] **End-to-End Testing**
  - Test complete user journey:
    1. Browse jobs → Take assessment
    2. View results → Get recommendations
    3. Submit to company (featured roles)
    4. Revisit past assessments
  - Test all user flows
  - Fix any bugs found

#### Afternoon (3-4 hours)
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

### IN SCOPE (Must Complete by Wed)
✅ Programs catalog with CIP/SOC mapping  
✅ Assessment results page  
✅ Program recommendations  
✅ Submit to Company flow  
✅ My Assessments results view  
✅ Final QA & polish

### OUT OF SCOPE (Post-Launch)
❌ Company admin dashboards  
❌ Provider admin dashboards  
❌ Chamber admin dashboard  
❌ RFI form + HubSpot integration  
❌ Advanced role management

**Rationale:** Focus on core job seeker experience first. Admin/partner features can be added after launch.

---

## 🎯 SUCCESS CRITERIA

**By Wednesday Night:**
- [ ] All 30 occupations enriched
- [ ] 200+ programs in catalog
- [ ] Complete assessment experience working
- [ ] User can: browse → assess → get results → see programs → submit to company
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
| Monday | Final QA & Polish | 6-8 |
| **TOTAL** | **Full Sprint** | **34-44 hours** |

**Realistic with focused work:** ✅ Achievable  
**Buffer:** Monday is buffer day for any overruns

---

## 🚀 LAUNCH CHECKLIST

### Pre-Launch
- [ ] All features tested
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Documentation complete

### Launch Day (Thursday)
- [ ] Final smoke test
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Gather initial feedback

---

**Start fresh Friday morning with clear priorities!** 🌅
