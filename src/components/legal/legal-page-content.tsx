import { ReactNode } from 'react'

interface LegalPageContentProps {
  title: string
  lastUpdated?: string
  children: ReactNode
}

/**
 * Reusable legal page content component
 * Single source of truth for legal page styling
 * Used by all legal pages: Terms of Use, User Agreement, Privacy Policy
 */
export function LegalPageContent({ title, lastUpdated, children }: LegalPageContentProps) {
  const displayDate = lastUpdated || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: {displayDate}</p>

      <div className="space-y-6 text-gray-700 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-700 [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-7 [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:list-outside [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:list-outside [&_li]:mb-2 [&_li]:leading-7 [&_a]:text-[#0694A2] [&_a]:underline hover:[&_a]:text-[#047481] [&_strong]:font-semibold [&_strong]:text-gray-900 [&_section]:mb-8">
        {children}
      </div>
    </article>
  )
}
