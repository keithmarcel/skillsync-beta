'use client'

import { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface SectionWithTabsProps {
  heading: string
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  maxWidth?: string
  contentMaxWidth?: string
  centerContent?: boolean
}

export function SectionWithTabs({
  heading,
  tabs,
  activeTab,
  onTabChange,
  maxWidth = 'max-w-md',
  contentMaxWidth = 'max-w-[672px]',
  centerContent = true
}: SectionWithTabsProps) {
  // Map tab count to Tailwind grid-cols class (Tailwind needs explicit class names)
  const gridColsClass = tabs.length === 2 ? 'grid-cols-2' : tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 font-source-sans-pro">{heading}</h2>
      
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className={`grid w-full ${maxWidth} ${gridColsClass}`}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className={`mt-6 ${centerContent ? 'flex justify-center' : ''}`}>
          <div className={`w-full ${contentMaxWidth}`}>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  )
}
