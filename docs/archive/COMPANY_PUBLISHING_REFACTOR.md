# Company Publishing Status Refactor

## Overview
This refactor changes the companies admin interface from controlling "trusted partner" status to controlling "published" status, which provides better control over company visibility in the main app.

## Changes Made

### 1. Database Schema Updates
- **Added `is_published` field** to companies table
- **Updated TypeScript interfaces** to include the new field
- **Modified queries** to filter by company published status

### 2. Admin Interface Updates
- **Companies list page**: Status column now controls `is_published` instead of `is_trusted_partner`
- **Company detail page**: Settings tab now has "Published Status" field
- **Status labels**: Changed from "Trusted Partner/Standard" to "Published/Unpublished"

### 3. Query Updates
- **Job queries**: `getFeaturedRoles()` and `getHighDemandOccupations()` now filter by `company.is_published = true`
- **Job detail**: `getJobById()` now only returns jobs from published companies
- **Trusted partners**: `getTrustedPartners()` now returns published companies (automatic designation)
- **Favorites**: `getUserFavoriteJobs()` now filters out jobs from unpublished companies

### 4. Business Logic
- **Publishing control**: When a company is published (is_published = true):
  - Company appears in main app
  - All company jobs are visible
  - Company is automatically considered a "trusted partner"
- **Unpublishing**: When unpublished (is_published = false):
  - Company is hidden from main app
  - All company jobs are hidden
  - Company no longer appears as trusted partner

## Migration Instructions

1. **Run the database migration** in Supabase SQL Editor:
   ```sql
   -- Located in: migrations/add_company_published_field.sql
   ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
   COMMENT ON COLUMN companies.is_published IS 'Controls whether the company and its jobs are visible in the main app...';
   UPDATE companies SET is_published = true WHERE is_published IS NULL;
   ```

2. **Verify the changes** by checking the companies admin page - the status column should now show "Published/Unpublished" instead of "Trusted Partner/Standard"

## Benefits

- **Clear separation of concerns**: Publishing controls visibility, trusted partner is automatic
- **Better user experience**: More intuitive labeling and behavior
- **Improved data integrity**: Unpublished companies are properly hidden from users
- **Future flexibility**: Easy to add additional status controls if needed

## Testing

After running the migration:
1. Check that all existing companies show as "Published" by default
2. Toggle a company's status to "Unpublished"
3. Verify that company's jobs are no longer visible in the main app
4. Verify that unpublished companies don't appear in trusted partners list
5. Test that published companies and their jobs are visible as expected
