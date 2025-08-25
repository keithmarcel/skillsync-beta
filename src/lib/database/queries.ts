import { supabase } from '@/lib/supabase/client'

// Types for database entities
export interface Job {
  id: string
  job_kind: 'featured_role' | 'high_demand'
  title: string
  soc_code: string | null
  company_id: string | null
  job_type: string | null
  category: string | null
  location_city: string | null
  location_state: string | null
  median_wage_usd: number | null
  long_desc: string | null
  featured_image_url: string | null
  skills_count: number
  company?: Company
  skills?: JobSkill[]
}

export interface Company {
  id: string
  name: string
  logo_url: string | null
  is_trusted_partner: boolean
  hq_city: string | null
  hq_state: string | null
  revenue_range: string | null
  employee_range: string | null
  industry: string | null
  bio: string | null
}

export interface Program {
  id: string
  school_id: string | null
  name: string
  program_type: string | null
  format: string | null
  duration_text: string | null
  short_desc: string | null
  program_url: string | null
  cip_code: string | null
  school?: School
  skills?: ProgramSkill[]
}

export interface School {
  id: string
  name: string
  logo_url: string | null
  about_url: string | null
  city: string | null
  state: string | null
}

export interface Assessment {
  id: string
  user_id: string | null
  job_id: string | null
  method: 'quiz' | 'resume'
  analyzed_at: string | null
  readiness_pct: number | null
  status_tag: 'role_ready' | 'close_gaps' | 'needs_development' | null
  job?: Job
  skill_results?: AssessmentSkillResult[]
}

export interface Skill {
  id: string
  name: string
  onet_id: string | null
  category: string | null
  description: string | null
  lightcast_id: string | null
  source: string | null
  source_version: string | null
}

export interface JobSkill {
  job_id: string
  skill_id: string
  weight: number
  skill?: Skill
}

export interface ProgramSkill {
  program_id: string
  skill_id: string
  weight: number
  skill?: Skill
}

export interface AssessmentSkillResult {
  assessment_id: string
  skill_id: string
  score_pct: number
  band: 'developing' | 'proficient' | 'expert'
  skill?: Skill
}

// Job queries
export async function getFeaturedRoles(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company:companies(*),
      skills:job_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('job_kind', 'featured_role')
    .order('title')

  if (error) {
    console.error('Error fetching featured roles:', error)
    return []
  }

  return data || []
}

export async function getHighDemandOccupations(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      skills:job_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('job_kind', 'high_demand')
    .order('title')

  if (error) {
    console.error('Error fetching high demand occupations:', error)
    return []
  }

  return data || []
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company:companies(*),
      skills:job_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching job:', error)
    return null
  }

  return data
}

// Program queries
export async function getFeaturedPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      school:schools(*),
      skills:program_skills(
        weight,
        skill:skills(*)
      )
    `)
    .limit(6)
    .order('name')

  if (error) {
    console.error('Error fetching featured programs:', error)
    return []
  }

  return data || []
}

export async function getAllPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      school:schools(*),
      skills:program_skills(
        weight,
        skill:skills(*)
      )
    `)
    .order('name')

  if (error) {
    console.error('Error fetching all programs:', error)
    return []
  }

  return data || []
}

export async function getProgramById(id: string): Promise<Program | null> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      school:schools(*),
      skills:program_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching program:', error)
    return null
  }

  return data
}

// Assessment queries
export async function getUserAssessments(userId: string): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      job:jobs(*),
      skill_results:assessment_skill_results(
        *,
        skill:skills(*)
      )
    `)
    .eq('user_id', userId)
    .order('analyzed_at', { ascending: false })

  if (error) {
    console.error('Error fetching user assessments:', error)
    return []
  }

  return data || []
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      job:jobs(*),
      skill_results:assessment_skill_results(
        *,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching assessment:', error)
    return null
  }

  return data
}

// Company queries
export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching companies:', error)
    return []
  }

  return data || []
}

export async function getTrustedPartners(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_trusted_partner', true)
    .order('name')

  if (error) {
    console.error('Error fetching trusted partners:', error)
    return []
  }

  return data || []
}

// School queries
export async function getSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching schools:', error)
    return []
  }

  return data || []
}

// Skill queries
export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching skills:', error)
    return []
  }

  return data || []
}

export async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('category', category)
    .order('name')

  if (error) {
    console.error('Error fetching skills by category:', error)
    return []
  }

  return data || []
}

// Favorites queries (requires authentication)
export async function getUserFavoriteJobs(userId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      entity_id,
      job:jobs(
        *,
        company:companies(*)
      )
    `)
    .eq('user_id', userId)
    .eq('entity_kind', 'job')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorite jobs:', error)
    return []
  }

  return (data?.map((item: any) => item.job).filter(Boolean) || []) as Job[]
}

export async function getUserFavoritePrograms(userId: string): Promise<Program[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      entity_id,
      program:programs(
        *,
        school:schools(*)
      )
    `)
    .eq('user_id', userId)
    .eq('entity_kind', 'program')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorite programs:', error)
    return []
  }

  return (data?.map((item: any) => item.program).filter(Boolean) || []) as Program[]
}

export async function addToFavorites(userId: string, entityKind: 'job' | 'program', entityId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      entity_kind: entityKind,
      entity_id: entityId
    })

  if (error) {
    console.error('Error adding to favorites:', error)
    return false
  }

  return true
}

export async function removeFromFavorites(userId: string, entityKind: 'job' | 'program', entityId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('entity_kind', entityKind)
    .eq('entity_id', entityId)

  if (error) {
    console.error('Error removing from favorites:', error)
    return false
  }

  return true
}
