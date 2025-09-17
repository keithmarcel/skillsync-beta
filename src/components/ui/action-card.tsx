import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from 'react'

interface ActionCardProps {
  title: string
  description: string
  buttonText: string
  href: string
  icon?: ReactNode
  className?: string
}

export function ActionCard({ 
  title, 
  description, 
  buttonText, 
  href, 
  icon,
  className = ""
}: ActionCardProps) {
  return (
    <Card className={`bg-teal-600 text-white ${className}`}>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-teal-50 text-sm mb-4">
          {description}
        </p>
        <Button 
          variant="secondary" 
          size="sm" 
          className="hover:bg-teal-100 hover:text-gray-900 transition-colors text-sm" 
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
