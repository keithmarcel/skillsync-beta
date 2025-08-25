import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, DollarSign, Target } from 'lucide-react'
import Image from 'next/image'

interface FeaturedRoleCardProps {
  id: string
  title: string
  company: {
    name: string
    logo?: string
    bio?: string
    headquarters?: string
    revenue?: string
    employees?: string
    industry?: string
    isTrustedPartner: boolean
  }
  category: string
  jobType: string
  skillsCount: number
  description: string
  medianSalary: number
  requiredProficiency: number
  href: string
  onAboutCompany?: () => void
  className?: string
}

export function FeaturedRoleCard({ 
  id,
  title,
  company,
  category,
  jobType,
  skillsCount,
  description,
  medianSalary,
  requiredProficiency,
  href,
  onAboutCompany,
  className = ""
}: FeaturedRoleCardProps) {
  return (
    <Card className={`rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-4">
        {/* Company Logo and Trusted Partner Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              {company.logo ? (
                <img src={company.logo} alt="logo" className="w-10 h-10 rounded" />
              ) : (
                <span className="text-lg font-semibold">{company.name[0]}</span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{company.name}</p>
            </div>
          </div>
          {company.isTrustedPartner && (
            <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">
              Trusted Partner
            </Badge>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          <Badge variant="secondary" className="text-xs font-medium">{category}</Badge>
          <Badge variant="secondary" className="text-xs font-medium">{jobType}</Badge>
          <Badge variant="secondary" className="text-xs font-medium">{skillsCount} skills</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Job Description */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>

        {/* Info Boxes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Median Salary</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              ${medianSalary.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-gray-600">Required Proficiency</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {requiredProficiency}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={onAboutCompany}
            variant="outline" 
            className="flex-1 border-gray-200 hover:bg-gray-50"
          >
            About the Company
          </Button>
          <Button 
            asChild
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            <Link href={href}>
              Job Details →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
