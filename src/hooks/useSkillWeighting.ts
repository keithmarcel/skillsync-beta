'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { calculateSkillWeighting, getMarketIntelligence } from '@/lib/services/enhanced-ai-context'

interface SkillWeightingData {
  id: string
  name: string
  category: string
  onetImportance: number
  marketAdjustment: number
  companyWeight: number
  finalWeight: number
  difficultyLevel: string
  questionCount: number
  performanceCorrelation: number
  marketDemand: string
  salaryImpact: string
  trendDirection: 'rising' | 'stable' | 'declining'
  proficiencyThreshold: number
}

export function useSkillWeighting(quizId: string) {
  const [skills, setSkills] = useState<SkillWeightingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (quizId) {
      loadSkillWeighting()
    }
  }, [quizId])

  const loadSkillWeighting = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get quiz sections with skills
      const { data: sections, error: sectionsError } = await supabase
        .from('quiz_sections')
        .select(`
          *,
          skill:skills(
            id,
            name,
            category,
            description
          )
        `)
        .eq('quiz_id', quizId)
        .order('order_index')

      if (sectionsError) throw sectionsError

      // Get job skills data for importance levels
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('soc_code, company_id')
        .eq('id', quizId)
        .single()

      if (quizError) throw quizError

      // Get job for this SOC code
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('soc_code', quiz.soc_code)
        .limit(1)
        .single()

      if (jobError) throw jobError

      // Get job skills with importance levels
      const { data: jobSkills, error: jobSkillsError } = await supabase
        .from('job_skills')
        .select('skill_id, importance_level, proficiency_threshold')
        .eq('job_id', job.id)

      if (jobSkillsError) throw jobSkillsError

      // Process each section/skill
      const skillWeightingData = await Promise.all(
        (sections || []).map(async (section) => {
          const skill = section.skill
          const jobSkill = jobSkills?.find(js => js.skill_id === skill.id)
          
          // Get market intelligence
          const marketData = await getMarketIntelligence(
            quiz.soc_code || '',
            skill.name
          )

          // Calculate weighting
          const onetImportance = jobSkill?.importance_level === 'critical' ? 4.5 :
                                jobSkill?.importance_level === 'important' ? 3.5 : 2.5

          const weighting = calculateSkillWeighting(
            onetImportance,
            marketData.currentDemand,
            3.0, // Default company weight
            0.75 // Default performance correlation
          )

          // Count questions for this section
          const { count: questionCount } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', section.id)

          return {
            id: skill.id,
            name: skill.name,
            category: skill.category || 'General',
            onetImportance,
            marketAdjustment: weighting.marketAdjustment,
            companyWeight: weighting.companyWeight,
            finalWeight: weighting.finalWeight,
            difficultyLevel: weighting.difficultyLevel,
            questionCount: questionCount || 0,
            performanceCorrelation: weighting.performanceCorrelation,
            marketDemand: marketData.currentDemand,
            salaryImpact: marketData.salaryRange,
            trendDirection: marketData.trendDirection,
            proficiencyThreshold: jobSkill?.proficiency_threshold || 70
          } as SkillWeightingData
        })
      )

      setSkills(skillWeightingData)

    } catch (err) {
      console.error('Failed to load skill weighting:', err)
      setError(err instanceof Error ? err.message : 'Failed to load skill weighting')
    } finally {
      setLoading(false)
    }
  }

  const updateSkillWeighting = async (
    skillId: string, 
    updates: Partial<SkillWeightingData>
  ) => {
    try {
      // Update local state immediately
      setSkills(prev => prev.map(skill => 
        skill.id === skillId 
          ? { ...skill, ...updates }
          : skill
      ))

      // TODO: Persist changes to database
      // This would involve updating job_skills table or creating
      // company-specific overrides
      
      console.log('Skill weighting updated:', { skillId, updates })
      
    } catch (err) {
      console.error('Failed to update skill weighting:', err)
      // Revert local changes on error
      await loadSkillWeighting()
    }
  }

  return {
    skills,
    loading,
    error,
    updateSkillWeighting,
    refreshWeighting: loadSkillWeighting
  }
}
