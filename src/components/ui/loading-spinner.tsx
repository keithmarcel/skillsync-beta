import React from 'react'
import { SpinnerDiamond } from 'spinners-react'

interface LoadingSpinnerProps {
  size?: number
  color?: string
  text?: string
  className?: string
  variant?: 'diamond' | 'circular'
}

export function LoadingSpinner({ 
  size = 60, 
  color = '#0694A2', // Teal from SkillSync palette
  text,
  className = '',
  variant = 'diamond'
}: LoadingSpinnerProps) {
  if (variant === 'circular') {
    // Fallback to CSS spinner for circular variant
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div 
          className="border-4 border-gray-200 rounded-full animate-spin"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderTopColor: color
          }}
        />
        {text && (
          <p className="text-sm text-gray-600 font-normal mt-4">{text}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <SpinnerDiamond 
        size={size}
        thickness={100}
        speed={100}
        color={color}
        secondaryColor="rgba(6, 148, 162, 0.2)"
      />
      {text && (
        <p className="text-sm text-gray-600 font-normal mt-4">{text}</p>
      )}
    </div>
  )
}

// Convenience wrapper for common loading states
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <LoadingSpinner size={60} text={text} />
    </div>
  )
}

// Small inline spinner
export function InlineSpinner({ size = 20 }: { size?: number }) {
  return <LoadingSpinner size={size} variant="circular" />
}
