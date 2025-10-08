// Example usage of LAiSER integration in SkillSync

import LaiserProgramSkillsService from '@/lib/services/laiser-program-skills'
import LaiserIntegrationService from '@/lib/services/laiser-integration'

// Example 1: Basic skills extraction from text
export async function extractSkillsFromJobDescription(jobDescription: string) {
  const laiserService = new LaiserIntegrationService()

  try {
    const result = await laiserService.extractSkills(jobDescription)

    console.log(`Extracted ${result.skills.length} skills in ${result.processing_time}ms`)

    // Skills are now in SkillSync format
    return result.skills.map(skill => ({
      name: skill.skill,
      proficiency_level: skill.level, // 1-12 scale from LAiSER
      knowledge_required: skill.knowledge_required,
      tasks: skill.tasks
    }))

  } catch (error) {
    console.error('Skills extraction failed:', error)
    // Fallback to existing logic
    return []
  }
}

// Example 2: Automate program skills extraction
export async function autoExtractProgramSkills(programId: string) {
  const programSkillsService = new LaiserProgramSkillsService()

  try {
    const result = await programSkillsService.extractProgramSkills(programId)

    console.log(`Program ${programId}: ${result.skills_mapped} skills mapped with ${result.confidence_score} confidence`)

    return result

  } catch (error) {
    console.error(`Program extraction failed for ${programId}:`, error)
    throw error
  }
}

// Example 3: Batch processing for multiple programs
export async function batchUpdateProgramSkills(programIds: string[]) {
  const programSkillsService = new LaiserProgramSkillsService()

  console.log(`Starting batch extraction for ${programIds.length} programs...`)

  const results = await programSkillsService.batchExtractProgramSkills(programIds)

  const successful = results.filter(r => r.skills_mapped > 0)
  const failed = results.filter(r => r.skills_mapped === 0)

  console.log(`Batch complete: ${successful.length} successful, ${failed.length} failed`)

  return { successful, failed, results }
}

// Example 4: Integration with existing program creation workflow
export async function onProgramCreated(programData: any) {
  // First, save program to database (existing logic)
  const { data: program } = await supabase
    .from('programs')
    .insert(programData)
    .select()
    .single()

  // Then, automatically extract skills using LAiSER
  try {
    await autoExtractProgramSkills(program.id)
    console.log(`✅ Auto-extracted skills for new program: ${program.name}`)
  } catch (error) {
    console.warn(`⚠️  Skills auto-extraction failed for ${program.name}, manual mapping required`)
  }

  return program
}

// Example 5: Enhanced skills gap analysis using LAiSER knowledge mapping
export async function enhancedGapAnalysis(userId: string, jobId: string) {
  // Get basic gap analysis (existing logic)
  const basicGaps = await calculateSkillGaps(userId, jobId)

  // Enhance with LAiSER knowledge requirements
  const laiserService = new LaiserIntegrationService()

  for (const gap of basicGaps) {
    try {
      // Get detailed skill information from LAiSER
      const skillDetails = await laiserService.extractSkills(`What knowledge is required for ${gap.skillName}?`)

      if (skillDetails.skills.length > 0) {
        const skillInfo = skillDetails.skills[0]
        gap.knowledge_required = skillInfo.knowledge_required
        gap.tasks = skillInfo.tasks
        gap.proficiency_level_required = skillInfo.level
      }
    } catch (error) {
      console.warn(`Failed to enhance gap analysis for ${gap.skillName}`)
    }
  }

  return basicGaps
}
