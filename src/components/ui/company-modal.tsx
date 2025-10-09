'use client'

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useState } from "react"

interface CompanyModalProps {
  isOpen: boolean
  onClose: () => void
  company: {
    name: string
    logo: string
    companyImage?: string
    bio: string
    headquarters: string
    revenue: string
    employees: string
    industry: string
    trustedPartner: boolean
  }
}

export function CompanyModal({ isOpen, onClose, company }: CompanyModalProps) {
  const [logoSize, setLogoSize] = useState<'small' | 'large'>('large')
  
  const handleLogoLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    // Check if it's Raymond James logo specifically
    const isRaymondJames = img.src.includes('Raymond') || img.alt.includes('Raymond James')
    setLogoSize(isRaymondJames ? 'small' : 'large')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" hideCloseButton>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 hover:bg-white transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="space-y-6">
          {/* Company Logo */}
          <div className="p-6 pb-0">
            <img 
              src={company.logo || '/companies/placeholder-logo.svg'} 
              alt={`${company.name} logo`} 
              className={`w-auto object-contain ${logoSize === 'small' ? 'h-6' : 'h-10'}`}
              onLoad={handleLogoLoad}
              onError={(e) => {
                e.currentTarget.src = '/companies/placeholder-logo.svg'
              }}
            />
          </div>

          {/* Company Image */}
          <div className="px-6">
            <img 
              src="https://plus.unsplash.com/premium_photo-1725400817468-ddb0135d865d?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Company workplace"
              className="w-full h-[199px] object-cover object-top rounded-xl"
            />
          </div>

          <div className="px-6">
            {/* About Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {company.name}</h3>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                {company.bio ? (
                  company.bio.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p>Company description coming soon.</p>
                )}
              </div>
            </div>

            {/* Company Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Headquarters</h4>
                <p className="text-sm text-gray-700 font-medium">{company.headquarters || 'Location not specified'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Revenue</h4>
                <p className="text-sm text-gray-700 font-medium">{company.revenue || 'Revenue not disclosed'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Employees</h4>
                <p className="text-sm text-gray-700 font-medium">{company.employees || 'Employee count not specified'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Industry</h4>
                <p className="text-sm text-gray-700 font-medium">{company.industry || 'Industry not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
