'use client'

import { MoreHorizontal, Heart, Eye, Building } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FeaturedCardActionsProps {
  entityType: 'job' | 'program'
  entityId: string
  entityTitle: string
  isFavorited: boolean
  onAddFavorite: () => void
  onRemoveFavorite: () => void
  onViewDetails?: () => void
  onAboutCompany?: () => void
  onAboutSchool?: () => void
}

export function FeaturedCardActions({
  entityType,
  entityId,
  entityTitle,
  isFavorited,
  onAddFavorite,
  onRemoveFavorite,
  onViewDetails,
  onAboutCompany,
  onAboutSchool
}: FeaturedCardActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          aria-label={`Actions for ${entityTitle}`}
        >
          <MoreHorizontal className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onViewDetails && (
          <>
            <DropdownMenuItem onClick={onViewDetails}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {onAboutCompany && (
          <>
            <DropdownMenuItem onClick={onAboutCompany}>
              <Building className="mr-2 h-4 w-4" />
              About the Company
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {onAboutSchool && (
          <>
            <DropdownMenuItem onClick={onAboutSchool}>
              <Building className="mr-2 h-4 w-4" />
              About the School
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {isFavorited ? (
          <DropdownMenuItem onClick={onRemoveFavorite} className="whitespace-nowrap">
            <Heart className="mr-2 h-4 w-4 fill-current" />
            Remove from Favorites
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onAddFavorite} className="whitespace-nowrap">
            <Heart className="mr-2 h-4 w-4" />
            Add to Favorites
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

