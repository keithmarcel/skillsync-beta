/**
 * O*NET Web Services API Client
 * Backup skills source and SOC-to-skills mapping
 * https://services.onetcenter.org/
 */

const ONET_API_BASE = 'https://services.onetcenter.org/ws';
const ONET_USERNAME = process.env.ONET_API_USERNAME || '';
const ONET_PASSWORD = process.env.ONET_API_PASSWORD || '';

interface ONetSkill {
  element_id: string;
  element_name: string;
  scale_id: string;
  data_value: number;
  description?: string;
  category?: string;
}

interface ONetResponse {
  skills?: ONetSkill[];
  knowledge?: ONetSkill[];
  abilities?: ONetSkill[];
}

export class ONetClient {
  private authHeader: string;

  constructor() {
    const credentials = Buffer.from(`${ONET_USERNAME}:${ONET_PASSWORD}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Fetch skills for a SOC code
   */
  async getSkillsForSOC(socCode: string): Promise<ONetSkill[]> {
    const skills: ONetSkill[] = [];

    try {
      // Fetch Skills
      const skillsData = await this.fetchONetData(socCode, 'skills');
      if (skillsData?.skills) {
        skills.push(...skillsData.skills.map(s => ({ ...s, category: 'Skills' })));
      }

      // Fetch Knowledge (weighted higher)
      const knowledgeData = await this.fetchONetData(socCode, 'knowledge');
      if (knowledgeData?.knowledge) {
        skills.push(...knowledgeData.knowledge.map(k => ({ ...k, category: 'Knowledge' })));
      }

      // Fetch Abilities
      const abilitiesData = await this.fetchONetData(socCode, 'abilities');
      if (abilitiesData?.abilities) {
        skills.push(...abilitiesData.abilities.map(a => ({ ...a, category: 'Abilities' })));
      }

      return this.filterAndRankSkills(skills);
    } catch (error) {
      console.error(`Error fetching O*NET skills for ${socCode}:`, error);
      return [];
    }
  }

  /**
   * Fetch data from O*NET API
   */
  private async fetchONetData(socCode: string, endpoint: string): Promise<any> {
    const url = `${ONET_API_BASE}/online/occupations/${socCode}/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': this.authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // SOC code not found
      }
      throw new Error(`O*NET API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Filter out generic skills and rank by importance
   */
  private filterAndRankSkills(skills: ONetSkill[]): ONetSkill[] {
    const genericSkills = [
      'Reading Comprehension',
      'Active Listening',
      'Speaking',
      'Writing',
      'Critical Thinking',
      'Active Learning',
      'Learning Strategies',
      'Monitoring',
      'Social Perceptiveness',
      'Coordination',
      'Persuasion',
      'Negotiation',
      'Instructing',
      'Service Orientation',
      'Complex Problem Solving',
      'Operations Analysis',
      'Technology Design',
      'Equipment Selection',
      'Installation',
      'Programming',
      'Quality Control Analysis',
      'Operations Monitoring',
      'Operation and Control',
      'Equipment Maintenance',
      'Troubleshooting',
      'Repairing',
      'Systems Analysis',
      'Systems Evaluation',
      'Judgment and Decision Making',
      'Time Management',
      'Management of Financial Resources',
      'Management of Material Resources',
      'Management of Personnel Resources',
      'Oral Comprehension',
      'Written Comprehension',
      'Oral Expression',
      'Written Expression',
      'Near Vision',
      'Speech Recognition',
      'Speech Clarity',
      'English Language',
    ];

    // Filter out generic skills
    const filtered = skills.filter(
      skill => !genericSkills.includes(skill.element_name)
    );

    // Sort by importance (data_value)
    filtered.sort((a, b) => b.data_value - a.data_value);

    // Return top 20 skills
    return filtered.slice(0, 20);
  }

  /**
   * Map O*NET skill to our database format
   */
  mapToDBFormat(skill: ONetSkill) {
    return {
      name: skill.element_name,
      onet_id: skill.element_id,
      category: skill.category || 'General',
      description: skill.description || '',
      source: 'ONET',
      source_version: 'latest',
      is_active: true,
    };
  }

  /**
   * Get all unique SOC codes from crosswalk
   */
  async getAllSOCCodes(): Promise<string[]> {
    // This will be called from the import script with database access
    // Placeholder for now
    return [];
  }
}

export const onetClient = new ONetClient();
