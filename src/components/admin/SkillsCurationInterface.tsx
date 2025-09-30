'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Shield,
  TrendingUp,
  Info,
  Save,
  RefreshCw
} from 'lucide-react'
import { 
  getSkillsBySocCode, 
  validateSkillsWithONET, 
  analyzeSkillRelevance,
  saveCuratedSkills,
  type SkillRelevanceScore 
} from '@/lib/services/lightcast-skills'

interface SkillsCurationInterfaceProps {
  socCode: string
  onSkillsSelected: (skillIds: string[]) => void
  initialSelectedSkills?: string[]
  readOnly?: boolean
}

export default function SkillsCurationInterface({
  socCode,
  onSkillsSelected,
  initialSelectedSkills = [],
  readOnly = false
}: SkillsCurationInterfaceProps) {
  const [allSkills, setAllSkills] = useState<SkillRelevanceScore[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialSelectedSkills)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [filterType, setFilterType] = useState<'all' | 'recommended' | 'technical' | 'validated'>('all')

  useEffect(() => {
    loadSkillsForCuration()
  }, [socCode])

  const loadSkillsForCuration = async () => {
    try {
      setLoading(true)
      
      // Step 1: Get Lightcast skills for SOC code
      const lightcastSkills = await getSkillsBySocCode(socCode, 30)
      
      // Step 2: Validate with O*NET
      const validatedSkills = await validateSkillsWithONET(lightcastSkills, socCode)
      
      // Step 3: AI relevance analysis
      const analyzedSkills = await analyzeSkillRelevance(validatedSkills)
      
      setAllSkills(analyzedSkills)
      
    } catch (error) {
      console.error('Failed to load skills for curation:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSkills = allSkills.filter(skillScore => {
    // Search filter
    if (searchTerm && !skillScore.skill.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    // Type filter
    switch (filterType) {
      case 'recommended':
        return skillScore.recommendedForAssessment
      case 'technical':
        return skillScore.skill.type.name === 'Hard Skill' || 
               skillScore.skill.type.name === 'Software' ||
               skillScore.skill.type.name === 'Technology'
      case 'validated':
        return skillScore.onetValidation
      default:
        return true
    }
  })

  const handleSkillToggle = (skillId: string) => {
    if (readOnly) return
    
    const newSelected = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId]
    
    setSelectedSkills(newSelected)
    onSkillsSelected(newSelected)
  }

  const handleSaveCuration = async () => {
    try {
      await saveCuratedSkills(socCode, selectedSkills, 'current-admin-user')
      // Show success message
    } catch (error) {
      console.error('Failed to save curation:', error)
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    if (score >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getMarketDemandColor = (demand: string) => {
    switch (demand) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'moderate': return 'bg-yellow-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading Lightcast skills and O*NET validation...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Skills Curation for {socCode}</h2>
          <p className="text-gray-600">
            Lightcast Open Skills + O*NET Validation • Select 5-8 skills for assessment
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50">
            <Sparkles className="h-3 w-3 mr-1" />
            Lightcast Taxonomy
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            <Shield className="h-3 w-3 mr-1" />
            O*NET Validated
          </Badge>
        </div>
      </div>

      {/* Selection Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">{selectedSkills.length}/8</span> skills selected
              </div>
              <Progress value={(selectedSkills.length / 8) * 100} className="w-32" />
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadSkillsForCuration}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleSaveCuration} disabled={selectedSkills.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Curation
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['all', 'recommended', 'technical', 'validated'].map((filter) => (
            <Button
              key={filter}
              variant={filterType === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(filter as any)}
            >
              <Filter className="h-3 w-3 mr-1" />
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid gap-4">
        {filteredSkills.map((skillScore) => {
          const isSelected = selectedSkills.includes(skillScore.skill.id)
          
          return (
            <Card 
              key={skillScore.skill.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${readOnly ? 'cursor-default' : ''}`}
              onClick={() => handleSkillToggle(skillScore.skill.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                        )}
                        <h3 className="font-semibold">{skillScore.skill.name}</h3>
                      </div>
                      
                      <div className="flex gap-1">
                        {skillScore.onetValidation && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Shield className="h-3 w-3 mr-1" />
                            O*NET
                          </Badge>
                        )}
                        {skillScore.recommendedForAssessment && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Recommended
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {skillScore.skill.type.name}
                        </Badge>
                      </div>
                    </div>
                    
                    {skillScore.skill.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {skillScore.skill.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">Relevance Score</div>
                        <div className="flex items-center gap-2">
                          <Progress value={skillScore.relevanceScore} className="flex-1" />
                          <span className="text-xs font-mono">{skillScore.relevanceScore}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">Market Demand</div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getMarketDemandColor(skillScore.marketDemand)}`} />
                          <span className="text-xs capitalize">{skillScore.marketDemand}</span>
                          {skillScore.marketDemand === 'high' && <TrendingUp className="h-3 w-3 text-green-600" />}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">Assessment Value</div>
                        <Badge className={getRelevanceColor(skillScore.relevanceScore)} variant="outline">
                          {skillScore.relevanceScore >= 80 ? 'Excellent' :
                           skillScore.relevanceScore >= 60 ? 'Good' :
                           skillScore.relevanceScore >= 40 ? 'Fair' : 'Poor'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">AI Reasoning</div>
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600 truncate">
                            {skillScore.aiReasoning}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSkills.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No skills found matching your criteria</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Skills Summary */}
      {selectedSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Skills Summary</CardTitle>
            <CardDescription>
              These skills will be used for assessment generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map(skillId => {
                const skillScore = allSkills.find(s => s.skill.id === skillId)
                if (!skillScore) return null
                
                return (
                  <Badge key={skillId} variant="outline" className="bg-blue-50">
                    {skillScore.skill.name}
                    {!readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSkillToggle(skillId)
                        }}
                        className="ml-2 hover:text-red-600"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
