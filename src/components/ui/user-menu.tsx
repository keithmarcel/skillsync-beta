'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, FileText, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface UserMenuProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  onSignOut?: () => void
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const { isAdmin } = useAuth();
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="!w-10 !h-10 p-0 m-0 rounded-full hover:opacity-90 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-opacity flex items-center justify-center overflow-hidden">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user?.avatar} 
              alt={user?.name || 'User'}
              loading="eager"
            />
            <AvatarFallback className="text-sm bg-teal-100 text-teal-700 font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-auto min-w-56 max-w-xs mt-2 bg-white border border-gray-200 rounded-lg shadow-lg"
        sideOffset={8}
      >
        {user && (
          <>
            <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage 
                  src={user.avatar} 
                  alt={user.name || 'User'}
                  loading="eager"
                />
                <AvatarFallback className="text-xs bg-teal-100 text-teal-700 font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </>
        )}
        
        <DropdownMenuItem asChild>
          <Link 
            href="/account-settings" 
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link 
            href="/my-assessments" 
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            My Assessments
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator className="my-1 bg-gray-100" />
            <DropdownMenuItem asChild>
              <Link 
                href="/admin" 
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                Admin Tools
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator className="my-1 bg-gray-100" />
        
        <DropdownMenuItem 
          className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          onClick={onSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
