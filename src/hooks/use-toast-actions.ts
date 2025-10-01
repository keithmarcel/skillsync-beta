/**
 * Standardized Toast Patterns for Common Actions
 * 
 * Provides consistent toast messaging across the application
 * for CRUD operations and other common actions.
 */

import { useToast } from '@/hooks/use-toast'

export function useToastActions() {
  const { toast } = useToast()

  return {
    // Success toasts
    deleteSuccess: (itemName: string) => {
      toast({
        title: 'Deleted successfully',
        description: `${itemName} has been permanently deleted.`,
      })
    },

    createSuccess: (itemName: string) => {
      toast({
        title: 'Created successfully',
        description: `${itemName} has been created.`,
      })
    },

    updateSuccess: (itemName: string) => {
      toast({
        title: 'Updated successfully',
        description: `${itemName} has been updated.`,
      })
    },

    publishSuccess: (itemName: string) => {
      toast({
        title: 'Published successfully',
        description: `${itemName} is now live.`,
      })
    },

    unpublishSuccess: (itemName: string) => {
      toast({
        title: 'Unpublished successfully',
        description: `${itemName} has been unpublished.`,
      })
    },

    // Error toasts
    deleteError: (itemName: string, error?: string) => {
      toast({
        title: 'Failed to delete',
        description: error || `Could not delete ${itemName}. Please try again.`,
        variant: 'destructive',
      })
    },

    createError: (itemName: string, error?: string) => {
      toast({
        title: 'Failed to create',
        description: error || `Could not create ${itemName}. Please try again.`,
        variant: 'destructive',
      })
    },

    updateError: (itemName: string, error?: string) => {
      toast({
        title: 'Failed to update',
        description: error || `Could not update ${itemName}. Please try again.`,
        variant: 'destructive',
      })
    },

    // Generic toasts
    success: (title: string, description?: string) => {
      toast({ title, description })
    },

    error: (title: string, description?: string) => {
      toast({ title, description, variant: 'destructive' })
    },

    loading: (title: string, description?: string) => {
      toast({ title, description })
    },
  }
}
