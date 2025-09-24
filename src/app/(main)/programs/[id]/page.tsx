'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/page-header'
import BreadcrumbLayout from '@/components/ui/breadcrumb-layout'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, MapPin, DollarSign, Users, Clock, Upload, FileText, GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getProgramById } from '@/lib/database/queries'
import { useFavorites } from '@/hooks/useFavorites'

function SchoolModal({ school }: { school: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Learn More
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              {school.logo_url ? (
                <img 
                  src={school.logo_url} 
                  alt={`${school.name} logo`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <GraduationCap className="w-6 h-6 text-gray-600" />
              )}
            </div>
            {school.name}
          </DialogTitle>
          <DialogDescription>
            Learn more about this educational institution
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">About</h4>
            <p className="text-gray-600 text-sm">
              {school.bio || 'Information about this school is not available at this time.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Location</h4>
              <p className="text-sm text-gray-600">
                {school.city && school.state 
                  ? `${school.city}, ${school.state}` 
                  : 'Location TBD'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Type</h4>
              <p className="text-sm text-gray-600">{school.school_type || 'Educational Institution'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProgramDetailPage({ params }: { params: { id: string } }) {
  const [program, setProgram] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()

  useEffect(() => {
    async function loadProgram() {
      try {
        setLoading(true)
        const programData = await getProgramById(params.id)
        if (programData) {
          setProgram(programData)
        } else {
          setError('Program not found')
        }
      } catch (err) {
        console.error('Error loading program:', err)
        setError('Failed to load program details')
      } finally {
        setLoading(false)
      }
    }

    loadProgram()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading program details...</p>
        </div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Program not found'}</p>
          <Button asChild>
            <Link href="/programs">← Back to Programs</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        isDynamic={true}
        programInfo={{
          name: program.name,
          school: program.schools?.name || '',
          location: program.schools?.city || ''
        }}
        showPrimaryAction={true}
        showSecondaryAction={true}
        primaryAction={{
          label: "Favorite",
          variant: "favorite",
          isFavorited: false,
          onClick: async () => {
            console.log('Favorite clicked for program:', program.id)
          }
        }}
        secondaryAction={{
          label: "Apply Now"
        }}
        variant="split"
      />

      <BreadcrumbLayout items={[
        { label: 'Programs', href: '/programs' },
        { label: 'All Programs', href: '/programs' },
        { label: program.name, isActive: true }
      ]}>
        {/* School Info */}
        {program.school && (
          <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                {program.school.logo_url ? (
                  <img 
                    src={program.school.logo_url} 
                    alt={`${program.school.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <GraduationCap className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{program.school.name}</h3>
                <p className="text-sm text-gray-600">
                  {program.school.city && program.school.state 
                    ? `${program.school.city}, ${program.school.state}` 
                    : 'Location TBD'}
                </p>
              </div>
            </div>
            <SchoolModal school={program.school} />
          </div>
        )}

        {/* Program Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
                <CardDescription>
                  Learn about this educational program and what you'll study
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {program.description || 'Program description is not available at this time.'}
                    </p>
                  </div>

                  {program.skills && program.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Skills You'll Learn</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {program.skills.slice(0, 8).map((programSkill: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                {programSkill.skill?.name || 'Skill'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {programSkill.skill?.category || 'General'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="w-12 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className="h-2 bg-teal-500 rounded-full" 
                                  style={{ width: `${(programSkill.weight || 0.5) * 100}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {Math.round((programSkill.weight || 0.5) * 100)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Program Type</p>
                    <p className="text-sm text-gray-600">{program.program_type || 'Educational Program'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-sm text-gray-600">{program.duration || 'Varies'}</p>
                  </div>
                </div>

                {program.cip_code && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">CIP Code</p>
                      <p className="text-sm text-gray-600">{program.cip_code}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Take Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Get More Info
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </BreadcrumbLayout>
    </div>
  )
}
