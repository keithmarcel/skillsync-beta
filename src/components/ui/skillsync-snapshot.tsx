'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label, Pie, PieChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ThumbsUp, Mail, RefreshCw, Target, TrendingUp, Award, Zap } from "lucide-react"
import Link from "next/link"

interface SnapshotMetrics {
  rolesReadyFor: number
  overallRoleReadiness: number
  skillsIdentified: number
  gapsHighlighted: number
  pendingInvitations: number
  assessmentsCompleted: number
}

interface SkillData {
  proficient: number
  building: number
  needsDevelopment: number
}

interface AssessmentProgress {
  date: string
  score: number
  role: string
}

interface SkillSyncSnapshotProps {
  hasAssessments: boolean
  metrics?: SnapshotMetrics
  skillData?: SkillData
  assessmentProgress?: AssessmentProgress[]
}

export function SkillSyncSnapshot({ hasAssessments, metrics, skillData, assessmentProgress }: SkillSyncSnapshotProps) {
  if (!hasAssessments) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Your SkillSync Snapshot</h2>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Complete your first skills assessment to see your personalized snapshot and career readiness insights.
            </p>
            <Button asChild>
              <Link href="/jobs">Take Your First Assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const defaultMetrics: SnapshotMetrics = {
    rolesReadyFor: 0,
    overallRoleReadiness: 0,
    skillsIdentified: 0,
    gapsHighlighted: 0,
    pendingInvitations: 0,
    assessmentsCompleted: 0
  }

  const defaultSkillData: SkillData = {
    proficient: 0,
    building: 0,
    needsDevelopment: 0
  }

  const finalMetrics = metrics || defaultMetrics
  const finalSkillData = skillData || defaultSkillData

  // Calculate skill mastery percentage
  const totalSkills = finalSkillData.proficient + finalSkillData.building + finalSkillData.needsDevelopment
  const masteryPercentage = totalSkills > 0 ? Math.round((finalSkillData.proficient / totalSkills) * 100) : 0

  // Skill breakdown data for horizontal bar chart
  const skillBreakdownData = [
    { 
      category: "Proficient", 
      count: finalSkillData.proficient,
      fill: "#10B981" // Green
    },
    { 
      category: "Building", 
      count: finalSkillData.building,
      fill: "#F59E0B" // Orange
    },
    { 
      category: "Developing", 
      count: finalSkillData.needsDevelopment,
      fill: "#0694A2" // Teal
    }
  ]

  const chartConfig = {
    count: {
      label: "Skills",
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Your SkillSync Snapshot</h2>
      
      {/* Metrics Cards - 4 Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Roles You're Ready For</p>
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">{finalMetrics.rolesReadyFor}</div>
            <p className="text-xs text-muted-foreground">Jobs matching your skills</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Assessments Completed</p>
              <Award className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">{finalMetrics.assessmentsCompleted}</div>
            <p className="text-xs text-muted-foreground">Roles you've evaluated</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Pending Invitations</p>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">{finalMetrics.pendingInvitations}</div>
            <p className="text-xs text-muted-foreground">Employer opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Skill Mastery</p>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">{masteryPercentage}%</div>
            <p className="text-xs text-muted-foreground">Skills at proficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Skill Proficiency Chart - Dark Theme */}
      <div className="rounded-[10px] border border-[#E5E5E5] shadow-sm overflow-hidden" style={{
        background: 'linear-gradient(180deg, #002E3E 0%, #111928 100%)'
      }}>
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-white font-semibold text-lg mb-6">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Your Skill Proficiency
          </h3>
          
          {totalSkills > 0 ? (
            <div className="flex items-center max-w-5xl mx-auto">
              {/* Pie Chart */}
              <div className="w-[380px] h-[320px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={130}
                      dataKey="count"
                      nameKey="category"
                      paddingAngle={2}
                    >
                      {skillBreakdownData.map((entry, index) => (
                        <rect key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="central"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) - 12}
                                  className="fill-white text-3xl font-bold"
                                  textAnchor="middle"
                                >
                                  {totalSkills}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 16}
                                  className="fill-gray-300 text-sm"
                                  textAnchor="middle"
                                >
                                  Total Skills
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percentage = Math.round((data.count / totalSkills) * 100);
                          const descriptions = {
                            'Proficient': 'You meet or exceed expectations. Ready to apply for roles requiring these skills.',
                            'Building': 'Foundational knowledge present. Consider training or hands-on experience.',
                            'Developing': 'Early stage skills. Focus on courses or mentorship in these areas.'
                          };
                          
                          return (
                            <div className="bg-gray-800 p-4 border border-gray-600 rounded-lg shadow-xl max-w-xs opacity-100 transition-opacity duration-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
                                <span className="font-semibold text-white">{data.category}</span>
                              </div>
                              <p className="text-white text-lg font-bold mb-1">
                                {data.count} skills ({percentage}% of total)
                              </p>
                              <p className="text-xs text-gray-300 leading-relaxed">
                                {descriptions[data.category as keyof typeof descriptions]}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                      animationDuration={200}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Right Column: Heading, Summary, and Legend */}
              <div className="flex flex-col justify-center flex-1">
                {/* Heading */}
                <h4 className="text-white font-semibold text-xl mb-3">
                  Your {totalSkills} Skills by Proficiency Level
                </h4>
                
                {/* Encouraging summary - Dynamic based on data */}
                <p className="text-gray-300 text-base leading-relaxed mb-6">
                  {(() => {
                    const proficientCount = skillBreakdownData.find(s => s.category === 'Proficient')?.count || 0;
                    const buildingCount = skillBreakdownData.find(s => s.category === 'Building')?.count || 0;
                    const developingCount = skillBreakdownData.find(s => s.category === 'Developing')?.count || 0;
                    const proficientPct = Math.round((proficientCount / totalSkills) * 100);
                    
                    if (proficientPct >= 60) {
                      return `Excellent work! You're proficient in ${proficientCount} skills (${proficientPct}% of total). You're well-positioned for roles requiring these competencies.`;
                    } else if (proficientPct >= 40) {
                      return `You're showing strong proficiency in ${proficientCount} skills! Keep building on your strengths while developing the remaining ${buildingCount + developingCount} areas to unlock even more opportunities.`;
                    } else if (buildingCount > 0) {
                      return `You're making solid progress with ${buildingCount} skills in development. Focus on moving these to proficiency to significantly expand your career options.`;
                    } else {
                      return `You're at the beginning of your skill journey! Focus on building proficiency in your developing skills to open up more career opportunities.`;
                    }
                  })()}
                </p>
                
                {/* Legend - Inline */}
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  {skillBreakdownData.map((item) => {
                    const percentage = Math.round((item.count / totalSkills) * 100);
                    return (
                      <div key={item.category} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }}></div>
                        <span className="text-sm text-gray-300">{item.category}</span>
                        <span className="text-sm font-semibold text-white">{item.count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No skill data yet</h3>
              <p className="text-gray-300 text-center mb-6 max-w-md">
                Complete an assessment to see your skill breakdown and proficiency levels.
              </p>
              <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#114B5F' }} asChild>
                <Link href="/jobs">Take an Assessment</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
