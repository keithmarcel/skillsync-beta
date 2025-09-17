'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'
import { 
  getUserFavoriteJobs, 
  getUserFavoritePrograms, 
  addToFavorites, 
  removeFromFavorites 
} from '@/lib/database/queries'
import type { Job, Program, Company, School } from '@/lib/database/queries'

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
    console.log('📥 Fetching favorites for user:', userId);
    setLoading(true);
    setError(null);
    try {
      const [jobs, programs] = await Promise.all([
        getUserFavoriteJobs(userId),
        getUserFavoritePrograms(userId),
      ]);

      console.log('📊 Fetched favorites:', { jobs: jobs.length, programs: programs.length });

      const processedJobs = jobs.map(j => ({ ...j, company: j.company as Company }));
      const processedPrograms = programs.map(p => ({ ...p, school: p.school as School }));

      setFavoriteJobs(processedJobs);
      setFavoritePrograms(processedPrograms);
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect now correctly handles all authentication states.
    if (authLoading) {
      // 1. If auth is loading, we are also loading.
      console.log('⏳ Auth is loading, useFavorites is waiting...');
      setLoading(true);
      return;
    }

    if (user) {
      // 2. If auth is done and we have a user, fetch their data.
      console.log('✅ Auth finished, user found. Fetching favorites.');
      fetchFavorites(user.id);
    } else {
      // 3. If auth is done and there is no user, we are done loading.
      console.log('❌ Auth finished, no user. Clearing favorites.');
      setFavoriteJobs([]);
      setFavoritePrograms([]);
      setLoading(false);
    }
  }, [user, authLoading, fetchFavorites]);

  const addFavorite = useCallback(async (entityKind: 'job' | 'program', entityId: string): Promise<boolean> => {
    console.log('🔥 ADD FAVORITE CALLED:', { entityKind, entityId, user: user?.id })
    
    if (!user?.id) {
      console.error('❌ No user ID available for favorites')
      toast({
        title: "Authentication Required",
        description: "Please sign in to add favorites.",
        variant: "destructive",
      })
      return false
    }

    console.log('📝 Adding favorite:', { entityKind, entityId, userId: user.id })
    try {
      const success = await addToFavorites(user.id, entityKind, entityId)
      console.log('✅ Add favorite result:', success)
      if (success) {
        toast({
          title: "Added to Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been added to your favorites.`,
        })
        console.log('🔄 Refreshing favorites after add...')
        await fetchFavorites(user.id)
      } else {
        console.error('❌ Add favorite failed')
        toast({
          title: "Error",
          description: "Failed to add to favorites. Please try again.",
          variant: "destructive",
        })
      }
      return success
    } catch (err) {
      console.error('❌ Error adding favorite:', err)
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
      console.log('No user ID available for favorites')
      return false
    }

    console.log('Removing favorite:', { entityKind, entityId, userId: user.id })
    try {
      const success = await removeFromFavorites(user.id, entityKind, entityId)
      console.log('Remove favorite result:', success)
      if (success) {
        toast({
          title: "Removed from Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been removed from your favorites.`,
        })
        await fetchFavorites(user.id)
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
    if (entityKind === 'job') {
      return favoriteJobs.some(job => job.id === entityId)
    } else {
      return favoritePrograms.some(program => program.id === entityId)
    }
  }, [favoriteJobs, favoritePrograms])

  const refreshFavorites = useCallback(async () => {
    if (user?.id) {
      await fetchFavorites(user.id);
    } else {
      console.log('🔄 Cannot refresh favorites, no user found.');
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
