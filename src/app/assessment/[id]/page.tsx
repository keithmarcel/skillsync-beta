'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AssessmentFlow } from '@/components/assessment/AssessmentFlow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Clock, TrendingUp } from 'lucide-react'

interface AssessmentResults {
  assessmentId: string
  totalQuestions: number
}

export default function AssessmentPage() {
  const router = useRouter()
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [results, setResults] = useState<AssessmentResults | null>(null)

  // TODO: Get from URL params or context
  const quizId = 'sample-quiz-id'
  const jobId = 'sample-job-id'

  const handleAssessmentComplete = (assessmentResults: AssessmentResults) => {
    setResults(assessmentResults)
    setAssessmentComplete(true)
  }

  if (assessmentComplete && results) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Assessment Complete!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-gray-600">
              You've successfully completed your skills assessment. Your responses will help us understand your proficiency and recommend the best career paths for you.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">{results.totalQuestions}</div>
                <div className="text-sm text-blue-600">Questions Completed</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-800">15-20m</div>
                <div className="text-sm text-purple-600">Time Invested</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">What's Next?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your results are being analyzed. You'll receive personalized insights about your skills, career recommendations, and suggested training programs.
              </p>
              <div className="flex items-center text-sm text-blue-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                Check your profile in 24-48 hours for detailed results
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={() => router.push('/my-assessments')} className="w-full">
                View My Assessments
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AssessmentFlow
        quizId={quizId}
        jobId={jobId}
        onComplete={handleAssessmentComplete}
      />
    </div>
  )
}
