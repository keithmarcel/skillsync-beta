# All Not Started MVP Tasks - Complete List

**Source:** SkillSync_MVP_User_Stories.csv  
**Generated:** October 21, 2025 12:03 PM  
**Total:** 70 tasks

---

## Row 2: MYASSESS-606
**Name:** Refine assessment cards  
**Page:** Jobs → My Assessments Page  
**Notes:** (none)

## Row 3: ONBOARD-823
**Name:** Send Rob legal pages for final review  
**Page:** Account Onboarding Flow  
**Notes:** (none)

## Row 4: PROGRAMS-825
**Name:** log rfi captures per provider in their respective portal, but log all in /bisk and superadmin  
**Page:** Programs → Program Details  
**Notes:** (none)

## Row 5: PROGRAMS-824
**Name:** create hubspot RFI form and embed per program  
**Page:** Programs → Program Details  
**Notes:** (none)

## Row 6: MYASSESS-605
**Name:** Retake Cooldown (24-hour limit)  
**Page:** Jobs → My Assessments Page  
**Notes:** (none)

## Row 7: ROLE-404
**Name:** add in skills extractor for job description via link or paste in  
**Page:** Jobs → Hiring Now → Role Detail  
**Notes:** (none)

## Row 8: ONBOARD-824
**Name:** Reroute users to /employers for login, /providers, and /bisk for admin purposes - reroute on root signin depending on email  
**Page:** Account Onboarding Flow  
**Notes:** (none)

## Row 9: SYSTEM-UI-941
**Name:** Responsiveness across experience  
**Page:** System → UI  
**Notes:** (none)

## Row 10: DEMO-106
**Name:** toasts and dialogs across app  
**Page:** System → Cleanup / Demo Prep  
**Notes:** (none)

## Row 11: DEMO-106
**Name:** Security check  
**Page:** System → Cleanup / Demo Prep  
**Notes:** (none)

## Row 12: DEMO-105
**Name:** Clean comments throughout app  
**Page:** System → Cleanup / Demo Prep  
**Notes:** (none)

## Row 13: DEMO-104
**Name:** Documentation best practices (what to include?)  
**Page:** System → Cleanup / Demo Prep  
**Notes:** (none)

## Row 14: DEMO-103
**Name:** Global stylesheet to manage plus documentation  
**Page:** System → Cleanup / Demo Prep  
**Notes:** (none)

## Row 15: (No ID)
**Name:** Add learning pathways tab and sub-tab  
**Page:** Programs → Featured Programs  
**Notes:** Bucket programs by job-type preparation: technology, healthcare, business, construction

## Row 21: DEMO-102
**Name:** Clean up page loading, login loading, speed, etc.  
**Page:** System → Cleanup / Demo Prep  
**Notes:** (none)

## Row 22: ONBOARD-822
**Name:** Add in FINAL Privacy Policy copy to page  
**Page:** Account Onboarding Flow  
**Notes:** (none)

## Row 23: SYSTEM-INFRA-913
**Name:** On notifications management page, change applied status to green with check mark icon and declined to have a declined icon- keep color as is  
**Page:** System → Infrastructure / Notifications  
**Notes:** (none)

## Row 24: SYSTEM-INFRA-912
**Name:** View Application button needs contrast update  
**Page:** System → Infrastructure / Notifications  
**Notes:** as well as mark all as read, remove the separator below recent invite notifications and make semi-bold, Change 'new invite from [company name]' to source sans pro and bump font one notch

## Row 28: OCC-402
**Name:** Show "Hiring Now" Roles Sharing SOC Code  
**Page:** Jobs → High-Demand Occupations → Occupation Details  
**Notes:** Pull all active Hiring Now roles whose SOC code matches the occupation's. Display as a "Hiring Now for this Occupation" block with company name, role title, and View Details link.

## Row 29: OCC-403
**Name:** Surface Relevant Programs via Skill Overlap  
**Page:** Jobs → High-Demand Occupations → Occupation Details  
**Notes:** Use the skill-mapping engine to surface programs that share 40%+ of the occupation's skill list. Show program name, provider, and primary skills overlap count.

## Row 30: ASSESS-301
**Name:** "What to Expect" and Timeline Block  
**Page:** Jobs → Hiring Now → Quiz  
**Notes:** Insert a pre-assessment information block summarizing assessment length, question type, and next steps.

## Row 31: ASSESS-301
**Name:** Eliminate Resume Upload (use LinkedIn URL only)  
**Page:** Jobs → Hiring Now → Quiz  
**Notes:** Remove all UI and backend references to resume upload. Keep optional LinkedIn URL field only.

## Row 34: ASSESS-310
**Name:** Retake Cooldown (24-hour limit)  
**Page:** Jobs → Hiring Now → Quiz  
**Notes:** Implement 24-hour cooldown for retakes per role. Store last attempt timestamp and enforce both client-side and server-side lockout.

## Row 35: ASSESS-320
**Name:** Consent-Aware Prompt on Assessment Completion  
**Page:** Jobs → Hiring Now → Quiz  
**Notes:** If a user completes an assessment without consent enabled, show message: "Share your results with employers by enabling invites." Include link to account settings.

## Row 36: ASSESS-321
**Name:** Auto-Share After Consent Enabled  
**Page:** Jobs → Hiring Now → Quiz  
**Notes:** Whenever consent is newly enabled, check for all past assessments meeting threshold criteria and trigger share automatically.

## Row 37: RESULTS-501
**Name:** Readiness Badge and Next Step CTA  
**Page:** Jobs → My Assessments Page  
**Notes:** Show status badge ("Role Ready," "Almost Ready," "Needs Development") with contextual copy and CTA (View Invites or View Programs).

## Row 38: RESULTS-502
**Name:** Auto-Share Confirmation Message  
**Page:** Jobs → My Assessments Page  
**Notes:** Display message: "Your results have been shared with [Company]" when threshold and consent conditions are met.

## Row 39: RESULTS-503
**Name:** Program Matches via Skill Overlap  
**Page:** Jobs → My Assessments Page  
**Notes:** Surface up to three matching programs with greatest skill overlap for that role.

## Row 42: RESULTS-504
**Name:** Retire Occupation-Level Assessments  
**Page:** Jobs → My Assessments Page  
**Notes:** Permanently remove any legacy links or tests tied to generic occupations.

## Row 43: MYASSESS-601
**Name:** Remove Skills Gap Progress Bar  
**Page:** Jobs → My Assessments Page  
**Notes:** Simplify each card by removing the progress bar graphic.

## Row 46: MYASSESS-602
**Name:** Display Retake Timer on Cooldown Assessments  
**Page:** Jobs → My Assessments Page  
**Notes:** For any assessment under cooldown, show remaining time on its card and disable retake button until timer expires.

## Row 49: MYASSESS-603
**Name:** Role-Ready Badge on Completed Assessments  
**Page:** Jobs → My Assessments Page  
**Notes:** Add "Role Ready" badge to cards meeting or exceeding proficiency requirement.

## Row 52: PROGRAMS-801
**Name:** "Preferred by Company" Badges  
**Page:** Programs → Featured Programs  
**Notes:** Show "Preferred by [Company]" or "Preferred by X Companies." Hover or modal reveals logo list.

## Row 55: PROGRAMS-821
**Name:** Remove "Call Now" External Link  
**Page:** Programs → Program Details  
**Notes:** Delete external call actions; channel all interactions to in-platform RFI form.

## Row 58: PROGRAMS-822
**Name:** List Companies Preferring Program (Logos Display)  
**Page:** Programs → Program Details  
**Notes:** On program detail page, show logos or list of all companies that marked the program "Preferred."

## Row 61: PROGRAMS-823
**Name:** "Provides Skills for N Jobs" Accuracy Audit  
**Page:** Programs → Program Details  
**Notes:** Validate job count calculation from skills overlap; adjust display to nearest integer and update nightly.

## Row 62: EMPLOYER-601
**Name:** Publish/Unpublish Job Toggle  
**Page:** Employer Admin → Listed Roles Tab  
**Notes:** (none)

## Row 63: EMPLOYER-602
**Name:** Set Required Proficiency (Role Ready Threshold)  
**Page:** Employer Admin → Listed Roles Tab  
**Notes:** (none)

## Row 64: EMPLOYER-603
**Name:** Set Invite Threshold (Auto-Invite Score)  
**Page:** Employer Admin → Listed Roles Tab  
**Notes:** (none)

## Row 65: EMPLOYER-613
**Name:** Retake Policy Override per Role  
**Page:** Employer Admin → Listed Roles Tab  
**Notes:** (none)

## Row 66: EMPLOYER-631
**Name:** "Preferred Programs" Tab Table  
**Page:** Employer Admin → Preferred Programs Tab  
**Notes:** (none)

## Row 67: EMPLOYER-641
**Name:** Invite Lifecycle Sync (Invited → Applied → Declined)  
**Page:** Employer Admin → Invites Management  
**Notes:** Ensure employers can view candidate lists with real-time statuses that sync directly with job-seeker activity. The list should automatically update as candidates apply, decline, or are invited, without requiring page refresh.

## Row 68: PROVIDER-703
**Name:** Program CIP Validation and Enforcement  
**Page:** Provider Admin → Programs Table  
**Notes:** Require that every program in the Provider Admin dashboard has a valid CIP code before publishing. Display warnings for missing CIPs and prevent publication until resolved.

## Row 71: PROVIDER-702
**Name:** Visibility of Employer Preferences (Preferred by View)  
**Page:** Provider Admin → Programs Table  
**Notes:** Provide a read-only column or section showing which employers have marked each program as "Preferred." This gives institutions insight into industry alignment and program-market fit.

## Row 72: SYSTEM-INFRA-901
**Name:** CIP→Skills→Program Mapping Pipeline  
**Page:** System → Infrastructure / Data  
**Notes:** Develop a pipeline that maps program CIPs to relevant regional and national skills using O*NET and BLS data. Store mappings as structured JSON objects in Supabase for fast querying.

## Row 75: SYSTEM-INFRA-902
**Name:** CIP Data Backfill from Melissa Stec Sheets  
**Page:** System → Infrastructure / Data  
**Notes:** Use the provided spreadsheets to backfill and validate missing CIP codes for all programs. Generate a system report showing completion rate and flagged anomalies.

## Row 78: SYSTEM-INFRA-903
**Name:** Source Metadata Registry (BLS/O*NET/CareerOneStop)  
**Page:** System → Infrastructure / Data  
**Notes:** Add metadata fields tracking the origin of each data point (skills, wages, or outlook) to maintain a verifiable source trail for every occupation and program.

## Row 79: SYSTEM-INFRA-904
**Name:** Multi-Tenant Subdomain Template ({company}.skillsync.com)  
**Page:** System → Infrastructure / Deployment  
**Notes:** Set up automated deployment logic using environment variables to generate isolated subdomains for each employer or partner. Example: thfoods.skillsync.com or mosaic.skillsync.com.

## Row 80: SYSTEM-INFRA-905
**Name:** Auto-Share Service (Consent + Threshold Trigger)  
**Page:** System → Infrastructure / Logic  
**Notes:** Implement a backend job that checks every completed assessment for consent and threshold match. If true, push assessment results to the employer dashboard. Re-run logic whenever consent is toggled on.

## Row 81: SYSTEM-INFRA-911
**Name:** Notification Service Scaffold (Supabase or SendGrid)  
**Page:** System → Infrastructure / Notifications  
**Notes:** Evaluate using Supabase Realtime, SendGrid, or Resend for notifications. Create a modular service layer that can power both in-app and email notifications later. Also Brevo: https://www.brevo.com/landing/sendgrid/...

## Row 85: SYSTEM-UI-921
**Name:** In-App Notifications Bell and Dropdown  
**Page:** System → UI  
**Notes:** Add a bell icon to the header showing unread notification counts. Clicking opens a dropdown with the latest invites or key events (e.g., "Employer viewed your assessment").

## Row 88: SYSTEM-UI-931
**Name:** Global Source Footer (Data Source Labels)  
**Page:** System → UI  
**Notes:** Display a standard footer section across all data-driven pages showing sources like BLS, O*NET, or CareerOneStop, ensuring transparency and consistent branding.

## Row 89: DEMO-101
**Name:** Remove Legacy Occupation Assessment Entrypoints  
**Page:** System → Cleanup / Demo Prep  
**Notes:** Search for and remove any buttons, routes, or components referencing the old occupation-based assessments.

## Row 92: DEMO-102
**Name:** Microcopy Alignment Across UI  
**Page:** System → Cleanup / Demo Prep  
**Notes:** Ensure consistent phrasing across all modules ("Hiring Now," "Preferred by," "Programs Matching Your Skills") and unify tone and capitalization before the executive demo.

## Row 93: PROGRAMS-802
**Name:** "Micro-Tags for Benefits (Scholarship, Internship, Preferred)"  
**Page:** Programs → Featured Programs  
**Notes:** Add optional visual micro-tags for key program attributes — "Scholarship Available," "Internship Available," "Preferred." These tags should appear on both Featured and All Programs views and be filterable.

## Row 94: MYASSESS-604
**Name:** "Employer Communication Badges (Shared, Invited, Applied, Declined)"  
**Page:** Jobs → My Assessments Page  
**Notes:** Add dynamic badges to each My Assessments card that display the live communication status between the job seeker and employer. Possible states include "Shared with Employer," "Invited to Apply," "Applied," and "Declined." Status should update automatically through backend sync with the employer portal.

---

**Total Count:** 70 Not Started Tasks
