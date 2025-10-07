import React from 'react'
import Image from 'next/image'

interface IllustrationHeroProps {
  imageSrc: string
  imageAlt: string
  title: string
  className?: string
}

export function IllustrationHero({ 
  imageSrc, 
  imageAlt, 
  title,
  className = '' 
}: IllustrationHeroProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Illustration Container with rounded top corners */}
      <div 
        className="w-full h-[286.76px] overflow-hidden block"
        style={{
          borderRadius: '12px 12px 0px 0px',
          display: 'block',
          lineHeight: 0,
          marginBottom: '-4px'
        }}
      >
        <img 
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-contain block"
          style={{
            display: 'block'
          }}
        />
      </div>
      
      {/* Title Container */}
      <div 
        className="w-full flex flex-row items-center px-5 py-3"
        style={{
          background: '#114B5F',
          borderRadius: '0px 0px 12px 12px',
          minHeight: '56px'
        }}
      >
        <h2 className="text-[#F9FAFB] font-bold text-[24px] leading-[32px] font-source-sans-pro">
          {title}
        </h2>
      </div>
    </div>
  )
}
