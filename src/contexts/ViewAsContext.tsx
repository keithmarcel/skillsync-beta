'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type ViewAsMode = 'super_admin' | 'employer_admin' | 'provider_admin' | 'user' | null

interface ViewAsContextType {
  viewAsMode: ViewAsMode
  setViewAsMode: (mode: ViewAsMode) => void
  isViewingAs: boolean
  actualRole: string | null
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined)

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsMode, setViewAsModeState] = useState<ViewAsMode>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('viewAsMode') as ViewAsMode
    if (saved && saved !== 'super_admin') {
      setViewAsModeState(saved)
    }
  }, [])

  const setViewAsMode = (mode: ViewAsMode) => {
    setViewAsModeState(mode)
    if (mode && mode !== 'super_admin') {
      localStorage.setItem('viewAsMode', mode)
    } else {
      localStorage.removeItem('viewAsMode')
    }
  }

  return (
    <ViewAsContext.Provider
      value={{
        viewAsMode,
        setViewAsMode,
        isViewingAs: viewAsMode !== null && viewAsMode !== 'super_admin',
        actualRole: null, // Will be set by useAuth
      }}
    >
      {children}
    </ViewAsContext.Provider>
  )
}

export function useViewAs() {
  const context = useContext(ViewAsContext)
  if (context === undefined) {
    throw new Error('useViewAs must be used within a ViewAsProvider')
  }
  return context
}
