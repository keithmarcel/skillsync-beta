// CareerOneStop API Service - Education Programs and Certification Data
// Fetches training programs, certifications, and education pathways

interface CareerOneStopProgram {
  id: string
  programName: string
  providerName: string
  providerType: 'Community College' | 'University' | 'Trade School' | 'Online' | 'Apprenticeship' | 'Other'
  city: string
  state: string
  zipCode: string
  programType: 'Certificate' | 'Associate Degree' | 'Bachelor Degree' | 'Master Degree' | 'Apprenticeship' | 'Other'
  deliveryMethod: 'In-Person' | 'Online' | 'Hybrid'
  duration: string
  cost: number | null
  programUrl: string | null
  cipCode: string | null
  description: string
  prerequisites: string[]
  outcomes: string[]
  accreditation: string | null
  lastUpdated: string
}

interface CareerOneStopCertification {
  certificationName: string
  issuingOrganization: string
  description: string
  requirements: string[]
  renewalPeriod: string | null
  cost: number | null
  examRequired: boolean
  relatedSOCs: string[]
}

interface CareerOneStopJobData {
  socCode: string
  occupationTitle: string
  educationLevel: string
  workExperience: string
  onJobTraining: string
  certifications: CareerOneStopCertification[]
  relatedPrograms: CareerOneStopProgram[]
  hiringCompanies: Array<{
    name: string
    location: string
    size: string
  }>
}

class CareerOneStopApiService {
  private readonly userId: string
  private readonly token: string
  private readonly baseUrl = 'https://api.careeronestop.org/v1'
  private readonly countryCode = 'US'
  private readonly stateCode = 'FL' // Florida
  
  constructor() {
    this.userId = process.env.COS_USERID || ''
    this.token = process.env.COS_TOKEN || ''
    
    if (!this.userId || !this.token) {
      console.warn('CareerOneStop API credentials not found in environment variables')
    }
  }

  /**
   * Convert SOC code to O*NET format (required by CareerOneStop)
   * Example: "29-1141" -> "29-1141.00"
   */
  private toOnetCode(socCode: string): string {
    // Remove any existing periods or dashes
    const cleaned = socCode.replace(/[.-]/g, '')
    // Format as XX-XXXX.XX
    if (cleaned.length >= 6) {
      const major = cleaned.substring(0, 2)
      const minor = cleaned.substring(2, 6)
      return `${major}-${minor}.00`
    }
    return socCode // Return as-is if format is unexpected
  }

  /**
   * Get occupation details by SOC code with optional data sections
   */
  async getOccupationDetails(socCode: string, options?: {
    tasks?: boolean
    skills?: boolean
    knowledge?: boolean
    abilities?: boolean
    toolsAndTechnology?: boolean
  }): Promise<any | null> {
    try {
      const onetCode = this.toOnetCode(socCode)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (options?.tasks) params.append('tasks', 'true')
      if (options?.skills) params.append('skills', 'true')
      if (options?.knowledge) params.append('knowledge', 'true')
      if (options?.abilities) params.append('abilities', 'true')
      if (options?.toolsAndTechnology) params.append('toolsAndTechnology', 'true')
      
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const endpoint = `${this.baseUrl}/occupation/${this.userId}/${onetCode}/${this.countryCode}${queryString}`
      
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`CareerOneStop occupation details failed for ${socCode}: ${response.status}`)
        return null
      }

      const data = await response.json()
      if (data.OccupationDetail && data.OccupationDetail.length > 0) {
        return data.OccupationDetail[0]
      }
      
      return null
    } catch (error) {
      console.error(`Error fetching occupation details for SOC ${socCode}:`, error)
      return null
    }
  }

  /**
   * Get Labor Market Information (LMI) for a SOC code
   */
  async getLaborMarketInfo(socCode: string): Promise<any | null> {
    try {
      const onetCode = this.toOnetCode(socCode)
      const endpoint = `${this.baseUrl}/lmi/${this.userId}/${onetCode}/${this.stateCode}`
      
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`CareerOneStop LMI failed for ${socCode}: ${response.status}`)
        return null
      }

      const data = await response.json()
      return data.LMI || null
    } catch (error) {
      console.error(`Error fetching LMI for SOC ${socCode}:`, error)
      return null
    }
  }



  /**
   * Get comprehensive occupation data from CareerOneStop
   */
  async getComprehensiveOccupationData(socCode: string): Promise<any | null> {
    try {
      const [occupationDetails, lmiData] = await Promise.all([
        this.getOccupationDetails(socCode, {
          tasks: true,
          toolsAndTechnology: true,
          skills: true,
          knowledge: true,
          abilities: true
        }),
        this.getLaborMarketInfo(socCode)
      ])

      console.log('🔍 CareerOneStop API Response for', socCode, ':', {
        hasTasks: !!occupationDetails?.Tasks,
        tasksCount: occupationDetails?.Tasks?.length || 0,
        hasTools: !!occupationDetails?.ToolsAndTechnology,
        toolsCount: occupationDetails?.ToolsAndTechnology?.length || 0,
        responseKeys: occupationDetails ? Object.keys(occupationDetails) : []
      })

      if (!occupationDetails) {
        console.warn(`No occupation data found forSOC ${socCode}`)
        return null
      }

      return {
        socCode,
        title: occupationDetails.OnetTitle || occupationDetails.SocInfo?.SocTitle,
        description: occupationDetails.OnetDescription || occupationDetails.SocInfo?.SocDescription,
        brightOutlook: occupationDetails.BrightOutlook,
        brightOutlookCategory: occupationDetails.BrightOutlookCategory,
        videoUrl: occupationDetails.COSVideoURL,
        tasks: occupationDetails.Tasks || [],
        toolsAndTechnology: occupationDetails.ToolsAndTechnology || [],
        skills: occupationDetails.Skills || [],
        knowledge: occupationDetails.Knowledge || [],
        abilities: occupationDetails.Abilities || [],
        lmi: lmiData ? {
          careerOutlook: lmiData.CareerOutLook,
          averagePayState: lmiData.AveragePayState ? parseFloat(lmiData.AveragePayState) : null,
          averagePayNational: lmiData.AveragePayNational ? parseFloat(lmiData.AveragePayNational) : null,
          typicalTraining: lmiData.TypicalTraining
        } : null
      }
    } catch (error) {
      console.error(`Error fetching comprehensive occupation data for SOC ${socCode}:`, error)
      return null
    }
  }

  /**
   * Get batch occupation data for multiple SOC codes
   */
  async getBatchOccupationData(socCodes: string[]): Promise<any[]> {
    const results: any[] = []
    
    for (const socCode of socCodes) {
      try {
        const data = await this.getComprehensiveOccupationData(socCode)
        if (data) {
          results.push(data)
        }
        
        // Rate limiting - wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error processing SOC ${socCode}:`, error)
      }
    }
    
    return results
  }

}

export { 
  CareerOneStopApiService, 
  type CareerOneStopProgram, 
  type CareerOneStopCertification, 
  type CareerOneStopJobData 
}
