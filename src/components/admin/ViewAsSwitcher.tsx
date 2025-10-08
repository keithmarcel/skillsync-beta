'use client'

import { useRouter } from 'next/navigation'
import { Eye, User, Building2, GraduationCap, Shield } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useViewAs } from '@/contexts/ViewAsContext'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'

type ViewAsMode = 'super_admin' | 'employer_admin' | 'provider_admin' | 'user'

export function ViewAsSwitcher() {
  const router = useRouter()
  const { isSuperAdmin } = useAuth()
  const { viewAsMode, setViewAsMode, isViewingAs } = useViewAs()

  if (!isSuperAdmin) {
    return null
  }

  const handleViewChange = (mode: ViewAsMode) => {
    setViewAsMode(mode === 'super_admin' ? null : mode)
    
    // Navigate to the appropriate view
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

  const currentMode = viewAsMode || 'super_admin'

  return (
    <div className="space-y-2">
      {isViewingAs && (
        <Badge variant="outline" className="w-full justify-center bg-amber-50 text-amber-700 border-amber-200">
          Viewing as {getLabel(currentMode as ViewAsMode)}
        </Badge>
      )}
      
      <div>
        <Select value={currentMode} onValueChange={(value) => handleViewChange(value as ViewAsMode)}>
          <SelectTrigger className="w-full">
            <SelectValue />
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
      </div>
    </div>
  )
}
