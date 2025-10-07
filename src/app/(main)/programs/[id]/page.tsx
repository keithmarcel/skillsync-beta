'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/page-header'
import BreadcrumbLayout from '@/components/ui/breadcrumb-layout'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, MapPin, DollarSign, Users, Clock, Upload, FileText, GraduationCap, Phone, Download, Code, Database, Palette, TrendingUp, BarChart, Users as UsersIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getProgramById } from '@/lib/database/queries'
import { useFavorites } from '@/hooks/useFavorites'
import { ProgramDetailsSkeleton } from '@/components/ui/program-details-skeleton'
import { getSkillIcon } from '@/lib/skill-icons'

function SchoolModal({ school }: { school: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-[#00A6AE] text-[#00A6AE] hover:bg-[#00A6AE] hover:text-white">
          About the School
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          {/* Logo displayed prominently - left aligned */}
          {school.logo_url && (
            <div className="flex justify-start mb-4">
              <img 
                src={school.logo_url} 
                alt={`${school.name} logo`}
                className="h-16 w-auto object-contain max-w-[300px]"
              />
            </div>
          )}
          <DialogTitle className="text-xl">{school.name}</DialogTitle>
          <DialogDescription>
            Learn more about this educational institution
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Profile Image if available */}
          {school.profile_image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img 
                src={school.profile_image_url} 
                alt={`${school.name} profile`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">About</h4>
            <p className="text-gray-600 text-sm">
              {school.bio || 'Information about this school is not available at this time.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1 text-sm">Location</h4>
              <p className="text-sm text-gray-600">
                {school.city && school.state 
                  ? `${school.city}, ${school.state}` 
                  : 'Location TBD'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1 text-sm">Type</h4>
              <p className="text-sm text-gray-600">{school.school_type || 'Educational Institution'}</p>
            </div>
          </div>
          
          {school.about_url && (
            <div className="pt-4">
              <Button asChild className="w-full bg-[#00A6AE] hover:bg-[#008A91] text-white">
                <a href={school.about_url} target="_blank" rel="noopener noreferrer">
                  Visit School Website
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProgramDetailPage({ params, searchParams }: { params: { id: string }, searchParams?: { from?: string } }) {
  const [program, setProgram] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  
  // Determine source tab from URL params
  const sourceTab = searchParams?.from || 'all'

  useEffect(() => {
    async function loadProgram() {
      try {
        setLoading(true)
        const programData = await getProgramById(params.id)
        if (programData) {
          console.log('🔍 Program data loaded:', {
            name: programData.name,
            school: programData.school,
            logo_url: programData.school?.logo_url
          })
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
    return <ProgramDetailsSkeleton />
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
        title={program.name}
        subtitle={program.school?.name || 'Education Provider'}
        showPrimaryAction={true}
        primaryAction={{
          label: isFavorite('program', program.id) ? "Favorited" : "Favorite Program",
          variant: "favorite",
          isFavorited: isFavorite('program', program.id),
          onClick: async () => {
            if (isFavorite('program', program.id)) {
              await removeFavorite('program', program.id)
            } else {
              await addFavorite('program', program.id)
            }
          }
        }}
        showSecondaryAction={true}
        secondaryAction={{
          label: "Request Info",
          onClick: () => {
            if (program.program_url) {
              window.open(program.program_url, '_blank')
            }
          }
        }}
        variant="split"
      />

      <BreadcrumbLayout items={[
        { label: 'Programs', href: '/programs' },
        { 
          label: sourceTab === 'featured' ? 'Featured Programs' : sourceTab === 'favorites' ? 'Saved Programs' : 'All Programs', 
          href: `/programs?tab=${sourceTab}` 
        },
        { label: program.name, isActive: true }
      ]}>
        {/* School Info - Logo and About button only */}
        {program.school && (
          <div className="flex items-center justify-between mb-6 p-8 bg-white rounded-lg border">
            <div className="flex items-center gap-4">
              {program.school.logo_url ? (
                <img 
                  src={program.school.logo_url} 
                  alt={`${program.school.name} logo`}
                  className="h-16 w-auto object-contain max-w-[300px]"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-gray-600" />
                </div>
              )}
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
                <h2 className="text-2xl font-bold text-gray-900">Program Overview</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                    <div 
                      className="text-gray-600 text-base leading-relaxed prose prose-sm max-w-none prose-p:mb-4 prose-p:leading-7"
                      dangerouslySetInnerHTML={{ 
                        __html: program.long_desc || program.short_desc || program.description || 'Program description is not available at this time.' 
                      }}
                    />
                  </div>

                  {program.skills && program.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills You'll Learn</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {program.skills.slice(0, 8).map((programSkill: any, index: number) => {
                          const SkillIcon = getSkillIcon(
                            programSkill.skill?.name || '',
                            programSkill.skill?.category
                          )
                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-[#00A6AE]/10 flex items-center justify-center">
                                  <SkillIcon className="w-5 h-5 text-[#00A6AE]" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {programSkill.skill?.name || 'Skill'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {programSkill.skill?.category || 'General'}
                                </p>
                              </div>
                            </div>
                          )
                        })}
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
                <Button className="w-full bg-[#00A6AE] hover:bg-[#008A91] text-white" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Request Info
                </Button>
                <Button variant="outline" className="w-full border-[#00A6AE] text-[#00A6AE] hover:bg-[#00A6AE] hover:text-white" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call the School
                </Button>
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Program Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </BreadcrumbLayout>
    </div>
  )
}
