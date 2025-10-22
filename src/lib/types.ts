export type Database = {
  public: {
    Tables: {
      assessments: {
        Row: {
          id: string
          user_id: string | null
          job_id: string | null
          method: 'quiz'
          analyzed_at: string | null
          readiness_pct: number | null
          status_tag: 'role_ready' | 'close_gaps' | 'needs_development' | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          job_id?: string | null
          method: 'quiz'
          analyzed_at?: string | null
          readiness_pct?: number | null
          status_tag?: 'role_ready' | 'close_gaps' | 'needs_development' | null
        }
        Update: {
          id?: string
          user_id?: string | null
          job_id?: string | null
          method?: 'quiz'
          analyzed_at?: string | null
          readiness_pct?: number | null
          status_tag?: 'role_ready' | 'close_gaps' | 'needs_development' | null
        }
      }
      assessment_skill_results: {
        Row: {
          assessment_id: string
          skill_id: string
          score_pct: number
          band: 'proficient' | 'building' | 'needs_dev'
        }
        Insert: {
          assessment_id: string
          skill_id: string
          score_pct: number
          band: 'proficient' | 'building' | 'needs_dev'
        }
        Update: {
          assessment_id?: string
          skill_id?: string
          score_pct?: number
          band?: 'proficient' | 'building' | 'needs_dev'
        }
      }
      jobs: {
        Row: {
          id: string
          job_kind: 'featured_role' | 'occupation'
          title: string
          soc_code: string | null
          company_id: string | null
          job_type: string | null
          category: string | null
          location_city: string | null
          location_state: string | null
          median_wage_usd: number | null
          long_desc: string | null
          featured_image_url: string | null
          skills_count: number | null
        }
        Insert: {
          id?: string
          job_kind: 'featured_role' | 'occupation'
          title: string
          soc_code?: string | null
          company_id?: string | null
          job_type?: string | null
          category?: string | null
          location_city?: string | null
          location_state?: string | null
          median_wage_usd?: number | null
          long_desc?: string | null
          featured_image_url?: string | null
          skills_count?: number | null
        }
        Update: {
          id?: string
          job_kind?: 'featured_role' | 'occupation'
          title?: string
          soc_code?: string | null
          company_id?: string | null
          job_type?: string | null
          category?: string | null
          location_city?: string | null
          location_state?: string | null
          median_wage_usd?: number | null
          long_desc?: string | null
          featured_image_url?: string | null
          skills_count?: number | null
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          onet_id: string | null
          category: string | null
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          onet_id?: string | null
          category?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          onet_id?: string | null
          category?: string | null
          description?: string | null
        }
      }
      programs: {
        Row: {
          id: string
          school_id: string | null
          name: string
          program_type: string | null
          format: string | null
          duration_text: string | null
          short_desc: string | null
          program_url: string | null
          cip_code: string | null
        }
        Insert: {
          id?: string
          school_id?: string | null
          name: string
          program_type?: string | null
          format?: string | null
          duration_text?: string | null
          short_desc?: string | null
          program_url?: string | null
          cip_code?: string | null
        }
        Update: {
          id?: string
          school_id?: string | null
          name?: string
          program_type?: string | null
          format?: string | null
          duration_text?: string | null
          short_desc?: string | null
          program_url?: string | null
          cip_code?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          is_trusted_partner: boolean | null
          hq_city: string | null
          hq_state: string | null
          revenue_range: string | null
          employee_range: string | null
          industry: string | null
          bio: string | null
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          is_trusted_partner?: boolean | null
          hq_city?: string | null
          hq_state?: string | null
          revenue_range?: string | null
          employee_range?: string | null
          industry?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          is_trusted_partner?: boolean | null
          hq_city?: string | null
          hq_state?: string | null
          revenue_range?: string | null
          employee_range?: string | null
          industry?: string | null
          bio?: string | null
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          about_url: string | null
          city: string | null
          state: string | null
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          about_url?: string | null
          city?: string | null
          state?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          about_url?: string | null
          city?: string | null
          state?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          zip: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          zip?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          zip?: string | null
          avatar_url?: string | null
        }
      }
      favorites: {
        Row: {
          user_id: string
          entity_kind: 'job' | 'program'
          entity_id: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          entity_kind: 'job' | 'program'
          entity_id: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          entity_kind?: 'job' | 'program'
          entity_id?: string
          created_at?: string | null
        }
      }
    }
  }
}

export type Band = 'proficient' | 'building' | 'needs_dev'
export type JobKind = 'featured_role' | 'occupation'
export type AssessmentMethod = 'quiz'
export type StatusTag = 'role_ready' | 'close_gaps' | 'needs_development'

export interface SkillResult {
  skill_id: string
  skill_name: string
  score_pct: number
  band: Band
}

export interface AssessmentData {
  id: string
  job_title: string
  job_kind: JobKind
  method: AssessmentMethod
  readiness_pct: number
  status_tag: StatusTag
  analyzed_at: string
  skill_results: SkillResult[]
}
