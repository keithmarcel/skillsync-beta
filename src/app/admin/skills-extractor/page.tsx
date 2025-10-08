/**
 * Skills Extractor Admin Interface
 * AI-powered skills extraction from SOC codes, programs, and custom text
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TestTube, Zap, Database, CheckCircle, XCircle, Clock, Minus, Circle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface LaiserSkill {
  skill: string
  description?: string
  level: number
  knowledge_required?: string[]
  tasks?: string[]
  confidence?: number
  curation_status?: string
  source?: string
}

interface SocProcessingResult {
  socCode: string
  occupation: {
    title: string
    description: string
    tasks: string[]
    skills: any[]
    knowledge: any[]
    trainingPrograms?: string[]
    certifications?: string[]
  }
  extractedSkills: LaiserSkill[]
  processingTime: number
  apiCalls: {
    onet: boolean
    cos: boolean
    lightcast: boolean
    laiser: boolean
  }
  richTextCompiled?: number
  warning?: string
  error?: string
}

interface LaiserTestResult {
  input: string
  skills: LaiserSkill[]
  processingTime: number
  success: boolean
  error?: string
}

export default function LaiserAdminPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('soc')
  const [isProcessing, setIsProcessing] = useState(false)
  const [testResults, setTestResults] = useState<LaiserTestResult[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [programId, setProgramId] = useState('')
  const [programResults, setProgramResults] = useState<any>(null)
  const [socCode, setSocCode] = useState('')
  const [socResults, setSocResults] = useState<SocProcessingResult | null>(null)
  const [processingStep, setProcessingStep] = useState<string>('')
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [activeStep, setActiveStep] = useState<string>('')
  const [socCodes, setSocCodes] = useState<any[]>([])
  const [loadingSocCodes, setLoadingSocCodes] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState('')
  const [programSyllabus, setProgramSyllabus] = useState('')
  const [programDescSource, setProgramDescSource] = useState<'manual' | 'short' | 'long'>('short')

  // Load SOC codes and programs on mount
  useEffect(() => {
    loadSocCodes()
    loadPrograms()
  }, [])

  const loadSocCodes = async () => {
    setLoadingSocCodes(true)
    try {
      const response = await fetch('/api/admin/skills-extractor/soc-codes')
      const data = await response.json()
      setSocCodes(data.socCodes || [])
    } catch (error) {
      console.error('Failed to load SOC codes:', error)
    } finally {
      setLoadingSocCodes(false)
    }
  }

  const loadPrograms = async () => {
    setLoadingPrograms(true)
    try {
      const response = await fetch('/api/admin/programs')
      if (!response.ok) {
        throw new Error(`Failed to fetch programs: ${response.status}`)
      }
      const data = await response.json()
      setPrograms(data || [])
    } catch (error) {
      console.error('Failed to load programs:', error)
      setPrograms([]) // Set empty array on error
    } finally {
      setLoadingPrograms(false)
    }
  }

  // Test LAiSER on custom text
  const testLaiserOnText = async () => {
    if (!currentInput.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/skills-extractor/extract-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentInput })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract skills')
      }

      const testResult: LaiserTestResult = {
        input: currentInput,
        skills: result.skills || [],
        processingTime: result.processing_time || 0,
        success: true
      }

      setTestResults(prev => [testResult, ...prev])
      setCurrentInput('')
    } catch (error) {
      const errorResult: LaiserTestResult = {
        input: currentInput,
        skills: [],
        processingTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      setTestResults(prev => [errorResult, ...prev])
    } finally {
      setIsProcessing(false)
    }
  }

  // Test LAiSER on a program
  const testLaiserOnProgram = async () => {
    if (!programId.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/laiser/extract-program-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract program skills')
      }

      setProgramResults(result)
    } catch (error) {
      setProgramResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsProcessing(false)
    }
  }

  // SOC Code processing with ONET + COS + LAiSER
  const processSocCode = async () => {
    if (!socCode.trim()) return

    setIsProcessing(true)
    setSocResults(null)
    setProcessingStep('Initializing...')
    setActiveStep('onet')

    // Initialize progress display
    const initialResult: SocProcessingResult = {
      socCode,
      occupation: { title: 'Processing...', description: '', tasks: [], skills: [], knowledge: [] },
      extractedSkills: [],
      processingTime: 0,
      apiCalls: { onet: false, cos: false, lightcast: false, laiser: false }
    }
    setSocResults(initialResult)

    try {
      // Step 1: Fetch ONET
      setProcessingStep('Fetching O*NET data...')
      setActiveStep('onet')
      
      const response = await fetch('/api/admin/skills-extractor/soc-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socCode,
          includeOnet: true,
          includeCos: true
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'SOC processing failed')
      }

      setSocResults(result)
      setProcessingStep('Complete!')
      setActiveStep('')

    } catch (error: any) {
      setSocResults({
        socCode,
        occupation: { title: '', description: '', tasks: [], skills: [], knowledge: [] },
        extractedSkills: [],
        processingTime: 0,
        apiCalls: { onet: false, cos: false, lightcast: false, laiser: false },
        error: error?.message || 'Unknown error'
      } as SocProcessingResult)
      setProcessingStep('Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // Toggle skill selection
  const toggleSkillSelection = (skillKey: string) => {
    const newSelected = new Set(selectedSkills)
    if (newSelected.has(skillKey)) {
      newSelected.delete(skillKey)
    } else {
      newSelected.add(skillKey)
    }
    setSelectedSkills(newSelected)
  }

  // Select all high-confidence skills
  const selectAllHighConfidence = () => {
    if (!socResults) return
    const highConfidenceSkills = new Set<string>(
      socResults.extractedSkills
        .filter((skill: LaiserSkill) => (skill.confidence || 0) >= 70)
        .map((skill: LaiserSkill, index: number) => `${skill.skill}-${index}`)
    )
    setSelectedSkills(highConfidenceSkills)
  }

  // Save selected skills curation to database
  const saveSkillCuration = async () => {
    if (!socResults || selectedSkills.size === 0) return
    
    setIsProcessing(true)
    try {
      const selectedSkillsList = Array.from(selectedSkills).map(key => {
        const index = parseInt(key.split('-').pop() || '0')
        return socResults.extractedSkills[index]
      })

      const response = await fetch('/api/admin/skills-extractor/save-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socCode: socResults.socCode,
          skills: selectedSkillsList,
          curatedBy: null // TODO: Add current user ID
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save skills')
      }

      toast({
        title: "Skills Saved Successfully!",
        description: `${result.skillsSaved} skills saved to database for SOC ${socResults.socCode}`,
      })

      // Clear selection after successful save
      setSelectedSkills(new Set())
      
    } catch (error: any) {
      console.error('Curation save failed:', error)
      toast({
        title: "Failed to Save Skills",
        description: error?.message || "An error occurred while saving skills",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Process program skills
  const processProgramSkills = async () => {
    if (!selectedProgram || !programSyllabus.trim()) return

    setIsProcessing(true)
    setProcessingStep('Analyzing program content...')

    try {
      const program = programs.find(p => p.id === selectedProgram)
      
      const aiResult = await fetch('/api/admin/laiser/extract-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Program: ${program?.name}\nCIP Code: ${program?.cip_code || 'N/A'}\n\n${programSyllabus}`
        })
      })

      const result = await aiResult.json()

      if (!aiResult.ok) {
        throw new Error(result.error || 'Failed to extract skills')
      }

      setProgramResults({
        programId: selectedProgram,
        programName: program?.name,
        extractedSkills: result.skills || [],
        processingTime: result.processing_time
      })

      setProcessingStep('Complete!')
    } catch (error: any) {
      console.error('Program processing failed:', error)
      alert(`Failed to process program: ${error?.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const [selectedSocCodes, setSelectedSocCodes] = useState<Set<string>>(new Set())
  const [bulkResults, setBulkResults] = useState<any>(null)
  const [reviewSocCode, setReviewSocCode] = useState('')
  const [curatedSkills, setCuratedSkills] = useState<any[]>([])
  const [loadingCurated, setLoadingCurated] = useState(false)

  // Load curated skills for review
  const loadCuratedSkills = async (socCode: string) => {
    setLoadingCurated(true)
    try {
      const response = await fetch(`/api/admin/skills-extractor/curated-skills?socCode=${socCode}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load curated skills')
      }
      
      setCuratedSkills(data.skills || [])
    } catch (error) {
      console.error('Failed to load curated skills:', error)
      toast({
        title: "Failed to Load Skills",
        description: "Could not load curated skills for this SOC code",
        variant: "destructive",
      })
    } finally {
      setLoadingCurated(false)
    }
  }

  // Bulk process SOC codes
  const bulkProcessSocs = async () => {
    if (selectedSocCodes.size === 0) {
      alert('Please select at least one SOC code')
      return
    }

    setIsProcessing(true)
    const results: any[] = []
    const codes = Array.from(selectedSocCodes)

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i]
      setProcessingStep(`Processing ${i + 1}/${codes.length}: ${code}`)

      try {
        const response = await fetch('/api/admin/skills-extractor/soc-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            socCode: code,
            includeOnet: true,
            includeCos: true
          })
        })

        const result = await response.json()
        results.push({
          socCode: code,
          success: response.ok,
          skillsExtracted: result.extractedSkills?.length || 0,
          error: result.error
        })
      } catch (error) {
        results.push({
          socCode: code,
          success: false,
          skillsExtracted: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    setBulkResults({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    })

    setIsProcessing(false)
    setProcessingStep('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Skills Extractor</h1>
        <p className="text-gray-600">AI-powered skills extraction from occupations, programs, and custom text</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="soc">SOC Enhancement</TabsTrigger>
          <TabsTrigger value="programs">Program Processing</TabsTrigger>
          <TabsTrigger value="review">Review Curated</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test Extraction</TabsTrigger>
        </TabsList>

        {/* Test Extraction Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Skills Extraction</CardTitle>
              <CardDescription>
                Test LAiSER on any text to see what skills it extracts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter any text (job description, course syllabus, etc.) to test skills extraction..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                rows={6}
                className="w-full"
              />

              <Button
                onClick={testLaiserOnText}
                disabled={isProcessing || !currentInput.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Skills...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Extract Skills
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Tests</h3>
            {testResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {result.success ? (
                        <CheckCircle className="inline h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="inline h-4 w-4 text-red-600 mr-2" />
                      )}
                      Test {index + 1}
                    </CardTitle>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.processingTime}ms
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.error ? (
                    <Alert>
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        "{result.input}"
                      </p>
                      <div className="space-y-2">
                        {result.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="p-2 border rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{skill.skill}</span>
                              <Badge variant="outline" className="text-xs">Level {skill.level}</Badge>
                              {skill.confidence && (
                                <Badge variant="outline" className="text-xs">{skill.confidence}%</Badge>
                              )}
                            </div>
                            {skill.description && (
                              <p className="text-xs text-gray-600">{skill.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {result.skills.length} skills extracted
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SOC Enhancement Tab */}
        <TabsContent value="soc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SOC Code Enhancement</CardTitle>
              <CardDescription>
                Process SOC codes with O*NET + CareerOneStop + OpenAI for AI-powered skills extraction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={socCode} onValueChange={setSocCode} disabled={loadingSocCodes}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={loadingSocCodes ? "Loading SOC codes..." : "Select SOC Code"} />
                  </SelectTrigger>
                  <SelectContent>
                    {socCodes.map((soc) => (
                      <SelectItem key={soc.code} value={soc.code}>
                        <div className="flex items-center gap-2">
                          {soc.processed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="font-mono text-sm">{soc.code}</span>
                          <span className="text-gray-600">- {soc.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={processSocCode}
                  disabled={isProcessing || !socCode.trim() || loadingSocCodes}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Process SOC'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Processing Step Indicator */}
          {isProcessing && processingStep && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">{processingStep}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SOC Processing Results */}
          {socResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {socResults.error ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  SOC {socResults.socCode}: {socResults.occupation?.title || 'Processing...'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex justify-center items-center h-8">
                      {activeStep === 'onet' && isProcessing ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[#0694A2]" />
                      ) : socResults.apiCalls.onet ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">O*NET</div>
                    <div className="text-xs text-gray-500">Occupation Data</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center items-center h-8">
                      {activeStep === 'cos' && isProcessing ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[#0694A2]" />
                      ) : socResults.apiCalls.cos ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">CareerOneStop</div>
                    <div className="text-xs text-gray-500">Training & Certs</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center items-center h-8">
                      {activeStep === 'openai' && isProcessing ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[#0694A2]" />
                      ) : socResults.apiCalls.laiser ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">OpenAI</div>
                    <div className="text-xs text-gray-500">AI Analysis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#0694A2]">
                      {socResults.processingTime}ms
                    </div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>

                {socResults.error && (
                  <Alert>
                    <AlertDescription className="text-red-600">{socResults.error}</AlertDescription>
                  </Alert>
                )}

                {socResults.occupation?.description && (
                  <div className="mt-4">
                    <p className="text-sm"><strong>Description:</strong> {socResults.occupation.description}</p>
                  </div>
                )}

                {socResults.extractedSkills && socResults.extractedSkills.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm font-semibold">Skills Curation ({socResults.extractedSkills.length} extracted)</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={selectAllHighConfidence}
                          variant="outline"
                          size="sm"
                        >
                          Select High Confidence (≥70%)
                        </Button>
                        <Button
                          onClick={() => setSelectedSkills(new Set())}
                          variant="outline"
                          size="sm"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                      {socResults.extractedSkills.map((skill, index) => {
                        const skillKey = `${skill.skill}-${index}`
                        const isSelected = selectedSkills.has(skillKey)

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? 'border-[#0694A2] bg-teal-50' : 'border-gray-200'
                            }`}
                            onClick={() => toggleSkillSelection(skillKey)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSkillSelection(skillKey)}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{skill.skill}</span>
                                <span className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700">
                                  {skill.confidence || 0}%
                                </span>
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                  Level {skill.level}
                                </span>
                              </div>
                              {skill.description && (
                                <p className="text-sm text-gray-600">{skill.description}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        {selectedSkills.size} of {socResults.extractedSkills.length} skills selected
                      </div>
                      <Button
                        type="button"
                        onClick={saveSkillCuration}
                        disabled={selectedSkills.size === 0 || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Curation'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Skills Enhancement</CardTitle>
              <CardDescription>
                CIP Code → O*NET Crosswalk → CareerOneStop → OpenAI → Curate Skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Program</label>
                  <Select 
                    value={selectedProgram} 
                    onValueChange={(value) => {
                      setSelectedProgram(value)
                      // Auto-fill based on selected source
                      const program = programs.find(p => p.id === value)
                      if (program) {
                        if (programDescSource === 'short' && program.short_desc) {
                          setProgramSyllabus(program.short_desc)
                        } else if (programDescSource === 'long' && program.long_desc) {
                          setProgramSyllabus(program.long_desc)
                        }
                      }
                    }} 
                    disabled={loadingPrograms}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingPrograms ? "Loading programs..." : "Select a program"} />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{program.name}</span>
                            <span className="text-xs text-gray-500">
                              {program.cip_code ? `CIP: ${program.cip_code}` : 'No CIP code'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description Source</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="short"
                        checked={programDescSource === 'short'}
                        onChange={(e) => {
                          setProgramDescSource('short')
                          const program = programs.find(p => p.id === selectedProgram)
                          if (program?.short_desc) setProgramSyllabus(program.short_desc)
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Program Overview (DB)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="long"
                        checked={programDescSource === 'long'}
                        onChange={(e) => {
                          setProgramDescSource('long')
                          const program = programs.find(p => p.id === selectedProgram)
                          if (program?.long_desc) setProgramSyllabus(program.long_desc)
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Full Description (DB)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="manual"
                        checked={programDescSource === 'manual'}
                        onChange={(e) => {
                          setProgramDescSource('manual')
                          setProgramSyllabus('')
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Manual Input</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Program Content</label>
                  <Textarea
                    placeholder={programDescSource === 'manual' ? "Paste program syllabus, course descriptions, learning outcomes..." : "Content loaded from database"}
                    value={programSyllabus}
                    onChange={(e) => setProgramSyllabus(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    disabled={programDescSource !== 'manual' && !selectedProgram}
                  />
                  {programDescSource !== 'manual' && selectedProgram && !programSyllabus && (
                    <p className="text-xs text-amber-600 mt-1">
                      No {programDescSource === 'short' ? 'overview' : 'description'} available for this program
                    </p>
                  )}
                </div>

                <Button
                  onClick={processProgramSkills}
                  disabled={isProcessing || !selectedProgram || !programSyllabus.trim()}
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Extract Program Skills'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Program Results */}
          {programResults && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Skills: {programResults.programName}</CardTitle>
                <Badge>{programResults.extractedSkills.length} skills found</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {programResults.extractedSkills.map((skill: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{skill.skill}</div>
                          <div className="text-sm text-gray-600">{skill.description}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">Level {skill.level}</Badge>
                          <Badge>{skill.confidence}%</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Processing time: {programResults.processingTime}ms
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Review Curated Skills Tab */}
        <TabsContent value="review" className="space-y-6">
          <Tabs defaultValue="soc-review">
            <TabsList>
              <TabsTrigger value="soc-review">SOC Skills</TabsTrigger>
              <TabsTrigger value="program-review">Program Skills</TabsTrigger>
            </TabsList>

            {/* SOC Skills Review */}
            <TabsContent value="soc-review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Curated SOC Skills</CardTitle>
                  <CardDescription>
                    View and edit previously curated skills for SOC codes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select SOC Code</label>
                    <Select 
                      value={reviewSocCode} 
                      onValueChange={(value) => {
                        setReviewSocCode(value)
                        loadCuratedSkills(value)
                      }}
                      disabled={loadingSocCodes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a processed SOC code" />
                      </SelectTrigger>
                      <SelectContent>
                        {socCodes.filter(soc => soc.processed).map((soc) => (
                          <SelectItem key={soc.code} value={soc.code}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-mono text-sm">{soc.code}</span>
                              <span className="text-gray-600">- {soc.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingCurated && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading curated skills...</span>
                    </div>
                  )}

                  {!loadingCurated && reviewSocCode && curatedSkills.length > 0 && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertDescription>
                          {curatedSkills.length} curated skills for SOC {reviewSocCode}. To modify, re-run the extraction in the SOC Enhancement tab.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        {curatedSkills.map((skill, index) => (
                          <div key={skill.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{skill.skill}</span>
                                  <Badge variant="outline" className="text-xs">
                                    Weight: {(skill.weight * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                                {skill.description && (
                                  <p className="text-sm text-gray-600">{skill.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loadingCurated && reviewSocCode && curatedSkills.length === 0 && (
                    <Alert>
                      <AlertDescription>
                        No curated skills found for this SOC code.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!reviewSocCode && !loadingCurated && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Select a SOC code to view curated skills</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Program Skills Review */}
            <TabsContent value="program-review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Curated Program Skills</CardTitle>
                  <CardDescription>
                    View and edit previously curated skills for education programs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Program</label>
                    <Select disabled={loadingPrograms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a processed program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            <span className="font-medium">{program.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Select a program above to view and edit its curated skills. You can re-select different skills or re-run the extraction pipeline.
                    </AlertDescription>
                  </Alert>

                  <div className="text-center py-8 text-gray-500">
                    <p>Select a program to view curated skills</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch SOC Processing</CardTitle>
              <CardDescription>
                Process multiple SOC codes at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Select SOC Codes to Process</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const unprocessed = socCodes.filter(soc => !soc.processed)
                      setSelectedSocCodes(new Set(unprocessed.map(s => s.code)))
                    }}
                  >
                    Select All Unprocessed
                  </Button>
                </div>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                  {socCodes.filter(soc => !soc.processed).length === 0 ? (
                    <p className="text-center text-gray-500 py-4">All SOC codes have been processed</p>
                  ) : socCodes.filter(soc => !soc.processed).map((soc) => (
                    <label key={soc.code} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSocCodes.has(soc.code)}
                        onChange={(e) => {
                          const newSet = new Set(selectedSocCodes)
                          if (e.target.checked) {
                            newSet.add(soc.code)
                          } else {
                            newSet.delete(soc.code)
                          }
                          setSelectedSocCodes(newSet)
                        }}
                        className="rounded"
                      />
                      <span className="font-mono text-sm">{soc.code}</span>
                      <span className="text-gray-600">- {soc.title}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {selectedSocCodes.size} SOC codes selected
                </div>
              </div>

              <Button
                onClick={bulkProcessSocs}
                disabled={isProcessing || selectedSocCodes.size === 0}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                {isProcessing ? `Processing... ${processingStep}` : `Process ${selectedSocCodes.size} SOC Codes`}
              </Button>

              {bulkResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Batch Processing Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{bulkResults.processed}</div>
                          <div className="text-sm text-gray-500">Total Processed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{bulkResults.successful}</div>
                          <div className="text-sm text-gray-500">Successful</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{bulkResults.failed}</div>
                          <div className="text-sm text-gray-500">Failed</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {bulkResults.results.map((result: any, index: number) => (
                          <div key={index} className={`p-3 border rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-mono">{result.socCode}</span>
                                {result.success ? (
                                  <span className="ml-2 text-sm text-green-600">
                                    ✓ {result.skillsExtracted} skills extracted
                                  </span>
                                ) : (
                                  <span className="ml-2 text-sm text-red-600">
                                    ✗ {result.error}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Status of external API integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">O*NET Web Services</div>
                    <div className="text-sm text-gray-500">Occupation data and skills</div>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">CareerOneStop API</div>
                    <div className="text-sm text-gray-500">Training programs and certifications</div>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">OpenAI GPT-4o-mini</div>
                    <div className="text-sm text-gray-500">AI skills extraction</div>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extraction Settings</CardTitle>
              <CardDescription>
                Configure skills extraction parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Target Skills per SOC</label>
                <input
                  type="number"
                  defaultValue="15"
                  min="10"
                  max="30"
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Number of skills to extract (10-30)</p>
              </div>
              <div>
                <label className="text-sm font-medium">Auto-approve Threshold</label>
                <input
                  type="number"
                  defaultValue="85"
                  min="0"
                  max="100"
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Skills with confidence ≥ this value are auto-selected</p>
              </div>
              <div>
                <label className="text-sm font-medium">Minimum Confidence</label>
                <input
                  type="number"
                  defaultValue="60"
                  min="0"
                  max="100"
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Skills below this threshold are filtered out</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extraction Statistics</CardTitle>
              <CardDescription>
                Overview of processed data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {socCodes.filter(s => s.processed).length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">SOCs Processed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {socCodes.length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Total SOCs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {programs.length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Programs Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
