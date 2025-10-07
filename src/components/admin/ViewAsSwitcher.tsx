'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, User, Building2, GraduationCap, Shield } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

type ViewAsMode = 'super_admin' | 'employer_admin' | 'provider_admin' | 'user'

export function ViewAsSwitcher() {
  const router = useRouter()
  const { isSuperAdmin } = useAuth()
  const [viewAsMode, setViewAsMode] = useState<ViewAsMode>('super_admin')

  // Only show for super admins
  if (!isSuperAdmin) return null

  // Load saved view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('viewAsMode') as ViewAsMode
    if (saved) {
      setViewAsMode(saved)
    }
  }, [])

  const handleViewChange = (mode: ViewAsMode) => {
    setViewAsMode(mode)
    localStorage.setItem('viewAsMode', mode)
    
    // Navigate to appropriate dashboard
    switch (mode) {
      case 'employer_admin':
        router.push('/employer')
        break
      case 'provider_admin':
        router.push('/provider')
        break
      case 'user':
        router.push('/')
        break
      case 'super_admin':
        router.push('/admin')
        break
    }
  }

  const getIcon = (mode: ViewAsMode) => {
    switch (mode) {
      case 'super_admin':
        return <Shield className="w-4 h-4" />
      case 'employer_admin':
        return <Building2 className="w-4 h-4" />
      case 'provider_admin':
        return <GraduationCap className="w-4 h-4" />
      case 'user':
        return <User className="w-4 h-4" />
    }
  }

  const getLabel = (mode: ViewAsMode) => {
    switch (mode) {
      case 'super_admin':
        return 'Super Admin'
      case 'employer_admin':
        return 'Employer Admin'
      case 'provider_admin':
        return 'Provider Admin'
      case 'user':
        return 'Regular User'
    }
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="px-3 mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Eye className="w-4 h-4" />
          <span>View As</span>
        </div>
      </div>
      
      <div className="px-3">
        <Select value={viewAsMode} onValueChange={(value) => handleViewChange(value as ViewAsMode)}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {getIcon(viewAsMode)}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="super_admin">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Super Admin</span>
              </div>
            </SelectItem>
            <SelectItem value="employer_admin">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Employer Admin</span>
              </div>
            </SelectItem>
            <SelectItem value="provider_admin">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>Provider Admin</span>
              </div>
            </SelectItem>
            <SelectItem value="user">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Regular User</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <p className="text-xs text-gray-500 mt-2">
          Switch views to test different user experiences
        </p>
      </div>
    </div>
  )
}
