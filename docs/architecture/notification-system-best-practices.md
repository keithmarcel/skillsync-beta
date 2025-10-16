# Notification System Architecture - FAANG-Level Best Practices

## Current Status

### ⚠️ Temporary Implementation (NOT Production-Ready)
**File**: `/src/components/employer/employer-notification-dropdown.tsx`

**Issues**:
- Manual client-side joins (N+1 query problem)
- No transactional consistency
- Over-fetching data
- Poor performance at scale
- Security concerns with client-side data assembly

### ✅ Production-Ready Implementation
**File**: `/src/components/employer/employer-notification-dropdown-optimized.tsx`

**Requires**: Foreign key constraint `employer_invitations_user_id_fkey`

---

## FAANG-Level Requirements

### 1. Database Schema Integrity

**Required Foreign Keys**:
```sql
-- User relationship
ALTER TABLE employer_invitations
ADD CONSTRAINT employer_invitations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Job relationship (should already exist)
ALTER TABLE employer_invitations
ADD CONSTRAINT employer_invitations_job_id_fkey
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Company relationship (should already exist)
ALTER TABLE employer_invitations
ADD CONSTRAINT employer_invitations_company_id_fkey
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
```

### 2. Performance Indexes

**Required Indexes**:
```sql
-- Notification queries (filtered by company, status, unread)
CREATE INDEX idx_employer_invitations_notifications 
ON employer_invitations(company_id, status, responded_at DESC)
WHERE responded_at IS NOT NULL AND is_read_by_employer = false;

-- Foreign key lookups
CREATE INDEX idx_employer_invitations_user_id ON employer_invitations(user_id);
CREATE INDEX idx_employer_invitations_job_id ON employer_invitations(job_id);
CREATE INDEX idx_employer_invitations_company_id ON employer_invitations(company_id);
```

### 3. Query Optimization

**❌ Bad: N+1 Queries (Current)**
```typescript
// 3 separate queries - scales poorly
const invitations = await supabase.from('employer_invitations').select('*')
const users = await supabase.from('profiles').select('*').in('id', userIds)
const jobs = await supabase.from('jobs').select('*').in('id', jobIds)
// Client-side join
const combined = invitations.map(...)
```

**✅ Good: Single Optimized Query**
```typescript
// 1 query with database joins - optimal
const { data } = await supabase
  .from('employer_invitations')
  .select(`
    *,
    user:employer_invitations_user_id_fkey(first_name, last_name),
    job:employer_invitations_job_id_fkey(title)
  `)
  .eq('company_id', companyId)
  .in('status', ['applied', 'declined', 'hired'])
```

### 4. Security Considerations

**Row Level Security (RLS)**:
```sql
-- Employers can only see their company's invitations
CREATE POLICY "Employers view own company invitations"
ON employer_invitations FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'employer_admin'
  )
);

-- Joined tables also need RLS
-- profiles: Users can see their own data + employers can see candidates
-- jobs: Public read access for active jobs
```

**Data Minimization**:
- Only fetch fields needed for display
- Don't expose sensitive user data
- Use proper field selection in queries

### 5. Real-time Updates (Future Enhancement)

**Supabase Realtime**:
```typescript
// Subscribe to new notifications
const subscription = supabase
  .channel('employer_notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'employer_invitations',
    filter: `company_id=eq.${companyId}`
  }, (payload) => {
    // Update notification count
    loadUnreadCount()
  })
  .subscribe()
```

---

## Migration Path

### Phase 1: Fix Schema (Immediate)
1. Run `/scripts/fix-employer-notifications-schema.sql`
2. Verify foreign keys exist
3. Wait for PostgREST schema cache refresh (1-2 minutes)

### Phase 2: Switch to Optimized Component
1. Test optimized component works with foreign keys
2. Replace current component
3. Remove manual join logic

### Phase 3: Add Provider Notifications
1. Create `provider_notifications` table (or similar)
2. Apply same patterns: foreign keys, indexes, RLS
3. Reuse notification component architecture
4. Ensure consistent UX across employer/provider

### Phase 4: Real-time Enhancement
1. Add Supabase Realtime subscriptions
2. Implement push notifications (optional)
3. Add notification preferences

---

## Provider Notifications Architecture

### Recommended Approach

**Option A: Separate Table (Recommended)**
```sql
CREATE TABLE provider_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES education_providers(id),
  program_id UUID REFERENCES education_programs(id),
  user_id UUID REFERENCES profiles(id),
  notification_type TEXT, -- 'enrollment_inquiry', 'program_interest', etc.
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);
```

**Benefits**:
- Clear separation of concerns
- Provider-specific fields
- Independent scaling
- Easier to maintain

**Option B: Unified Notifications Table**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  entity_type TEXT, -- 'employer', 'provider'
  entity_id UUID,
  ...
);
```

**Benefits**:
- Single notification system
- Unified UI components
- Cross-entity notifications possible

**Recommendation**: Use **Option A** (separate tables) for:
- Type safety
- Clear domain boundaries
- Easier RLS policies
- Better performance

---

## Testing Checklist

### Performance Testing
- [ ] Query execution time < 100ms
- [ ] Handles 1000+ notifications efficiently
- [ ] Proper index usage (verify with EXPLAIN ANALYZE)
- [ ] No N+1 queries in production

### Security Testing
- [ ] RLS policies enforce company boundaries
- [ ] No data leakage between companies
- [ ] ViewAs mode respects permissions
- [ ] Proper authentication checks

### Functionality Testing
- [ ] Unread count updates correctly
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Notifications link to correct pages
- [ ] Empty states display properly

### Scale Testing
- [ ] Test with 10,000+ invitations
- [ ] Test with 100+ concurrent users
- [ ] Monitor database connection pool
- [ ] Check memory usage

---

## Monitoring & Observability

### Key Metrics
- Query execution time
- Notification load time
- Unread count accuracy
- Error rates
- Database connection usage

### Logging
```typescript
// Structured logging for debugging
console.log({
  action: 'load_notifications',
  companyId,
  count: notifications.length,
  duration: Date.now() - startTime,
  error: error?.message
})
```

### Alerts
- Slow query alerts (> 500ms)
- High error rates (> 1%)
- Schema cache issues
- RLS policy violations

---

## Summary

**Current State**: Temporary workaround with manual joins
**Target State**: Production-grade with proper foreign keys and indexes
**Migration**: Run schema fix script, switch to optimized component
**Future**: Extend pattern to provider notifications with same best practices

**Key Principle**: Always use database-level joins with proper foreign keys for optimal performance, security, and maintainability.
