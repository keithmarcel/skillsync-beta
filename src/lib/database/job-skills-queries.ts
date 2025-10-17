/**
 * Database queries for job-specific skills
 * 
 * Architecture:
 * - Featured roles: Use job_skills junction table (role-specific, customizable)
 * - High-demand occupations: Use skills table with SOC code (general baseline)
 */

import { supabase } from '@/lib/supabase/client'

export interface JobSkill {
  id: string
  job_id: string
  skill_id: string
  importance_level: number
  created_at: string
  updated_at: string
  skill?: {
    id: string
    name: string
    category: string
    soc_code: string | null
    source: string
  }
}

/**
 * Get skills for a specific job
 * - Featured roles: Returns job-specific skills from job_skills table
 * - High-demand occupations: Returns SOC-based skills from skills table
 */
export async function getJobSkills(jobId: string, jobKind: 'featured_role' | 'occupation', socCode?: string | null) {
  if (jobKind === 'featured_role') {
    // Featured roles use job-specific skills
    const { data, error } = await supabase
      .from('job_skills')
      .select(`
        id,
        job_id,
        skill_id,
        importance_level,
        created_at,
        updated_at,
        skill:skills (
          id,
          name,
          category,
          soc_code,
          source
        )
      `)
      .eq('job_id', jobId)
      .order('importance_level', { ascending: false })
      .order('name', { ascending: true, foreignTable: 'skills' })

    if (error) throw error
    return data as JobSkill[]
  } else {
    // High-demand occupations use SOC-based skills
    if (!socCode) return []
    
    const { data, error } = await supabase
      .from('skills')
      .select('id, name, category, soc_code, source')
      .eq('soc_code', socCode)
      .order('name')

    if (error) throw error
    
    // Transform to match JobSkill interface for consistency
    return data.map(skill => ({
      id: skill.id,
      job_id: jobId,
      skill_id: skill.id,
      importance_level: 3, // Default for SOC-based skills
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      skill: skill
    })) as JobSkill[]
  }
}

/**
 * Add a skill to a featured role
 */
export async function addJobSkill(jobId: string, skillId: string, importanceLevel: number = 3) {
  const { data, error } = await supabase
    .from('job_skills')
    .insert({
      job_id: jobId,
      skill_id: skillId,
      importance_level: importanceLevel
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update skill importance level for a featured role
 */
export async function updateJobSkillImportance(jobSkillId: string, importanceLevel: number) {
  const { data, error } = await supabase
    .from('job_skills')
    .update({ importance_level: importanceLevel })
    .eq('id', jobSkillId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Remove a skill from a featured role
 */
export async function removeJobSkill(jobSkillId: string) {
  const { error } = await supabase
    .from('job_skills')
    .delete()
    .eq('id', jobSkillId)

  if (error) throw error
}

/**
 * Bulk update job skills for a featured role
 * Replaces all existing skills with new set
 */
export async function updateJobSkills(jobId: string, skillIds: string[], importanceLevel: number = 3) {
  // Delete existing skills
  const { error: deleteError } = await supabase
    .from('job_skills')
    .delete()
    .eq('job_id', jobId)

  if (deleteError) throw deleteError

  // Insert new skills
  if (skillIds.length > 0) {
    const { error: insertError } = await supabase
      .from('job_skills')
      .insert(
        skillIds.map(skillId => ({
          job_id: jobId,
          skill_id: skillId,
          importance_level: importanceLevel
        }))
      )

    if (insertError) throw insertError
  }
}

/**
 * Copy SOC-based skills to a featured role as starting point
 * Useful when creating a new role or changing SOC code
 */
export async function copySOCSkillsToJob(jobId: string, socCode: string) {
  // Get skills for this SOC code
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('id')
    .eq('soc_code', socCode)

  if (skillsError) throw skillsError
  if (!skills || skills.length === 0) return

  // Insert as job-specific skills
  const { error: insertError } = await supabase
    .from('job_skills')
    .insert(
      skills.map(skill => ({
        job_id: jobId,
        skill_id: skill.id,
        importance_level: 3
      }))
    )
    .select()

  if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
    throw insertError
  }
}

/**
 * Get skill count for a job
 */
export async function getJobSkillCount(jobId: string, jobKind: 'featured_role' | 'occupation', socCode?: string | null): Promise<number> {
  if (jobKind === 'featured_role') {
    const { count, error } = await supabase
      .from('job_skills')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)

    if (error) throw error
    return count || 0
  } else {
    if (!socCode) return 0
    
    const { count, error } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('soc_code', socCode)

    if (error) throw error
    return count || 0
  }
}
