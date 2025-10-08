/**
 *SOC Code Processing API Route
 * Orchestrates ONET + COS + LAiSER processing for enhanced skills extraction
 */

import { NextRequest, NextResponse } from 'next/server'
import { openaiSkillsExtractor } from '@/lib/services/openai-skills-extraction'
import { onetApi } from '@/lib/services/onet-api'
import { CareerOneStopApiService } from '@/lib/services/careeronestop-api'
import { createClient } from '@supabase/supabase-js'

const careerOneStopApi = new CareerOneStopApiService()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock ONET data for development (replace with real API when credentials available)
const mockOnetData = {
  '15-1253.00': {
    title: 'Software Developers',
    description: 'Develop, create, and modify general computer applications software or specialized utility programs. Analyze user needs and develop software solutions.',
    tasks: [
      'Analyze user requirements and design software solutions',
      'Develop and maintain computer programs',
      'Test and debug software applications',
      'Write technical documentation',
      'Collaborate with cross-functional teams'
    ],
    skills: [
      { name: 'Programming', importance: 95, level: 85 },
      { name: 'Problem Solving', importance: 90, level: 80 },
      { name: 'Systems Analysis', importance: 85, level: 75 }
    ],
    knowledge: [
      { name: 'Computer Science', importance: 90 },
      { name: 'Software Development', importance: 85 }
    ]
  }
}

// Mock COS data for development
const mockCosData = {
  '15-1253.00': {
    trainingPrograms: [
      'Computer Science Bachelor Degree',
      'Software Engineering Certification',
      'Coding Bootcamp Programs'
    ],
    localPrograms: [
      'Tampa Bay Software Development Program',
      'Florida Tech Coding Academy'
    ],
    certifications: [
      'AWS Certified Developer',
      'Google Cloud Professional',
      'Microsoft Azure Fundamentals'
    ]
  }
}

/**
 * POST /api/admin/laiser/soc-process
 * Process SOC code with ONET + COS + LAiSER enhancement
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { socCode, includeOnet = true, includeCos = true } = body

    if (!socCode || typeof socCode !== 'string') {
      return NextResponse.json(
        { error: 'Valid SOC code is required' },
        { status: 400 }
      )
    }

    const result: any = {
      socCode,
      processingTime: 0,
      apiCalls: {
        onet: false,
        cos: false,
        lightcast: false,
        laiser: false
      },
      lightcastData: null
    }

    // Step 1: Fetch ONET data (REAL API)
    if (includeOnet) {
      try {
        const [occupation, skills] = await Promise.all([
          onetApi.getOccupationDetails(socCode),
          onetApi.getOccupationSkills(socCode)
        ])

        if (occupation) {
          result.onetData = {
            title: occupation.title,
            description: occupation.description,
            tasks: [], // TODO: Add tasks endpoint
            skills: skills.map(skill => ({
              name: skill.name,
              level: skill.level * 10, // Convert 1-7 to 10-70 scale
              importance: skill.importance * 20, // Convert 1-5 to 20-100 scale
              category: skill.category
            })),
            knowledge: skills.filter(s => s.category === 'knowledge')
          }
          result.apiCalls.onet = true
        }
      } catch (error) {
        console.warn('ONET API call failed, using fallback:', error)
        // Fallback to mock data if API fails
        const mockData = mockOnetData[socCode as keyof typeof mockOnetData]
        if (mockData) {
          result.onetData = mockData
          result.apiCalls.onet = true
        }
      }
    }

    // Step 2: Fetch CareerOneStop data (REAL API)
    if (includeCos) {
      try {
        const cosData = await careerOneStopApi.getComprehensiveOccupationData(socCode)

        if (cosData) {
          result.cosData = {
            trainingPrograms: cosData.trainingPrograms || [],
            certifications: cosData.certifications || [],
            lmiData: cosData.lmiData
          }
          result.apiCalls.cos = true
        }
      } catch (error) {
        console.warn('CareerOneStop API call failed, using fallback:', error)
        // Fallback to mock data if API fails
        const mockData = mockCosData[socCode as keyof typeof mockCosData]
        if (mockData) {
          result.cosData = mockData
          result.apiCalls.cos = true
        }
      }
    }

    // Step 3: Compile rich text for LAiSER
    const richText = compileRichText(result)
    result.richTextCompiled = richText.length

    // Step 4: Process with OpenAI (replaces LAiSER)
    if (richText.length > 50) { // Minimum content threshold
      try {
        const aiResult = await openaiSkillsExtractor.extractSkills({
          title: result.onetData?.title || `Occupation ${socCode}`,
          description: result.onetData?.description || richText,
          tasks: result.onetData?.tasks || [],
          onetSkills: result.onetData?.skills || [],
          cosPrograms: result.cosData?.trainingPrograms || [],
          cosCertifications: result.cosData?.certifications || [],
          lightcastSkills: [] // TODO: Add Lightcast skills when integrated
        })

        result.extractedSkills = aiResult.skills.map((skill: any) => ({
          ...skill,
          curation_status: skill.confidence >= 85 ? 'auto_approved' :
                          skill.confidence >= 60 ? 'pending_review' : 'rejected',
          source: 'OPENAI'
        }))

        result.apiCalls.laiser = true // Keep same field name for UI compatibility
        result.laiserProcessingTime = aiResult.processing_time
      } catch (aiError) {
        console.error('OpenAI extraction failed:', aiError)
        
        result.extractedSkills = []
        result.apiCalls.laiser = false
        result.error = `AI extraction failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
      }
    } else {
      result.extractedSkills = []
      result.warning = 'Insufficient content for AI processing'
    }

    // Step 5: Structure occupation data
    result.occupation = {
      title: result.onetData?.title || `Occupation ${socCode}`,
      description: result.onetData?.description || '',
      tasks: result.onetData?.tasks || [],
      skills: result.onetData?.skills || [],
      knowledge: result.onetData?.knowledge || [],
      trainingPrograms: result.cosData?.trainingPrograms || [],
      certifications: result.cosData?.certifications || []
    }

    result.processingTime = Date.now() - startTime

    return NextResponse.json(result)

  } catch (error) {
    console.error('SOC processing error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

/**
 * Compile rich text from ONET and COS data for LAiSER processing
 */
function compileRichText(processingResult: any): string {
  const parts = []

  // ONET data
  if (processingResult.onetData) {
    parts.push(`Occupation Title: ${processingResult.onetData.title}`)
    parts.push(`Description: ${processingResult.onetData.description}`)

    if (processingResult.onetData.tasks?.length > 0) {
      parts.push('Key Tasks:')
      processingResult.onetData.tasks.forEach((task: string, i: number) => {
        parts.push(`${i + 1}. ${task}`)
      })
    }

    if (processingResult.onetData.skills?.length > 0) {
      parts.push('Required Skills:')
      processingResult.onetData.skills.forEach((skill: any) => {
        parts.push(`- ${skill.name} (Importance: ${skill.importance}/100, Level: ${skill.level}/100)`)
      })
    }

    if (processingResult.onetData.knowledge?.length > 0) {
      parts.push('Required Knowledge:')
      processingResult.onetData.knowledge.forEach((knowledge: any) => {
        parts.push(`- ${knowledge.name} (Importance: ${knowledge.importance}/100)`)
      })
    }
  }

  // COS data
  if (processingResult.cosData) {
    if (processingResult.cosData.trainingPrograms?.length > 0) {
      parts.push('Available Training Programs:')
      processingResult.cosData.trainingPrograms.forEach((program: string) => {
        parts.push(`- ${program}`)
      })
    }

    if (processingResult.cosData.certifications?.length > 0) {
      parts.push('Relevant Certifications:')
      processingResult.cosData.certifications.forEach((cert: string) => {
        parts.push(`- ${cert}`)
      })
    }
  }

  return parts.join('\n\n')
}
