// Occupation Enrichment Service - Orchestrates BLS and CareerOneStop API integration
// Fills occupation detail page data gaps with intelligent caching

import { createClient } from '@supabase/supabase-js'
import { BLSApiService, type BLSWageData } from './bls-api'
import { CareerOneStopApiService, type CareerOneStopJobData } from './careeronestop-api'

// Use server-side Supabase client for cache operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface EnrichmentResult {
  socCode: string
  success: boolean
  dataUpdated: {
    blsWage: boolean
    blsProjections: boolean
    cosPrograms: boolean
    cosCertifications: boolean
  }
  errors: string[]
  cacheStatus: {
    blsWageExpired: boolean
    cosProgramsExpired: boolean
  }
}

interface OccupationEnrichmentData {
  socCode: string
  // BLS Data
  medianWage?: number
  employmentLevel?: number
  growthRate?: string
  // CareerOneStop Data
  educationLevel?: string
  workExperience?: string
  onJobTraining?: string
  relatedPrograms?: Array<{
    name: string
    provider: string
    type: string
    duration: string
    cost?: number
  }>
  certifications?: Array<{
    name: string
    organization: string
    required: boolean
  }>
}

class OccupationEnrichmentService {
  private blsApi: BLSApiService
  private cosApi: CareerOneStopApiService

  constructor() {
    this.blsApi = new BLSApiService()
    this.cosApi = new CareerOneStopApiService()
  }

  /**
   * Enrich a single occupation with BLS and CareerOneStop data
   */
  async enrichOccupation(socCode: string, forceRefresh = false): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      socCode,
      success: false,
      dataUpdated: {
        blsWage: false,
        blsProjections: false,
        cosPrograms: false,
        cosCertifications: false
      },
      errors: [],
      cacheStatus: {
        blsWageExpired: false,
        cosProgramsExpired: false
      }
    }

    try {
      // Update enrichment status to in_progress
      await this.updateEnrichmentStatus(socCode, 'in_progress')

      // Check cache status first
      const cacheStatus = await this.checkCacheStatus(socCode)
      result.cacheStatus = cacheStatus

      // Enrich BLS wage data if expired or force refresh
      if (forceRefresh || cacheStatus.blsWageExpired) {
        try {
          const wageData = await this.blsApi.getRegionalWageData(socCode)
          if (wageData) {
            await this.cacheBLSWageData(wageData)
            result.dataUpdated.blsWage = true
          }
        } catch (error) {
          result.errors.push(`BLS wage data: ${error}`)
        }
      }

      // Enrich CareerOneStop data if expired or force refresh
      if (forceRefresh || cacheStatus.cosProgramsExpired) {
        try {
          const cosData = await this.cosApi.getComprehensiveOccupationData(socCode)
          if (cosData) {
            await this.cacheCareerOneStopData(cosData)
            result.dataUpdated.cosPrograms = true
            result.dataUpdated.cosCertifications = true
          }
        } catch (error) {
          result.errors.push(`CareerOneStop data: ${error}`)
        }
      }

      // Update jobs table with enriched data
      await this.updateJobsTable(socCode)

      // Mark enrichment as completed
      await this.updateEnrichmentStatus(socCode, 'completed')
      result.success = true

    } catch (error) {
      result.errors.push(`Enrichment failed: ${error}`)
      await this.updateEnrichmentStatus(socCode, 'failed', String(error))
    }

    return result
  }

  /**
   * Batch enrich multiple occupations
   */
  async enrichOccupationsBatch(socCodes: string[], forceRefresh = false): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = []

    for (const socCode of socCodes) {
      try {
        const result = await this.enrichOccupation(socCode, forceRefresh)
        results.push(result)

        // Rate limiting between enrichments
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        results.push({
          socCode,
          success: false,
          dataUpdated: { blsWage: false, blsProjections: false, cosPrograms: false, cosCertifications: false },
          errors: [String(error)],
          cacheStatus: { blsWageExpired: true, cosProgramsExpired: true }
        })
      }
    }

    return results
  }

  /**
   * Get enriched occupation data from cache
   */
  async getEnrichedOccupationData(socCode: string): Promise<OccupationEnrichmentData | null> {
    try {
      // Get BLS wage data
      const { data: blsWageData } = await supabase
        .rpc('get_cached_bls_wage_data', { p_soc_code: socCode })

      // Get CareerOneStop programs
      const { data: cosPrograms } = await supabase
        .rpc('get_cached_cos_programs', { p_soc_code: socCode })

      // Get CareerOneStop certifications
      const { data: cosCertifications } = await supabase
        .from('cos_certifications_cache')
        .select('*')
        .eq('soc_code', socCode)
        .gt('expires_at', new Date().toISOString())

      const enrichmentData: OccupationEnrichmentData = {
        socCode
      }

      // Add BLS data if available
      if (blsWageData && blsWageData.length > 0) {
        const wage = blsWageData[0]
        enrichmentData.medianWage = wage.median_wage
        enrichmentData.employmentLevel = wage.employment_level
      }

      // Add CareerOneStop programs if available
      if (cosPrograms && cosPrograms.length > 0) {
        enrichmentData.relatedPrograms = cosPrograms.map((program: any) => ({
          name: program.program_name,
          provider: program.provider_name,
          type: program.program_type,
          duration: program.duration,
          cost: program.cost
        }))
      }

      // Add certifications if available
      if (cosCertifications && cosCertifications.length > 0) {
        enrichmentData.certifications = cosCertifications.map((cert: any) => ({
          name: cert.certification_name,
          organization: cert.issuing_organization,
          required: cert.exam_required
        }))
      }

      return enrichmentData
    } catch (error) {
      console.error(`Error getting enriched data for SOC ${socCode}:`, error)
      return null
    }
  }

  /**
   * Check cache status for a SOC code
   */
  private async checkCacheStatus(socCode: string): Promise<{ blsWageExpired: boolean; cosProgramsExpired: boolean }> {
    try {
      // Check BLS wage data cache - look for Tampa MSA first, then national
      const { data: blsWage } = await supabase
        .from('bls_wage_data')
        .select('expires_at')
        .eq('soc_code', socCode)
        .in('area_code', ['45300', '0000']) // Tampa MSA or national
        .order('created_at', { ascending: false })
        .limit(1)

      // Check CareerOneStop programs cache
      const { data: cosPrograms } = await supabase
        .from('cos_programs_cache')
        .select('expires_at')
        .eq('soc_code', socCode)
        .order('created_at', { ascending: false })
        .limit(1)

      const now = new Date()
      const blsWageExpired = !blsWage || blsWage.length === 0 || new Date(blsWage[0].expires_at) < now
      const cosProgramsExpired = !cosPrograms || cosPrograms.length === 0 || new Date(cosPrograms[0].expires_at) < now

      return { blsWageExpired, cosProgramsExpired }
    } catch (error) {
      console.error(`Error checking cache status for SOC ${socCode}:`, error)
      return { blsWageExpired: true, cosProgramsExpired: true }
    }
  }

  /**
   * Cache BLS wage data
   */
  private async cacheBLSWageData(wageData: BLSWageData): Promise<void> {
    try {
      await supabase
        .from('bls_wage_data')
        .upsert({
          soc_code: wageData.socCode,
          area_code: wageData.areaCode,
          area_name: wageData.areaName,
          median_wage: wageData.medianWage,
          mean_wage: wageData.meanWage,
          employment_level: wageData.employmentLevel,
          employment_rse: wageData.employmentRSE,
          wage_rse: wageData.wageRSE,
          data_year: wageData.dataYear,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        }, {
          onConflict: 'soc_code,area_code,data_year'
        })
    } catch (error) {
      console.error('Error caching BLS wage data:', error)
      throw error
    }
  }

  /**
   * Cache CareerOneStop data
   */
  private async cacheCareerOneStopData(cosData: any): Promise<void> {
    try {
      // For now, we'll store the raw COS data in a simple cache structure
      // This can be expanded later when we have more endpoints working
      
      // Store occupation details and LMI data
      const cacheData = {
        soc_code: cosData.socCode,
        onet_code: cosData.onetCode,
        title: cosData.title,
        description: cosData.description,
        bright_outlook: cosData.brightOutlook,
        bright_outlook_category: cosData.brightOutlookCategory,
        video_url: cosData.videoUrl,
        career_outlook: cosData.lmi?.careerOutlook,
        average_pay_state: cosData.lmi?.averagePayState,
        average_pay_national: cosData.lmi?.averagePayNational,
        typical_training: cosData.lmi?.typicalTraining,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
      }

      // We'll need to create a new cache table for this data
      // For now, log it so we can see what we're getting
      console.log('CareerOneStop data to cache:', cacheData)
      
      // TODO: Create cos_occupation_cache table and insert data
      // await supabase.from('cos_occupation_cache').upsert(cacheData, { onConflict: 'soc_code' })
      
    } catch (error) {
      console.error('Error caching CareerOneStop data:', error)
      throw error
    }
  }

  /**
   * Update jobs table with enriched data from BLS and CareerOneStop
   */
  private async updateJobsTable(socCode: string): Promise<void> {
    try {
      // Get BLS wage data
      const { data: blsData } = await supabase
        .from('bls_wage_data')
        .select('*')
        .eq('soc_code', socCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Get CareerOneStop occupation data from the latest enrichment
      const cosData = await this.cosApi.getComprehensiveOccupationData(socCode)

      const updateData: any = {}

      // BLS wage data
      if (blsData) {
        updateData.median_wage_usd = blsData.median_wage
      }

      // CareerOneStop occupation data
      if (cosData) {
        // Core occupation info
        if (cosData.onetCode) updateData.onet_code = cosData.onetCode
        if (cosData.title) updateData.title = cosData.title
        if (cosData.description) updateData.long_desc = cosData.description
        
        // Bright outlook indicators
        if (cosData.brightOutlook) updateData.bright_outlook = cosData.brightOutlook
        if (cosData.brightOutlookCategory) updateData.bright_outlook_category = cosData.brightOutlookCategory
        
        // Video URL
        if (cosData.videoUrl) updateData.video_url = cosData.videoUrl
        
        // LMI data
        if (cosData.lmi) {
          if (cosData.lmi.careerOutlook) {
            updateData.employment_outlook = `${cosData.lmi.careerOutlook} (National)`
          }
          if (cosData.lmi.typicalTraining) {
            updateData.education_level = cosData.lmi.typicalTraining
          }
          // Use COS national wage if BLS doesn't have data
          if (!blsData && cosData.lmi.averagePayNational) {
            updateData.median_wage_usd = cosData.lmi.averagePayNational
          }
        }

        // Tasks (if available)
        if (cosData.tasks && cosData.tasks.length > 0) {
          updateData.tasks = cosData.tasks
        }

        // Tools and Technology (if available)
        if (cosData.toolsAndTechnology && cosData.toolsAndTechnology.length > 0) {
          updateData.tools_and_technology = cosData.toolsAndTechnology
        }
      }

      // Only update if we have data to update
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString()

        const { error } = await supabase
          .from('jobs')
          .update(updateData)
          .eq('soc_code', socCode)
          .eq('job_kind', 'occupation')

        if (error) {
          console.error(`Error updating jobs table for SOC ${socCode}:`, error)
        } else {
          console.log(`Successfully updated jobs table for SOC ${socCode} with ${Object.keys(updateData).length} fields`)
        }
      }
    } catch (error) {
      console.error(`Error updating jobs table for SOC ${socCode}:`, error)
    }
  }

  /**
   * Update enrichment status
   */
  private async updateEnrichmentStatus(
    socCode: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        enrichment_status: status,
        last_enrichment_attempt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        const now = new Date().toISOString()
        updateData.bls_wage_updated_at = now
        updateData.cos_programs_updated_at = now
        updateData.cos_certifications_updated_at = now
      }

      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      await supabase
        .from('occupation_enrichment_status')
        .upsert({
          soc_code: socCode,
          ...updateData
        }, {
          onConflict: 'soc_code'
        })
    } catch (error) {
      console.error(`Error updating enrichment status for SOC ${socCode}:`, error)
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const { data } = await supabase.rpc('clean_expired_occupation_cache')
      return data || 0
    } catch (error) {
      console.error('Error cleaning expired cache:', error)
      return 0
    }
  }
}

export { OccupationEnrichmentService, type EnrichmentResult, type OccupationEnrichmentData }
