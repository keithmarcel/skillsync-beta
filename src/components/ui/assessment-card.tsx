import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Share, Eye, BookOpen, RotateCcw } from 'lucide-react'

interface AssessmentCardProps {
  id: string
  jobTitle: string
  jobType: 'Featured Role' | 'High Demand Occupation'
  readinessScore: number
  status: 'role_ready' | 'close_gaps' | 'needs_development'
  assessmentMethod: 'Skills Assessment' | 'Resume Upload'
  analyzedDate: string
  skillsGapsIdentified: number
  totalSkills: number
  specificGaps?: string[]
  reportHref: string
  className?: string
}

export function AssessmentCard({ 
  id,
  jobTitle,
  jobType,
  readinessScore,
  status,
  assessmentMethod,
  analyzedDate,
  skillsGapsIdentified,
  totalSkills,
  specificGaps,
  reportHref,
  className = ""
}: AssessmentCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'role_ready':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {readinessScore}% → Role Ready
          </Badge>
        )
      case 'close_gaps':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            {readinessScore}% → Close Gaps
          </Badge>
        )
      case 'needs_development':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {readinessScore}% → Needs Development
          </Badge>
        )
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'role_ready':
        return (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Recommend applying for this role or occupation</span>
          </div>
        )
      case 'close_gaps':
        return (
          <div className="space-y-2">
            {specificGaps && specificGaps.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
                <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Gaps: {specificGaps.join(', ')}</span>
              </div>
            )}
          </div>
        )
      case 'needs_development':
        return (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
            <RotateCcw className="w-4 h-4" />
            <span>Recommend retaking skills assessment</span>
          </div>
        )
    }
  }

  const getActionButton = () => {
    switch (status) {
      case 'role_ready':
        return (
          <Button 
            asChild
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <Link href={reportHref}>
              <Share className="w-4 h-4 mr-2" />
              Share Readiness Score
            </Link>
          </Button>
        )
      case 'close_gaps':
        return (
          <Button 
            asChild
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <Link href={`/program-matches/${id}`}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Program Matches →
            </Link>
          </Button>
        )
      case 'needs_development':
        return (
          <div className="space-y-2">
            <Button 
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href={reportHref}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Assessment
              </Link>
            </Button>
          </div>
        )
    }
  }

  return (
    <Card className={`rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-4">
        {/* Job Title and Type */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{jobTitle}</h3>
          <Badge variant="outline" className="text-xs font-medium mb-4">
          {jobType}
        </Badge>
        </div>

        {/* Status Badge */}
        {getStatusBadge()}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Assessment Method and Date */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{assessmentMethod}</span>
          </div>
          <span>Analyzed on {new Date(analyzedDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}</span>
        </div>

        {/* Skills Gaps Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Skills Gaps Identified</span>
            <span className="font-medium">{skillsGapsIdentified}/{totalSkills}</span>
          </div>
          <Progress 
            value={((totalSkills - skillsGapsIdentified) / totalSkills) * 100} 
            className="h-2"
          />
        </div>

        {/* Status Message */}
        {getStatusMessage()}

        {/* Action Button */}
        {getActionButton()}
      </CardContent>
    </Card>
  )
}
