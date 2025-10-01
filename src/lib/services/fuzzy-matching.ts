/**
 * Fuzzy Matching Service
 * Matches programs to jobs based on skill similarity (Jaccard similarity)
 * Bypasses rigid CIP-SOC crosswalk for more comprehensive matching
 */

import { supabase } from '@/lib/supabase/client';

export interface FuzzyMatch {
  jobId: string;
  jobTitle: string;
  socCode: string;
  similarity: number; // 0-1 Jaccard similarity score
  sharedSkills: string[];
  programSkillsCount: number;
  jobSkillsCount: number;
}

/**
 * Calculate Jaccard similarity between two sets
 * Jaccard = |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Find jobs that match a program based on skill overlap
 */
export async function findFuzzyMatches(
  programId: string,
  minSimilarity: number = 0.3 // 30% skill overlap minimum
): Promise<FuzzyMatch[]> {
  try {
    // Step 1: Get program's skills
    const { data: programSkills, error: programError } = await supabase
      .from('program_skills')
      .select('skill_id')
      .eq('program_id', programId);

    if (programError || !programSkills || programSkills.length === 0) {
      return [];
    }

    const programSkillIds = new Set(programSkills.map(ps => ps.skill_id));

    // Step 2: Get all jobs with their skills
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, soc_code');

    if (jobsError || !jobs) {
      return [];
    }

    // Step 3: Calculate similarity for each job
    const matches: FuzzyMatch[] = [];

    for (const job of jobs) {
      // Get job's skills
      const { data: jobSkills } = await supabase
        .from('job_skills')
        .select('skill_id, skill:skills(name)')
        .eq('job_id', job.id);

      if (!jobSkills || jobSkills.length === 0) continue;

      const jobSkillIds = new Set(jobSkills.map(js => js.skill_id));

      // Calculate Jaccard similarity
      const similarity = jaccardSimilarity(programSkillIds, jobSkillIds);

      // Only include if meets minimum threshold
      if (similarity >= minSimilarity) {
        // Get shared skill names
        const sharedSkillIds = [...programSkillIds].filter(id => jobSkillIds.has(id));
        const sharedSkillNames = jobSkills
          .filter(js => sharedSkillIds.includes(js.skill_id))
          .map(js => js.skill?.name || 'Unknown')
          .filter(name => name !== 'Unknown');

        matches.push({
          jobId: job.id,
          jobTitle: job.title,
          socCode: job.soc_code,
          similarity,
          sharedSkills: sharedSkillNames,
          programSkillsCount: programSkillIds.size,
          jobSkillsCount: jobSkillIds.size
        });
      }
    }

    // Sort by similarity (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error in fuzzy matching:', error);
    return [];
  }
}

/**
 * Batch process: Find fuzzy matches for all programs with skills
 */
export async function generateFuzzyMatchesForAllPrograms(
  minSimilarity: number = 0.3,
  maxMatchesPerProgram: number = 10
): Promise<{
  programId: string;
  programName: string;
  matches: FuzzyMatch[];
}[]> {
  try {
    // Get all programs that have skills
    const { data: programs, error } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        program_skills(skill_id)
      `)
      .not('program_skills', 'is', null);

    if (error || !programs) {
      return [];
    }

    // Filter to programs that actually have skills
    const programsWithSkills = programs.filter(
      p => p.program_skills && p.program_skills.length > 0
    );

    const results = [];

    for (const program of programsWithSkills) {
      const matches = await findFuzzyMatches(program.id, minSimilarity);
      
      results.push({
        programId: program.id,
        programName: program.name,
        matches: matches.slice(0, maxMatchesPerProgram) // Limit matches
      });
    }

    return results;
  } catch (error) {
    console.error('Error generating fuzzy matches:', error);
    return [];
  }
}

/**
 * Insert fuzzy matches into program_jobs table
 */
export async function saveFuzzyMatches(
  programId: string,
  matches: FuzzyMatch[]
): Promise<{ success: boolean; inserted: number; error?: string }> {
  try {
    // Check which matches already exist
    const { data: existing } = await supabase
      .from('program_jobs')
      .select('job_id')
      .eq('program_id', programId);

    const existingJobIds = new Set(existing?.map(e => e.job_id) || []);

    // Filter out existing matches
    const newMatches = matches.filter(m => !existingJobIds.has(m.jobId));

    if (newMatches.length === 0) {
      return { success: true, inserted: 0 };
    }

    // Insert new fuzzy matches
    const programJobs = newMatches.map(match => ({
      program_id: programId,
      job_id: match.jobId,
      match_type: 'fuzzy',
      match_confidence: match.similarity,
      notes: `Fuzzy match: ${match.sharedSkills.length} shared skills (${(match.similarity * 100).toFixed(0)}% similarity)`
    }));

    const { error } = await supabase
      .from('program_jobs')
      .insert(programJobs);

    if (error) {
      return { success: false, inserted: 0, error: error.message };
    }

    return { success: true, inserted: newMatches.length };
  } catch (error) {
    return {
      success: false,
      inserted: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
