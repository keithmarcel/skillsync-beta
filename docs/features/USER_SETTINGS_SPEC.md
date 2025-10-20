# User Settings - Specification

**Route:** `/settings`  
**Access:** All authenticated users  
**Status:** Planning - awaiting mockups

---

## Overview

Comprehensive user settings page allowing users to manage their profile, preferences, privacy, and account security.

---

## Proposed Sections

### 1. Profile Information
**Fields to add/extend:**
- ✅ First Name (existing)
- ✅ Last Name (existing)
- ✅ Email (existing, read-only)
- ✅ ZIP Code (existing)
- ✅ LinkedIn URL (existing)
- ✅ Avatar URL (existing)
- 🆕 Phone Number
- 🆕 Professional Title/Current Role
- 🆕 Years of Experience
- 🆕 Bio/About Me (text area)

### 2. Avatar Upload
**Requirements:**
- Upload image file (JPG, PNG, WebP)
- Max file size: 2MB
- Image preview before upload
- Crop/resize functionality (optional)
- Store in Supabase Storage
- Update `avatar_url` in profiles table

### 3. Notification Preferences
**Settings:**
- 🆕 Email notifications (boolean)
- 🆕 Employer invitation notifications (boolean)
- 🆕 Program recommendation notifications (boolean)
- 🆕 Assessment reminders (boolean)
- 🆕 Weekly digest (boolean)
- 🆕 Notification frequency (immediate, daily, weekly)

### 4. Privacy Settings
**Settings:**
- 🆕 Visible to employers (boolean) - Default: true
- 🆕 Show profile to education providers (boolean) - Default: true
- 🆕 Allow profile in search results (boolean) - Default: true
- 🆕 Share assessment results with employers (boolean) - Default: true

### 5. Account Security
**Actions:**
- Change password
- Change email (with verification)
- Two-factor authentication (future)
- Active sessions management (future)

### 6. Data & Privacy
**Actions:**
- Download my data (export JSON)
- Delete account (with confirmation)
- View privacy policy
- View terms of service

---

## Database Schema Extensions

### Profiles Table - New Fields
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS professional_title TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS employer_invitation_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS program_recommendation_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assessment_reminder_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_frequency VARCHAR DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')),
ADD COLUMN IF NOT EXISTS visible_to_employers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visible_to_providers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS searchable_profile BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS share_assessment_results BOOLEAN DEFAULT true;
```

---

## Questions for User

### Profile Fields
1. **Phone Number:** Required or optional? Format validation (US only or international)?
2. **Professional Title:** Free text or dropdown of common titles?
3. **Years of Experience:** Dropdown ranges (0-1, 1-3, 3-5, 5-10, 10+) or exact number?
4. **Bio:** Character limit? (Suggest 500 characters)

### Avatar Upload
1. Do you want built-in crop/resize functionality or just upload as-is?
2. Should we support drag-and-drop upload?
3. Default avatar if none uploaded? (Initials circle?)

### Notifications
1. Should notification preferences affect both email AND in-app notifications?
2. Any other notification types needed?

### Privacy
1. **Visible to employers:** Should this completely hide user from employer candidate pools, or just hide contact info?
2. Should users be able to selectively share with specific employers?

### Additional Features
1. **Resume Upload:** Should users be able to upload/store their resume in settings?
2. **Skills Management:** Should users be able to manually add/edit skills in their profile?
3. **Certifications:** Track professional certifications?
4. **Education History:** Add education background?

---

## UI Components Needed

1. **Settings Layout** - Sidebar navigation with sections
2. **Profile Form** - Text inputs, textarea for bio
3. **Avatar Upload Component** - File picker, preview, crop (optional)
4. **Toggle Switches** - For boolean preferences
5. **Radio Groups** - For notification frequency
6. **Password Change Modal** - Secure password update flow
7. **Delete Account Modal** - Confirmation with password re-entry
8. **Success/Error Toast** - Feedback for save actions

---

## API Endpoints Needed

```
PATCH /api/user/profile - Update profile information
POST /api/user/avatar - Upload avatar image
PATCH /api/user/preferences - Update notification preferences
PATCH /api/user/privacy - Update privacy settings
POST /api/user/change-password - Change password
POST /api/user/change-email - Change email (with verification)
DELETE /api/user/account - Delete account
GET /api/user/export-data - Export user data
```

---

## Implementation Priority

### Phase 1 (MVP)
- Profile information form
- Avatar upload
- Basic notification toggles
- Privacy: Visible to employers toggle
- Change password

### Phase 2 (Enhanced)
- All notification preferences
- All privacy settings
- Change email
- Export data

### Phase 3 (Future)
- Resume upload
- Skills management
- Certifications
- Education history
- Two-factor authentication

---

**Next Steps:**
1. Get mockups for settings page layout
2. Confirm which fields to include in MVP
3. Create database migration for new fields
4. Build settings page components

---

*Awaiting mockups and field confirmation before implementation.*
