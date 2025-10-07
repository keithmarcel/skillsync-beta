import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProviderDashboardPage from '@/app/(main)/provider/page'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Provider Dashboard', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockSearchParams = {
    get: vi.fn(),
    toString: vi.fn(() => ''),
  }

  const mockSchool = {
    id: 'school-123',
    name: 'St. Petersburg College',
    logo_url: 'https://example.com/logo.png',
    city: 'St. Petersburg',
    state: 'FL',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useSearchParams as any).mockReturnValue(mockSearchParams)
  })

  describe('Authentication & Access Control', () => {
    it('should show loading state while authenticating', () => {
      ;(useAuth as any).mockReturnValue({
        user: null,
        profile: null,
        loading: true,
        isProviderAdmin: false,
      })

      render(<ProviderDashboardPage />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should deny access for non-provider admins', () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'user' },
        loading: false,
        isProviderAdmin: false,
      })

      render(<ProviderDashboardPage />)
      expect(screen.getByText(/Access denied/i)).toBeInTheDocument()
      expect(screen.getByText(/Provider admin access required/i)).toBeInTheDocument()
    })

    it('should show error when no school is associated', async () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'provider_admin', school_id: null },
        loading: false,
        isProviderAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('No school found'),
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/No school associated/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation & URL Routing', () => {
    beforeEach(() => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'provider_admin', school_id: 'school-123' },
        loading: false,
        isProviderAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchool,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)
    })

    it('should default to dashboard tab when no tab param', async () => {
      mockSearchParams.get.mockReturnValue(null)

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Engagement Dashboard')).toBeInTheDocument()
      })
    })

    it('should load tab from URL parameter', async () => {
      mockSearchParams.get.mockReturnValue('programs')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Manage Your Listed Programs')).toBeInTheDocument()
      })
    })

    it('should update URL when tab changes', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      const { container } = render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(`Welcome, ${mockSchool.name}!`)).toBeInTheDocument()
      })

      // Find and click the Listed Programs tab
      const programsTab = screen.getByText('Listed Programs')
      fireEvent.click(programsTab)

      expect(mockRouter.push).toHaveBeenCalledWith('/provider?tab=programs')
    })

    it('should render all three tabs', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Listed Programs')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })
  })

  describe('Page Header & School Info', () => {
    beforeEach(() => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'provider_admin', school_id: 'school-123' },
        loading: false,
        isProviderAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchool,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)
    })

    it('should display school name in header', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(`Welcome, ${mockSchool.name}!`)).toBeInTheDocument()
      })
    })

    it('should display location in subtitle when available', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/Top High Demand Jobs in St. Petersburg/i)).toBeInTheDocument()
      })
    })

    it('should display fallback subtitle when location not available', async () => {
      const schoolWithoutLocation = { ...mockSchool, city: null, state: null }
      
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: schoolWithoutLocation,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      mockSearchParams.get.mockReturnValue('dashboard')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/Manage Your Programs/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Tab Content', () => {
    beforeEach(() => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'provider_admin', school_id: 'school-123' },
        loading: false,
        isProviderAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSchool,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)
    })

    it('should render dashboard widgets placeholder', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard Widgets')).toBeInTheDocument()
        expect(screen.getByText(/Place useful widgets for employer admins here/i)).toBeInTheDocument()
      })
    })
  })

  describe('Data Fetching', () => {
    it('should fetch school data on mount', async () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'provider_admin', school_id: 'school-123' },
        loading: false,
        isProviderAdmin: true,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockSchool,
            error: null,
          }),
        }),
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      mockSearchParams.get.mockReturnValue('dashboard')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('schools')
        expect(mockSelect).toHaveBeenCalledWith('*')
      })
    })

    it('should handle school fetch errors gracefully', async () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'provider_admin', school_id: 'school-123' },
        loading: false,
        isProviderAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      mockSearchParams.get.mockReturnValue('dashboard')

      render(<ProviderDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/No school associated/i)).toBeInTheDocument()
      })
    })
  })
})
