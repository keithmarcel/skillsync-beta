export type Band = 'proficient' | 'building' | 'needs_dev'

export const toBand = (pct: number): Band => {
  if (pct >= 85) return 'proficient'
  if (pct >= 50) return 'building'
  return 'needs_dev'
}

export const getBandColor = (band: Band): string => {
  switch (band) {
    case 'proficient':
      return 'text-green-600 bg-green-50'
    case 'building':
      return 'text-yellow-600 bg-yellow-50'
    case 'needs_dev':
      return 'text-red-600 bg-red-50'
  }
}

export const getBandLabel = (band: Band): string => {
  switch (band) {
    case 'proficient':
      return 'Proficient'
    case 'building':
      return 'Building'
    case 'needs_dev':
      return 'Needs Development'
  }
}

export const getStatusTag = (readinessPct: number): 'role_ready' | 'close_gaps' | 'needs_development' => {
  if (readinessPct >= 85) return 'role_ready'
  if (readinessPct >= 50) return 'close_gaps'
  return 'needs_development'
}

export const getStatusTagLabel = (statusTag: string): string => {
  switch (statusTag) {
    case 'role_ready':
      return 'Role Ready'
    case 'close_gaps':
      return 'Close Gaps'
    case 'needs_development':
      return 'Needs Development'
    default:
      return 'Unknown'
  }
}

export const getStatusTagColor = (statusTag: string): string => {
  switch (statusTag) {
    case 'role_ready':
      return 'text-green-600 bg-green-50'
    case 'close_gaps':
      return 'text-yellow-600 bg-yellow-50'
    case 'needs_development':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}
