import { supabase } from './supabase/client'
import { Database, JobKind, AssessmentMethod } from './types'

type Tables = Database['public']['Tables']

// Jobs API
export async function listJobs(kind?: JobKind, region?: string) {
  try {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        companies(name, logo_url, is_trusted_partner)
      `)

    if (kind) {
      query = query.eq('job_kind', kind)
    }

    if (region) {
      query = query.eq('location_state', region)
    }

    const { data, error } = await query.order('title')
    
    if (error) {
      console.error('listJobs error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('listJobs exception:', err)
    return []
  }
}

export async function getJob(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies(name, logo_url, is_trusted_partner, bio),
      job_skills(
        weight,
        skills(id, name, description, category)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Assessments API
export async function createAssessment(jobId: string, method: AssessmentMethod) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      user_id: user.id,
      job_id: jobId,
      method
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAssessment(id: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      jobs(title, job_kind),
      assessment_skill_results(
        score_pct,
        band,
        skills(id, name, category)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getUserAssessments() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  console.log('🔐 Fetching assessments for user:', user.id);

  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      jobs(title, job_kind, category),
      skill_results:assessment_skill_results(
        skill_id,
        score_pct,
        band
      )
    `)
    .eq('user_id', user.id)
    .order('analyzed_at', { ascending: false })

  console.log('🔐 Query error:', error);
  console.log('🔐 First assessment skill_results:', data?.[0]?.skill_results);
  
  if (error) throw error
  return data
}

// Skills extraction via Edge Function
export async function extractResumeSkills(assessmentId: string, text: string, jobId?: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/llm_extract_skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      assessment_id: assessmentId,
      resume_text: text,
      job_id: jobId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to extract skills from resume')
  }

  return response.json()
}

// Readiness summary via Edge Function
export async function summarizeReadiness(assessmentId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/llm_readiness_summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      assessment_id: assessmentId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate readiness summary')
  }

  return response.json()
}

// Quiz generation via Edge Function
export async function generateQuiz(jobId: string, skillsCount = 5) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/llm_generate_quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      job_id: jobId,
      skills_count: skillsCount
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate quiz')
  }

  return response.json()
}

// Program matching
export async function getProgramMatches(assessmentId: string) {
  // Get assessment with skill gaps
  const assessment = await getAssessment(assessmentId)
  const gapSkills = assessment.assessment_skill_results
    .filter((result: any) => result.band !== 'proficient')
    .map((result: any) => result.skills.id)

  if (gapSkills.length === 0) {
    return []
  }

  // Find programs that teach gap skills
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      schools(name, logo_url, city, state),
      program_skills!inner(
        weight,
        skills(id, name)
      )
    `)
    .in('program_skills.skill_id', gapSkills)

  if (error) throw error

  // Calculate match scores
  const programsWithScores = data.map((ps: any) => ({
    ...ps,
    matchScore: ps.program_skills.reduce((sum: any, ps: any) => 
      sum + (gapSkills.includes(ps.skills.id) ? 1 : 0), 0
    ),
    totalSkills: ps.program_skills.length,
    gapSkillsCovered: ps.program_skills.filter((ps: any) => 
      gapSkills.includes(ps.skills.id)
    ).length
  }))

  // Sort by match score and total skills
  return programsWithScores
    .sort((a, b) => b.matchScore - a.matchScore || b.totalSkills - a.totalSkills)
    .slice(0, 10)
}

// Favorites
export async function toggleFavorite(kind: 'job' | 'program', entityId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select()
    .eq('user_id', user.id)
    .eq('entity_kind', kind)
    .eq('entity_id', entityId)
    .single()

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('entity_kind', kind)
      .eq('entity_id', entityId)
    
    if (error) throw error
    return { favorited: false }
  } else {
    // Add favorite
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        entity_kind: kind,
        entity_id: entityId
      })
    
    if (error) throw error
    return { favorited: true }
  }
}

export async function listFavorites(kind: 'job' | 'program') {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  if (kind === 'job') {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        jobs(*, companies(name, logo_url))
      `)
      .eq('user_id', user.id)
      .eq('entity_kind', 'job')

    if (error) throw error
    return data.map(fav => fav.jobs)
  } else {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        programs(*, schools(name, logo_url))
      `)
      .eq('user_id', user.id)
      .eq('entity_kind', 'program')

    if (error) throw error
    return data.map(fav => fav.programs)
  }
}

// Feedback
export async function createFeedback(feedback: {
  sentiment: 'like' | 'neutral' | 'dislike'
  score_int?: number
  text?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      ...feedback
    })
    .select()
    .single()

  if (error) throw error
  return data
}
