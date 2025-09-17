import { Job, Company, Program, School, Assessment } from './queries'

interface CompanyProfile {
  name: string
  logo: string
  companyImage?: string
  bio: string
  headquarters: string
  revenue: string
  employees: string
  industry: string
  trustedPartner: boolean
}

// Transform database Job to component props format
export function transformJobToFeaturedRole(job: Job) {
  // Map job titles to proper job categories
  const getJobCategory = (title: string) => {
    const categoryMap: Record<string, string> = {
      'Mechanical Assistant Project Manager': 'Skilled Trade',
      'Senior Financial Analyst (FP&A)': 'Business',
      'Mechanical Project Manager': 'Skilled Trade', 
      'Surgical Technologist (Certified)': 'Healthcare',
      'Business Development Manager': 'Business',
      'Administrative Assistant': 'Business',
      'Supervisor, Residential Inbound Sales': 'Business',
      'Senior Mechanical Project Manager': 'Skilled Trade'
    }
    return categoryMap[title] || 'General'
  }

  return {
    id: job.id,
    title: job.title,
    company: {
      name: job.company?.name || 'Unknown Company',
      logo: job.company?.logo_url || '',
      bio: job.company?.bio || '',
      headquarters: job.company?.hq_city && job.company?.hq_state
        ? `${job.company.hq_city}, ${job.company.hq_state}`
        : '',
      revenue: job.company?.revenue_range || '',
      employees: job.company?.employee_range || '',
      industry: job.company?.industry || '',
      isTrustedPartner: job.company?.is_trusted_partner || false
    },
    location: job.location_city && job.location_state 
      ? `${job.location_city}, ${job.location_state}` 
      : 'Location TBD',
    jobType: job.job_type || 'Full-time',
    category: getJobCategory(job.title), // Use actual job category instead of 'Featured Role'
    skillsCount: job.skills_count || 0,
    description: job.long_desc || '',
    medianSalary: job.median_wage_usd || 0,
    requiredProficiency: job.required_proficiency_pct || 70, // Use database value or default
    featuredImage: job.featured_image_url || '/assets/hero_featured-roles.jpg',
    socCode: job.soc_code || '',
    
    // Skills data
    skills: job.skills?.map(js => ({
      name: js.skill?.name || '',
      proficiency: Math.round((js.weight || 0) * 100)
    })) || []
  }
}

export function transformJobToHighDemand(job: Job) {
  // Map job titles to proper job categories for featured roles
  const getJobCategory = (title: string) => {
    const categoryMap: Record<string, string> = {
      'Mechanical Assistant Project Manager': 'Skilled Trades',
      'Senior Financial Analyst (FP&A)': 'Business',
      'Mechanical Project Manager': 'Skilled Trades', 
      'Surgical Technologist (Certified)': 'Health & Education',
      'Business Development Manager': 'Business',
      'Administrative Assistant': 'Business',
      'Supervisor, Residential Inbound Sales': 'Business',
      'Senior Mechanical Project Manager': 'Skilled Trades'
    }
    return categoryMap[title] || 'Business'
  }

  return {
    id: job.id,
    title: job.title,
    socCode: job.soc_code || '',
    // Use mapped category for featured roles, database category for occupations
    category: job.job_kind === 'featured_role' ? getJobCategory(job.title) : (job.category || 'General'),
    job_kind: job.job_kind || 'occupation', // Add job_kind to distinguish featured roles vs occupations
    projectedOpenings: Math.floor(Math.random() * 5000) + 1000, // Mock data for now
    educationRequired: 'Bachelor\'s degree', // Mock data for now
    medianSalary: job.median_wage_usd || 0,
    jobGrowthOutlook: 'Faster than average', // Mock data for now
    description: job.long_desc || '',
    featuredImage: job.featured_image_url || '/assets/hero_featured-roles.jpg',
    readinessStatus: 'available' as const,
    skillsRequired: job.skills_count || 0,
    
    // Skills data
    skills: job.skills?.map(js => ({
      name: js.skill?.name || '',
      proficiency: Math.round((js.weight || 0) * 100)
    })) || []
  }
}

export function transformProgramToCard(program: Program) {
  return {
    id: program.id,
    title: program.name,
    school: program.school?.name || 'Unknown School',
    schoolLogo: program.school?.logo_url || '',
    programType: program.program_type || 'Program',
    format: program.format || 'On-campus',
    duration: program.duration_text || 'Duration varies',
    description: program.short_desc || '',
    programUrl: program.program_url || '',
    
    // Skills mapped from program
    skillsMapped: program.skills?.map(ps => ps.skill?.name || '').filter(Boolean) || [],
    
    // Mock data for fields not in database yet
    applicationLink: program.program_url || '#',
    aboutSchoolLink: program.school?.about_url || '#'
  }
}

export function transformAssessmentToCard(assessment: Assessment) {
  const job = assessment.job
  const skillResults = assessment.skill_results || []
  const totalSkills = skillResults.length
  const skillsGapsIdentified = skillResults.filter(sr => sr.band === 'developing').length
  
  return {
    id: assessment.id,
    jobTitle: job?.title || 'Unknown Job',
    jobType: job?.job_type || 'Full-time',
    assessmentMethod: assessment.method === 'quiz' ? 'Skills Quiz' : 'Resume Analysis',
    analyzedDate: assessment.analyzed_at || new Date().toISOString(),
    readinessScore: assessment.readiness_pct || 0,
    statusTag: assessment.status_tag || 'needs_development',
    skillsGapsIdentified,
    totalSkills,
    
    // Skills gaps details
    skillsGaps: skillResults
      .filter(sr => sr.band === 'developing')
      .map(sr => sr.skill?.name || '')
      .filter(Boolean)
  }
}

// Transform company data for modals/detailed views
export function transformCompanyProfile(company: Company): CompanyProfile {
  return {
    name: company.name,
    logo: company.logo_url || '',
    companyImage: undefined, // Field doesn't exist in database
    bio: company.bio || '',
    headquarters: company.hq_city && company.hq_state ? `${company.hq_city}, ${company.hq_state}` : 'Location not specified',
    revenue: company.revenue_range || 'Revenue not disclosed',
    employees: company.employee_range || 'Employee count not specified',
    industry: company.industry || 'Industry not specified',
    trustedPartner: company.is_trusted_partner || false
  }
}

// Transform program data for table display
export function transformProgramToTable(program: Program) {
  return {
    id: program.id,
    name: program.name,
    short_desc: program.short_desc || '',
    program_type: program.program_type || 'Program',
    format: program.format || 'On-campus',
    duration_text: program.duration_text || 'Duration varies',
    school: {
      name: program.school?.name || 'Unknown School'
    },
    skills_provided: program.skills?.length || 0
  }
}

// Transform school data for program cards
export function transformSchoolProfile(school: School) {
  return {
    id: school.id,
    name: school.name,
    logo: school.logo_url || '',
    aboutUrl: school.about_url || '',
    location: school.city && school.state
      ? `${school.city}, ${school.state}`
      : ''
  }
}
