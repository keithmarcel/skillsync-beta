import { cn } from "@/lib/utils"

interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner' | 'pulse'
  count?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ 
  variant = 'skeleton', 
  count = 1, 
  className = "",
  size = 'md'
}: LoadingStateProps) {
  if (variant === 'spinner') {
    const spinnerSizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6', 
      lg: 'w-8 h-8'
    }

    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className={cn(
          "border-2 border-gray-200 border-t-[#0694A2] rounded-full animate-spin",
          spinnerSizes[size]
        )} />
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("animate-pulse", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded h-4 mb-2" />
        ))}
      </div>
    )
  }

  // Default skeleton variant
  const skeletonSizes = {
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32'
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className={cn(
            "bg-gray-200 rounded",
            skeletonSizes[size]
          )} />
        </div>
      ))}
    </div>
  )
}
