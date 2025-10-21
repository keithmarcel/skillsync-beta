# Apply Feedback Widget Migration

The feedback widget is failing because the database migration hasn't been applied yet.

## Option 1: Apply via Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste the following SQL:

```sql
-- Enhance feedback table with route context and feedback level
-- Migration: 20251009000000_enhance_feedback_table.sql

-- Add route_path column to track where feedback was submitted
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS route_path TEXT;

-- Add feedback_level column to store numeric rating (1-5 scale)
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS feedback_level INTEGER CHECK (feedback_level BETWEEN 1 AND 5);

-- Add index for querying by feedback level
CREATE INDEX IF NOT EXISTS idx_feedback_level ON public.feedback(feedback_level);

-- Add index for querying by route path
CREATE INDEX IF NOT EXISTS idx_feedback_route_path ON public.feedback(route_path);

-- Add comment explaining emoji to level mapping
COMMENT ON COLUMN public.feedback.feedback_level IS 'Feedback level: 1=😟 (negative), 3=😐 (neutral), 5=😍 (positive)';
COMMENT ON COLUMN public.feedback.route_path IS 'Route path where feedback was submitted (e.g., /jobs, /programs/123)';
```

5. Click **Run** button
6. Verify success message appears

## Option 2: Apply via Supabase CLI

```bash
# Make sure you're connected to your remote database
npx supabase db push
```

⚠️ **Note**: This may hang due to connection pool issues. If it does, use Option 1 instead.

## Verify Migration Applied

After applying the migration, test the feedback widget:

1. Navigate to any page in the app
2. Click "Give Feedback" button in navbar
3. Select an emoji (😟, 😐, or 😍)
4. Optionally add a comment
5. Click Submit
6. You should see "Thank you!" success message

## Check Admin Dashboard

1. Navigate to `/admin/feedback` (Super Admin or Partner Admin only)
2. You should see:
   - Total feedback count
   - Sentiment breakdown (positive, neutral, negative)
   - Average rating
   - Feedback by page analytics
   - Recent feedback submissions

## Troubleshooting

If you still get "Failed to submit feedback" error:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try submitting feedback again
4. Look for error messages
5. Check Network tab for the `/api/feedback` POST request
6. Share the error details for further debugging
