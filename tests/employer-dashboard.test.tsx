import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import EmployerDashboardPage from '@/app/(main)/employer/page'
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

describe('Employer Dashboard', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockSearchParams = {
    get: vi.fn(),
    toString: vi.fn(() => ''),
  }

  const mockCompany = {
    id: 'company-123',
    name: 'Power Design',
    logo_url: 'https://example.com/logo.png',
    city: 'Pinellas',
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
        isEmployerAdmin: false,
      })

      render(<EmployerDashboardPage />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should deny access for non-employer admins', () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'user' },
        loading: false,
        isEmployerAdmin: false,
      })

      render(<EmployerDashboardPage />)
      expect(screen.getByText(/Access denied/i)).toBeInTheDocument()
      expect(screen.getByText(/Employer admin access required/i)).toBeInTheDocument()
    })

    it('should show error when no company is associated', async () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'employer_admin', company_id: null },
        loading: false,
        isEmployerAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('No company found'),
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/No company associated/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation & URL Routing', () => {
    beforeEach(() => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'employer_admin', company_id: 'company-123' },
        loading: false,
        isEmployerAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCompany,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)
    })

    it('should default to dashboard tab when no tab param', async () => {
      mockSearchParams.get.mockReturnValue(null)

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Engagement Dashboard')).toBeInTheDocument()
      })
    })

    it('should load tab from URL parameter - roles', async () => {
      mockSearchParams.get.mockReturnValue('roles')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Manage Your Listed Roles')).toBeInTheDocument()
      })
    })

    it('should load tab from URL parameter - invites', async () => {
      mockSearchParams.get.mockReturnValue('invites')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Manage Your Invites')).toBeInTheDocument()
      })
    })

    it('should update URL when tab changes', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(`Welcome, ${mockCompany.name}!`)).toBeInTheDocument()
      })

      // Find and click the Listed Roles tab
      const rolesTab = screen.getByText('Listed Roles')
      fireEvent.click(rolesTab)

      expect(mockRouter.push).toHaveBeenCalledWith('/employer?tab=roles')
    })

    it('should render all four tabs', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Listed Roles')).toBeInTheDocument()
        expect(screen.getByText('Invites')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })
  })

  describe('Page Header & Company Info', () => {
    beforeEach(() => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'employer_admin', company_id: 'company-123' },
        loading: false,
        isEmployerAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCompany,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)
    })

    it('should display company name in header', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(`Welcome, ${mockCompany.name}!`)).toBeInTheDocument()
      })
    })

    it('should display location in subtitle when available', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/Top High Demand Jobs in Pinellas/i)).toBeInTheDocument()
      })
    })

    it('should display fallback subtitle when location not available', async () => {
      const companyWithoutLocation = { ...mockCompany, city: null, state: null }
      
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: companyWithoutLocation,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      mockSearchParams.get.mockReturnValue('dashboard')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/Manage your profile details/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Tab Content', () => {
    beforeEach(() => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'employer_admin', company_id: 'company-123' },
        loading: false,
        isEmployerAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCompany,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)
    })

    it('should render dashboard widgets placeholder', async () => {
      mockSearchParams.get.mockReturnValue('dashboard')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard Widgets')).toBeInTheDocument()
        expect(screen.getByText(/Place useful widgets for provider admins here/i)).toBeInTheDocument()
      })
    })
  })

  describe('Data Fetching', () => {
    it('should fetch company data on mount', async () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'employer_admin', company_id: 'company-123' },
        loading: false,
        isEmployerAdmin: true,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCompany,
            error: null,
          }),
        }),
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      mockSearchParams.get.mockReturnValue('dashboard')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('companies')
        expect(mockSelect).toHaveBeenCalledWith('*')
      })
    })

    it('should handle company fetch errors gracefully', async () => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'employer_admin', company_id: 'company-123' },
        loading: false,
        isEmployerAdmin: true,
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

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/No company associated/i)).toBeInTheDocument()
      })
    })
  })

  describe('Invites Tab - Critical Integration', () => {
    beforeEach(() => {
      ;(useAuth as any).mockReturnValue({
        user: { id: 'user-123' },
        profile: { role: 'employer_admin', company_id: 'company-123' },
        loading: false,
        isEmployerAdmin: true,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCompany,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase.from as any).mockImplementation(mockFrom)
    })

    it('should render invites management interface', async () => {
      mockSearchParams.get.mockReturnValue('invites')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Manage Your Invites')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('Archived')).toBeInTheDocument()
      })
    })

    it('should have search and filter controls on invites tab', async () => {
      mockSearchParams.get.mockReturnValue('invites')

      render(<EmployerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
      })
    })
  })
})
