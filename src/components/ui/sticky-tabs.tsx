'use client'

import React from 'react'

interface TabItem {
  id: string
  label: string
  isActive?: boolean
}

interface StickyTabsProps {
  tabs: TabItem[]
  onTabChange: (tabId: string) => void
  className?: string
}

/**
 * Reusable sticky tabs component with consistent spacing:
 * - 24px padding above and below tabs
 * - Sticky positioning below navbar when scrolling
 * - Background matches page color for seamless look
 * - Border bottom for visual separation
 */
export default function StickyTabs({ tabs, onTabChange, className = '' }: StickyTabsProps) {
  return (
    <div className="bg-gray-50 sticky top-24 z-40">
      <div className={`max-w-[1280px] mx-auto px-6 border-b border-gray-200 mb-7 ${className}`}>
        {/* 24px padding above tabs */}
        <div className="h-6"></div>
        
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tab.isActive
                  ? 'border-[#0694A2] text-[#0694A2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* 24px padding below tabs */}
        <div className="h-6"></div>
      </div>
    </div>
  )
}
