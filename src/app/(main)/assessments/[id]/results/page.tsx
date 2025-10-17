'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PageLoader } from '@/components/ui/loading-spinner'
import { CheckCircle, AlertCircle, XCircle, ArrowLeft, ArrowRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AssessmentResultsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<any>(null)
  const [skillResults, setSkillResults] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssessmentResults()
  }, [assessmentId])

  const loadAssessmentResults = async () => {
    try {
      // Load assessment with job details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          *,
          job:jobs(id, title, soc_code, company:companies(name, logo_url))
        `)
        .eq('id', assessmentId)
        .single()

      if (assessmentError) throw assessmentError
      setAssessment(assessmentData)

      // Load skill results
      const { data: skillsData, error: skillsError } = await supabase
        .from('assessment_skill_results')
        .select('*, skill:skills(name, category)')
        .eq('assessment_id', assessmentId)
        .order('score_pct', { ascending: false })

      if (!skillsError && skillsData) {
        setSkillResults(skillsData)
      }

      // Load recommended programs based on skill gaps
      if (assessmentData.job?.soc_code) {
        // Get skills that need development (< 75%)
        const gapSkills = skillsData?.filter(s => s.score_pct < 75).map(s => s.skill_id) || []
        
        if (gapSkills.length > 0) {
          const { data: programsData } = await supabase
            .from('programs')
            .select(`
              id,
              name,
              program_type,
              duration_text,
              delivery_format,
              short_description,
              school:schools(name, logo_url)
            `)
            .eq('status', 'published')
            .limit(6)
          
          if (programsData) {
            setPrograms(programsData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReadinessStatus = (readiness: number) => {
    if (readiness >= 80) return { 
      icon: CheckCircle, 
      text: "You're role ready.", 
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10'
    }
    if (readiness >= 60) return { 
      icon: AlertCircle, 
      text: "You're close to being role ready.", 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    }
    return { 
      icon: XCircle, 
      text: "You need more skill development.", 
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10'
    }
  }

  const getSkillBarColor = (score: number) => {
    if (score >= 80) return 'bg-teal-400'
    if (score >= 60) return 'bg-orange-400'
    return 'bg-pink-400'
  }

  const getSkillLabel = (score: number) => {
    if (score >= 80) return { text: 'Proficient', color: 'text-teal-700', bg: 'bg-teal-100' }
    if (score >= 60) return { text: 'Building Proficiency', color: 'text-orange-700', bg: 'bg-orange-100' }
    return { text: 'Needs Development', color: 'text-pink-700', bg: 'bg-pink-100' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="Loading your results..." />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Assessment not found</p>
          <Button asChild>
            <Link href="/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    )
  }

  const readiness = Math.round(assessment.readiness_pct || 0)
  const status = getReadinessStatus(readiness)
  const StatusIcon = status.icon
  const filledBlocks = Math.round(readiness / 10)
  const programCount = programs.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/my-assessments')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Hero Section - Dark Teal Background */}
        <div className="bg-[#0B4F56] rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between gap-8">
            {/* Left Side - Status and Copy */}
            <div className="flex-1">
              {/* Status Icon + Headline */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-full ${status.bgColor}`}>
                  <StatusIcon className={`h-6 w-6 ${status.color}`} />
                </div>
                <h1 className="text-3xl font-bold">{status.text}</h1>
              </div>

              {/* Match Percentage Text */}
              <p className="text-lg mb-4 text-white/90">
                Based on your assessment, you have a <span className="font-bold">{readiness}% match</span> with the skills required for {assessment.job?.company?.name}'s <span className="font-bold">{assessment.job?.title}</span> role.
              </p>

              {/* Personalized Feedback Copy */}
              <p className="text-white/80 leading-relaxed mb-6">
                {readiness >= 80 && "You excel in strategic planning and leadership, critical skills for driving business success in the dynamic project management market. To further grow, focus on enhancing your project management, data analysis, and process improvement abilities. Engaging in business analytics and operations programs will support your role readiness."}
                {readiness >= 60 && readiness < 80 && "You demonstrate strong foundational skills but have opportunities to strengthen key competencies. Focus on developing your weaker areas through targeted training and practice. With dedication, you'll be fully role-ready soon."}
                {readiness < 60 && "You're building your skills in this area. Focus on the development areas identified below, and consider enrolling in recommended training programs to accelerate your growth and become role-ready."}
              </p>

              {/* Conditional Info Cards */}
              <div className="space-y-3">
                {readiness >= 80 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                    <p className="text-white/90">
                      You've shown <span className="font-semibold">high proficiency</span>. Your readiness score has been shared with the employer.
                    </p>
                    <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 whitespace-nowrap">
                      View Upskilling Programs →
                    </Button>
                  </div>
                )}
                
                {programCount > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                    <p className="text-white/90">
                      You matched with <span className="font-semibold">{programCount} education programs</span> that have the skills you need.
                    </p>
                    <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 whitespace-nowrap">
                      View Your Program Matches →
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Stacked Bar Chart + Percentage */}
            <div className="flex flex-col items-center gap-4">
              {/* Stacked Bar Chart - 10 blocks */}
              <div className="flex flex-col gap-1.5">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-32 h-3 rounded-sm ${
                      i < filledBlocks ? 'bg-[#0694A2]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Large Percentage */}
              <div className="text-center">
                <div className="text-6xl font-bold">{readiness}%</div>
                <div className="text-sm text-white/70 mt-1">Role Readiness</div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Gap Analysis */}
        <div className="bg-white rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">Skills Gap Analysis</h2>
          <p className="text-gray-600 mb-6">
            Here's how <span className="font-semibold">your skills</span> compare to what employers expect for this role.
          </p>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Benchmark</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-teal-400" />
              <span className="text-gray-600">Proficient</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-400" />
              <span className="text-gray-600">Building Proficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-400" />
              <span className="text-gray-600">Needs Development</span>
            </div>
          </div>

          {/* Skill Bars */}
          <div className="space-y-6">
            {skillResults.map((result) => {
              const score = Math.round(result.score_pct || 0)
              const barColor = getSkillBarColor(score)
              
              return (
                <div key={result.skill_id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{result.skill?.name}</h3>
                  </div>
                  <div className="relative">
                    {/* Background bar (benchmark) */}
                    <div className="w-full h-8 bg-gray-200 rounded-full relative">
                      {/* Filled bar (user score) */}
                      <div
                        className={`h-8 ${barColor} rounded-full flex items-center justify-end pr-3 transition-all duration-500`}
                        style={{ width: `${score}%` }}
                      >
                        <span className="text-sm font-bold text-gray-900">{score}%</span>
                      </div>
                      {/* 100% marker */}
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">100%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Education Program Matches */}
        {programs.length > 0 && (
          <div className="bg-white rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-teal-100 rounded-lg">
                <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Relevant Education & Training Programs</h2>
                <p className="text-gray-600">Programs that align with the skills and requirements for this role.</p>
              </div>
            </div>

            {/* Program Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <div key={program.id} className="border border-gray-200 rounded-lg p-6 hover:border-teal-500 hover:shadow-md transition-all">
                  {/* School Logo */}
                  {program.school?.logo_url && (
                    <div className="mb-4">
                      <img 
                        src={program.school.logo_url} 
                        alt={program.school.name}
                        className="h-8 object-contain"
                      />
                    </div>
                  )}

                  {/* Program Title */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{program.name}</h3>
                  
                  {/* School Name */}
                  <p className="text-sm text-gray-600 mb-3">{program.school?.name}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {program.program_type && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {program.program_type}
                      </span>
                    )}
                    {program.delivery_format && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {program.delivery_format}
                      </span>
                    )}
                    {program.duration_text && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {program.duration_text}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {program.short_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {program.short_description}
                    </p>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      About the Program
                    </Button>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                      Inquire Now →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
