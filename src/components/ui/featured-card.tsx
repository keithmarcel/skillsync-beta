import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, DollarSign } from 'lucide-react'
import { ReactNode } from 'react'

interface FeaturedCardProps {
  id: string
  title: string
  description: string
  location?: string
  salary?: string
  company?: string
  badges?: string[]
  imageUrl?: string
  href: string
  isFavorited?: boolean
  onFavoriteToggle?: (id: string) => void
  className?: string
}

export function FeaturedCard({ 
  id,
  title, 
  description, 
  location,
  salary,
  company,
  badges = [],
  imageUrl,
  href,
  isFavorited = false,
  onFavoriteToggle,
  className = ""
}: FeaturedCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
          {onFavoriteToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFavoriteToggle(id)}
              className="p-1 h-auto"
            >
              <Heart 
                className={`w-5 h-5 ${
                  isFavorited 
                    ? 'fill-rose-500 text-rose-500' 
                    : 'text-gray-400 hover:text-rose-500'
                }`}
              />
            </Button>
          )}
        </div>
        
        {company && (
          <p className="text-sm text-gray-600 font-medium">{company}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-3">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{salary}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button asChild className="w-full">
          <Link href={href}>
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
