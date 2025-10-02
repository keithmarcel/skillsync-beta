import { createSupabaseClient as createClient } from '@/lib/supabase/client';

type LogActionParams = {
  action: string;
  entityType: string;
  entityId: string;
  status: 'success' | 'error' | 'pending';
  metadata?: Record<string, any>;
};

export const logAction = async (params: LogActionParams) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Cannot log action: No authenticated user');
    return null;
  }

  const { data, error } = await supabase
    .from('admin_audit_logs')
    .insert([
      {
        user_id: user.id,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        status: params.status,
        metadata: params.metadata || {},
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error logging admin action:', error);
    return null;
  }

  return data;
};

export const getAdminStats = async () => {
  const supabase = createClient();

  try {
    const [
      usersResult,
      companiesResult,
      providersResult,
      programsResult,
      rolesResult,
      assessmentsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      supabase.from('programs').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('job_kind', 'featured_role'),
      supabase.from('assessments').select('id', { count: 'exact', head: true }),
    ]);

    // Log results for debugging
    console.log('Admin Stats Debug:', {
      users: usersResult,
      companies: companiesResult,
      providers: providersResult,
      programs: programsResult,
      roles: rolesResult,
      assessments: assessmentsResult,
    });

    return {
      total_users: usersResult.count || 0,
      total_companies: companiesResult.count || 0,
      total_providers: providersResult.count || 0,
      total_programs: programsResult.count || 0,
      total_roles: rolesResult.count || 0,
      total_assessments: assessmentsResult.count || 0,
      pending_approvals: 0, // Implement this based on your approval workflow
      total_occupations: 0, // Implement this if needed
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      total_users: 0,
      total_companies: 0,
      total_providers: 0,
      total_programs: 0,
      total_roles: 0,
      total_assessments: 0,
      pending_approvals: 0,
      total_occupations: 0,
    };
  }
};

export const getRecentActivity = async (limit = 10) => {
  const supabase = createClient();

  const { data: activities, error: activitiesError } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .neq('action', 'viewed') // Exclude "viewed" actions - only show changes
    .order('created_at', { ascending: false })
    .limit(limit);

  if (activitiesError) {
    console.error('Error fetching recent activity:', activitiesError);
    return [];
  }

  if (!activities || activities.length === 0) {
    return [];
  }

  const userIds = Array.from(new Set(activities.map(a => a.user_id).filter(Boolean)));
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles for activity:', profilesError);
    // Return activities without profile info if profiles fetch fails
    return activities;
  }

  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  return activities.map(activity => ({
    ...activity,
    profiles: profilesMap.get(activity.user_id) || null,
  }));
};
