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
import { User, Settings, Heart, LogOut, FileText } from 'lucide-react'

interface UserMenuProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  onSignOut?: () => void
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-8 h-8 p-0 rounded-full hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
            <AvatarFallback className="text-xs bg-teal-100 text-teal-700 font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg"
        sideOffset={8}
      >
        {user && (
          <>
            <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                <AvatarFallback className="text-xs bg-teal-100 text-teal-700 font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </>
        )}
        
        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
          <Settings className="w-4 h-4" />
          Account Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link 
            href="/assessments" 
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            My Assessments
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
          <Heart className="w-4 h-4" />
          Favorites
        </DropdownMenuItem>
        
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
