// O*NET API Integration Service
// Fetches skills and occupational data for SOC codes

import { supabase } from '@/lib/supabase/client'

const ONET_BASE_URL = 'https://services.onetcenter.org/ws/online'

export interface OnetCredentials {
  username: string
  password: string
}

export interface OnetSkill {
  id: string
  name: string
  description?: string
  category: 'knowledge' | 'skill' | 'ability'
  importance: number // 1-5 scale
  level: number // 1-7 scale
}

export interface OnetOccupation {
  socCode: string
  title: string
  description: string
  skills: OnetSkill[]
}

class OnetApiService {
  private credentials: OnetCredentials

  constructor() {
    this.credentials = {
      username: process.env.ONET_USERNAME!,
      password: process.env.ONET_PASSWORD!
    }
  }

  private getAuthHeader(): string {
    const { username, password } = this.credentials
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  }

  /**
   * Fetch detailed occupation information from O*NET
   */
  async getOccupationDetails(socCode: string): Promise<OnetOccupation | null> {
    try {
      const response = await fetch(`${ONET_BASE_URL}/occupations/${socCode}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`O*NET API error: ${response.status}`)
      }

      const data = await response.json()

      return {
        socCode,
        title: data.title || '',
        description: data.description || '',
        skills: []
      }
    } catch (error) {
      console.error(`Failed to fetch O*NET occupation ${socCode}:`, error)
      return null
    }
  }

  /**
   * Fetch skills for a specific SOC code
   */
  async getOccupationSkills(socCode: string): Promise<OnetSkill[]> {
    const skills: OnetSkill[] = []

    try {
      // Fetch knowledge, skills, and abilities in parallel
      const [knowledgeRes, skillsRes, abilitiesRes] = await Promise.all([
        fetch(`${ONET_BASE_URL}/occupations/${socCode}/knowledge`, {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        }),
        fetch(`${ONET_BASE_URL}/occupations/${socCode}/skills`, {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        }),
        fetch(`${ONET_BASE_URL}/occupations/${socCode}/abilities`, {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        })
      ])

      // Process knowledge
      if (knowledgeRes.ok) {
        const knowledgeData = await knowledgeRes.json()
        const knowledgeSkills = this.processOnetSkills(knowledgeData, 'knowledge')
        skills.push(...knowledgeSkills)
      }

      // Process skills
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json()
        const skillSkills = this.processOnetSkills(skillsData, 'skill')
        skills.push(...skillSkills)
      }

      // Process abilities
      if (abilitiesRes.ok) {
        const abilitiesData = await abilitiesRes.json()
        const abilitySkills = this.processOnetSkills(abilitiesData, 'ability')
        skills.push(...abilitySkills)
      }

      // Sort by importance and take top skills
      return skills
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8) // Top 8 most important skills

    } catch (error) {
      console.error(`Failed to fetch O*NET skills for ${socCode}:`, error)
      return []
    }
  }

  /**
   * Process O*NET API response into standardized skill format
   */
  private processOnetSkills(data: any, category: 'knowledge' | 'skill' | 'ability'): OnetSkill[] {
    if (!data || !Array.isArray(data)) return []

    return data.map((item: any) => ({
      id: item.id || item.code,
      name: item.name || item.title,
      description: item.description,
      category,
      importance: item.importance || item.score || 3, // Default to medium importance
      level: item.level || item.value || 3 // Default to medium level
    }))
  }

  /**
   * Map O*NET skills to our taxonomy
   */
  async mapOnetSkillsToTaxonomy(onetSkills: OnetSkill[]): Promise<any[]> {
    const mappedSkills: any[] = []

    for (const onetSkill of onetSkills) {
      // Try to find existing skill in our taxonomy
      let existingSkill = await supabase
        .from('skills')
        .select('*')
        .eq('onet_id', onetSkill.id)
        .single()

      if (!existingSkill.data) {
        // Create new skill if it doesn't exist
        const { data: newSkill, error } = await supabase
          .from('skills')
          .insert({
            name: onetSkill.name,
            onet_id: onetSkill.id,
            category: this.mapOnetCategoryToOurCategory(onetSkill.category),
            description: onetSkill.description,
            source: 'ONET',
            proficiency_levels: {
              beginner: 'Basic understanding and application',
              intermediate: 'Solid working knowledge with some independence',
              expert: 'Advanced mastery and ability to teach others'
            }
          })
          .select()
          .single()

        if (error) {
          console.error('Failed to create skill:', error)
          continue
        }

        existingSkill.data = newSkill
      }

      // Map importance and proficiency
      const importanceLevel = this.mapImportanceToLevel(onetSkill.importance)
      const proficiencyThreshold = this.mapLevelToProficiency(onetSkill.level)

      mappedSkills.push({
        skill: existingSkill.data,
        importance_level: importanceLevel,
        proficiency_threshold: proficiencyThreshold,
        weight: onetSkill.importance / 5.0, // Normalize to 0-1 scale
        onet_data_source: {
          importance: onetSkill.importance,
          level: onetSkill.level,
          category: onetSkill.category
        }
      })
    }

    return mappedSkills
  }

  private mapOnetCategoryToOurCategory(onetCategory: string): string {
    switch (onetCategory.toLowerCase()) {
      case 'knowledge': return 'Business'
      case 'skill': return 'Operations'
      case 'ability': return 'Technical'
      default: return 'Business'
    }
  }

  private mapImportanceToLevel(importance: number): 'critical' | 'important' | 'helpful' {
    if (importance >= 4.5) return 'critical'
    if (importance >= 3.5) return 'important'
    return 'helpful'
  }

  private mapLevelToProficiency(level: number): number {
    // Map O*NET 1-7 scale to our 0-100 scale
    return Math.round((level / 7) * 100)
  }
}

// Export singleton instance
export const onetApi = new OnetApiService()
