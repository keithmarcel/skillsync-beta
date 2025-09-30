import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Job } from '@/lib/database/queries'

interface EnrichedJob extends Job {
  bls_wage_data?: {
    median_wage: number
    employment_level: number
    location_quotient: number
    updated_at: string
  }[]
  bls_employment_projections?: {
    projected_growth_rate: number
    projected_openings: number
    updated_at: string
  }[]
  cos_programs_cache?: {
    count: number
  }[]
  cos_certifications_cache?: {
    count: number
  }[]
}

export function useEnrichedOccupations(occupations: Job[] | null) {
  const [enrichedData, setEnrichedData] = useState<EnrichedJob[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!occupations || occupations.length === 0) {
      setEnrichedData([])
      return
    }

    const fetchEnrichmentData = async () => {
      setLoading(true)
      try {
        const socCodes = occupations
          .filter(job => job.soc_code)
          .map(job => job.soc_code!)

        if (socCodes.length === 0) {
          setEnrichedData(occupations as EnrichedJob[])
          return
        }

        // Fetch BLS wage data
        const { data: wageData } = await supabase
          .from('bls_wage_data')
          .select('soc_code, median_wage, employment_level, location_quotient, updated_at')
          .in('soc_code', socCodes)
          .order('data_year', { ascending: false })

        // Fetch BLS employment projections
        const { data: projectionsData } = await supabase
          .from('bls_employment_projections')
          .select('soc_code, projected_growth_rate, projected_openings, updated_at')
          .in('soc_code', socCodes)

        // Fetch CareerOneStop programs count
        const { data: programsData } = await supabase
          .from('cos_programs_cache')
          .select('soc_code')
          .in('soc_code', socCodes)

        // Fetch CareerOneStop certifications count
        const { data: certsData } = await supabase
          .from('cos_certifications_cache')
          .select('soc_code')
          .in('soc_code', socCodes)

        // Group data by SOC code
        const wageMap = new Map()
        wageData?.forEach(item => {
          if (!wageMap.has(item.soc_code)) {
            wageMap.set(item.soc_code, [])
          }
          wageMap.get(item.soc_code).push(item)
        })

        const projectionsMap = new Map()
        projectionsData?.forEach(item => {
          if (!projectionsMap.has(item.soc_code)) {
            projectionsMap.set(item.soc_code, [])
          }
          projectionsMap.get(item.soc_code).push(item)
        })

        const programsCount = new Map()
        programsData?.forEach(item => {
          programsCount.set(item.soc_code, (programsCount.get(item.soc_code) || 0) + 1)
        })

        const certsCount = new Map()
        certsData?.forEach(item => {
          certsCount.set(item.soc_code, (certsCount.get(item.soc_code) || 0) + 1)
        })

        // Merge enrichment data with occupations
        const enriched: EnrichedJob[] = occupations.map(job => ({
          ...job,
          bls_wage_data: job.soc_code ? wageMap.get(job.soc_code) || [] : [],
          bls_employment_projections: job.soc_code ? projectionsMap.get(job.soc_code) || [] : [],
          cos_programs_cache: job.soc_code ? [{ count: programsCount.get(job.soc_code) || 0 }] : [{ count: 0 }],
          cos_certifications_cache: job.soc_code ? [{ count: certsCount.get(job.soc_code) || 0 }] : [{ count: 0 }]
        }))

        setEnrichedData(enriched)
      } catch (error) {
        console.error('Error fetching enrichment data:', error)
        setEnrichedData(occupations as EnrichedJob[])
      } finally {
        setLoading(false)
      }
    }

    fetchEnrichmentData()
  }, [occupations])

  return { enrichedData, loading }
}
