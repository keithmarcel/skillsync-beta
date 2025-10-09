import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from 'react'

interface ActionCardProps {
  title: string
  description: string
  buttonText: string
  href: string
  icon?: ReactNode
  imageUrl?: string
  className?: string
}

export function ActionCard({ 
  title, 
  description, 
  buttonText, 
  href, 
  icon,
  imageUrl,
  className = ""
}: ActionCardProps) {
  return (
    <Card className={`overflow-hidden border-0 shadow-none bg-transparent rounded-xl ${className}`}>
      {imageUrl && (
        <div className="relative w-full bg-transparent" style={{ height: '11.5rem', marginBottom: '-1px' }}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover rounded-t-xl"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardContent className="p-4 sm:p-6 bg-teal-600 text-white rounded-b-xl">
        <h3 className="text-base sm:text-lg mb-2 text-white font-semibold leading-snug" style={{ fontFamily: 'Source Sans Pro, sans-serif' }}>
          {title}
        </h3>
        <p className="text-sm mb-4 text-teal-50 leading-relaxed">
          {description}
        </p>
        <Button 
          variant="secondary"
          size="sm" 
          className="hover:bg-teal-100 hover:text-gray-900 transition-colors text-sm bg-white text-gray-900"
          asChild
        >
          <Link href={href} className="flex items-center gap-2">
            {buttonText}
            {icon || (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            )}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
