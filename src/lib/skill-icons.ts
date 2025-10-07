import { 
  Code, 
  Database, 
  Palette, 
  TrendingUp, 
  BarChart, 
  Users, 
  MessageSquare,
  Briefcase,
  Target,
  Lightbulb,
  FileText,
  Settings,
  Globe,
  Heart,
  Shield,
  Zap,
  BookOpen,
  Calculator,
  Microscope,
  Stethoscope,
  Scale,
  Gavel,
  DollarSign,
  PieChart,
  LineChart,
  Cpu,
  Network,
  Server,
  Cloud,
  Lock,
  Key,
  Search,
  Edit,
  PenTool,
  Camera,
  Video,
  Music,
  Headphones,
  Languages,
  GraduationCap,
  type LucideIcon
} from 'lucide-react'

// Comprehensive skill-to-icon mapping
const skillKeywords: Array<{ keywords: string[], icon: LucideIcon }> = [
  // Programming & Development
  { keywords: ['programming', 'coding', 'developer', 'software', 'web development', 'frontend', 'backend'], icon: Code },
  { keywords: ['database', 'sql', 'mysql', 'postgresql', 'mongodb', 'data storage'], icon: Database },
  { keywords: ['server', 'backend', 'api', 'rest', 'graphql'], icon: Server },
  { keywords: ['cloud', 'aws', 'azure', 'gcp', 'devops'], icon: Cloud },
  { keywords: ['network', 'networking', 'tcp/ip', 'routing'], icon: Network },
  { keywords: ['computer', 'hardware', 'cpu', 'processor'], icon: Cpu },
  { keywords: ['security', 'cybersecurity', 'encryption', 'infosec'], icon: Lock },
  { keywords: ['authentication', 'authorization', 'access control'], icon: Key },
  
  // Data & Analytics
  { keywords: ['data', 'analytics', 'analysis', 'insights', 'metrics'], icon: BarChart },
  { keywords: ['statistics', 'statistical', 'quantitative'], icon: LineChart },
  { keywords: ['reporting', 'dashboard', 'visualization'], icon: PieChart },
  { keywords: ['research', 'investigation', 'study'], icon: Search },
  { keywords: ['math', 'mathematics', 'calculation', 'algebra'], icon: Calculator },
  
  // Design & Creative
  { keywords: ['design', 'designer', 'visual', 'aesthetic'], icon: Palette },
  { keywords: ['ui', 'user interface', 'interface design'], icon: PenTool },
  { keywords: ['ux', 'user experience', 'usability'], icon: Users },
  { keywords: ['graphic', 'graphics', 'illustration'], icon: Edit },
  { keywords: ['photo', 'photography', 'image'], icon: Camera },
  { keywords: ['video', 'videography', 'film', 'multimedia'], icon: Video },
  { keywords: ['audio', 'sound', 'music production'], icon: Music },
  
  // Business & Management
  { keywords: ['business', 'enterprise', 'commercial'], icon: Briefcase },
  { keywords: ['management', 'manager', 'managing', 'administration'], icon: Briefcase },
  { keywords: ['project', 'project management', 'planning', 'coordination'], icon: Target },
  { keywords: ['leadership', 'leader', 'leading', 'supervision'], icon: Users },
  { keywords: ['team', 'teamwork', 'collaboration', 'cooperative'], icon: Users },
  { keywords: ['strategy', 'strategic', 'planning'], icon: Target },
  { keywords: ['finance', 'financial', 'accounting', 'budget'], icon: DollarSign },
  { keywords: ['marketing', 'market', 'promotion', 'advertising'], icon: TrendingUp },
  { keywords: ['sales', 'selling', 'revenue'], icon: TrendingUp },
  
  // Communication & Language
  { keywords: ['communication', 'communicating', 'interpersonal'], icon: MessageSquare },
  { keywords: ['writing', 'written', 'documentation', 'content'], icon: FileText },
  { keywords: ['presentation', 'presenting', 'public speaking'], icon: MessageSquare },
  { keywords: ['english', 'language', 'linguistic', 'translation', 'bilingual'], icon: Languages },
  { keywords: ['education', 'teaching', 'training', 'instruction'], icon: GraduationCap },
  { keywords: ['customer', 'customer service', 'service', 'client'], icon: Users },
  { keywords: ['personnel', 'human resources', 'hr', 'recruiting'], icon: Users },
  
  // Healthcare & Medical
  { keywords: ['healthcare', 'health', 'medical', 'medicine'], icon: Heart },
  { keywords: ['patient', 'patient care', 'clinical'], icon: Stethoscope },
  { keywords: ['nursing', 'nurse', 'care'], icon: Heart },
  { keywords: ['laboratory', 'lab', 'testing', 'diagnostic'], icon: Microscope },
  
  // Legal & Compliance
  { keywords: ['compliance', 'regulatory', 'regulation'], icon: Shield },
  { keywords: ['legal', 'law', 'attorney', 'paralegal'], icon: Gavel },
  { keywords: ['policy', 'policies', 'governance'], icon: Shield },
  { keywords: ['audit', 'auditing', 'review'], icon: Scale },
  { keywords: ['risk', 'risk management', 'assessment'], icon: Shield },
  
  // General Skills
  { keywords: ['problem', 'problem solving', 'troubleshooting'], icon: Lightbulb },
  { keywords: ['critical thinking', 'analytical', 'reasoning'], icon: Lightbulb },
  { keywords: ['innovation', 'innovative', 'creative thinking'], icon: Zap },
  { keywords: ['technology', 'technical', 'tech'], icon: Settings },
  { keywords: ['digital', 'digitalization', 'online'], icon: Globe },
  { keywords: ['learning', 'study', 'academic'], icon: BookOpen },
]

export function getSkillIcon(skillName: string, category?: string): LucideIcon {
  if (!skillName) return Zap
  
  const skillNameLower = skillName.toLowerCase().trim()
  const categoryLower = category?.toLowerCase().trim() || ''
  
  // First, try to match against skill name only (more specific)
  for (const { keywords, icon } of skillKeywords) {
    for (const keyword of keywords) {
      if (skillNameLower.includes(keyword.toLowerCase())) {
        return icon
      }
    }
  }
  
  // Then try category if no skill name match
  if (categoryLower) {
    for (const { keywords, icon } of skillKeywords) {
      for (const keyword of keywords) {
        if (categoryLower.includes(keyword.toLowerCase())) {
          return icon
        }
      }
    }
  }
  
  // Default icon for unmatched skills
  return Zap
}
