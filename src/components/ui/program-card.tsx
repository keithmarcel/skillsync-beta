import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, BookOpen } from 'lucide-react'
import Image from 'next/image'

interface ProgramCardProps {
  id: string
  name: string
  school: {
    name: string
    logo?: string
  }
  programType: string
  format: string
  duration: string
  description: string
  skillsCallout?: {
    type: 'jobs' | 'skills'
    count: number
    label: string
    href?: string
  }
  aboutSchoolHref: string
  programDetailsHref: string
  className?: string
}

export function ProgramCard({ 
  id,
  name,
  school,
  programType,
  format,
  duration,
  description,
  skillsCallout,
  aboutSchoolHref,
  programDetailsHref,
  className = ""
}: ProgramCardProps) {
  return (
    <Card className={`rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-4">
        {/* School Logo and Name */}
        <div className="flex items-center gap-3 mb-4">
          {school.logo ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <Image 
                src={school.logo} 
                alt={`${school.name} logo`} 
                width={48} 
                height={48}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <span className="text-lg font-bold">
                {school.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
        </div>

        {/* School Name */}
        <div className="text-sm text-gray-600 mb-2">
          {school.name}
        </div>

        {/* Program Title */}
        <h3 className="text-xl font-semibold text-gray-900">{name}</h3>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          <Badge variant="secondary" className="text-xs font-medium">{programType}</Badge>
          <Badge variant="secondary" className="text-xs font-medium">{format}</Badge>
          <Badge variant="secondary" className="text-xs font-medium">{duration}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Program Description */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>

        {/* Skills/Jobs Callout */}
        {skillsCallout && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {skillsCallout.label}
                </span>
              </div>
              {skillsCallout.href && (
                <Button asChild variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                  <Link href={skillsCallout.href}>
                    See {skillsCallout.type === 'jobs' ? 'Jobs' : 'Skills'}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            asChild
            variant="outline" 
            className="flex-1 border-gray-200 hover:bg-gray-50"
          >
            <Link href={aboutSchoolHref}>
              About the School
            </Link>
          </Button>
          <Button 
            asChild
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            <Link href={programDetailsHref}>
              Program Details →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
