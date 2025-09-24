# Database Migrations

This directory contains database migrations for the SkillSync application.

## Migration System

Our migration system uses:
- **Versioned migrations** with timestamp naming convention
- **Migration tracking table** to prevent duplicate executions
- **Idempotent operations** that can be safely re-run
- **Transactional execution** with rollback on failure

## Naming Convention

Migrations follow the format: `YYYYMMDD_description.sql`

Example: `20250924_fix_featured_role_categories.sql`

## How to Run Migrations

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy the migration file content**
3. **Paste and execute** - the migration will:
   - Check if already executed (idempotent)
   - Run the migration if needed
   - Record completion in `migrations` table
   - Provide status feedback

## Migration Structure

Each migration includes:
```sql
-- Migration metadata
-- Description and author info

BEGIN;

-- Create migrations table if needed
CREATE TABLE IF NOT EXISTS public.migrations (...);

-- Idempotent check
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = 'migration_name') THEN
    RAISE NOTICE 'Migration already executed';
    RETURN;
  END IF;

  -- Migration logic here
  -- ...

  -- Record completion
  INSERT INTO public.migrations (name) VALUES ('migration_name');
END $$;

COMMIT;
```

## Current Migrations

- `20250924_fix_featured_role_categories.sql` - Updates featured roles to have proper categories instead of "Featured Role"

## Best Practices

- ✅ **Always use transactions** (BEGIN/COMMIT)
- ✅ **Make migrations idempotent** (can be safely re-run)
- ✅ **Include rollback instructions** in comments if needed
- ✅ **Test migrations** on staging before production
- ✅ **Use descriptive names** and include metadata
- ✅ **Track execution** in migrations table
