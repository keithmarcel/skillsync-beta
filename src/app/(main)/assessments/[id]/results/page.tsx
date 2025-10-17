'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PageLoader } from '@/components/ui/loading-spinner'
import { CheckCircle, AlertCircle, XCircle, ArrowLeft, Settings } from 'lucide-react'
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

      const { data: skillsData, error: skillsError } = await supabase
        .from('assessment_skill_results')
        .select('*, skill:skills(name, category)')
        .eq('assessment_id', assessmentId)
        .order('score_pct', { ascending: false })

      if (!skillsError && skillsData) {
        setSkillResults(skillsData)
      }

      if (assessmentData.job?.soc_code) {
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
      color: 'text-[#00A6AE]'
    }
    if (readiness >= 60) return { 
      icon: AlertCircle, 
      text: "You're close to being role ready.", 
      color: 'text-[#FDBA8C]'
    }
    return { 
      icon: XCircle, 
      text: "You need more skill development.", 
      color: 'text-[#F8B4B4]'
    }
  }

  const getSkillBarColor = (score: number) => {
    if (score >= 80) return 'bg-[#84E1BC]'
    if (score >= 60) return 'bg-[#FDBA8C]'
    return 'bg-[#F8B4B4]'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - No background, just spacing like other pages */}
      <div className="max-w-[1232px] mx-auto px-6 pt-6 pb-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/my-assessments')}
          className="text-gray-600 hover:text-gray-900 -ml-3"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </Button>
      </div>

      <div className="max-w-[1232px] mx-auto px-6 pb-8">
        {/* Hero Section - Figma: #002F3F background, shadow, 48px padding */}
        <div className="bg-[#002F3F] rounded-xl shadow-lg mb-6">
          {/* Main content area - 48px 48px 32px padding */}
          <div className="flex items-center px-12 pt-12 pb-8 gap-8">
            {/* Left side - 2/3 width, pl-8 for inner padding */}
            <div className="flex-1 pl-8">
              {/* Status Icon + Headline */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-1.5 bg-[#00A6AE] rounded-full">
                  <StatusIcon className={`h-4 w-4 text-[#AFECEF]`} />
                </div>
                <h1 className="text-3xl font-semibold text-white">{status.text}</h1>
              </div>

              {/* Match Percentage Text - 18px font */}
              <p className="text-lg text-white/90 leading-relaxed mb-2">
                Based on your assessment, you have a <span className="font-semibold">{readiness}% match</span> with the skills required for {assessment.job?.company?.name}'s <span className="font-semibold">{assessment.job?.title}</span> role.
              </p>

              {/* Personalized Feedback - 16px font, pt-2 */}
              <p className="text-base text-white/80 leading-relaxed pt-2">
                {readiness >= 80 && "You excel in strategic planning and leadership, critical skills for driving business success in the dynamic project management market. To further grow, focus on enhancing your project management, data analysis, and process improvement abilities. Engaging in business analytics and operations programs will support your role readiness."}
                {readiness >= 60 && readiness < 80 && "You demonstrate strong foundational skills but have opportunities to strengthen key competencies. Focus on developing your weaker areas through targeted training and practice. With dedication, you'll be fully role-ready soon."}
                {readiness < 60 && "You're building your skills in this area. Focus on the development areas identified below, and consider enrolling in recommended training programs to accelerate your growth and become role-ready."}
              </p>
            </div>

            {/* Right side - Stacked bars + percentage, centered */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              {/* Stacked bars - 200px wide, 12px height, 8px gap */}
              <div className="flex flex-col gap-2">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-[200px] h-3 rounded-full ${
                      i < filledBlocks ? 'bg-[#00E1FF]' : 'bg-[#324650]/50'
                    }`}
                  />
                ))}
              </div>

              {/* Percentage - 72px font, 8px gap */}
              <div className="text-center pt-1">
                <div className="text-[72px] font-bold leading-none text-white">{readiness}%</div>
                <div className="text-base text-white/70 mt-2">Role Readiness</div>
              </div>
            </div>
          </div>

          {/* Bottom card - 48px horizontal, 32px bottom padding */}
          {readiness >= 80 && (
            <div className="px-12 pb-8">
              <div className="bg-[#114B5F] rounded-lg px-6 py-4 flex items-center justify-between">
                <p className="text-lg text-[#F5F5F5]">
                  You've shown <span className="font-semibold">high proficiency</span>. Your readiness score has been shared with the employer.
                </p>
                <Button 
                  variant="outline" 
                  className="bg-transparent border-[#AFECEF] text-[#AFECEF] hover:bg-white/10 text-sm whitespace-nowrap ml-4"
                >
                  View Upskilling Programs →
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Skills Gap Analysis - Figma: #FCFCFC bg, #E5E5E5 border */}
        <div className="bg-[#FCFCFC] border border-[#E5E5E5] rounded-xl p-8 mb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-[#1F2937] mb-4">Skills Gap Analysis</h2>
            <p className="text-base text-[#1F2A37]">
              Here's how <span className="font-semibold">your skills</span> compare to what employers expect for this role.
            </p>
          </div>

          {/* Legend - 16px gap between items */}
          <div className="flex items-center gap-4 mb-5 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-full border border-dashed border-[#374151] bg-[#D1D5DB]" />
              <span className="text-[#4B5563]">Benchmark</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-full bg-[#84E1BC]" />
              <span className="text-[#4B5563]">Proficient</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-full bg-[#FDBA8C]" />
              <span className="text-[#4B5563]">Building Proficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-full bg-[#F8B4B4]" />
              <span className="text-[#4B5563]">Needs Development</span>
            </div>
          </div>

          <div className="border-t border-[#E5E5E5] pt-5" />

          {/* Skill Bars - 26px gap between items */}
          <div className="space-y-[26px] mt-5">
            {skillResults.map((result) => {
              const score = Math.round(result.score_pct || 0)
              const barColor = getSkillBarColor(score)
              
              return (
                <div key={result.skill_id}>
                  <div className="mb-2">
                    <h3 className="font-medium text-base text-[#1F2937]">{result.skill?.name}</h3>
                  </div>
                  <div className="relative">
                    {/* Background bar - border style from Figma */}
                    <div className="w-full h-7 bg-[#E5E7EB] border border-[#E5E7EB] rounded-full relative flex items-center">
                      {/* Filled bar */}
                      <div
                        className={`h-7 ${barColor} rounded-full absolute left-0 top-0 transition-all duration-500`}
                        style={{ width: `${score}%` }}
                      />
                      {/* Score label inside filled area */}
                      <div
                        className="absolute flex items-center justify-center h-7"
                        style={{ left: `${Math.max(score - 5, 0)}%` }}
                      >
                        <span className="text-sm font-bold text-[#1F2A37] px-3">{score}%</span>
                      </div>
                      {/* 100% marker - dashed border on right */}
                      <div className="absolute right-0 top-0 h-7 w-[60px] flex items-center justify-center border-r border-dashed border-[#4B5563] rounded-r-full">
                        <span className="text-sm font-medium text-[#4B5563]">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Education Program Matches */}
        {programs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <div key={program.id} className="border border-gray-200 rounded-lg p-6 hover:border-teal-500 hover:shadow-md transition-all">
                  {program.school?.logo_url && (
                    <div className="mb-4">
                      <img 
                        src={program.school.logo_url} 
                        alt={program.school.name}
                        className="h-8 object-contain"
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{program.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{program.school?.name}</p>
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
                  {program.short_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {program.short_description}
                    </p>
                  )}
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
