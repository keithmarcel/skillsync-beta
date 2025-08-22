'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { Search, MapPin, Clock, Users, DollarSign } from 'lucide-react'
import { useState } from 'react'

// Mock data - will be replaced with real API calls
const featuredPrograms = [
  {
    id: '1',
    name: 'Full Stack Web Development Bootcamp',
    school: { name: 'TechEd Institute', logo_url: null, city: 'Tampa', state: 'FL' },
    program_type: 'Bootcamp',
    format: 'Online',
    duration_text: '24 weeks',
    short_desc: 'Comprehensive program covering modern web development technologies including React, Node.js, and databases.',
    skills_count: 15
  },
  {
    id: '2',
    name: 'Data Analytics Certificate',
    school: { name: 'Pinellas College', logo_url: null, city: 'Clearwater', state: 'FL' },
    program_type: 'Certificate',
    format: 'Hybrid',
    duration_text: '16 weeks',
    short_desc: 'Learn data analysis, visualization, and statistical methods using Python and SQL.',
    skills_count: 10
  }
]

const allPrograms = [
  {
    id: '3',
    name: 'Cybersecurity Fundamentals',
    program_type: 'Certificate',
    format: 'Online',
    duration_text: '12 weeks',
    school: 'Security Academy',
    skills_provided: 8
  },
  {
    id: '4',
    name: 'Project Management Professional',
    program_type: 'Certification Prep',
    format: 'In-person',
    duration_text: '8 weeks',
    school: 'Business Institute',
    skills_provided: 6
  },
  {
    id: '5',
    name: 'Digital Marketing Specialist',
    program_type: 'Certificate',
    format: 'Hybrid',
    duration_text: '20 weeks',
    school: 'Marketing College',
    skills_provided: 12
  }
]

function ProgramCard({ program }: { program: any }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
          {program.school?.logo_url ? (
            <img src={program.school.logo_url} alt="logo" className="w-8 h-8 rounded" />
          ) : (
            <span className="text-sm font-semibold">{program.school?.name?.[0] || 'P'}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{program.name}</h3>
          <p className="text-sm text-muted-foreground">{program.school?.name}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{program.program_type}</Badge>
          <Badge variant="secondary">{program.format}</Badge>
          <Badge variant="secondary">{program.duration_text}</Badge>
        </div>
        <p className="text-sm text-gray-700">{program.short_desc}</p>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{program.skills_count || program.skills_provided} skills provided</span>
          {program.school?.city && program.school?.state && (
            <span>{program.school.city}, {program.school.state}</span>
          )}
        </div>
      </CardContent>
      <div className="px-6 pb-6 space-y-2">
        <Button asChild className="w-full">
          <Link href={`/programs/${program.id}`}>Program Details</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">About School</Button>
          <Button variant="outline" size="sm" className="flex-1">♡ Save</Button>
        </div>
      </div>
    </Card>
  )
}

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState('featured')

  const tabs = [
    { id: 'featured', label: 'Featured', isActive: activeTab === 'featured' },
    { id: 'all', label: 'All Programs', isActive: activeTab === 'all' },
    { id: 'favorites', label: 'Favorites', isActive: activeTab === 'favorites' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Educational Programs"
        subtitle="Discover programs to develop your skills and advance your career."
        variant="split"
      />
      
      <StickyTabs 
        tabs={tabs}
        onTabChange={setActiveTab}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'featured' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPrograms.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
            )}

            {activeTab === 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>All Programs</CardTitle>
                  <CardDescription>
                    Browse all available educational programs in Pinellas County
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPrograms.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.name}</TableCell>
                          <TableCell>{program.program_type}</TableCell>
                          <TableCell>{program.format}</TableCell>
                          <TableCell>{program.duration_text}</TableCell>
                          <TableCell>{program.school}</TableCell>
                          <TableCell>{program.skills_provided}</TableCell>
                          <TableCell>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/programs/${program.id}`}>Details</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'favorites' && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorite Programs</CardTitle>
                  <CardDescription>
                    Programs you've saved for later review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No favorite programs yet</p>
                    <Button asChild variant="outline">
                      <button onClick={() => setActiveTab('featured')}>Browse Featured Programs</button>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      </main>
    </div>
  )
}
