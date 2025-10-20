# API Documentation - SkillSync

## Current API Functions

### User Management APIs

#### `getUserAssessments()`
**Location**: `/src/lib/api.ts`  
**Description**: Retrieves user's assessment history and results  
**Database Tables**: `assessments`, `assessment_skill_results`  
**Used In**: 
- `/src/app/page.tsx` - Dashboard recent assessments
- `/src/app/my-assessments/page.tsx` - Full assessment list

**Current Implementation**: Mock data fallback
**Schema Dependencies**:
```sql
assessments (id, user_id, job_id, method, analyzed_at, readiness_pct, status_tag)
assessment_skill_results (assessment_id, skill_id, score_pct, band)
```

---

#### `listJobs(filter)`
**Location**: `/src/lib/api.ts`  
**Description**: Retrieves job listings with optional filtering  
**Parameters**: 
- `filter`: 'featured_role' | 'all' | 'saved'
**Database Tables**: `jobs`, `companies`, `job_skills`, `favorites`  
**Used In**:
- `/src/app/page.tsx` - Featured jobs section
- `/src/app/jobs/page.tsx` - All jobs listing
- Job detail pages for related jobs

**Current Implementation**: Mock data fallback
**Schema Dependencies**:
```sql
jobs (id, job_kind, title, soc_code, company_id, location_city, median_wage_usd, long_desc)
companies (id, name, logo_url, is_trusted_partner)
job_skills (job_id, skill_id, weight)
favorites (user_id, entity_kind, entity_id) -- for saved jobs
```

---

### Assessment APIs

#### Quiz Assessment Flow
**Endpoints**: TBD - Currently mock implementation  
**Database Tables**: `quizzes`, `quiz_sections`, `quiz_questions`, `quiz_responses`  
**Used In**:
- `/src/app/assessments/quiz/[jobId]/page.tsx`

**Schema Dependencies**:
```sql
quizzes (id, job_id, estimated_minutes, version)
quiz_sections (id, quiz_id, skill_id, order_index)
quiz_questions (id, section_id, stem, choices, answer_key, difficulty)
quiz_responses (assessment_id, question_id, selected, is_correct)
```

---

#### Resume Assessment Flow
**Endpoints**: TBD - Currently mock implementation  
**Database Tables**: `resume_features`, `assessments`  
**Used In**:
- `/src/app/assessments/resume/[jobId]/page.tsx`

**Schema Dependencies**:
```sql
resume_features (assessment_id, extracted_skills, notes)
assessments (id, user_id, job_id, method, analyzed_at, readiness_pct)
```

---

### Skills Management APIs

#### Skills CRUD Operations
**Location**: `/src/app/admin/skills/page.tsx` (Supabase client direct)  
**Database Tables**: `skills`, `skill_aliases`  
**Operations**:
- Load skills: `SELECT * FROM skills ORDER BY name`
- Load aliases: `SELECT skill_id, alias, skills.name FROM skill_aliases JOIN skills`
- Add alias: `INSERT INTO skill_aliases (skill_id, alias)`
- Remove alias: `DELETE FROM skill_aliases WHERE skill_id = ? AND alias = ?`

**Schema Dependencies**:
```sql
skills (id, name, onet_id, category, description, lightcast_id, source)
skill_aliases (skill_id, alias)
```

---

### Programs APIs

#### `listPrograms(filter)`
**Status**: Not implemented - Mock data only  
**Database Tables**: `programs`, `schools`, `program_skills`  
**Used In**:
- `/src/app/programs/page.tsx`
- `/src/app/page.tsx` - Saved programs section

**Required Schema**:
```sql
programs (id, school_id, name, program_type, format, duration_text, short_desc, program_url)
schools (id, name, logo_url, city, state)
program_skills (program_id, skill_id, weight)
```

---

### Favorites APIs

#### User Favorites Management
**Status**: Not implemented - Static counts only  
**Database Tables**: `favorites`  
**Used In**:
- `/src/components/navbar.tsx` - Favorite counts
- All job/program cards - Favorite buttons

**Required Implementation**:
```sql
favorites (user_id, entity_kind, entity_id, created_at)
-- entity_kind: 'job' | 'program'
```

---

### Feedback APIs

#### `submitFeedback(sentiment, text)`
**Status**: Not implemented - Mock only  
**Database Tables**: `feedback`  
**Used In**:
- `/src/components/ui/give-feedback-dialog.tsx`

**Required Schema**:
```sql
feedback (id, user_id, sentiment, score_int, text, created_at)
-- sentiment: 'like' | 'neutral' | 'dislike'
```

---

## Missing API Implementations

### High Priority
1. **User Authentication APIs** - Replace hardcoded user data
2. **Favorites Management** - Add/remove favorites with real-time counts
3. **Programs Listing** - Dynamic program data with filtering
4. **Assessment Submission** - Store quiz/resume assessment results

### Medium Priority
1. **User Profile Management** - Profile CRUD operations
2. **Company Data APIs** - Company information and job openings
3. **Skills Matching** - Job-to-skill and program-to-skill matching algorithms
4. **Search & Filtering** - Advanced search across jobs/programs

### Low Priority
1. **Analytics APIs** - User interaction tracking
2. **Recommendation Engine** - Personalized job/program suggestions
3. **Notification System** - User alerts and updates
4. **Export Functions** - Data export capabilities

---

## Database Connection Status

### ✅ Connected & Working
- Skills management (admin interface)
- Skill aliases management

### 🟡 Partial Implementation
- User assessments (fallback to mock data)
- Jobs listing (fallback to mock data)

### ❌ Not Connected
- User authentication & profiles
- Favorites system
- Programs listing
- Feedback submission
- Assessment result storage

---

*This documentation will be updated as APIs are implemented and database connections are established.*

