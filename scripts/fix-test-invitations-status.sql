-- Fix Test Invitations Status
-- Makes seeded test invitations visible to candidates by updating status from 'pending' to 'sent'
-- Run this in Supabase SQL Editor after seeding test data

-- ✅ EXECUTED: October 11, 2025 1:26 AM
-- ✅ RESULT: 19 invitations updated to status='sent'
-- ✅ VERIFIED: Test data now visible across 5 test candidates

-- Update all pending invitations to sent status
-- This simulates the employer clicking "Send Invitation" button
UPDATE employer_invitations 
SET 
  status = 'sent',
  invited_at = NOW() - INTERVAL '2 days',  -- Backdated 2 days for realistic testing
  updated_at = NOW()
WHERE status = 'pending';

-- Verify the update
SELECT 
  ei.id,
  c.name as company_name,
  j.title as job_title,
  ei.status,
  ei.invited_at,
  ei.is_read,
  p.first_name || ' ' || p.last_name as candidate_name
FROM employer_invitations ei
JOIN companies c ON ei.company_id = c.id
JOIN jobs j ON ei.job_id = j.id
JOIN profiles p ON ei.user_id = p.id
WHERE ei.status = 'sent'
ORDER BY ei.invited_at DESC;

-- Expected result: All test invitations now have status='sent' and invited_at timestamp
-- These will now appear in candidate notification dropdowns and invitations page
