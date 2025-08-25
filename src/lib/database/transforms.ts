import { Job, Company, Program, School, Assessment } from './queries'

// Transform database Job to component props format
export function transformJobToFeaturedRole(job: Job) {
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
    category: job.category || 'General',
    skillsCount: job.skills_count || 0,
    description: job.long_desc || '',
    medianSalary: job.median_wage_usd || 0,
    requiredProficiency: 90, // Default proficiency score
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
  return {
    id: job.id,
    title: job.title,
    socCode: job.soc_code || '',
    category: job.category || 'General',
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
export function transformCompanyProfile(company: Company) {
  return {
    id: company.id,
    name: company.name,
    logo: company.logo_url || '',
    bio: company.bio || '',
    headquarters: company.hq_city && company.hq_state
      ? `${company.hq_city}, ${company.hq_state}`
      : '',
    revenue: company.revenue_range || '',
    employees: company.employee_range || '',
    industry: company.industry || '',
    trustedPartner: company.is_trusted_partner || false
  }
}

// Transform program data for table display
export function transformProgramToTable(program: Program) {
  return {
    id: program.id,
    name: program.name,
    program_type: program.program_type || 'Program',
    format: program.format || 'On-campus',
    duration_text: program.duration_text || 'Duration varies',
    school: program.school?.name || 'Unknown School',
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
