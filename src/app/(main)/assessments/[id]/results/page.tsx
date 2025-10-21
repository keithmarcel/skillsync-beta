'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getGapFillingPrograms, getRelatedPrograms } from '@/lib/database/queries'
import { processAssessmentCompletion } from '@/lib/services/auto-invite'
import { CheckCircle, AlertCircle, XCircle, ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleProgramCard } from '@/components/ui/simple-program-card'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AssessmentResultsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string
  const { toast } = useToast()

  const [assessment, setAssessment] = useState<any>(null)
  const [skillResults, setSkillResults] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [displayedReadiness, setDisplayedReadiness] = useState(0)
  const [hasShownToast, setHasShownToast] = useState(false)

  const scrollToPrograms = () => {
    const programsSection = document.getElementById('upskilling-programs')
    if (programsSection) {
      programsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    loadAssessmentResults()
  }, [assessmentId])

  // Animate the readiness percentage counter
  useEffect(() => {
    if (!loading && assessment) {
      const targetValue = Math.round(assessment.overall_readiness_pct || assessment.readiness_pct || 0)
      const duration = 1500 // 1.5 seconds
      const steps = 60
      const increment = targetValue / steps
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayedReadiness(targetValue)
          clearInterval(timer)
        } else {
          setDisplayedReadiness(Math.floor(increment * currentStep))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [loading, assessment])

  const loadAssessmentResults = async () => {
    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          *,
          job:jobs(id, title, soc_code, required_proficiency_pct, company:companies(name, logo_url))
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

      // Get programs based on user's readiness
      const requiredProficiency = assessmentData.job?.required_proficiency_pct || 75
      const gapSkills = skillsData?.filter(s => s.score_pct < requiredProficiency).map(s => s.skill_id) || []
      
      if (gapSkills.length > 0) {
        // User has gaps - show gap-filling programs (real data only)
        const programsData = await getGapFillingPrograms(gapSkills, 10)
        setPrograms(programsData)
        console.log(`Found ${programsData.length} programs addressing ${gapSkills.length} skill gaps (threshold: ${requiredProficiency}%)`)
      } else if (assessmentData.job?.id) {
        // User is role-ready - show programs for continued growth via CIP-SOC crosswalk (real data only)
        const programsData = await getRelatedPrograms(assessmentData.job.id, 10)
        setPrograms(programsData)
        console.log(`User is role-ready - showing ${programsData.length} growth programs via CIP-SOC crosswalk`)
      } else {
        // No job data - show empty state
        setPrograms([])
        console.log('No job data available - showing empty state')
      }

      // Process auto-invite and show toast ONCE (only after assessment completion)
      const toastKey = `assessment-toast-${assessmentId}`
      const hasShownBefore = sessionStorage.getItem(toastKey)
      
      if (!hasShownBefore && !hasShownToast) {
        const inviteResult = await processAssessmentCompletion(assessmentId)
        
        if (inviteResult.shared && inviteResult.companyName) {
          // Show toast notification
          toast({
            title: "Assessment Results Shared",
            description: `Your assessment results have been shared with ${inviteResult.companyName}.`,
          })

          // Mark as shown
          setHasShownToast(true)
          sessionStorage.setItem(toastKey, 'true')

          // Log invitation status
          if (inviteResult.invited) {
            console.log(`✅ Added to ${inviteResult.companyName}'s invite queue (${inviteResult.readinessPct}% readiness)`)
          } else if (inviteResult.qualified) {
            console.log(`ℹ️ Qualified but already invited to ${inviteResult.companyName}`)
          } else {
            console.log(`ℹ️ Results shared with ${inviteResult.companyName} (${inviteResult.readinessPct}% < ${inviteResult.requiredPct}% threshold)`)
          }
        }
      }

    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReadinessStatus = (readiness: number, requiredProf: number) => {
    if (readiness >= requiredProf) return { 
      icon: CheckCircle, 
      text: "You're role ready.", 
      color: 'text-[#00A6AE]'
    }
    // Close to ready (within 15% of requirement)
    if (readiness >= requiredProf - 15) return { 
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

  if (loading || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="max-w-[1232px] mx-auto px-6 pt-8 pb-6">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="max-w-[1232px] mx-auto px-6 pb-8">
          {/* Hero Card Skeleton */}
          <div className="bg-[#002F3F] rounded-xl shadow-lg mb-12 p-12">
            <div className="flex items-center gap-12">
              <div className="flex-1 space-y-4">
                <div className="h-10 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-6 bg-white/10 rounded animate-pulse w-full" />
                <div className="h-6 bg-white/10 rounded animate-pulse w-5/6" />
              </div>
              <div className="border-2 border-[#114B5F] rounded-xl p-8 min-w-[240px]">
                <div className="h-32 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Skills Gap Skeleton */}
          <div className="bg-white rounded-xl p-8 mb-12 shadow-md">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-6" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Programs Skeleton */}
          <div className="bg-white rounded-xl p-8 shadow-md">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-96 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const readiness = Math.round(assessment.readiness_pct || 0)
  const requiredProficiency = assessment.job?.required_proficiency_pct || 75
  const status = getReadinessStatus(readiness, requiredProficiency)
  const StatusIcon = status.icon
  const filledBlocks = Math.round(readiness / 10)

  // No placeholder programs - only show real crosswalk data
  const displayPrograms = programs

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - No background, just spacing like other pages */}
      <div className="max-w-[1232px] mx-auto px-6 pt-8 pb-6">
        <Link 
          href="/my-assessments"
          className="inline-flex items-center text-gray-600 hover:text-[#0694A2] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </Link>
      </div>

      <div className="max-w-[1232px] mx-auto px-6 pb-8">
        {/* Hero Section - Role Readiness Card */}
        <div className="bg-[#002F3F] rounded-xl shadow-lg mb-12">
          {/* Main content area - extra padding for breathing room */}
          <div className="flex items-center px-16 pt-12 pb-8 gap-12">
            {/* Left side - 2/3 width */}
            <div className="flex-1">
              {/* Headline - Icon removed since we have one above the percentage */}
              <div className="mb-5">
                <h1 className="text-4xl font-bold text-white font-source-sans-pro">{status.text}</h1>
              </div>

              {/* Match Percentage Text - 18px font */}
              <p className="text-lg text-white/90 leading-relaxed mb-2">
                Based on your assessment, you have a <span className="font-semibold">{readiness}% match</span> with the skills required for {assessment.job?.company?.name}'s{' '}
                <Link href={`/jobs/${assessment.job?.id}`} className="font-semibold text-[#00E1FF] hover:text-[#AFECEF] underline underline-offset-2 transition-colors">
                  {assessment.job?.title}
                </Link> role.
              </p>

              {/* Personalized Feedback - Dynamic based on actual results */}
              <p className="text-base text-white/80 leading-relaxed pt-2">
                {(() => {
                  const requiredProf = assessment?.job?.required_proficiency_pct || 75
                  const gapSkillsCount = skillResults.filter(s => s.score_pct < requiredProf).length
                  const strongSkills = skillResults.filter(s => s.score_pct >= 85).slice(0, 3)
                  const gapSkills = skillResults.filter(s => s.score_pct < requiredProf).slice(0, 3)
                  const topSkills = skillResults.slice(0, 3)
                  
                  if (readiness >= requiredProf) {
                    // Role-ready: Highlight top skills and programs
                    const skillsList = strongSkills.length > 0 
                      ? strongSkills.map(s => s.skill?.name).filter(Boolean).join(', ')
                      : topSkills.map(s => s.skill?.name).filter(Boolean).join(', ')
                    
                    if (programs.length > 0) {
                      return `Your strong performance in ${skillsList || 'essential competencies'} demonstrates you're well-prepared for this role. Explore the ${programs.length} program${programs.length !== 1 ? 's' : ''} below to continue advancing your expertise and unlock new career opportunities.`
                    }
                    return `Your strong performance in ${skillsList || 'essential competencies'} demonstrates you're well-prepared for this role. Continue building on these strengths to advance your career.`
                  } else if (gapSkillsCount > 0 && gapSkillsCount <= 3) {
                    // Few gaps: Specific, actionable guidance
                    const gapsList = gapSkills.map(s => s.skill?.name).filter(Boolean).join(', ')
                    const skillsPrefix = gapsList ? 'skills in ' : ''
                    if (programs.length > 0) {
                      return `You're ${requiredProf - readiness}% away from role-ready! Strengthening ${skillsPrefix}${gapsList || 'a few key areas'} will get you there. The ${programs.length} program${programs.length !== 1 ? 's' : ''} below specifically target these skills and can help you become fully qualified.`
                    }
                    return `You're ${requiredProf - readiness}% away from role-ready! Focus on strengthening ${skillsPrefix}${gapsList || 'a few key areas'} to meet the ${requiredProf}% proficiency requirement.`
                  } else {
                    // Multiple gaps: Encouraging with clear path
                    const strongCount = skillResults.filter(s => s.score_pct >= 70).length
                    if (programs.length > 0) {
                      return `You've built a solid foundation with ${strongCount} skill${strongCount !== 1 ? 's' : ''} at 70% or higher. The ${programs.length} program${programs.length !== 1 ? 's' : ''} below are specifically designed to address your development areas and accelerate your journey to becoming role-ready.`
                    }
                    return `You've built a solid foundation with ${strongCount} skill${strongCount !== 1 ? 's' : ''} at 70% or higher. Focus on the development areas identified below to accelerate your growth and become role-ready.`
                  }
                })()}
              </p>
            </div>

            {/* Right side - Readiness score in outlined container */}
            <div className="flex-shrink-0">
              <div className="border-2 border-[#114B5F] rounded-xl p-8 bg-transparent min-w-[240px]">
                <div className="text-center">
                  {/* Icon - Target/Gauge for role readiness */}
                  <div className="mb-4 flex justify-center">
                    <div className="p-2 bg-[#00A6AE] rounded-full">
                      <svg className="w-6 h-6 text-[#AFECEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Percentage - Animated counter */}
                  <div className="text-[64px] font-bold leading-none text-white mb-2">{displayedReadiness}%</div>
                  <div className="text-base text-white/70 mb-4">Role Readiness</div>
                  
                  {/* Horizontal progress bar comparing to required proficiency */}
                  <div className="space-y-2">
                    <div className="relative h-3 bg-[#324650] rounded-full w-full">
                      {/* Your score fill */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-[#00E1FF] transition-all duration-1000 rounded-full"
                        style={{ width: `${Math.min(readiness, 100)}%` }}
                      />
                      {/* Required proficiency marker - bright yellow for contrast */}
                      <div 
                        className="absolute top-0 h-full w-1 bg-yellow-400 shadow-lg"
                        style={{ left: `${Math.min(assessment?.job?.required_proficiency_pct || 75, 100)}%`, transform: 'translateX(-50%)' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                      <span>0%</span>
                      <span className="text-yellow-400 font-medium">Required: {assessment?.job?.required_proficiency_pct || 75}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom card - shown for all readiness levels */}
          {(() => {
            const requiredProf = assessment?.job?.required_proficiency_pct || 75
            const isRoleReady = readiness >= requiredProf
            const filteredPrograms = displayPrograms.filter(program => {
              const hasValidName = program.name && !program.name.startsWith('Skills:') && !program.name.startsWith('Build:')
              const hasDescription = program.short_desc || program.short_description
              return hasValidName && hasDescription
            })
            const programCount = filteredPrograms.length

            return (
              <div className="px-8 pb-8">
                <div className={`bg-[#114B5F] rounded-lg px-6 py-4 flex items-center ${programCount > 0 ? 'justify-between' : 'justify-center'}`}>
                  <p className="text-lg text-[#F5F5F5]">
                    {isRoleReady ? (
                      <>
                        You've shown <span className="font-semibold">high proficiency</span>. Your readiness score has been shared with {assessment.job?.company?.name || 'the employer'}.
                      </>
                    ) : (
                      <>
                        You matched with <span className="font-semibold">{programCount} education program{programCount !== 1 ? 's' : ''}</span> that have the skills you need.
                      </>
                    )}
                  </p>
                  {programCount > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={scrollToPrograms}
                      className="bg-transparent border-[#AFECEF] text-[#AFECEF] hover:bg-white/10 text-sm whitespace-nowrap ml-4"
                    >
                      {isRoleReady ? 'View Upskilling Programs →' : 'View Your Program Matches →'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Skills Gap Analysis - White bg with shadow */}
        <div className="bg-white rounded-xl p-8 mb-12 shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-[#1F2937] mb-4 font-source-sans-pro">Skills Gap Analysis</h2>
            <p className="text-base text-[#1F2A37]">
              Here's how <span className="font-semibold">your skills</span> compare to what {assessment.job?.company?.name || 'employers'} expect{assessment.job?.company?.name ? 's' : ''} for this role.
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
                      {/* Score label inside filled area - adjust position to avoid overlap with 100% */}
                      <div
                        className="absolute flex items-center justify-center h-7"
                        style={{ left: `${score > 90 ? Math.max(score - 12, 0) : Math.max(score - 5, 0)}%` }}
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

        {/* Education Program Matches - Always show - White bg with shadow */}
        <div id="upskilling-programs" className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-200">
          {(() => {
            const requiredProficiency = assessment?.job?.required_proficiency_pct || 75
            const gapCount = skillResults.filter(s => s.score_pct < requiredProficiency).length
            const isRoleReady = gapCount === 0
            
            const filteredPrograms = displayPrograms.filter(program => {
              const hasValidName = program.name && !program.name.startsWith('Skills:') && !program.name.startsWith('Build:')
              const hasDescription = program.short_desc || program.short_description
              return hasValidName && hasDescription
            })
            
            const hasPrograms = filteredPrograms.length > 0
            
            return (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2 font-source-sans-pro">
                    {isRoleReady 
                      ? 'Continue Growing in Your Field' 
                      : 'Close Your Skill Gaps'}
                  </h2>
                  <p className="text-gray-600">
                    {hasPrograms ? (
                      isRoleReady
                        ? 'You\'re role-ready! These programs can help you continue developing your expertise and advance your career.'
                        : `These programs address ${gapCount} skill gap${gapCount !== 1 ? 's' : ''} identified in your assessment and can help you become role-ready.`
                    ) : (
                      'No programs available yet. Check back soon for training opportunities relevant to your career path.'
                    )}
                  </p>
                </div>

                {hasPrograms && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map((program) => (
                      <Link key={program.id} href={`/programs/${program.id}`} className="block">
                        <SimpleProgramCard
                          id={program.id}
                          name={program.name}
                          school={{
                            name: program.school?.name || 'Unknown School',
                            logo: program.school?.logo_url || undefined
                          }}
                          programType={program.program_type || 'Program'}
                          format={program.format || program.delivery_format || 'On-campus'}
                          duration={program.duration_text || 'Duration varies'}
                          description={program.short_desc || program.short_description || ''}
                          relevanceScore={program.gap_coverage_pct}
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
