'use client'

import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FeaturedCardActionsProps {
  entityType: 'job' | 'program'
  entityId: string
  entityTitle: string
  isFavorited: boolean
  onAddFavorite: () => void
  onRemoveFavorite: () => void
  onViewDetails: () => void
}

export function FeaturedCardActions({
  entityType,
  entityId,
  entityTitle,
  isFavorited,
  onAddFavorite,
  onRemoveFavorite,
  onViewDetails
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
        <DropdownMenuItem onClick={onViewDetails}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={isFavorited ? onRemoveFavorite : onAddFavorite}>
          {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
