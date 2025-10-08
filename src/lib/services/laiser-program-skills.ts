/**
 * LAiSER Program Skills Extraction Service
 * Automates program skills extraction using LAiSER AI
 * Replaces manual CIP-SOC mapping with intelligent text analysis
 */

import { supabase } from '@/lib/supabase/client'
import LaiserIntegrationService, { LaiserSkill } from './laiser-integration'

export interface ProgramSkillMapping {
  program_id: string
  skill_name: string
  coverage_level: 'primary' | 'secondary' | 'supplemental'
  weight: number
  source: 'laiser_ai' | 'manual'
  confidence: number
  extracted_at: string
}

export interface ProgramExtractionResult {
  program_id: string
  skills_extracted: number
  skills_mapped: number
  processing_time: number
  confidence_score: number
  extraction_sources: string[]
}

export class LaiserProgramSkillsService {
  private laiserService: LaiserIntegrationService

  constructor() {
    this.laiserService = new LaiserIntegrationService()
  }

  /**
   * Extract skills from program description and syllabus
   */
  async extractProgramSkills(programId: string): Promise<ProgramExtractionResult> {
    const startTime = Date.now()

    try {
      // Get program data
      const { data: program } = await supabase
        .from('programs')
        .select('id, name, short_desc, long_desc, program_url, program_guide_url')
        .eq('id', programId)
        .single()

      if (!program) {
        throw new Error(`Program ${programId} not found`)
      }

      // Gather all text sources for extraction
      const textSources = await this.gatherProgramTextSources(program)
      const combinedText = textSources.join('\n\n')

      if (!combinedText.trim()) {
        throw new Error('No text content available for skills extraction')
      }

      // Extract skills using LAiSER
      const extractionResult = await this.laiserService.extractSkills(combinedText)

      // Map LAiSER skills to program skills
      const skillMappings = await this.mapLaiserSkillsToProgram(
        programId,
        extractionResult.skills,
        textSources.length
      )

      // Save mappings to database
      await this.saveProgramSkillMappings(programId, skillMappings)

      const processingTime = Date.now() - startTime
      const confidenceScore = this.calculateOverallConfidence(skillMappings)

      return {
        program_id: programId,
        skills_extracted: extractionResult.skills.length,
        skills_mapped: skillMappings.length,
        processing_time: processingTime,
        confidence_score: confidenceScore,
        extraction_sources: textSources.map((_, i) => `source_${i + 1}`)
      }

    } catch (error) {
      console.error(`Program skills extraction failed for ${programId}:`, error)
      throw error
    }
  }

  /**
   * Gather all available text sources for a program
   */
  private async gatherProgramTextSources(program: any): Promise<string[]> {
    const sources: string[] = []

    // Primary sources
    if (program.short_desc) sources.push(program.short_desc)
    if (program.long_desc) sources.push(program.long_desc)
    if (program.name) sources.push(`Program Name: ${program.name}`)

    // Try to fetch syllabus content if URLs are available
    if (program.program_guide_url) {
      try {
        const syllabusContent = await this.fetchSyllabusContent(program.program_guide_url)
        if (syllabusContent) sources.push(syllabusContent)
      } catch (error) {
        console.warn(`Failed to fetch syllabus from ${program.program_guide_url}:`, error)
      }
    }

    // Add CIP code context
    const cipContext = await this.getCIPContext(program.cip_code)
    if (cipContext) sources.push(cipContext)

    return sources
  }

  /**
   * Fetch syllabus content from URL (placeholder - implement based on your needs)
   */
  private async fetchSyllabusContent(url: string): Promise<string | null> {
    // TODO: Implement syllabus fetching logic
    // This could use a headless browser, API calls, or web scraping
    // For now, return null to indicate not implemented
    console.log(`Syllabus fetching not implemented for: ${url}`)
    return null
  }

  /**
   * Get CIP code context for better extraction
   */
  private async getCIPContext(cipCode: string): Promise<string | null> {
    if (!cipCode) return null

    try {
      // Get related occupations for context
      const { data: crosswalk } = await supabase
        .from('cip_soc_crosswalk')
        .select('soc_code')
        .eq('cip_code', cipCode)
        .limit(5)

      if (!crosswalk?.length) return null

      const socCodes = crosswalk.map(c => c.soc_code)
      const { data: occupations } = await supabase
        .from('jobs')
        .select('title, short_desc')
        .in('soc_code', socCodes)
        .limit(3)

      const contextText = occupations?.map(job =>
        `Related occupation: ${job.title} - ${job.short_desc || ''}`
      ).join('\n')

      return contextText || null
    } catch (error) {
      console.error('Failed to get CIP context:', error)
      return null
    }
  }

  /**
   * Map LAiSER skills to program skill format
   */
  private async mapLaiserSkillsToProgram(
    programId: string,
    laiserSkills: LaiserSkill[],
    sourceCount: number
  ): Promise<ProgramSkillMapping[]> {
    const mappings: ProgramSkillMapping[] = []

    for (const laiserSkill of laiserSkills) {
      // Find or create skill in taxonomy
      const skillId = await this.findOrCreateSkill(laiserSkill)

      // Determine coverage level based on level and confidence
      const coverageLevel = this.determineCoverageLevel(laiserSkill)

      // Calculate weight based on coverage and confidence
      const weight = this.calculateSkillWeight(laiserSkill, coverageLevel)

      mappings.push({
        program_id: programId,
        skill_name: laiserSkill.skill,
        coverage_level: coverageLevel,
        weight: weight,
        source: 'laiser_ai',
        confidence: laiserSkill.confidence || 0.5,
        extracted_at: new Date().toISOString()
      })
    }

    return mappings
  }

  /**
   * Find existing skill or create new one
   */
  private async findOrCreateSkill(laiserSkill: LaiserSkill): Promise<string> {
    // Try to find existing skill by name similarity
    const { data: existingSkills } = await supabase
      .from('skills')
      .select('id, name')
      .ilike('name', `%${laiserSkill.skill}%`)
      .limit(5)

    // Find best match
    const bestMatch = existingSkills?.find(skill =>
      skill.name.toLowerCase() === laiserSkill.skill.toLowerCase() ||
      skill.name.toLowerCase().includes(laiserSkill.skill.toLowerCase()) ||
      laiserSkill.skill.toLowerCase().includes(skill.name.toLowerCase())
    )

    if (bestMatch) {
      return bestMatch.id
    }

    // Create new skill
    const { data: newSkill } = await supabase
      .from('skills')
      .insert({
        name: laiserSkill.skill,
        source: 'LAISER',
        is_assessable: laiserSkill.level >= 3, // Only assessable if intermediate+
        description: `Extracted by LAiSER AI. Level: ${laiserSkill.level}/12`
      })
      .select('id')
      .single()

    return newSkill.id
  }

  /**
   * Determine coverage level based on LAiSER data
   */
  private determineCoverageLevel(skill: LaiserSkill): 'primary' | 'secondary' | 'supplemental' {
    const level = skill.level || 1
    const confidence = skill.confidence || 0.5

    // Primary: High level skills with high confidence
    if (level >= 8 && confidence >= 0.8) return 'primary'

    // Secondary: Medium level skills with decent confidence
    if (level >= 5 && confidence >= 0.6) return 'secondary'

    // Supplemental: Everything else
    return 'supplemental'
  }

  /**
   * Calculate skill weight for program
   */
  private calculateSkillWeight(skill: LaiserSkill, coverageLevel: string): number {
    const baseWeight = {
      primary: 1.0,
      secondary: 0.7,
      supplemental: 0.3
    }[coverageLevel] || 0.3

    const levelMultiplier = (skill.level || 1) / 12
    const confidenceMultiplier = skill.confidence || 0.5

    return Math.min(1.0, baseWeight * levelMultiplier * confidenceMultiplier)
  }

  /**
   * Save program skill mappings to database
   */
  private async saveProgramSkillMappings(
    programId: string,
    mappings: ProgramSkillMapping[]
  ): Promise<void> {
    // Get skill IDs for mappings
    const skillMappings = []

    for (const mapping of mappings) {
      const skillId = await this.findOrCreateSkill({
        skill: mapping.skill_name,
        level: 1, // Will be updated when we get the full skill object
        confidence: mapping.confidence
      })

      skillMappings.push({
        program_id: programId,
        skill_id: skillId,
        coverage_level: mapping.coverage_level,
        weight: mapping.weight
      })
    }

    // Upsert to program_skills table
    if (skillMappings.length > 0) {
      await supabase
        .from('program_skills')
        .upsert(skillMappings, {
          onConflict: 'program_id,skill_id'
        })
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(mappings: ProgramSkillMapping[]): number {
    if (mappings.length === 0) return 0

    const totalConfidence = mappings.reduce((sum, mapping) => sum + mapping.confidence, 0)
    return totalConfidence / mappings.length
  }

  /**
   * Batch extract skills for multiple programs
   */
  async batchExtractProgramSkills(programIds: string[]): Promise<ProgramExtractionResult[]> {
    const results: ProgramExtractionResult[] = []

    for (const programId of programIds) {
      try {
        const result = await this.extractProgramSkills(programId)
        results.push(result)
      } catch (error) {
        console.error(`Failed to extract skills for program ${programId}:`, error)
        // Add failed result
        results.push({
          program_id: programId,
          skills_extracted: 0,
          skills_mapped: 0,
          processing_time: 0,
          confidence_score: 0,
          extraction_sources: []
        })
      }
    }

    return results
  }
}

export default LaiserProgramSkillsService
