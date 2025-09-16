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
import { Search, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

// Mock data for featured roles
const mockFeaturedRoles = [
  {
    id: '1',
    title: 'Mechanical Assistant Project Manager',
    company: 'Power Design',
    category: 'Skilled Trades',
    type: 'Full-Time',
    skillsCount: 5,
    description: 'Work directly with project managers to oversee all business aspects of a project.',
    medianSalary: 65700,
    logo: undefined,
    isTrustedPartner: true,
    proficiencyScore: 90
  },
  {
    id: '2',
    title: 'Senior Financial Analyst (FP&A)',
    company: 'TD SYNNEX',
    category: 'Finance & Legal',
    type: 'Full-Time',
    skillsCount: 5,
    description: 'Develop and manage recurring financial performance reporting for various functions areas or divisions.',
    medianSalary: 70700,
    logo: undefined,
    isTrustedPartner: true,
    proficiencyScore: 90
  },
  {
    id: '3',
    title: 'Mechanical Project Manager',
    company: 'Power Design',
    category: 'Skilled Trades',
    type: 'Full-Time',
    skillsCount: 5,
    description: 'Manage all business aspects of concurrent projects and ensure financial and quality targets are met.',
    medianSalary: 85700,
    logo: undefined,
    isTrustedPartner: true,
    proficiencyScore: 90
  },
  {
    id: '4',
    title: 'Surgical Technologist Certified',
    company: 'BayCare',
    category: 'Health & Education',
    type: 'Full-Time',
    skillsCount: 6,
    description: 'Perform technical support in the preoperative period under the direction and supervision of a RN.',
    medianSalary: 60600,
    logo: undefined,
    isTrustedPartner: true,
    proficiencyScore: 90
  },
  {
    id: '5',
    title: 'Business Development Manager',
    company: 'ATECO',
    category: 'Business',
    type: 'Full-Time',
    skillsCount: 8,
    description: 'Assist the Director in design and implementation of business development strategies and growth areas.',
    medianSalary: 78475,
    logo: undefined,
    isTrustedPartner: true,
    proficiencyScore: 90
  },
  {
    id: '6',
    title: 'Administrative Assistant',
    company: 'Raymond James',
    category: 'Business',
    type: 'Full-Time',
    skillsCount: 5,
    description: 'Perform routine tasks following oral procedures in the field of Administrative/Clerical/Service.',
    medianSalary: 48307,
    logo: undefined,
    isTrustedPartner: true,
    proficiencyScore: 90
  }
]

// Mock data for high-demand occupations
const mockOccupations = [
  {
    id: 'occ-1',
    role: 'Electricians',
    summary: 'Install and maintain wiring systems in residential, commercial, and industrial settings.',
    category: 'Skilled Trades',
    avgEarnings: 63600,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-2',
    role: 'Carpenters',
    summary: 'Construct, repair, and install building frameworks and structures.',
    category: 'Skilled Trades',
    avgEarnings: 45040,
    roleReadiness: 'Close Gaps'
  },
  {
    id: 'occ-3',
    role: 'Project Management Specialists',
    summary: 'Oversee projects, resources, and teams to meet deadlines and goals across industries.',
    category: 'Business',
    avgEarnings: 86040,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-4',
    role: 'Software Developers',
    summary: 'Design and build computer software and applications for user and business needs.',
    category: 'Tech & Services',
    avgEarnings: 89180,
    roleReadiness: 'Ready'
  },
  {
    id: 'occ-5',
    role: 'HR Specialists',
    summary: 'Manage hiring, onboarding, employee relations, and compliance with labor laws.',
    category: 'Business',
    avgEarnings: 64020,
    roleReadiness: 'Ready'
  },
  {
    id: 'occ-6',
    role: 'Sales Reps (Services)',
    summary: 'Sell business services such as software, consulting, or logistics to organizations.',
    category: 'Business',
    avgEarnings: 60510,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-7',
    role: 'Bookkeeping & Auditing Clerks',
    summary: 'Maintain financial records, processes invoices, and assists with audits.',
    category: 'Finance & Legal',
    avgEarnings: 43290,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-8',
    role: 'Computer User Support Specialists',
    summary: 'Provide technical assistance and support to users on software and hardware.',
    category: 'Tech & Services',
    avgEarnings: 50690,
    roleReadiness: 'Close Gaps'
  },
  {
    id: 'occ-9',
    role: 'General & Operations Managers',
    summary: 'Direct daily business operations, manages budgets, and oversees staff.',
    category: 'Business',
    avgEarnings: 104850,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-10',
    role: 'Accountants & Auditors',
    summary: 'Analyze financial records, prepares reports, and ensures regulatory compliance.',
    category: 'Finance & Legal',
    avgEarnings: 69280,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-11',
    role: 'Sales Reps, Wholesale/Manufacturing',
    summary: 'Sell products to businesses and government agencies, often involving technical goods.',
    category: 'Business',
    avgEarnings: 65190,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-12',
    role: 'First-Line Supervisors, Construction Trades',
    summary: 'Oversee construction crews, schedules tasks, and ensures safety and code compliance.',
    category: 'Skilled Trades',
    avgEarnings: 71400,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-13',
    role: 'Maintenance & Repair Workers, General',
    summary: 'Perform routine duties and preventive maintenance on equipment, buildings, and machinery.',
    category: 'Skilled Trades',
    avgEarnings: 39750,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-14',
    role: 'Registered Nurses (RNs)',
    summary: 'Provide patient care, educates about health conditions, and supports recovery.',
    category: 'Health & Education',
    avgEarnings: 78810,
    roleReadiness: 'Assess Skills'
  },
  {
    id: 'occ-15',
    role: 'Construction Laborers',
    summary: 'Assist in physical construction tasks including site prep, digging, hauling, and cleanup.',
    category: 'Skilled Trades',
    avgEarnings: 37140,
    roleReadiness: 'Assess Skills'
  }
]

// Mock data for favorites
const mockFavorites = {
  roles: [
    {
      id: '1',
      role: 'Mechanical Project Manager',
      summary: 'Manage all business aspects of concurrent projects and ensure financial and quality targets are met.',
      avgEarnings: 89700,
      roleReadiness: 'Close Gaps'
    },
    {
      id: '2',
      role: 'Senior Mechanical Project Manager',
      summary: 'Lead all business aspects of concurrent projects and ensure financial and quality targets are met.',
      avgEarnings: 103350,
      roleReadiness: 'Ready'
    }
  ],
  occupations: [
    {
      id: 'occ-3',
      occupation: 'Project Management Specialists',
      summary: 'Oversee projects, resources, and teams to meet deadlines and goals across industries.',
      avgEarnings: 86040,
      roleReadiness: 'Assess Skills'
    },
    {
      id: 'occ-4',
      occupation: 'Software Developers',
      summary: 'Design and build computer software and applications for user and business needs.',
      avgEarnings: 89180,
      roleReadiness: 'Ready'
    },
    {
      id: 'occ-5',
      occupation: 'HR Specialists',
      summary: 'Manage hiring, onboarding, employee relations, and compliance with labor laws.',
      avgEarnings: 64020,
      roleReadiness: 'Close Gaps'
    },
    {
      id: 'occ-8',
      occupation: 'Computer User Support Specialists',
      summary: 'Provide technical assistance and support to users on software and hardware.',
      avgEarnings: 50690,
      roleReadiness: 'Ready'
    },
    {
      id: 'occ-6',
      occupation: 'Sales Reps (Services)',
      summary: 'Sell business services such as software, consulting, or logistics to organizations.',
      avgEarnings: 60510,
      roleReadiness: 'Ready'
    }
  ]
}

function FeaturedRoleCard({ role }: { role: typeof mockFeaturedRoles[0] }) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-3 pb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          {role.logo ? (
            <Image src={role.logo} alt={`${role.company} logo`} width={40} height={40} className="rounded" />
          ) : (
            <span className="text-sm font-semibold text-gray-600">
              {role.company.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{role.title}</h3>
            {role.isTrustedPartner && (
              <Badge variant="secondary" className="text-xs">Trusted Partner</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex gap-2">
            <span>{role.category}</span>•<span>{role.type}</span>•<span>{role.skillsCount} skills</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{role.description}</p>
        <p className="text-sm text-muted-foreground">Median salary: ${role.medianSalary.toLocaleString()}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-sm">About the Company</Button>
          <Button asChild size="sm" className="text-sm">
            <Link href={`/jobs/${role.id}`}>Job Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getRoleReadinessBadge(readiness: string) {
  switch (readiness) {
    case 'Ready':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ready</Badge>
    case 'Close Gaps':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Close Gaps</Badge>
    default:
      return <Badge variant="outline">Assess Skills</Badge>
  }
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('featured-roles')

  const tabs = [
    { id: 'featured-roles', label: 'Featured Roles', isActive: activeTab === 'featured-roles' },
    { id: 'high-demand', label: 'High-Demand Occupations', isActive: activeTab === 'high-demand' },
    { id: 'favorites', label: 'Favorites', isActive: activeTab === 'favorites' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Explore Top Companies Hiring in Pinellas"
        subtitle="Browse job-based opportunities from our trusted employer partners."
        variant="split"
      />
      
      <StickyTabs 
        tabs={tabs}
        onTabChange={setActiveTab}
      />
      
      <div className="max-w-[1280px] mx-auto px-6">
          
          {/* Tab Content */}
          {activeTab === 'featured-roles' && (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-full h-64 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-6">
                  <div className="text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">Featured Roles</h2>
                    <p className="text-blue-100">Discover opportunities from our trusted partners</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search by keyword, category, or SOC code" className="pl-10" />
                </div>
                <Select defaultValue="all-roles">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by: All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-roles">All Roles</SelectItem>
                    <SelectItem value="skilled-trades">Skilled Trades</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="health-education">Health & Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockFeaturedRoles.map((role) => (
                  <FeaturedRoleCard key={role.id} role={role} />
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'high-demand' && (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-full h-64 rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center mb-6">
                  <div className="text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">High-Demand Occupations</h2>
                    <p className="text-green-100">Explore growing career paths in your region</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search occupations by keyword or SOC code" className="pl-10" />
                </div>
                <Select defaultValue="all-occupations">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by: All Occupations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-occupations">All Occupations</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>High-Demand Occupations</CardTitle>
                  <CardDescription>
                    Occupations with strong growth potential and hiring demand in Pinellas County
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Occupation</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Median Salary</TableHead>
                        <TableHead>Open Positions</TableHead>
                        <TableHead>Readiness</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockFavorites.occupations.map((occupation) => (
                        <TableRow key={occupation.id}>
                          <TableCell className="font-medium">
                            <Link href={`/jobs/${occupation.id}`} className="text-blue-600 hover:underline">
                              {occupation.occupation}
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm text-gray-600">{occupation.summary}</p>
                          </TableCell>
                          <TableCell>${occupation.avgEarnings.toLocaleString()}</TableCell>
                          <TableCell>
                            {getRoleReadinessBadge(occupation.roleReadiness)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-full h-64 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-6">
                  <div className="text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">Your Favorites</h2>
                    <p className="text-purple-100">Jobs and occupations you've saved for later</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center py-8 text-gray-500">
                <p>No favorites saved yet. Start exploring jobs and programs to add them to your favorites!</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button onClick={() => setActiveTab('featured-roles')} variant="outline">
                    Browse Featured Roles
                  </Button>
                  <Button onClick={() => setActiveTab('high-demand')} variant="outline">
                    Browse Occupations
                  </Button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
