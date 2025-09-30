// BLS API Service - Bureau of Labor Statistics OEWS Data Integration
// Fetches regional wage and employment data for SOC codes

interface BLSWageData {
  socCode: string
  areaCode: string
  areaName: string
  medianWage: number | null
  meanWage: number | null
  employmentLevel: number | null
  employmentRSE?: number | null
  wageRSE?: number | null
  dataYear: number
  lastUpdated: string
}

interface BLSEmploymentProjection {
  socCode: string
  occupationTitle: string
  employment2022: number
  employment2032: number
  changeNumber: number
  changePercent: number
  growthRate: 'Much faster than average' | 'Faster than average' | 'As fast as average' | 'Slower than average' | 'Little or no change' | 'Decline'
  medianWage2023: number
  educationLevel: string
  workExperience: string
  onJobTraining: string
}

class BLSApiService {
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.bls.gov/publicAPI/v2'
  private readonly oewsUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data'
  
  // Tampa-St. Petersburg-Clearwater, FL MSA
  private readonly tampaMSA = '45300'
  
  constructor() {
    this.apiKey = process.env.BLS_API_KEY || ''
    if (!this.apiKey) {
      console.warn('BLS_API_KEY not found in environment variables')
    }
  }

  /**
   * Fetch OEWS wage data for a specific SOC code in Tampa MSA
   */
  async getRegionalWageData(socCode: string): Promise<BLSWageData | null> {
    try {
      // Format SOC code for BLS (remove periods, ensure 7 digits with leading zero)
      const formattedSOC = socCode.replace(/[.-]/g, '').padStart(7, '0')
      
      // Try multiple data sources in order of preference
      const seriesIds = [
        `OEUM${this.tampaMSA}000000${formattedSOC}04`, // Tampa MSA median wage
        `OEUM${this.tampaMSA}000000${formattedSOC}03`, // Tampa MSA mean wage  
        `OEUS000000000${formattedSOC}04`,              // National median wage
        `OEUS000000000${formattedSOC}03`,              // National mean wage
      ]
      
      // Try national all occupations as last resort
      const nationalAllOccupations = 'OEUN000000000000000000004' // National all occupations annual mean wage
      
      for (const seriesId of seriesIds) {
        const requestBody = {
          seriesid: [seriesId],
          startyear: '2020',  // Start from 2020 to get latest available data
          endyear: '2024',    // Include 2024 OEWS data
          registrationkey: this.apiKey
        }

        const response = await fetch(this.oewsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          continue // Try next series ID
        }

        const data = await response.json()
        
        if (data.status !== 'REQUEST_SUCCEEDED') {
          continue // Try next series ID
        }

        const series = data.Results?.series?.[0]
        if (series?.data?.length) {
          // Found data, process it
          const latestData = series.data[0] // Most recent data point
          const areaName = seriesId.includes(this.tampaMSA) 
            ? 'Tampa-St. Petersburg-Clearwater, FL'
            : 'United States'
          
          return {
            socCode,
            areaCode: seriesId.includes(this.tampaMSA) ? this.tampaMSA : '0000',
            areaName,
            medianWage: parseFloat(latestData.value) || null,
            meanWage: null, // OEWS median wage series doesn't include mean
            employmentLevel: null, // Would need separate employment series
            dataYear: parseInt(latestData.year),
            lastUpdated: new Date().toISOString()
          }
        }
      }
      
      // If no specific occupation data found, try national all occupations as fallback
      const fallbackRequestBody = {
        seriesid: [nationalAllOccupations],
        registrationkey: this.apiKey
      }

      const fallbackResponse = await fetch(this.oewsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackRequestBody)
      })

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.status === 'REQUEST_SUCCEEDED') {
          const fallbackSeries = fallbackData.Results?.series?.[0]
          if (fallbackSeries?.data?.length) {
            const latestData = fallbackSeries.data[0]
            console.log(`Using national all-occupations wage data as fallback for SOC ${socCode}`)
            return {
              socCode,
              areaCode: '0000',
              areaName: 'United States (All Occupations Average)',
              medianWage: parseFloat(latestData.value) || null,
              meanWage: null,
              employmentLevel: null,
              dataYear: parseInt(latestData.year),
              lastUpdated: new Date().toISOString()
            }
          }
        }
      }
      
      console.warn(`No wage data found for SOC ${socCode} in Tampa MSA, nationally, or as all-occupations average`)
      return null
    } catch (error) {
      console.error(`Error fetching BLS wage data for SOC ${socCode}:`, error)
      return null
    }
  }

  /**
   * Fetch employment projections for a SOC code (2022-2032)
   */
  async getEmploymentProjections(socCode: string): Promise<BLSEmploymentProjection | null> {
    try {
      // Employment projections use different API endpoint
      // This would typically come from BLS Employment Projections program
      // For now, we'll return null and implement when BLS provides this API
      
      console.warn(`Employment projections API not yet available for SOC ${socCode}`)
      return null
    } catch (error) {
      console.error(`Error fetching employment projections for SOC ${socCode}:`, error)
      return null
    }
  }

  /**
   * Get multiple wage data points for batch processing
   */
  async getBatchWageData(socCodes: string[]): Promise<BLSWageData[]> {
    const results: BLSWageData[] = []
    
    // BLS API allows up to 50 series per request for registered users
    const batchSize = this.apiKey ? 50 : 25
    
    for (let i = 0; i < socCodes.length; i += batchSize) {
      const batch = socCodes.slice(i, i + batchSize)
      
      try {
        const batchResults = await Promise.all(
          batch.map(socCode => this.getRegionalWageData(socCode))
        )
        
        // Filter out null results
        const validResults = batchResults.filter((result): result is BLSWageData => result !== null)
        results.push(...validResults)
        
        // Rate limiting - wait 1 second between batches
        if (i + batchSize < socCodes.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error)
      }
    }
    
    return results
  }

  /**
   * Validate SOC code format for BLS API
   */
  private isValidSOCCode(socCode: string): boolean {
    // BLS expects 6-digit SOC codes (XX-XXXX format becomes XXXXXX)
    const cleaned = socCode.replace(/[.-]/g, '')
    return /^\d{6}$/.test(cleaned) || /^\d{2}-?\d{4}$/.test(socCode)
  }

  /**
   * Get growth rate category from percentage
   */
  private getGrowthRateCategory(changePercent: number): BLSEmploymentProjection['growthRate'] {
    if (changePercent >= 7) return 'Much faster than average'
    if (changePercent >= 4) return 'Faster than average'
    if (changePercent >= 2) return 'As fast as average'
    if (changePercent >= 0) return 'Slower than average'
    if (changePercent >= -2) return 'Little or no change'
    return 'Decline'
  }
}

export { BLSApiService, type BLSWageData, type BLSEmploymentProjection }
