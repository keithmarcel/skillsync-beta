'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'
import { 
  getUserFavoriteJobs, 
  getUserFavoritePrograms, 
  addToFavorites, 
  removeFromFavorites,
  getJobById,
  type Job,
  type Program,
  type School
} from '@/lib/database/queries'

interface UseFavoritesReturn {
  favoriteJobs: Job[]
  favoritePrograms: Program[]
  loading: boolean
  error: string | null
  addFavorite: (entityKind: 'job' | 'program', entityId: string) => Promise<boolean>
  removeFavorite: (entityKind: 'job' | 'program', entityId: string) => Promise<boolean>
  isFavorite: (entityKind: 'job' | 'program', entityId: string) => boolean
  refreshFavorites: () => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [favoriteJobs, setFavoriteJobs] = useState<Job[]>([]);
  const [favoritePrograms, setFavoritePrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [jobs, programs] = await Promise.all([
        getUserFavoriteJobs(userId),
        getUserFavoritePrograms(userId),
      ]);

      const processedJobs = jobs.map(j => ({ 
        ...j, 
        company: typeof j.company === 'string' ? JSON.parse(j.company) : j.company 
      }));
      const processedPrograms = programs.map(p => ({ ...p, school: p.school as School }));

      setFavoriteJobs(processedJobs);
      setFavoritePrograms(processedPrograms);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (user) {
      fetchFavorites(user.id);
    } else {
      setFavoriteJobs([]);
      setFavoritePrograms([]);
      setLoading(false);
    }
  }, [user, authLoading, fetchFavorites]);

  const addFavorite = useCallback(async (entityKind: 'job' | 'program', entityId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add favorites.",
        variant: "destructive",
      })
      return false
    }

    try {
      const success = await addToFavorites(user.id, entityKind, entityId)
      if (success) {
        toast({
          title: "Added to Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been added to your favorites.`,
        })
        // Refresh favorites data to reflect the change
        await fetchFavorites(user.id)
      } else {
        toast({
          title: "Error",
          description: "Failed to add to favorites. Please try again.",
          variant: "destructive",
        })
      }
      return success
    } catch (err) {
      console.error('Error adding favorite:', err)
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      })
      setError('Failed to add favorite')
      return false
    }
  }, [user?.id, fetchFavorites, toast])

  const removeFavorite = useCallback(async (entityKind: 'job' | 'program', entityId: string): Promise<boolean> => {
    if (!user?.id) {
      return false
    }

    try {
      const success = await removeFromFavorites(user.id, entityKind, entityId)
      if (success) {
        toast({
          title: "Removed from Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been removed from your favorites.`,
        })
        // Refresh favorites data to reflect the change
        await fetchFavorites(user.id)
      } else {
        toast({
          title: "Error",
          description: "Failed to remove from favorites. Please try again.",
          variant: "destructive",
        })
      }
      return success
    } catch (err) {
      console.error('Error removing favorite:', err)
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      })
      setError('Failed to remove favorite')
      return false
    }
  }, [user?.id, fetchFavorites, toast])

  const isFavorite = useCallback((entityKind: 'job' | 'program', entityId: string): boolean => {
    // If still loading, return false to avoid premature rendering
    if (loading) {
      return false
    }
    
    if (entityKind === 'job') {
      return favoriteJobs.some(job => job.id === entityId)
    } else {
      return favoritePrograms.some(program => program.id === entityId)
    }
  }, [favoriteJobs, favoritePrograms, loading])

  const refreshFavorites = useCallback(async () => {
    if (user?.id) {
      await fetchFavorites(user.id);
    }
  }, [user?.id, fetchFavorites]);

  return {
    favoriteJobs,
    favoritePrograms,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites
  }
}
