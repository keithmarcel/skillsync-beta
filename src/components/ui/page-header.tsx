import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageHeaderProps {
  title?: string
  subtitle?: string
  primaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  variant?: 'default' | 'centered' | 'split'
  isDynamic?: boolean
  userName?: string
  isReturningUser?: boolean
}

export function PageHeader({ 
  title, 
  subtitle, 
  primaryAction, 
  secondaryAction, 
  variant = 'default',
  isDynamic = false,
  userName,
  isReturningUser = false
}: PageHeaderProps) {
  
  // Generate dynamic greeting for homepage
  const getDynamicTitle = () => {
    if (!isDynamic) return title
    
    if (userName) {
      return isReturningUser ? `Welcome back, ${userName}!` : `Welcome, ${userName}!`
    } else {
      return isReturningUser ? "Welcome back!" : "Welcome!"
    }
  }
  
  const dynamicTitle = getDynamicTitle()
  const dynamicSubtitle = isDynamic ? "Track your progress and take your next step toward career readiness." : subtitle
  if (variant === 'split') {
    return (
      <div className="bg-[#114B5F] py-12 mt-4">
        <div className="max-w-[1280px] mx-auto px-6 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-white font-bold text-[30px] leading-[36px]">
              {dynamicTitle}
            </h1>
            {dynamicSubtitle && (
              <p className="text-teal-50 text-base font-normal">
                {dynamicSubtitle}
              </p>
            )}
          </div>
          {primaryAction && !isDynamic && (
            <div className="flex items-center gap-4">
              {primaryAction.href ? (
                <Button 
                  asChild
                  className="flex h-9 px-2 py-4 justify-center items-center gap-2 rounded-md border border-teal-100 bg-teal-500 hover:bg-teal-600 text-white shadow-sm"
                >
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
              ) : (
                <Button 
                  onClick={primaryAction.onClick}
                  className="flex h-9 px-2 py-4 justify-center items-center gap-2 rounded-md border border-teal-100 bg-teal-500 hover:bg-teal-600 text-white shadow-sm"
                >
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <>
                  {secondaryAction.href ? (
                    <Button 
                      asChild
                      variant="outline"
                      className="flex h-9 px-2 py-4 justify-center items-center gap-2 rounded-md border border-teal-100 bg-white text-teal-900 hover:bg-teal-50 shadow-sm"
                    >
                      <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={secondaryAction.onClick}
                      className="flex h-9 px-2 py-4 justify-center items-center gap-2 rounded-md border border-teal-100 bg-white text-teal-900 hover:bg-teal-50 shadow-sm"
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const containerClasses = variant === 'centered' 
    ? "flex justify-center items-center bg-[#114B5F] py-8"
    : "bg-[#114B5F] py-8"

  const contentClasses = variant === 'centered'
    ? "flex flex-col items-center gap-6 max-w-[1280px] px-6 text-center"
    : "max-w-[1280px] mx-auto px-6"

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <h1 className="text-white font-bold text-[30px] leading-[36px]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-teal-50 text-base font-normal">
            {subtitle}
          </p>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-4">
            {primaryAction && (
              <>
                {primaryAction.href ? (
                  <Button 
                    asChild
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={primaryAction.onClick}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
                  >
                    {primaryAction.label}
                  </Button>
                )}
              </>
            )}
            {secondaryAction && (
              <>
                {secondaryAction.href ? (
                  <Button 
                    asChild
                    variant="outline"
                    className="border border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 px-4 py-2 rounded-lg"
                  >
                    <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={secondaryAction.onClick}
                    className="border border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 px-4 py-2 rounded-lg"
                  >
                    {secondaryAction.label}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
