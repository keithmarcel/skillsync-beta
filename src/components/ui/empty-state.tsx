import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description: string
  primaryButtonText: string
  secondaryButtonText: string
  onPrimaryClick: () => void
  onSecondaryClick: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryClick,
  onSecondaryClick,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hero Section with Gradient containing empty state content */}
      <div className="w-full h-80 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 flex flex-col items-center justify-center p-8">
        <div className="text-white text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
        </div>
        
        {/* Empty State Content inside gradient */}
        <div className="text-center text-white/90">
          <p className="mb-6">{description}</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={onPrimaryClick}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              {primaryButtonText}
            </Button>
            <Button 
              variant="outline" 
              onClick={onSecondaryClick}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              {secondaryButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
