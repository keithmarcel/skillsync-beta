/**
 * Program Matching Service
 * Matches skill gaps to education programs with precision
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface SkillGap {
  skillId: string;
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  importance: number;
}

export interface ProgramMatch {
  programId: string;
  programName: string;
  provider: string;
  providerLogo?: string;
  description: string;
  duration: string;
  format: string;
  credentialType: string;
  
  // Matching scores
  gapCoverage: number;        // % of gaps this program addresses
  skillAlignment: number;     // How well skills align
  overallMatch: number;       // Combined score
  
  // Skills addressed
  addressedSkills: Array<{
    skillName: string;
    currentLevel: number;
    gap: number;
  }>;
  
  // Practical info
  cost?: number;
  startDate?: string;
  url?: string;
}

/**
 * Main function to match programs to skill gaps
 */
export async function matchProgramsToSkillGaps(
  assessmentId: string
): Promise<ProgramMatch[]> {
  try {
    // 1. Get assessment skill results (gaps)
    const { data: skillResults, error: skillError } = await supabase
      .from('assessment_skill_results')
      .select(`
        skill_id,
        score_pct,
        skill:skills(id, name)
      `)
      .eq('assessment_id', assessmentId);

    if (skillError || !skillResults) {
      console.error('Error fetching skill results:', skillError);
      return [];
    }

    // 2. Get assessment to find required proficiency
    const { data: assessment } = await supabase
      .from('assessments')
      .select('job_id, job:jobs(required_proficiency_pct)')
      .eq('id', assessmentId)
      .single();

    const requiredProficiency = assessment?.job?.required_proficiency_pct || 80;

    // 3. Identify skill gaps (below required threshold)
    const skillGaps: SkillGap[] = skillResults
      .filter((result: any) => result.score_pct < requiredProficiency)
      .map((result: any) => ({
        skillId: result.skill_id,
        skillName: result.skill?.name || 'Unknown',
        currentLevel: result.score_pct,
        requiredLevel: requiredProficiency,
        gap: requiredProficiency - result.score_pct,
        importance: 3.0 // Default, could fetch from skill_weightings
      }))
      .sort((a, b) => b.gap - a.gap); // Sort by largest gaps first

    if (skillGaps.length === 0) {
      // No gaps - user is role ready!
      return [];
    }

    // 4. Get gap skill IDs
    const gapSkillIds = skillGaps.map((g) => g.skillId);

    // 5. Find programs that address these skills
    const { data: programSkills, error: programError } = await supabase
      .from('program_skills')
      .select(`
        program_id,
        skill_id,
        weight,
        program:programs(
          id,
          name,
          description,
          duration,
          format,
          credential_type,
          catalog_provider,
          status,
          school_id,
          school:schools(name, logo_url)
        )
      `)
      .in('skill_id', gapSkillIds)
      .eq('program.status', 'published')
      .eq('program.school.is_published', true);

    if (programError || !programSkills) {
      console.error('Error fetching programs:', programError);
      return [];
    }

    // 6. Group by program and calculate match scores
    const programMap = new Map<string, any>();

    for (const ps of programSkills as any[]) {
      if (!ps.program || !ps.program.id) continue;

      const programId = ps.program.id;

      if (!programMap.has(programId)) {
        programMap.set(programId, {
          program: ps.program,
          matchedSkills: [],
          skillIds: new Set()
        });
      }

      const programData = programMap.get(programId);
      
      // Find the gap for this skill
      const gap = skillGaps.find((g) => g.skillId === ps.skill_id);
      if (gap) {
        programData.matchedSkills.push(gap);
        programData.skillIds.add(ps.skill_id);
      }
    }

    // 7. Calculate match scores for each program
    const programMatches: ProgramMatch[] = [];

    for (const [programId, data] of programMap.entries()) {
      const program = data.program;
      const matchedSkills = data.matchedSkills;

      // Gap Coverage: % of total gaps this program addresses
      const gapCoverage = (matchedSkills.length / skillGaps.length) * 100;

      // Skill Alignment: Average gap size of addressed skills (inverse - smaller gaps = better alignment)
      const avgGap = matchedSkills.reduce((sum: number, s: SkillGap) => sum + s.gap, 0) / matchedSkills.length;
      const skillAlignment = Math.max(0, 100 - avgGap); // Inverse - smaller gap = higher alignment

      // Overall Match: Weighted combination
      const overallMatch = (gapCoverage * 0.6) + (skillAlignment * 0.4);

      // Only include programs with reasonable match (>30%)
      if (overallMatch < 30) continue;

      programMatches.push({
        programId: program.id,
        programName: program.name,
        provider: program.school?.name || program.catalog_provider || 'Unknown',
        providerLogo: program.school?.logo_url,
        description: program.description || '',
        duration: program.duration || 'Varies',
        format: program.format || 'Online',
        credentialType: program.credential_type || 'Certificate',
        gapCoverage,
        skillAlignment,
        overallMatch,
        addressedSkills: matchedSkills.map((s: SkillGap) => ({
          skillName: s.skillName,
          currentLevel: s.currentLevel,
          gap: s.gap
        })),
        cost: undefined, // Could add if available
        startDate: undefined, // Could add if available
        url: undefined // Could add if available
      });
    }

    // 8. Sort by overall match score (highest first) and return top 10
    return programMatches
      .sort((a, b) => b.overallMatch - a.overallMatch)
      .slice(0, 10);

  } catch (error) {
    console.error('Program matching error:', error);
    return [];
  }
}

/**
 * Get program recommendations for display
 */
export async function getProgramRecommendations(assessmentId: string) {
  const matches = await matchProgramsToSkillGaps(assessmentId);

  return {
    totalMatches: matches.length,
    topRecommendations: matches.slice(0, 5),
    allMatches: matches,
    hasRecommendations: matches.length > 0
  };
}
