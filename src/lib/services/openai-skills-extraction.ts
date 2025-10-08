/**
 * OpenAI Skills Extraction Service
 * Replaces LAiSER with OpenAI for more reliable skills extraction
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ExtractedSkill {
  skill: string
  level: number // 1-10 proficiency scale
  confidence: number // 0-100 confidence score
  knowledge_required?: string[]
  tasks?: string[]
  source: string
}

export interface SkillsExtractionResult {
  skills: ExtractedSkill[]
  processing_time: number
  model_used: string
}

export class OpenAISkillsExtractor {
  
  /**
   * Extract skills from occupation data using OpenAI
   */
  async extractSkills(context: {
    title: string
    description: string
    tasks?: string[]
    onetSkills?: any[]
    cosPrograms?: string[]
    cosCertifications?: string[]
    lightcastSkills?: any[]
  }): Promise<SkillsExtractionResult> {
    const startTime = Date.now()

    try {
      // Build rich context for OpenAI
      const contextText = this.buildContext(context)

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert workforce analyst specializing in skills taxonomy and job requirements analysis.

Your task: Analyze occupation data from multiple sources (O*NET, CareerOneStop) and extract 15-25 specific, measurable job skills.

CONTEXT SOURCES:
- O*NET: Government occupation data with validated skills
- CareerOneStop: Real training programs and certifications that indicate required skills
- Use training programs and certifications to infer practical, industry-relevant skills

SKILL ABSTRACTION RULES (CRITICAL):
- Use CATEGORY-LEVEL skills, not specific tools/frameworks
- ✅ GOOD: "Frontend Development", "Cloud Infrastructure", "Database Management"
- ❌ BAD: "React.js", "AWS Lambda", "PostgreSQL"
- ✅ GOOD: "Object-Oriented Programming", "API Development", "Version Control"
- ❌ BAD: "Python", "REST APIs", "Git"
- Exception: If a specific technology dominates the field (e.g., "SQL" for databases)

EXAMPLES:
- Training in "React, Vue, Angular" → Extract: "Frontend Framework Development"
- Certs in "AWS, Azure, GCP" → Extract: "Cloud Platform Management"
- Programs in "Python, Java, C++" → Extract: "Software Development"
- Certs in "Scrum, Kanban, SAFe" → Extract: "Agile Project Management"

PRIORITIZE:
- Technical competencies (e.g., "Software Development", "Database Design")
- Domain-specific knowledge (e.g., "Supply Chain Management", "Financial Analysis")
- Professional expertise (e.g., "Strategic Planning", "Risk Assessment")
- Methodology skills (e.g., "Agile Methodology", "DevOps Practices")
- Platform categories (e.g., "Cloud Infrastructure", "Container Orchestration")

AVOID:
- Specific programming languages (use "Software Development" instead)
- Specific cloud providers (use "Cloud Infrastructure" instead)
- Specific frameworks (use framework category instead)
- Generic soft skills (e.g., "Communication", "Teamwork")
- Basic abilities (e.g., "Reading", "Writing")

For each skill, provide:
1. skill: Category-level skill name (2-4 words)
2. description: Brief description including common tools/technologies as examples (1-2 sentences)
3. level: Proficiency level 1-10 (based on job requirements)
4. confidence: Confidence score 0-100 (how certain you are this skill is required)
5. knowledge_required: Array of related knowledge areas (optional)

Return ONLY valid JSON with this structure:
{
  "skills": [
    {
      "skill": "Software Development",
      "description": "Ability to design, write, and maintain software applications using languages like Python, Java, or JavaScript",
      "level": 8,
      "confidence": 95,
      "knowledge_required": ["Object-Oriented Programming", "Data Structures", "Algorithms"]
    },
    {
      "skill": "Cloud Infrastructure",
      "description": "Experience deploying and managing applications on cloud platforms such as AWS, Azure, or Google Cloud",
      "level": 7,
      "confidence": 85,
      "knowledge_required": ["Virtualization", "Networking", "Security"]
    }
  ]
}`
          },
          {
            role: 'user',
            content: contextText
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 2000
      })

      const result = JSON.parse(response.choices[0].message.content || '{"skills":[]}')

      return {
        skills: result.skills.map((skill: any) => ({
          ...skill,
          source: 'OPENAI',
          tasks: []
        })),
        processing_time: Date.now() - startTime,
        model_used: 'gpt-4o-mini'
      }

    } catch (error) {
      console.error('OpenAI skills extraction failed:', error)
      throw new Error(`Skills extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build rich context from all available data sources
   */
  private buildContext(context: {
    title: string
    description: string
    tasks?: string[]
    onetSkills?: any[]
    cosPrograms?: string[]
    cosCertifications?: string[]
    lightcastSkills?: any[]
  }): string {
    const parts: string[] = []

    parts.push(`OCCUPATION: ${context.title}`)
    parts.push(`\nDESCRIPTION: ${context.description}`)

    if (context.tasks && context.tasks.length > 0) {
      parts.push(`\nKEY TASKS:`)
      context.tasks.slice(0, 10).forEach((task, i) => {
        parts.push(`${i + 1}. ${task}`)
      })
    }

    if (context.onetSkills && context.onetSkills.length > 0) {
      parts.push(`\nO*NET SKILLS REFERENCE:`)
      context.onetSkills.slice(0, 15).forEach(skill => {
        parts.push(`- ${skill.name || skill.skill} (Importance: ${skill.importance || skill.level})`)
      })
    }

    if (context.cosPrograms && context.cosPrograms.length > 0) {
      parts.push(`\nAVAILABLE TRAINING PROGRAMS:`)
      context.cosPrograms.slice(0, 10).forEach(program => {
        parts.push(`- ${program}`)
      })
    }

    if (context.cosCertifications && context.cosCertifications.length > 0) {
      parts.push(`\nRELEVANT CERTIFICATIONS:`)
      context.cosCertifications.slice(0, 10).forEach(cert => {
        parts.push(`- ${cert}`)
      })
    }

    if (context.lightcastSkills && context.lightcastSkills.length > 0) {
      parts.push(`\nLIGHTCAST INDUSTRY SKILLS:`)
      context.lightcastSkills.slice(0, 15).forEach(skill => {
        parts.push(`- ${skill.name || skill.skill}`)
      })
    }

    return parts.join('\n')
  }

  /**
   * Check if OpenAI is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false
      }
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
export const openaiSkillsExtractor = new OpenAISkillsExtractor()
