# Assessment Components

Reusable components for the Assessment Management system.

## Components

### QuestionCard
**File:** `question-card.tsx`

Displays a single question with all its metadata and actions.

**Props:**
```typescript
{
  question: QuizQuestion      // Question data
  index: number              // Display index (1-based)
  onEdit: () => void         // Edit handler
  onDelete: () => void       // Delete handler
  isDragging?: boolean       // Drag state (optional)
}
```

**Features:**
- Question type badge with icon
- Importance level stars (⭐ × 1-5)
- Difficulty level with multiplier
- Associated skill display
- Answer preview (type-specific)
- Drag handle (visual, ready for DnD integration)
- Edit/Delete action buttons

**Usage:**
```tsx
<QuestionCard
  question={question}
  index={0}
  onEdit={() => handleEdit(question)}
  onDelete={() => handleDelete(question)}
/>
```

---

### QuestionModal
**File:** `question-modal.tsx`

2-step wizard for creating/editing questions.

**Props:**
```typescript
{
  open: boolean                           // Modal visibility
  onOpenChange: (open: boolean) => void   // Close handler
  onSave: (question: Partial<QuizQuestion>) => Promise<void>
  editQuestion?: QuizQuestion | null      // For edit mode
  skills: Array<{ id: string; name: string }>  // Available skills
}
```

**Features:**
- **Step 1:** Question type selection (4 types)
- **Step 2:** Question details form
- Type-specific fields:
  - Multiple Choice: 4 options + radio select
  - True/False: Toggle buttons
  - Short/Long Answer: Good answer example field
- Importance dropdown (1-5)
- Difficulty dropdown (Easy/Medium/Hard/Expert)
- Skill association dropdown
- Validation before save
- Edit mode support

**Usage:**
```tsx
<QuestionModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  onSave={handleSaveQuestion}
  editQuestion={editingQuestion}
  skills={availableSkills}
/>
```

---

### QuestionsTab
**File:** `questions-tab.tsx`

Complete question management interface for an assessment.

**Props:**
```typescript
{
  quizId: string    // Assessment ID
  jobId: string     // Associated job/role ID
}
```

**Features:**
- Empty state with "Create Question" CTA
- Question list with cards
- Create/Edit/Delete operations
- Auto-creates quiz section if needed
- Loads job skills for dropdown
- Delete confirmation dialog
- Toast notifications
- Loading states
- AI generation button (placeholder)

**Usage:**
```tsx
<QuestionsTab
  quizId={assessmentId}
  jobId={selectedRoleId}
/>
```

---

### AnalyticsTab
**File:** `analytics-tab.tsx`

Performance metrics and analytics dashboard.

**Props:**
```typescript
{
  quizId: string       // Assessment ID
  isAdmin?: boolean    // Admin mode (global vs company-scoped)
}
```

**Features:**
- Overview stats (4 cards):
  - Total assessments
  - Average readiness
  - Ready candidates (90%+)
  - Developing candidates (<85%)
- Readiness distribution bars
- Top performers list (top 10)
- Skill gaps analysis (lowest 5)
- Question performance metrics
- Empty state for no data
- Admin mode support

**Usage:**
```tsx
<AnalyticsTab
  quizId={assessmentId}
  isAdmin={false}  // Employer mode
/>
```

---

## Data Flow

```
Assessment Editor Page
  ├── Basic Info Tab (native)
  ├── Questions Tab
  │   ├── QuestionsTab Component
  │   │   ├── QuestionCard (multiple)
  │   │   └── QuestionModal
  │   └── Supabase Queries
  │       ├── quiz_sections
  │       ├── quiz_questions
  │       └── job_skills
  └── Analytics Tab
      ├── AnalyticsTab Component
      └── Supabase Queries
          ├── assessments
          ├── quiz_questions
          └── skills
```

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui components (Button, Card, Dialog, etc.)
- Lucide React icons
- Teal color scheme (`teal-600`, `teal-100`, etc.)
- Consistent spacing and typography

## TypeScript

All components are fully typed using definitions from:
```typescript
import type { QuizQuestion, QuestionType, ImportanceLevel, DifficultyLevel } from '@/types/assessment'
```

## Testing

Test coverage for these components:
- **Phase 4 Tests:** 49/49 passed
- **Phase 5 Tests:** 27/27 passed

Run tests:
```bash
node scripts/test-assessment-phase4.js
node scripts/test-assessment-phase5.js
```

## Future Enhancements

- [ ] Drag-and-drop reordering (QuestionCard has handle ready)
- [ ] AI question generation integration
- [ ] Question templates
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Export/Import functionality
