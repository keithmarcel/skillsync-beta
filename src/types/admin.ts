import { User } from '@supabase/supabase-js';

export type AdminRole = 'super_admin' | 'company_admin' | 'provider_admin' | null;

export interface AdminProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  admin_role: AdminRole;
  company_id: string | null;
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface AdminDashboardStats {
  total_users: number;
  total_companies: number;
  total_providers: number;
  total_programs: number;
  total_roles: number;
  total_assessments: number;
  recent_activity: AdminAuditLog[];
}

export interface AdminContextType {
  user: User | null;
  profile: AdminProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isProviderAdmin: boolean;
  can: (action: string, resource: string, resourceOwnerId?: string) => boolean;
  getScopedData: <T>(
    table: string, 
    select?: string, 
    filter?: Record<string, any>
  ) => Promise<T[] | null>;
  logAction: (
    action: string, 
    entityType: string, 
    entityId: string, 
    metadata?: Record<string, any>
  ) => Promise<void>;
  showToast: (type: 'success' | 'error', title: string, description?: string) => void;
}

export interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
  children?: AdminNavItem[];
}

export interface AdminTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface AdminTableProps<T> {
  data: T[];
  columns: AdminTableColumn<T>[];
  keyField?: keyof T | string;
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  rowActions?: (row: T) => React.ReactNode[];
  className?: string;
}
