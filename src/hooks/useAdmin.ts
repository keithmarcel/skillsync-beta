import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

export function useAdmin() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has any admin role
  const isAdmin = Boolean(
    profile?.admin_role === 'super_admin' || 
    profile?.admin_role === 'company_admin' || 
    profile?.admin_role === 'provider_admin'
  );

  // Check specific admin roles
  const isSuperAdmin = profile?.admin_role === 'super_admin';
  const isCompanyAdmin = profile?.admin_role === 'company_admin';
  const isProviderAdmin = profile?.admin_role === 'provider_admin';

  // Get admin scope based on role
  const getAdminScope = useCallback(() => {
    if (!user || !profile) return null;
    
    return {
      userId: user.id,
      companyId: profile.company_id,
      schoolId: profile.school_id,
      adminRole: profile.admin_role,
    };
  }, [user, profile]);

  // Check if user can perform an action on a resource
  const can = useCallback((
    action: 'create' | 'read' | 'update' | 'delete', 
    resource: string,
    resourceOwnerId?: string
  ) => {
    if (!isAdmin) return false;
    if (isSuperAdmin) return true;

    // Company admin permissions
    if (isCompanyAdmin) {
      // Company admins can manage their own company's roles
      if (resource === 'roles' && profile?.company_id === resourceOwnerId) {
        return ['read', 'update'].includes(action);
      }
      
      // Add more company-specific permissions here
      return false;
    }

    // Provider admin permissions
    if (isProviderAdmin) {
      // Provider admins can manage their own programs
      if (resource === 'programs' && profile?.school_id === resourceOwnerId) {
        return ['read', 'update'].includes(action);
      }
      
      // Add more provider-specific permissions here
      return false;
    }

    return false;
  }, [isAdmin, isSuperAdmin, isCompanyAdmin, isProviderAdmin, profile]);

  // Get scoped data based on admin role
  const getScopedData = useCallback(async <T>(
    table: string,
    select = '*',
    filter?: Record<string, any>
  ): Promise<T[] | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from(table)
        .select(select);
      
      // Apply role-based filtering
      if (isCompanyAdmin && profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      } else if (isProviderAdmin && profile?.school_id) {
        query = query.eq('school_id', profile.school_id);
      }
      
      // Apply additional filters if provided
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error: queryError } = await query;
      
      if (queryError) throw queryError;
      return data as T[];
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(`Failed to load ${table}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, isCompanyAdmin, isProviderAdmin, profile]);

  // Log admin actions for audit trail
  const logAction = useCallback(async (
    action: string, 
    entityType: string, 
    entityId: string, 
    metadata: Record<string, any> = {}
  ) => {
    if (!user) return;
    
    try {
      await supabase
        .from('admin_audit_logs')
        .insert([
          {
            user_id: user.id,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata: { ...metadata, user_agent: window.navigator.userAgent },
          },
        ]);
    } catch (err) {
      console.error('Error logging admin action:', err);
    }
  }, [user]);

  // Show success/error toast
  const showToast = useCallback((
    type: 'success' | 'error', 
    title: string, 
    description: string = ''
  ) => {
    console.error('Failed to perform admin action');
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Role checks
    isAdmin,
    isSuperAdmin,
    isCompanyAdmin,
    isProviderAdmin,
    
    // Methods
    can,
    getAdminScope,
    getScopedData,
    logAction,
    showToast,
  };
}
