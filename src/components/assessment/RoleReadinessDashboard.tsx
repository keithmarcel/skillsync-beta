'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BookOpen, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Star,
  Award
} from 'lucide-react'
import { type RoleReadinessScore, type SkillProficiency } from '@/lib/services/assessment-engine'
import { type EducationRecommendation } from '@/lib/services/education-matching'

interface RoleReadinessDashboardProps {
  userId: string
  roleId: string
  roleReadiness: RoleReadinessScore
  educationRecommendations: EducationRecommendation
  onRetakeAssessment?: () => void
  onEnrollProgram?: (programId: string) => void
}

export default function RoleReadinessDashboard({
  userId,
  roleId,
  roleReadiness,
  educationRecommendations,
  onRetakeAssessment,
  onEnrollProgram
}: RoleReadinessDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'Highly Qualified': return 'bg-green-100 text-green-800 border-green-200'
      case 'Ready': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Developing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Not Ready': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSkillStatusIcon = (status: string) => {
    switch (status) {
      case 'Exceeds': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'Meets': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'Developing': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'Gap': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'Important': return 'bg-orange-100 text-orange-800'
      case 'Helpful': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Readiness Assessment</h1>
            <p className="text-gray-600 mt-1">Your personalized pathway to career success</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">
              {Math.round(roleReadiness.overallProficiency)}%
            </div>
            <Badge className={`${getReadinessColor(roleReadiness.roleReadiness)} mt-2`}>
              {roleReadiness.roleReadiness}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="education">Learning Path</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Overall Proficiency */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Overall Proficiency</CardTitle>
                <CardDescription>Your current skill level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={roleReadiness.overallProficiency} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current</span>
                    <span className="font-medium">{Math.round(roleReadiness.overallProficiency)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strength Areas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Strengths
                </CardTitle>
                <CardDescription>Skills where you excel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roleReadiness.strengthAreas.slice(0, 3).map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{skill}</span>
                    </div>
                  ))}
                  {roleReadiness.strengthAreas.length === 0 && (
                    <p className="text-sm text-gray-500">Take assessment to identify strengths</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time to Ready */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Time to Ready
                </CardTitle>
                <CardDescription>Estimated learning timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {roleReadiness.estimatedTimeToReady}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    With focused learning
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Next Steps</CardTitle>
              <CardDescription>Prioritized actions to improve your role readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roleReadiness.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6">
                {onRetakeAssessment && (
                  <Button onClick={onRetakeAssessment} variant="outline">
                    Retake Assessment
                  </Button>
                )}
                <Button onClick={() => setActiveTab('education')}>
                  View Learning Path
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Analysis Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Skills Breakdown</CardTitle>
              <CardDescription>Your proficiency level for each required skill</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleReadiness.skillProficiencies.map((skill, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getSkillStatusIcon(skill.status)}
                        <div>
                          <h4 className="font-medium">{skill.skillName}</h4>
                          <p className="text-sm text-gray-600">
                            Importance: {skill.importance.toFixed(1)}/5.0
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        skill.status === 'Exceeds' ? 'border-green-200 text-green-800' :
                        skill.status === 'Meets' ? 'border-blue-200 text-blue-800' :
                        skill.status === 'Developing' ? 'border-yellow-200 text-yellow-800' :
                        'border-red-200 text-red-800'
                      }>
                        {skill.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Level</span>
                        <span className="font-medium">{Math.round(skill.currentLevel)}%</span>
                      </div>
                      <Progress value={skill.currentLevel} className="h-2" />
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Required: {skill.requiredLevel}%</span>
                        {skill.gap > 0 && (
                          <span className="text-red-600">Gap: {Math.round(skill.gap)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gap Analysis Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Critical Gaps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-700">Critical Gaps</CardTitle>
                <CardDescription>Must address for role readiness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roleReadiness.criticalGaps.length > 0 ? (
                    roleReadiness.criticalGaps.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{skill}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">No critical gaps!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Development Areas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-yellow-700">Development Areas</CardTitle>
                <CardDescription>Skills to strengthen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roleReadiness.developmentAreas.length > 0 ? (
                    roleReadiness.developmentAreas.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">{skill}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">All skills meet requirements!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Identified Gaps Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Gap Summary</CardTitle>
                <CardDescription>Overview of skill gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {educationRecommendations.identifiedGaps.slice(0, 3).map((gap, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{gap.skillName}</span>
                      <Badge className={getPriorityColor(gap.priority)}>
                        {gap.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Education Path Tab */}
        <TabsContent value="education" className="space-y-6">
          {/* Learning Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recommended Learning Path
              </CardTitle>
              <CardDescription>
                Personalized program recommendations based on your skill gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {educationRecommendations.recommendedPrograms.map((rec, index) => (
                  <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{rec.program.name}</CardTitle>
                          <CardDescription>{rec.program.provider}</CardDescription>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {Math.round(rec.overallMatch)}% match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Gap Coverage</span>
                          <span className="font-medium">{Math.round(rec.gapCoverage)}%</span>
                        </div>
                        <Progress value={rec.gapCoverage} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {rec.program.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${rec.program.cost.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <strong>Expected improvement:</strong> +{Math.round(rec.expectedImprovement)}%
                      </div>
                      
                      <div className="text-sm text-blue-600 font-medium">
                        {rec.timeToRoleReady}
                      </div>
                      
                      {onEnrollProgram && (
                        <Button 
                          className="w-full mt-3" 
                          onClick={() => onEnrollProgram(rec.program.id)}
                        >
                          Learn More
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Learning Sequence */}
              {educationRecommendations.recommendedSequence.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-3">Recommended Learning Sequence</h4>
                  <div className="space-y-2">
                    {educationRecommendations.recommendedSequence.map((step, index) => {
                      const program = educationRecommendations.recommendedPrograms
                        .find(p => p.program.id === step.programId)?.program
                      
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                            {step.order}
                          </div>
                          <div>
                            <span className="font-medium">{program?.name}</span>
                            <p className="text-sm text-gray-600">{step.reasoning}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span>Total Timeline:</span>
                      <span className="font-medium">{educationRecommendations.estimatedTimeline}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Total Investment:</span>
                      <span className="font-medium">${educationRecommendations.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
