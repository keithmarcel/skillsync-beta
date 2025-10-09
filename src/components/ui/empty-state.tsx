import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BUTTON_STYLES } from '@/lib/design-system'
import Link from 'next/link'
import { ReactNode } from 'react'

interface EmptyStateProps {
  // Content
  title: string
  description: string
  icon?: ReactNode
  
  // Actions (all optional)
  primaryButtonText?: string
  primaryButtonHref?: string
  onPrimaryClick?: () => void
  
  secondaryButtonText?: string
  secondaryButtonHref?: string
  onSecondaryClick?: () => void
  
  // Styling
  variant?: 'card' | 'gradient' | 'inline'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  primaryButtonText,
  primaryButtonHref,
  onPrimaryClick,
  secondaryButtonText,
  secondaryButtonHref,
  onSecondaryClick,
  variant = 'card',
  className = ""
}: EmptyStateProps) {
  
  // Default icon if none provided
  const defaultIcon = (
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
  )

  const renderButtons = () => {
    if (!primaryButtonText && !secondaryButtonText) return null

    return (
      <div className="flex gap-2 justify-center flex-wrap">
        {primaryButtonText && (
          primaryButtonHref ? (
            <Button asChild className={variant === 'gradient' ? 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white' : BUTTON_STYLES.primary}>
              <Link href={primaryButtonHref}>{primaryButtonText}</Link>
            </Button>
          ) : (
            <Button onClick={onPrimaryClick} className={variant === 'gradient' ? 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white' : BUTTON_STYLES.primary}>
              {primaryButtonText}
            </Button>
          )
        )}
        {secondaryButtonText && (
          secondaryButtonHref ? (
            <Button asChild className={variant === 'gradient' ? 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white' : BUTTON_STYLES.secondary}>
              <Link href={secondaryButtonHref}>{secondaryButtonText}</Link>
            </Button>
          ) : (
            <Button onClick={onSecondaryClick} className={variant === 'gradient' ? 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white' : BUTTON_STYLES.secondary}>
              {secondaryButtonText}
            </Button>
          )
        )}
      </div>
    )
  }

  // Gradient variant (for full-page empty states)
  if (variant === 'gradient') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="w-full h-80 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 flex flex-col items-center justify-center p-8">
          <div className="text-white text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
          </div>
          <div className="text-center text-white/90">
            <p className="mb-6">{description}</p>
            {renderButtons()}
          </div>
        </div>
      </div>
    )
  }

  // Inline variant (for smaller empty states within sections)
  if (variant === 'inline') {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        {icon || defaultIcon}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
          {description}
        </p>
        {renderButtons()}
      </div>
    )
  }

  // Card variant (default - for contained empty states)
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon || defaultIcon}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          {description}
        </p>
        {renderButtons()}
      </CardContent>
    </Card>
  )
}
