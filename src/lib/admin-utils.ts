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
  
  const [
    { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false),
    { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true }),
    { count: totalProviders } = await supabase
      .from('education_providers')
      .select('*', { count: 'exact', head: true }),
    { count: totalPrograms } = await supabase
      .from('education_programs')
      .select('*', { count: 'exact', head: true }),
    { count: totalRoles } = await supabase
      .from('roles')
      .select('*', { count: 'exact', head: true }),
    { count: totalAssessments } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true }),
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('education_providers').select('*', { count: 'exact', head: true }),
    supabase.from('education_programs').select('*', { count: 'exact', head: true }),
    supabase.from('roles').select('*', { count: 'exact', head: true }),
    supabase.from('assessments').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalCompanies: totalCompanies || 0,
    totalProviders: totalProviders || 0,
    totalPrograms: totalPrograms || 0,
    totalRoles: totalRoles || 0,
    totalAssessments: totalAssessments || 0,
    pendingApprovals: 0, // Implement this based on your approval workflow
    totalOccupations: 0, // Implement this if needed
  };
};

export const getRecentActivity = async (limit = 10) => {
  const supabase = createClient();
  
  const { data: activities, error } = await supabase
    .from('admin_audit_logs')
    .select(`
      *,
      profiles:user_id (id, email, first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }

  return activities.map((activity: any) => ({
    id: activity.id,
    action: activity.action,
    entityType: activity.entity_type,
    entityId: activity.entity_id,
    status: activity.status,
    timestamp: activity.created_at,
    user: {
      id: activity.profiles?.id,
      email: activity.profiles?.email,
      name: activity.profiles?.first_name 
        ? `${activity.profiles.first_name} ${activity.profiles.last_name || ''}`.trim()
        : undefined,
    },
  }));
};
