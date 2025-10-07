import Image from 'next/image'

interface TitleHeroProps {
  title: string
  subtitle?: string
  heroImage?: string
  showHeroOnly?: boolean
  className?: string
}

export function TitleHero({ 
  title, 
  subtitle, 
  heroImage, 
  showHeroOnly = false,
  className = "" 
}: TitleHeroProps) {
  if (showHeroOnly && heroImage) {
    return (
      <div className={`w-full mb-6 ${className}`}>
        <div className="relative w-full h-80 rounded-xl overflow-hidden">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col justify-center items-start gap-5 w-full max-w-[1232px] mx-auto mb-6 ${className}`}>
      {/* Page Title */}
      <h1 className="text-[24px] font-bold leading-[32px] text-[#114B5F] font-source-sans-pro">
        {title}
      </h1>
      
      {/* Hero Image */}
      {heroImage && (
        <div className="relative w-full h-80 rounded-xl overflow-hidden self-stretch">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-gray-600 text-base">
          {subtitle}
        </p>
      )}
    </div>
  )
}
