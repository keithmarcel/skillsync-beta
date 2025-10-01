/**
 * Skills Enrichment Service
 * Enhances job/occupation skills using Lightcast taxonomy + O*NET validation
 * Strategy: Check Lightcast first (comprehensive), validate with O*NET (authoritative)
 */

import { createClient } from '@supabase/supabase-js';
import { lightcastClient } from '../api/lightcast-client';
import { onetClient } from '../api/onet-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SkillEnrichmentResult {
  jobId: string;
  socCode: string;
  success: boolean;
  skillsAdded: number;
  skillsUpdated: number;
  source: 'lightcast' | 'onet' | 'hybrid';
  errors: string[];
}

export class SkillsEnrichmentService {
  /**
   * Enrich job skills using Lightcast + O*NET
   * Strategy: Lightcast first (comprehensive), O*NET for validation
   */
  async enrichJobSkills(
    jobId: string,
    socCode: string,
    forceRefresh = false
  ): Promise<SkillEnrichmentResult> {
    const result: SkillEnrichmentResult = {
      jobId,
      socCode,
      success: false,
      skillsAdded: 0,
      skillsUpdated: 0,
      source: 'hybrid',
      errors: [],
    };

    try {
      // Check if job already has skills (unless force refresh)
      if (!forceRefresh) {
        const { count } = await supabase
          .from('job_skills')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId);

        if (count && count > 0) {
          result.errors.push('Job already has skills. Use forceRefresh=true to update.');
          return result;
        }
      }

      // Step 1: Try Lightcast first (most comprehensive)
      let lightcastSkills: any[] = [];
      try {
        lightcastSkills = await lightcastClient.getOccupationSkills(socCode);
        console.log(`Found ${lightcastSkills.length} skills from Lightcast for ${socCode}`);
      } catch (error) {
        result.errors.push(`Lightcast API error: ${error}`);
      }

      // Step 2: Get O*NET skills for validation/backup
      let onetSkills: any[] = [];
      try {
        onetSkills = await onetClient.getSkillsForSOC(socCode);
        console.log(`Found ${onetSkills.length} skills from O*NET for ${socCode}`);
      } catch (error) {
        result.errors.push(`O*NET API error: ${error}`);
      }

      // Step 3: Merge and deduplicate
      const mergedSkills = this.mergeSkills(lightcastSkills, onetSkills);

      if (mergedSkills.length === 0) {
        result.errors.push('No skills found from either source');
        return result;
      }

      // Step 4: Match to our skills taxonomy
      const skillsToInsert = [];

      for (const skill of mergedSkills) {
        // Try to find in our database
        let dbSkill = await this.findSkillInDatabase(skill);

        // If not found, create it
        if (!dbSkill) {
          dbSkill = await this.createSkill(skill);
        }

        if (dbSkill) {
          skillsToInsert.push({
            job_id: jobId,
            skill_id: dbSkill.id,
            weight: skill.weight || 0.5,
            importance_level: this.getImportanceLevel(skill.importance),
            onet_data_source: skill.source === 'onet' ? { importance: skill.importance } : null,
          });
        }
      }

      // Step 5: Delete existing and insert new
      if (forceRefresh) {
        await supabase.from('job_skills').delete().eq('job_id', jobId);
      }

      const { error: insertError } = await supabase
        .from('job_skills')
        .insert(skillsToInsert);

      if (insertError) {
        result.errors.push(`Insert error: ${insertError.message}`);
        return result;
      }

      // Step 6: Update skills_count
      await supabase
        .from('jobs')
        .update({ skills_count: skillsToInsert.length })
        .eq('id', jobId);

      result.success = true;
      result.skillsAdded = skillsToInsert.length;
      result.source = lightcastSkills.length > 0 ? 'lightcast' : 'onet';

      return result;
    } catch (error) {
      result.errors.push(`Enrichment failed: ${error}`);
      return result;
    }
  }

  /**
   * Merge Lightcast and O*NET skills, prioritizing Lightcast
   */
  private mergeSkills(lightcastSkills: any[], onetSkills: any[]): any[] {
    const skillsMap = new Map();

    // Add Lightcast skills first (priority)
    for (const skill of lightcastSkills) {
      const key = skill.name.toLowerCase().trim();
      if (!skillsMap.has(key)) {
        skillsMap.set(key, {
          name: skill.name,
          source: 'lightcast',
          lightcast_id: skill.id,
          importance: 4, // Default high importance for Lightcast
          weight: 0.8,
        });
      }
    }

    // Add O*NET skills (fill gaps, validate)
    for (const skill of onetSkills) {
      const key = skill.name.toLowerCase().trim();
      if (!skillsMap.has(key)) {
        skillsMap.set(key, {
          name: skill.name,
          source: 'onet',
          onet_id: skill.onet_id,
          importance: skill.importance || 3,
          weight: 0.6,
        });
      } else {
        // Skill exists from Lightcast, add O*NET ID for validation
        const existing = skillsMap.get(key);
        existing.onet_id = skill.onet_id;
        existing.source = 'hybrid';
      }
    }

    return Array.from(skillsMap.values())
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 15); // Top 15 skills
  }

  /**
   * Find skill in our database by name, lightcast_id, or onet_id
   */
  private async findSkillInDatabase(skill: any): Promise<any> {
    // Try by Lightcast ID first
    if (skill.lightcast_id) {
      const { data } = await supabase
        .from('skills')
        .select('id')
        .eq('lightcast_id', skill.lightcast_id)
        .single();

      if (data) return data;
    }

    // Try by O*NET ID
    if (skill.onet_id) {
      const { data } = await supabase
        .from('skills')
        .select('id')
        .eq('onet_id', skill.onet_id)
        .single();

      if (data) return data;
    }

    // Try by name (case-insensitive)
    const { data } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', skill.name)
      .single();

    return data;
  }

  /**
   * Create new skill in database
   */
  private async createSkill(skill: any): Promise<any> {
    const { data, error } = await supabase
      .from('skills')
      .insert({
        name: skill.name,
        lightcast_id: skill.lightcast_id || null,
        onet_id: skill.onet_id || null,
        source: skill.source.toUpperCase(),
        category: 'General', // Could be enhanced
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating skill:', error);
      return null;
    }

    return data;
  }

  /**
   * Convert importance score to level
   */
  private getImportanceLevel(importance: number): string {
    if (importance >= 4) return 'critical';
    if (importance >= 3) return 'important';
    return 'helpful';
  }

  /**
   * Batch enrich multiple jobs
   */
  async enrichMultipleJobs(
    jobs: Array<{ id: string; soc_code: string }>,
    forceRefresh = false
  ): Promise<SkillEnrichmentResult[]> {
    const results: SkillEnrichmentResult[] = [];

    for (const job of jobs) {
      const result = await this.enrichJobSkills(job.id, job.soc_code, forceRefresh);
      results.push(result);

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }
}

export const skillsEnrichmentService = new SkillsEnrichmentService();
