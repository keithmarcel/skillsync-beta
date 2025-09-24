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
    console.log('📥 Fetching favorites for user:', userId);
    setLoading(true);
    setError(null);
    try {
      const [jobs, programs] = await Promise.all([
        getUserFavoriteJobs(userId),
        getUserFavoritePrograms(userId),
      ]);

      console.log('📊 Fetched favorites:', { jobs: jobs.length, programs: programs.length });

      const processedJobs = jobs.map(j => ({ 
        ...j, 
        company: typeof j.company === 'string' ? JSON.parse(j.company) : j.company 
      }));
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
    console.log('🔥 ADD FAVORITE CALLED:', { entityKind, entityId, user: user?.id, userId: user?.id })
    console.log('🔥 Current auth state:', { user, loading: authLoading })

    if (!user?.id) {
      console.error('❌ No user ID available for favorites')
      console.error('❌ Auth state:', { user, authLoading })
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
        // TEMPORARY: For development mode, manually add to in-memory favorites
        if (entityKind === 'job') {
          console.log('🔧 DEV MODE: Fetching real job data for favorites list')
          
          // Fetch the real job data
          getJobById(entityId).then(realJob => {
            if (realJob) {
              console.log('🔧 DEV MODE: Found real job data:', realJob.title)
              setFavoriteJobs(prev => {
                // Check if already exists to avoid duplicates
                if (prev.some(job => job.id === entityId)) {
                  console.log('🔧 DEV MODE: Job already in favorites, skipping')
                  return prev
                }
                console.log('🔧 DEV MODE: Adding real job to favorites:', realJob)
                return [...prev, realJob]
              })
            } else {
              console.log('🔧 DEV MODE: Could not find job data, using fallback')
              // Fallback to mock if job not found
              setFavoriteJobs(prev => {
                if (prev.some(job => job.id === entityId)) return prev
                const mockJob: Job = {
                  id: entityId,
                  job_kind: 'occupation',
                  title: 'Added Job',
                  soc_code: null,
                  company_id: null,
                  job_type: null,
                  category: 'Unknown',
                  location_city: null,
                  location_state: null,
                  median_wage_usd: null,
                  long_desc: 'Recently added job',
                  featured_image_url: null,
                  skills_count: 0,
                  is_featured: false,
                  employment_outlook: null,
                  education_level: null,
                  work_experience: null,
                  on_job_training: null,
                  job_openings_annual: null,
                  growth_rate_percent: null,
                  required_proficiency_pct: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  status: 'published'
                }
                return [...prev, mockJob]
              })
            }
          }).catch(error => {
            console.error('🔧 DEV MODE: Error fetching job data:', error)
          })
        }
        
        toast({
          title: "Added to Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been added to your favorites.`,
        })
        
        // TEMPORARY: Skip fetchFavorites in development mode since we manually updated the state
        console.log('🔄 Skipping fetchFavorites in development mode - using manual state update')
        // await fetchFavorites(user.id)
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
  }, [user?.id, fetchFavorites, toast, authLoading])

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
        // TEMPORARY: For development mode, manually remove from in-memory favorites
        if (entityKind === 'job') {
          console.log('🔧 DEV MODE: Manually removing job from favorites list')
          setFavoriteJobs(prev => prev.filter(job => job.id !== entityId))
        }
        
        toast({
          title: "Removed from Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been removed from your favorites.`,
        })
        
        // TEMPORARY: Skip fetchFavorites in development mode since we manually updated the state
        console.log('🔄 Skipping fetchFavorites in development mode - using manual state update')
        // await fetchFavorites(user.id)
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
    console.log('🔍 IS FAVORITE CHECK:', { entityKind, entityId, loading })
    console.log('🔍 Current favorite jobs:', favoriteJobs.map(j => ({ id: j.id, title: j.title })))
    console.log('🔍 Looking for job ID:', entityId)
    console.log('🔍 Available job IDs:', favoriteJobs.map(j => j.id))
    
    // If still loading, return false to avoid premature rendering
    if (loading) {
      console.log('🔍 Still loading favorites, returning false')
      return false
    }
    
    if (entityKind === 'job') {
      const result = favoriteJobs.some(job => job.id === entityId)
      console.log('🔍 Is job favorited?', result)
      console.log('🔍 Exact match check:', favoriteJobs.map(j => ({ id: j.id, matches: j.id === entityId })))
      return result
    } else {
      const result = favoritePrograms.some(program => program.id === entityId)
      console.log('🔍 Is program favorited?', result)
      return result
    }
  }, [favoriteJobs, favoritePrograms, loading])

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
