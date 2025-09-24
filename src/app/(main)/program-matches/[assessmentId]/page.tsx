import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/ui/page-header'
import Breadcrumb from '@/components/ui/breadcrumb'
import AssessmentStepper from '@/components/ui/assessment-stepper'
import { FeaturedProgramCard } from '@/components/ui/featured-program-card'
import Link from 'next/link'
import { routes } from '@/lib/routes'

// Mock data - will be replaced with real API calls
const mockProgramMatches = [
  {
    id: '1',
    name: 'Full Stack Web Development Bootcamp',
    school: { name: 'TechEd Institute', logo_url: null, city: 'Tampa', state: 'FL' },
    program_type: 'Bootcamp',
    format: 'Online',
    duration_text: '24 weeks',
    short_desc: 'Comprehensive program covering modern web development technologies including React, Node.js, and databases.',
    coverage_score: 0.85,
    covered_skills: ['Node.js', 'SQL', 'Git', 'Docker'],
    program_url: 'https://example.com/program1'
  },
  {
    id: '2',
    name: 'Backend Development Certificate',
    school: { name: 'Code Academy', logo_url: null, city: 'St. Petersburg', state: 'FL' },
    program_type: 'Certificate',
    format: 'Hybrid',
    duration_text: '16 weeks',
    short_desc: 'Focus on server-side development, databases, and API design.',
    coverage_score: 0.75,
    covered_skills: ['Node.js', 'SQL', 'Docker'],
    program_url: 'https://example.com/program2'
  },
  {
    id: '3',
    name: 'DevOps Fundamentals',
    school: { name: 'Tech Institute', logo_url: null, city: 'Clearwater', state: 'FL' },
    program_type: 'Certificate',
    format: 'Online',
    duration_text: '12 weeks',
    short_desc: 'Learn containerization, CI/CD, and infrastructure management.',
    coverage_score: 0.50,
    covered_skills: ['Git', 'Docker'],
    program_url: 'https://example.com/program3'
  }
]

const mockAssessment = {
  id: '1',
  job: { 
    id: '1',
    title: 'Project Management Specialists',
    soc_code: '13-1082'
  },
  gap_skills: ['Node.js', 'SQL', 'Git', 'Docker']
}

function ProgramMatchCard({ program, gapSkills }: { program: any, gapSkills: string[] }) {
  const coveragePercentage = Math.round(program.coverage_score * 100)
  
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          {program.school?.logo_url ? (
            <img src={program.school.logo_url} alt="logo" className="w-10 h-10 rounded" />
          ) : (
            <span className="text-lg font-semibold">{program.school?.name?.[0] || 'P'}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{program.name}</h3>
          <p className="text-sm text-muted-foreground">{program.school?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-green-100 text-green-800">
              {coveragePercentage}% match
            </Badge>
            <Badge variant="secondary">{program.program_type}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{program.format}</Badge>
          <Badge variant="outline">{program.duration_text}</Badge>
          {program.school?.city && program.school?.state && (
            <Badge variant="outline">{program.school.city}, {program.school.state}</Badge>
          )}
        </div>
        
        <p className="text-sm text-gray-700">{program.short_desc}</p>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Skills you'll develop:</h4>
          <div className="flex gap-1 flex-wrap">
            {program.covered_skills.map((skill: string) => (
              <Badge 
                key={skill} 
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-800"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link href={`/programs/${program.id}`}>Program Details</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <a href={program.program_url} target="_blank" rel="noopener noreferrer">
              Apply Now
            </a>
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1">
            About School
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            ♡ Save Program
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProgramMatchesPage({ params }: { params: { assessmentId: string } }) {
  const assessment = mockAssessment // In real app: await getAssessment(params.assessmentId)
  const programMatches = mockProgramMatches // In real app: await getProgramMatches(params.assessmentId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs above header */}
      <div className="bg-gray-50 py-3">
        <div className="max-w-[1280px] mx-auto px-6">
          <Breadcrumb items={[
            { label: 'Jobs', href: '/jobs' },
            { label: 'High Demand Occupations', href: '/jobs' },
            { label: assessment.job.title, href: `/jobs/${assessment.job.id}` },
            { label: 'SkillSync Assessment', isActive: true }
          ]} />
        </div>
      </div>

      <PageHeader 
        isDynamic={true}
        jobInfo={{
          title: assessment.job.title,
          socCode: assessment.job.soc_code
        }}
        showPrimaryAction={true}
        showSecondaryAction={true}
        primaryAction={{
          label: "Favorite",
          variant: "favorite",
          isFavorited: false,
          onClick: () => {
            console.log('Toggle favorite for job:', assessment.job.id)
          }
        }}
        secondaryAction={{
          label: "Action 2"
        }}
        variant="split"
      />

      {/* Assessment stepper below header */}
      <div className="bg-white py-6 border-b">
        <div className="max-w-[1280px] mx-auto px-6">
          <AssessmentStepper steps={[
            { id: '1', label: 'Assess Your Skills', status: 'completed' },
            { id: '2', label: 'SkillSync Readiness Score', status: 'completed' },
            { id: '3', label: 'Education Program Matches', status: 'current' }
          ]} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-8">

        {/* Skills Gap Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Skills to Develop</CardTitle>
            <CardDescription>
              Based on your assessment, focus on these areas for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {assessment.gap_skills.map((skill) => (
                <Badge key={skill} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Program Matches */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Recommended Programs ({programMatches.length})
            </h2>
            <Button asChild variant="outline">
              <Link href={routes.programs}>Browse All Programs</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {programMatches.map((program) => (
              <div key={program.id} className="relative">
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-green-100 text-green-800">
                    {Math.round(program.coverage_score * 100)}% match
                  </Badge>
                </div>
                <FeaturedProgramCard
                  id={program.id}
                  name={program.name}
                  school={{
                    name: program.school.name,
                    logo: program.school.logo_url || undefined
                  }}
                  programType={program.program_type}
                  format={program.format}
                  duration={program.duration_text}
                  description={program.short_desc}
                  skillsCallout={{
                    type: 'skills',
                    count: program.covered_skills.length,
                    label: `Covers ${program.covered_skills.length} of your skill gaps`,
                    href: `/programs/${program.id}/skills`
                  }}
                  aboutSchoolHref={`https://${program.school.name.toLowerCase().replace(/\s+/g, '')}.edu`}
                  programDetailsHref={`/programs/${program.id}`}
                />
              </div>
            ))}
          </div>

          {programMatches.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No program matches found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find programs that match your specific skill gaps. Try browsing all available programs.
                  </p>
                  <Button asChild size="lg">
                    <Link href={routes.programs}>Browse All Programs</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-16">
                <Link href={routes.assessment(assessment.id)}>
                  📊 View Full Report
                  <span className="block text-xs opacity-75">Review your assessment</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16">
                <Link href={routes.jobs}>
                  🔄 Take Another Assessment
                  <span className="block text-xs opacity-75">Assess different roles</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16">
                <Link href={routes.myAssessments}>
                  📈 Track Progress
                  <span className="block text-xs opacity-75">View all assessments</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
