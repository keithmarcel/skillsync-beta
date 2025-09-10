'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMockAuth } from './useAuth'
import { useToast } from './use-toast'
import { 
  getUserFavoriteJobs, 
  getUserFavoritePrograms, 
  addToFavorites, 
  removeFromFavorites 
} from '@/lib/database/queries'
import type { Job, Program } from '@/lib/database/queries'

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
  const { user } = useMockAuth()
  const { toast } = useToast()
  const [favoriteJobs, setFavoriteJobs] = useState<Job[]>([])
  const [favoritePrograms, setFavoritePrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching favorites')
      return
    }

    console.log('Fetching favorites for user:', user.id)
    setLoading(true)
    setError(null)
    
    try {
      const [jobs, programs] = await Promise.all([
        getUserFavoriteJobs(user.id),
        getUserFavoritePrograms(user.id)
      ])
      
      console.log('Fetched favorites:', { jobs: jobs.length, programs: programs.length })
      setFavoriteJobs(jobs)
      setFavoritePrograms(programs)
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const addFavorite = useCallback(async (entityKind: 'job' | 'program', entityId: string): Promise<boolean> => {
    if (!user?.id) {
      console.log('No user ID available for favorites')
      return false
    }

    console.log('Adding favorite:', { entityKind, entityId, userId: user.id })
    try {
      const success = await addToFavorites(user.id, entityKind, entityId)
      console.log('Add favorite result:', success)
      if (success) {
        // Show success toast
        toast({
          title: "Added to Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been added to your favorites.`,
        })
        // Refresh favorites to get updated data
        await fetchFavorites()
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
      console.log('No user ID available for favorites')
      return false
    }

    console.log('Removing favorite:', { entityKind, entityId, userId: user.id })
    try {
      const success = await removeFromFavorites(user.id, entityKind, entityId)
      console.log('Remove favorite result:', success)
      if (success) {
        // Show success toast
        toast({
          title: "Removed from Favorites",
          description: `${entityKind === 'job' ? 'Job' : 'Program'} has been removed from your favorites.`,
        })
        // Refresh favorites to get updated data
        await fetchFavorites()
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

  return {
    favoriteJobs,
    favoritePrograms,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites
  }
}
