'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label, Pie, PieChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ThumbsUp, BarChartHorizontal, Layers3, SquareSplitHorizontal } from "lucide-react"
import Link from "next/link"

interface SnapshotMetrics {
  rolesReadyFor: number
  overallRoleReadiness: number
  skillsIdentified: number
  gapsHighlighted: number
}

interface SkillData {
  proficient: number
  building: number
  needsDevelopment: number
}

interface SkillSyncSnapshotProps {
  hasAssessments: boolean
  metrics?: SnapshotMetrics
  skillData?: SkillData
}

export function SkillSyncSnapshot({ hasAssessments, metrics, skillData }: SkillSyncSnapshotProps) {
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
    gapsHighlighted: 0
  }

  const defaultSkillData: SkillData = {
    proficient: 0,
    building: 0,
    needsDevelopment: 0
  }

  const finalMetrics = metrics || defaultMetrics
  const finalSkillData = skillData || defaultSkillData

  const chartData = [
    { skill: "proficient", count: finalSkillData.proficient, fill: "#10B981" },
    { skill: "building", count: finalSkillData.building, fill: "#F59E0B" },
    { skill: "needsDevelopment", count: finalSkillData.needsDevelopment, fill: "#EF4444" }
  ]

  const chartConfig = {
    count: {
      label: "Skills",
    },
    proficient: {
      label: "Proficient",
      color: "#10B981",
    },
    building: {
      label: "Building Proficiency", 
      color: "#F59E0B",
    },
    needsDevelopment: {
      label: "Needs Development",
      color: "#EF4444",
    },
  } satisfies ChartConfig

  const totalSkills = finalSkillData.proficient + finalSkillData.building + finalSkillData.needsDevelopment

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Your SkillSync Snapshot</h2>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Roles You're Ready For</p>
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{finalMetrics.rolesReadyFor}</div>
            <p className="text-xs text-muted-foreground">Jobs you've shown proficiency in</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Overall Role Readiness %</p>
              <BarChartHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{finalMetrics.overallRoleReadiness}%</div>
            <p className="text-xs text-muted-foreground">Avg across roles you've assessed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Skills Identified</p>
              <Layers3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{finalMetrics.skillsIdentified}</div>
            <p className="text-xs text-muted-foreground">Strengths we've mapped to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Gaps Highlighted</p>
              <SquareSplitHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{finalMetrics.gapsHighlighted}</div>
            <p className="text-xs text-muted-foreground">Opportunities to grow</p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Proficiency Breakdown */}
      <div className="flex flex-col gap-4 p-6 rounded-[10px] border border-[#E5E5E5] shadow-sm" style={{
        background: 'linear-gradient(180deg, #002E3E 0%, #111928 100%)'
      }}>
        <div className="flex justify-center">
          <div className="flex gap-3">
            {/* Pie Chart Column */}
            <div className="flex flex-col items-center">
              {totalSkills > 0 ? (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[300px] w-[300px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="skill"
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-white text-3xl font-bold"
                                >
                                  {totalSkills.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-gray-300 text-sm"
                                >
                                  Skills Assessed
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-800 rounded-lg">
                  <p className="text-gray-300">No skill data available</p>
                </div>
              )}
            </div>

            {/* Content Column */}
            <div className="flex flex-col">
              {/* Copy */}
              <div>
                <h4 className="font-bold text-white text-sm leading-5 mb-1">Keep building momentum.</h4>
                <p className="text-white text-sm font-medium leading-5">
                  You already meet expectations in several core areas and a few more could push you to the next level.
                </p>
              </div>
              
              {/* Alert Cards with 24px gap from copy */}
              <div className="mt-6 space-y-2">
                <Alert className="border-gray-600 bg-transparent">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <AlertTitle className="text-white font-medium text-sm">Your Strongest Skill Area</AlertTitle>
                  <AlertDescription className="text-gray-300 text-sm">Strategic Planning • 90%</AlertDescription>
                </Alert>
                
                <Alert className="border-gray-600 bg-transparent">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <AlertTitle className="text-white font-medium text-sm">Skill Nearest to Proficiency</AlertTitle>
                  <AlertDescription className="text-gray-300 text-sm">Data Analysis • 65%</AlertDescription>
                </Alert>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="border-gray-400 text-gray-300 hover:bg-gray-700 bg-transparent">
                  View jobs with this skill
                </Button>
                <Button variant="outline" size="sm" className="border-gray-400 text-gray-300 hover:bg-gray-700 bg-transparent">
                  View program matches
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
