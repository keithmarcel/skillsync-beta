/**
 * Proficiency and Readiness Utilities
 * 
 * This is the SINGLE SOURCE OF TRUTH for proficiency calculations across the app.
 * Used in: Employer Invites, Employer Roles, Quiz Analysis, Assessments
 */

export interface ProficiencyData {
  proficiency_pct: number
  required_proficiency_pct?: number
}

/**
 * Determines if a candidate is "Ready" for a role
 * Ready = Meets or exceeds the role's required proficiency
 * 
 * @param proficiency - Candidate's proficiency percentage
 * @param requiredProficiency - Role's required proficiency (defaults to 90)
 * @returns true if candidate is ready
 */
export function isReady(proficiency: number, requiredProficiency: number = 90): boolean {
  return proficiency >= requiredProficiency
}

/**
 * Determines if a candidate is "Almost There"
 * Almost There = Below the role's required proficiency
 * 
 * @param proficiency - Candidate's proficiency percentage
 * @param requiredProficiency - Role's required proficiency (defaults to 90)
 * @returns true if candidate is almost there
 */
export function isAlmostThere(proficiency: number, requiredProficiency: number = 90): boolean {
  return proficiency < requiredProficiency
}

// Legacy alias for backwards compatibility
export const isBuildingSkills = isAlmostThere

/**
 * Determines if a candidate is a "Top Performer"
 * Top Performer = 5% or more above the role's required proficiency
 * 
 * @param proficiency - Candidate's proficiency percentage
 * @param requiredProficiency - Role's required proficiency (defaults to 90)
 * @returns true if candidate is a top performer
 */
export function isTopPerformer(proficiency: number, requiredProficiency: number = 90): boolean {
  return proficiency >= (requiredProficiency + 5)
}

/**
 * Gets the readiness status label
 * 
 * @param proficiency - Candidate's proficiency percentage
 * @param requiredProficiency - Role's required proficiency (defaults to 90)
 * @returns "Ready" or "Almost There"
 */
export function getReadinessLabel(proficiency: number, requiredProficiency: number = 90): 'Ready' | 'Almost There' {
  return isReady(proficiency, requiredProficiency) ? 'Ready' : 'Almost There'
}

/**
 * Gets comprehensive proficiency status
 * 
 * @param proficiency - Candidate's proficiency percentage
 * @param requiredProficiency - Role's required proficiency (defaults to 90)
 * @returns Object with all proficiency flags
 */
export function getProficiencyStatus(proficiency: number, requiredProficiency: number = 90) {
  return {
    proficiency,
    requiredProficiency,
    isReady: isReady(proficiency, requiredProficiency),
    isAlmostThere: isAlmostThere(proficiency, requiredProficiency),
    isBuildingSkills: isAlmostThere(proficiency, requiredProficiency), // Legacy alias
    isTopPerformer: isTopPerformer(proficiency, requiredProficiency),
    label: getReadinessLabel(proficiency, requiredProficiency),
    percentAboveRequired: proficiency - requiredProficiency
  }
}

/**
 * Filters candidates by readiness status
 * 
 * @param candidates - Array of candidates with proficiency data
 * @param status - Filter by "Ready" or "Almost There"
 * @returns Filtered array
 */
export function filterByReadiness<T extends ProficiencyData>(
  candidates: T[],
  status: 'Ready' | 'Almost There'
): T[] {
  return candidates.filter(candidate => {
    const requiredProficiency = candidate.required_proficiency_pct || 90
    const candidateStatus = getReadinessLabel(candidate.proficiency_pct, requiredProficiency)
    return candidateStatus === status
  })
}

/**
 * Sorts candidates by proficiency (descending by default)
 * 
 * @param candidates - Array of candidates with proficiency data
 * @param ascending - Sort order (default: false)
 * @returns Sorted array
 */
export function sortByProficiency<T extends ProficiencyData>(
  candidates: T[],
  ascending: boolean = false
): T[] {
  return [...candidates].sort((a, b) => {
    return ascending 
      ? a.proficiency_pct - b.proficiency_pct
      : b.proficiency_pct - a.proficiency_pct
  })
}
