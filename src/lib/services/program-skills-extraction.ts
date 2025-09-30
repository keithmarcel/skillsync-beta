/**
 * Program Skills Extraction Service
 * Extracts skills for programs using the CIP → SOC → Skills pipeline
 */

import { supabase } from '@/lib/supabase/client';

export interface SkillWithWeight {
  skill_id: string;
  skill_name: string;
  weight: number;
  frequency: number; // How many SOCs/jobs have this skill
  importance: number; // Average importance from O*NET data
}

export interface ExtractionResult {
  programId: string;
  programName: string;
  cipCode: string;
  socCodes: string[];
  allSkills: SkillWithWeight[];
  topSkills: SkillWithWeight[];
  success: boolean;
  error?: string;
}

/**
 * Extract skills for a single program
 */
export async function extractSkillsForProgram(
  programId: string
): Promise<ExtractionResult> {
  try {
    // Step 1: Get program and its CIP code
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, cip_code')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return {
        programId,
        programName: 'Unknown',
        cipCode: '',
        socCodes: [],
        allSkills: [],
        topSkills: [],
        success: false,
        error: 'Program not found'
      };
    }

    if (!program.cip_code) {
      return {
        programId,
        programName: program.name,
        cipCode: '',
        socCodes: [],
        allSkills: [],
        topSkills: [],
        success: false,
        error: 'No CIP code assigned'
      };
    }

    // Step 2: Get SOC codes from CIP-SOC crosswalk
    const { data: socMappings, error: socError } = await supabase
      .from('cip_soc_crosswalk')
      .select('soc_code')
      .eq('cip_code', program.cip_code);

    if (socError || !socMappings || socMappings.length === 0) {
      return {
        programId,
        programName: program.name,
        cipCode: program.cip_code,
        socCodes: [],
        allSkills: [],
        topSkills: [],
        success: false,
        error: 'No SOC mappings found for CIP code'
      };
    }

    const socCodes = socMappings.map(m => m.soc_code);

    // Step 3: Get jobs for these SOC codes
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, soc_code')
      .in('soc_code', socCodes);

    if (jobsError || !jobs || jobs.length === 0) {
      return {
        programId,
        programName: program.name,
        cipCode: program.cip_code,
        socCodes,
        allSkills: [],
        topSkills: [],
        success: false,
        error: `No jobs found for SOC codes: ${socCodes.join(', ')}`
      };
    }

    const jobIds = jobs.map(j => j.id);

    // Step 4: Get skills for these jobs
    const { data: jobSkills, error: skillsError } = await supabase
      .from('job_skills')
      .select(`
        skill_id,
        weight,
        importance_level,
        onet_data_source,
        skill:skills(id, name, source)
      `)
      .in('job_id', jobIds);

    if (skillsError || !jobSkills || jobSkills.length === 0) {
      return {
        programId,
        programName: program.name,
        cipCode: program.cip_code,
        socCodes,
        allSkills: [],
        topSkills: [],
        success: false,
        error: 'No skills found for jobs'
      };
    }

    // Step 5: Aggregate and rank skills
    const skillsMap = new Map<string, SkillWithWeight>();

    for (const js of jobSkills) {
      if (!js.skill || !js.skill.id) continue;

      const skillId = js.skill.id;
      const existing = skillsMap.get(skillId);

      // Extract importance from O*NET data
      const onetImportance = js.onet_data_source?.importance || 0;

      if (existing) {
        // Skill appears in multiple jobs - increase frequency and average weight
        existing.frequency += 1;
        existing.weight = (existing.weight + (js.weight || 0)) / 2;
        existing.importance = (existing.importance + onetImportance) / 2;
      } else {
        skillsMap.set(skillId, {
          skill_id: skillId,
          skill_name: js.skill.name || 'Unknown',
          weight: js.weight || 0,
          frequency: 1,
          importance: onetImportance
        });
      }
    }

    const allSkills = Array.from(skillsMap.values());

    // Step 6: Rank skills by composite score
    // Score = frequency (40%) + importance (40%) + weight (20%)
    const rankedSkills = allSkills
      .map(skill => {
        const normalizedFrequency = skill.frequency / jobs.length; // 0-1
        const normalizedImportance = skill.importance / 5; // O*NET uses 1-5 scale
        const normalizedWeight = skill.weight; // Already 0-1

        const compositeScore =
          normalizedFrequency * 0.4 +
          normalizedImportance * 0.4 +
          normalizedWeight * 0.2;

        return {
          ...skill,
          compositeScore
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);

    // Step 7: Select top 8 skills
    const topSkills = rankedSkills.slice(0, 8);

    return {
      programId,
      programName: program.name,
      cipCode: program.cip_code,
      socCodes,
      allSkills: rankedSkills,
      topSkills,
      success: true
    };
  } catch (error) {
    console.error('Error extracting skills:', error);
    return {
      programId,
      programName: 'Unknown',
      cipCode: '',
      socCodes: [],
      allSkills: [],
      topSkills: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Insert extracted skills into program_skills table
 */
export async function insertProgramSkills(
  programId: string,
  skills: SkillWithWeight[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete existing skills for this program
    const { error: deleteError } = await supabase
      .from('program_skills')
      .delete()
      .eq('program_id', programId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Insert new skills
    const programSkills = skills.map(skill => ({
      program_id: programId,
      skill_id: skill.skill_id,
      weight: skill.weight
    }));

    const { error: insertError } = await supabase
      .from('program_skills')
      .insert(programSkills);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
