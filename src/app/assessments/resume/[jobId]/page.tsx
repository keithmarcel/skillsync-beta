'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Breadcrumb from '@/components/ui/breadcrumb'
import AssessmentStepper from '@/components/ui/assessment-stepper'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

// Mock job data - same structure as job detail page
const mockJobData = {
  '1': {
    id: '1',
    title: 'Mechanical Project Manager',
    job_kind: 'featured_role',
    soc_code: '13-1082',
    category: 'Skilled Trades',
    company: { name: 'Power Design' }
  },
  'occ-3': {
    id: 'occ-3',
    title: 'Project Management Specialists',
    job_kind: 'occupation',
    soc_code: '13-1082',
    category: 'Business'
  }
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

export default function ResumeAssessmentPage({ params }: { params: { jobId: string } }) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const job = mockJobData[params.jobId as keyof typeof mockJobData]
  
  if (!job) {
    return <div>Job not found</div>
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Please upload a PDF or Word document')
      setUploadState('error')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB')
      setUploadState('error')
      return
    }

    setFileName(file.name)
    setErrorMessage('')
    simulateUploadProcess()
  }

  const simulateUploadProcess = async () => {
    setUploadState('uploading')
    setUploadProgress(0)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setUploadState('processing')
    
    // Simulate LLM processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setUploadState('completed')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRetry = () => {
    setUploadState('idle')
    setUploadProgress(0)
    setFileName('')
    setErrorMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs above header */}
      <div className="bg-gray-50 py-3">
        <div className="max-w-[1280px] mx-auto px-6">
          <Breadcrumb items={[
            { label: 'Jobs', href: '/jobs' },
            { label: 'High Demand Occupations', href: '/jobs' },
            { label: job.title, href: `/jobs/${job.id}` },
            { label: 'SkillSync Assessment', isActive: true }
          ]} />
        </div>
      </div>

      <PageHeader 
        isDynamic={true}
        jobInfo={{
          title: job.title,
          socCode: job.soc_code
        }}
        title={job.title}
        subtitle={`SOC Code: ${job.soc_code}`}
        showPrimaryAction={true}
        primaryAction={{
          label: "Favorite Occupation",
          variant: "favorite",
          isFavorited: false,
          onClick: () => {
            console.log('Toggle favorite for job:', job.id)
          }
        }}
        variant="split"
      />

      {/* Assessment stepper below header */}
      <div className="bg-white py-6 border-b">
        <div className="max-w-[1280px] mx-auto px-6">
          <AssessmentStepper steps={[
            { id: '1', label: 'Assess Your Skills', status: 'current' },
            { id: '2', label: 'SkillSync Readiness Score', status: 'upcoming' },
            { id: '3', label: 'Education Program Matches', status: 'upcoming' }
          ]} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Upload Your Resume</CardTitle>
                <CardDescription>
                  We'll use AI to analyze your resume and extract your skills to compare against the requirements for {job.title}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {uploadState === 'idle' && (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors"
                    onClick={handleUploadClick}
                  >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Drop your resume here</h3>
                    <p className="text-gray-600 mb-4">or click to browse files</p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, DOC, and DOCX files up to 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {uploadState === 'uploading' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-teal-600" />
                      <span className="font-medium">{fileName}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  </div>
                )}

                {uploadState === 'processing' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                      <span className="font-medium">Processing your resume...</span>
                    </div>
                    <p className="text-gray-600">
                      Our AI is analyzing your resume and extracting your skills. This may take a few moments.
                    </p>
                  </div>
                )}

                {uploadState === 'completed' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <span className="font-medium text-green-800">Resume processed successfully!</span>
                    </div>
                    <p className="text-gray-600">
                      We've extracted your skills and are ready to show your assessment results.
                    </p>
                    <Button asChild className="bg-[#114B5F] hover:bg-[#0d3a4a] text-white">
                      <Link href="/assessments/1">
                        View Your Assessment Results →
                      </Link>
                    </Button>
                  </div>
                )}

                {uploadState === 'error' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                      <span className="font-medium text-red-800">Upload failed</span>
                    </div>
                    <p className="text-red-600">{errorMessage}</p>
                    <Button onClick={handleRetry} variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Job Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Assessment For</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  {job.job_kind === 'featured_role' && 'company' in job && job.company && (
                    <p className="text-gray-600">at {job.company.name}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">{job.category}</Badge>
                    <Badge variant="outline">SOC: {job.soc_code}</Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">What we'll analyze:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Technical skills and competencies</li>
                    <li>• Work experience relevance</li>
                    <li>• Education and certifications</li>
                    <li>• Industry keywords and terminology</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Privacy Notice:</h4>
                  <p className="text-sm text-gray-600">
                    Your resume is processed securely and is not stored permanently. We only extract skill information for assessment purposes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
