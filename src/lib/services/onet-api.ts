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
      // Use the correct summary endpoints
      const [skillsRes, knowledgeRes, abilitiesRes] = await Promise.all([
        fetch(`${ONET_BASE_URL}/occupations/${socCode}/summary/skills`, {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        }),
        fetch(`${ONET_BASE_URL}/occupations/${socCode}/summary/knowledge`, {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        }),
        fetch(`${ONET_BASE_URL}/occupations/${socCode}/summary/abilities`, {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        })
      ])

      // Process skills with filtering
      const skillsArray: OnetSkill[] = []
      const knowledgeArray: OnetSkill[] = []
      const abilitiesArray: OnetSkill[] = []

      if (skillsRes.ok) {
        const skillsData = await skillsRes.json()
        console.log(`Skills data for ${socCode}:`, JSON.stringify(skillsData, null, 2))
        if (skillsData.element && Array.isArray(skillsData.element)) {
          const processedSkills = this.processOnetSkills(skillsData.element, 'skill')
          const filteredSkills = this.filterGenericSkills(processedSkills)
          skillsArray.push(...filteredSkills)
        } else if (skillsData.error) {
          console.warn(`Skills not available for ${socCode}: ${skillsData.error}`)
        }
      } else {
        console.error(`Skills endpoint failed for ${socCode}: ${skillsRes.status}`)
      }

      // Process knowledge (prioritized)
      if (knowledgeRes.ok) {
        const knowledgeData = await knowledgeRes.json()
        console.log(`Knowledge data for ${socCode}:`, JSON.stringify(knowledgeData, null, 2))
        if (knowledgeData.element && Array.isArray(knowledgeData.element)) {
          const processedKnowledge = this.processOnetSkills(knowledgeData.element, 'knowledge')
          knowledgeArray.push(...processedKnowledge)
        } else if (knowledgeData.error) {
          console.warn(`Knowledge not available for ${socCode}: ${knowledgeData.error}`)
        }
      } else {
        console.error(`Knowledge endpoint failed for ${socCode}: ${knowledgeRes.status}`)
      }

      // Process abilities
      if (abilitiesRes.ok) {
        const abilitiesData = await abilitiesRes.json()
        console.log(`Abilities data for ${socCode}:`, JSON.stringify(abilitiesData, null, 2))
        if (abilitiesData.element && Array.isArray(abilitiesData.element)) {
          const processedAbilities = this.processOnetSkills(abilitiesData.element, 'ability')
          const filteredAbilities = this.filterGenericSkills(processedAbilities)
          abilitiesArray.push(...filteredAbilities)
        } else if (abilitiesData.error) {
          console.warn(`Abilities not available for ${socCode}: ${abilitiesData.error}`)
        }
      } else {
        console.error(`Abilities endpoint failed for ${socCode}: ${abilitiesRes.status}`)
      }

      // If no data from any endpoint, return empty array
      if (skillsArray.length === 0 && knowledgeArray.length === 0 && abilitiesArray.length === 0) {
        console.warn(`No skills data available for SOC ${socCode} from any O*NET endpoint`)
        return []
      }

      // Apply weighted selection algorithm
      return this.selectSkillsWithWeighting(skillsArray, knowledgeArray, abilitiesArray)

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
      id: item.id,
      name: item.name,
      description: item.description || '',
      category,
      importance: 3, // Default importance - O*NET summary doesn't include scores
      level: 3 // Default level - O*NET summary doesn't include scores
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

  /**
   * Filter out generic/basic skills that don't add assessment value
   */
  private filterGenericSkills(skills: OnetSkill[]): OnetSkill[] {
    const genericSkillNames = [
      // Language and Communication (too basic)
      'English Language',
      'Speaking',
      'Reading Comprehension', 
      'Active Listening',
      'Writing',
      'Oral Comprehension',
      'Oral Expression', 
      'Written Comprehension',
      'Written Expression',
      
      // Basic cognitive abilities (too generic)
      'Mathematics',
      'Science',
      'Learning Strategies',
      'Monitoring',
      'Social Perceptiveness',
      'Coordination',
      'Persuasion',
      'Negotiation',
      'Instructing',
      'Service Orientation',
      
      // Generic problem solving (too broad)
      'Complex Problem Solving',
      'Operations Analysis',
      'Technology Design',
      'Equipment Selection',
      'Installation',
      'Programming',
      'Operations Monitoring',
      'Operation and Control',
      'Equipment Maintenance',
      'Troubleshooting',
      'Repairing',
      'Quality Control Analysis',
      'Judgment and Decision Making',
      'Systems Analysis',
      'Systems Evaluation',
      
      // Basic abilities that appear in every job
      'Problem Sensitivity',
      'Deductive Reasoning',
      'Inductive Reasoning',
      'Information Ordering',
      'Category Flexibility',
      'Mathematical Reasoning',
      'Number Facility',
      'Memorization',
      'Speed of Closure',
      'Flexibility of Closure',
      'Perceptual Speed',
      'Spatial Orientation',
      'Visualization',
      'Selective Attention',
      'Time Sharing'
    ]

    return skills.filter(skill => {
      // Keep skills that are not in the generic list
      const isGeneric = genericSkillNames.some(generic => 
        skill.name.toLowerCase().includes(generic.toLowerCase()) ||
        generic.toLowerCase().includes(skill.name.toLowerCase())
      )
      
      // Also filter out "Customer and Personal Service" - too generic
      const isCustomerService = skill.name.toLowerCase().includes('customer') && 
                               skill.name.toLowerCase().includes('service')
      
      return !isGeneric && !isCustomerService
    })
  }

  /**
   * Select skills using weighted algorithm prioritizing knowledge and technical abilities
   */
  private selectSkillsWithWeighting(
    skills: OnetSkill[], 
    knowledge: OnetSkill[], 
    abilities: OnetSkill[]
  ): OnetSkill[] {
    const totalSkills = 10 // Reduced from 12 for more focused selection
    
    // Sort each category by importance
    const sortedSkills = skills.sort((a, b) => b.importance - a.importance)
    const sortedKnowledge = knowledge.sort((a, b) => b.importance - a.importance)
    const sortedAbilities = abilities.sort((a, b) => b.importance - a.importance)

    // Apply aggressive weighting: Knowledge 80%, Abilities 15%, Skills 5%
    const knowledgeCount = Math.ceil(totalSkills * 0.8) // ~8 skills
    const abilitiesCount = Math.ceil(totalSkills * 0.15) // ~1-2 skills  
    const skillsCount = Math.max(0, totalSkills - knowledgeCount - abilitiesCount) // ~0-1 skills

    const selectedSkills: OnetSkill[] = []

    // Select top knowledge items (heavily prioritized)
    selectedSkills.push(...sortedKnowledge.slice(0, knowledgeCount))
    
    // Select only the most relevant abilities (very selective)
    selectedSkills.push(...sortedAbilities.slice(0, abilitiesCount))
    
    // Select minimal basic skills (only if really relevant)
    if (skillsCount > 0) {
      selectedSkills.push(...sortedSkills.slice(0, skillsCount))
    }

    console.log(`Selected skills breakdown: ${knowledgeCount} knowledge, ${abilitiesCount} abilities, ${skillsCount} skills`)

    // Sort final list by importance and return
    return selectedSkills
      .sort((a, b) => b.importance - a.importance)
      .slice(0, totalSkills) // Ensure we don't exceed limit
  }
}

// Export singleton instance
export const onetApi = new OnetApiService()
