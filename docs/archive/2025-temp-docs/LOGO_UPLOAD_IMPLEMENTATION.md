# School Logo Upload Implementation

## Overview
Complete implementation of SVG/PNG logo upload functionality for education providers in the admin tools.

## Components Created

### 1. **ImageUpload Component** (`/src/components/admin/ImageUpload.tsx`)
- Reusable image upload component with preview
- Supports SVG, PNG, JPG formats
- 2MB file size limit
- Real-time preview before upload
- Remove/change functionality
- Inline spinner during upload
- Error handling and validation

### 2. **API Route** (`/src/app/api/admin/upload-logo/route.ts`)
- Handles file uploads via FormData
- Validates file type and size
- Saves to `/public/schools/` or `/public/companies/` based on entity type
- Generates unique filenames with timestamps
- Returns public URL path for database storage

### 3. **EntityDetailView Integration**
- Added IMAGE case handler to EntityDetailView component
- Integrated ImageUpload component
- Passes entity type and ID for proper routing

## Database Structure

### Schools Table
```sql
- id (uuid)
- name (text)
- logo_url (text) ← Stores uploaded logo path
- about_url (text)
- city (text)
- state (text)
- catalog_affiliation (text)
- is_published (boolean)
```

## Upload Flow

### Admin Upload Process
1. Navigate to `/admin/providers`
2. Click on any provider to edit
3. Go to "Media & Branding" tab
4. Click "Upload Image" button
5. Select SVG/PNG/JPG file (max 2MB)
6. Preview appears immediately
7. Click "Save" to persist to database
8. Logo URL stored in `schools.logo_url` field

### File Storage
- **Location**: `/public/schools/[timestamp]-[filename].[ext]`
- **URL Format**: `/schools/[timestamp]-[filename].[ext]`
- **Examples**: 
  - `/schools/1696350000000-university-logo.svg`
  - `/schools/1696350000000-college-logo.png`

## Display Locations

### Where School Logos Appear
1. **Featured Programs Cards** (`/programs?tab=featured`)
   - Query: `programs.select('*, school:schools(*)')`
   - Component: `FeaturedProgramCard`
   - Field: `school.logo`

2. **All Programs Table** (`/programs?tab=all`)
   - Query: `programs.select('*, school:schools(*)')`
   - Transform: `transformProgramToTable()`
   - Field: `school.logo_url`

3. **Program Detail Pages** (`/programs/[id]`)
   - Shows school logo in header
   - Links to school website

## Data Transform Flow

```javascript
// Database Query
const { data } = await supabase
  .from('programs')
  .select(`
    *,
    school:schools!inner(*)
  `)

// Transform
transformProgramToCard(program) {
  return {
    schoolLogo: program.school?.logo_url || ''
  }
}

// Component
<FeaturedProgramCard
  school={{
    name: program.school,
    logo: program.schoolLogo
  }}
/>
```

## Testing Checklist

### Upload Functionality
- [ ] Navigate to `/admin/providers`
- [ ] Click on a provider (e.g., "Bisk Workforce Essentials")
- [ ] Go to "Media & Branding" tab
- [ ] Upload an SVG logo
- [ ] Verify preview appears
- [ ] Click "Save"
- [ ] Verify success message

### Display Verification
- [ ] Go to `/programs?tab=featured`
- [ ] Verify uploaded logo appears on program card
- [ ] Go to `/programs?tab=all`
- [ ] Verify logo appears in table
- [ ] Check responsive behavior (mobile/desktop)

### File Validation
- [ ] Try uploading file > 2MB (should fail)
- [ ] Try uploading non-image file (should fail)
- [ ] Try uploading SVG (should succeed)
- [ ] Try uploading PNG (should succeed)
- [ ] Try uploading JPG (should succeed)

### Edge Cases
- [ ] Upload logo for provider without existing logo
- [ ] Replace existing logo
- [ ] Remove logo (click X button)
- [ ] Save without logo (should allow null)

## Current Status

### ✅ Completed
- ImageUpload component with preview
- API route for file uploads
- EntityDetailView IMAGE field integration
- Database schema verified
- Transform functions updated
- Display components working
- File validation implemented

### 📊 Database Status
- 15 schools have logos already set
- 7 schools need logos uploaded
- All logos stored in `/public/schools/`

### 🔗 Integration Points
- Admin UI: `/admin/providers/[id]` → Media & Branding tab
- API: `/api/admin/upload-logo`
- Storage: `/public/schools/`
- Display: Featured Programs, All Programs, Program Details

## File Locations

### New Files Created
```
/src/components/admin/ImageUpload.tsx
/src/app/api/admin/upload-logo/route.ts
/scripts/test-logo-flow.js
/docs/LOGO_UPLOAD_IMPLEMENTATION.md
```

### Modified Files
```
/src/components/admin/EntityDetailView.tsx
  - Added ImageUpload import
  - Added IMAGE case handler
```

### Existing Files (No Changes Needed)
```
/src/app/admin/providers/[id]/page.tsx
  - Already configured with IMAGE field type
/src/lib/database/transforms.ts
  - Already handles school.logo_url
/src/components/ui/featured-program-card.tsx
  - Already displays school.logo
```

## Security Considerations

### File Validation
- File type whitelist: SVG, PNG, JPG only
- File size limit: 2MB maximum
- Filename sanitization: Remove special characters
- Unique filenames: Timestamp prefix prevents conflicts

### Storage
- Files stored in `/public` directory (publicly accessible)
- No sensitive data in filenames
- Proper MIME type validation

### API Security
- Should add authentication check (admin only)
- Rate limiting recommended
- File scan for malware (future enhancement)

## Future Enhancements

### Potential Improvements
1. **Image Optimization**
   - Auto-resize large images
   - Convert to WebP for better performance
   - Generate multiple sizes for responsive images

2. **Cloud Storage**
   - Migrate to S3/Cloudinary for scalability
   - CDN integration for faster delivery
   - Automatic backups

3. **Advanced Features**
   - Drag-and-drop upload
   - Bulk upload for multiple providers
   - Image cropping/editing tools
   - Logo library/gallery view

4. **Validation**
   - SVG sanitization (remove scripts)
   - Image dimension requirements
   - Aspect ratio validation

## Troubleshooting

### Logo Not Displaying
1. Check database: `SELECT name, logo_url FROM schools WHERE id = 'xxx'`
2. Verify file exists: Check `/public/schools/[filename]`
3. Check browser console for 404 errors
4. Verify URL format: Should be `/schools/filename.ext` (no `/public`)

### Upload Failing
1. Check file size (must be < 2MB)
2. Check file type (SVG, PNG, JPG only)
3. Check API route logs
4. Verify `/public/schools/` directory exists and is writable

### Preview Not Showing
1. Check browser console for errors
2. Verify FileReader API support
3. Check file format compatibility
4. Clear browser cache

## Support

For issues or questions:
- Check browser console for errors
- Review API route logs
- Test with sample SVG file
- Verify database permissions
