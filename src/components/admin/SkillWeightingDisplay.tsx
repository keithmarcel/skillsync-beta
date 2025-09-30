'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Brain, 
  BarChart3, 
  Settings,
  Eye,
  AlertTriangle
} from 'lucide-react'

interface SkillWeightingData {
  id: string
  name: string
  category: string
  onetImportance: number        // 1-5 O*NET baseline
  marketAdjustment: number      // Real-time demand multiplier  
  companyWeight: number         // Organization-specific importance
  finalWeight: number           // Calculated assessment weight
  difficultyLevel: string       // Dynamic difficulty assignment
  questionCount: number         // Questions allocated to this skill
  performanceCorrelation: number // Historical success rate
  marketDemand: string          // Current market demand level
  salaryImpact: string          // Salary correlation
  trendDirection: 'rising' | 'stable' | 'declining'
  proficiencyThreshold: number  // Required proficiency percentage
}

interface SkillWeightingDisplayProps {
  skills: SkillWeightingData[]
  onWeightingChange?: (skillId: string, newWeighting: Partial<SkillWeightingData>) => void
  readOnly?: boolean
  showMarketIntelligence?: boolean
}

export default function SkillWeightingDisplay({ 
  skills, 
  onWeightingChange, 
  readOnly = false,
  showMarketIntelligence = true 
}: SkillWeightingDisplayProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const getImportanceColor = (importance: number) => {
    if (importance >= 4.0) return 'bg-red-100 text-red-800 border-red-200'
    if (importance >= 3.0) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (importance >= 2.0) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getImportanceLabel = (importance: number) => {
    if (importance >= 4.0) return 'Critical'
    if (importance >= 3.0) return 'Important'
    if (importance >= 2.0) return 'Helpful'
    return 'Basic'
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800'
      case 'advanced': return 'bg-blue-100 text-blue-800'
      case 'intermediate': return 'bg-green-100 text-green-800'
      case 'basic': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
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

  const handleWeightingChange = (skillId: string, field: string, value: number) => {
    if (onWeightingChange && !readOnly) {
      onWeightingChange(skillId, { [field]: value })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Skills Weighting & Intelligence</h2>
          <p className="text-gray-600">
            O*NET baseline + market intelligence + company customization
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50">
            <Brain className="h-3 w-3 mr-1" />
            AI-Driven Scaling
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            <BarChart3 className="h-3 w-3 mr-1" />
            Market Intelligence
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Skills Overview</TabsTrigger>
          <TabsTrigger value="weighting">Weighting Controls</TabsTrigger>
          <TabsTrigger value="intelligence">Market Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {skills.map((skill) => (
              <Card key={skill.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <CardDescription>{skill.category}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getImportanceColor(skill.finalWeight)}>
                        {getImportanceLabel(skill.finalWeight)}
                      </Badge>
                      <Badge className={getDifficultyColor(skill.difficultyLevel)}>
                        {skill.difficultyLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">O*NET Importance</div>
                      <div className="flex items-center gap-2">
                        <Progress value={skill.onetImportance * 20} className="flex-1" />
                        <span className="text-sm font-mono">{skill.onetImportance}/5.0</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Market Demand</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getMarketDemandColor(skill.marketDemand)}`} />
                        <span className="text-sm capitalize">{skill.marketDemand}</span>
                        {getTrendIcon(skill.trendDirection)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium">Questions Allocated</div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-mono">{skill.questionCount} questions</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium">Success Rate</div>
                      <div className="flex items-center gap-2">
                        <Progress value={skill.performanceCorrelation * 100} className="flex-1" />
                        <span className="text-sm font-mono">{Math.round(skill.performanceCorrelation * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Final Assessment Weight:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={skill.finalWeight * 20} className="w-20" />
                        <span className="font-mono font-medium">{skill.finalWeight}/5.0</span>
                      </div>
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSkill(skill.id)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Adjust Weighting
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View Questions
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weighting" className="space-y-4">
          {selectedSkill ? (
            <WeightingControls 
              skill={skills.find(s => s.id === selectedSkill)!}
              onUpdate={(updates) => handleWeightingChange(selectedSkill, 'companyWeight', updates.companyWeight || 0)}
              readOnly={readOnly}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a skill from the overview to adjust its weighting</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          {showMarketIntelligence && (
            <MarketIntelligencePanel skills={skills} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WeightingControls({ 
  skill, 
  onUpdate, 
  readOnly 
}: { 
  skill: SkillWeightingData
  onUpdate: (updates: Partial<SkillWeightingData>) => void
  readOnly: boolean
}) {
  const [companyWeight, setCompanyWeight] = useState(skill.companyWeight)
  const [proficiencyThreshold, setProficiencyThreshold] = useState(skill.proficiencyThreshold)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weighting Controls: {skill.name}</CardTitle>
        <CardDescription>
          Adjust company-specific importance and proficiency requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Company Importance Weight</label>
            <div className="mt-2">
              <Slider
                value={[companyWeight]}
                onValueChange={(value: number[]) => {
                  setCompanyWeight(value[0])
                  if (!readOnly) onUpdate({ companyWeight: value[0] })
                }}
                max={5}
                min={1}
                step={0.1}
                disabled={readOnly}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (1.0)</span>
                <span className="font-medium">{companyWeight.toFixed(1)}</span>
                <span>Critical (5.0)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Proficiency Threshold (%)</label>
            <div className="mt-2">
              <Slider
                value={[proficiencyThreshold]}
                onValueChange={(value: number[]) => {
                  setProficiencyThreshold(value[0])
                  if (!readOnly) onUpdate({ proficiencyThreshold: value[0] })
                }}
                max={100}
                min={50}
                step={5}
                disabled={readOnly}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Basic (50%)</span>
                <span className="font-medium">{proficiencyThreshold}%</span>
                <span>Expert (100%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Impact Preview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Final Weight:</span>
              <span className="ml-2 font-mono">{((skill.onetImportance * skill.marketAdjustment * companyWeight) / 3).toFixed(1)}/5.0</span>
            </div>
            <div>
              <span className="text-blue-700">Question Count:</span>
              <span className="ml-2 font-mono">{Math.round(companyWeight * 2)} questions</span>
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm">Save Changes</Button>
            <Button variant="outline" size="sm">Reset to Defaults</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MarketIntelligencePanel({ skills }: { skills: SkillWeightingData[] }) {
  const avgMarketAdjustment = skills.reduce((sum, s) => sum + s.marketAdjustment, 0) / skills.length
  const highDemandSkills = skills.filter(s => s.marketDemand === 'high' || s.marketDemand === 'critical')
  const risingSkills = skills.filter(s => s.trendDirection === 'rising')

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{risingSkills.length}</div>
                <div className="text-sm text-gray-600">Rising Demand Skills</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{highDemandSkills.length}</div>
                <div className="text-sm text-gray-600">High Demand Skills</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{avgMarketAdjustment.toFixed(1)}x</div>
                <div className="text-sm text-gray-600">Avg Market Multiplier</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Intelligence Summary</CardTitle>
          <CardDescription>
            Real-time market data influencing assessment difficulty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">High-Demand Skills (Critical for Friday Pitch)</h4>
              <div className="flex flex-wrap gap-2">
                {highDemandSkills.map(skill => (
                  <Badge key={skill.id} variant="outline" className="bg-red-50">
                    {skill.name} ({skill.marketDemand})
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Trending Skills</h4>
              <div className="flex flex-wrap gap-2">
                {risingSkills.map(skill => (
                  <Badge key={skill.id} variant="outline" className="bg-green-50">
                    {skill.name} <TrendingUp className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
