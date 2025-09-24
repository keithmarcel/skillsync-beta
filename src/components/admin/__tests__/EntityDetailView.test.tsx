// Mock the toast modules before any imports
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
  toast: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  __esModule: true,
  default: vi.fn(),
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
  Toast: vi.fn(() => null),
  ToastProvider: vi.fn(({ children }) => children),
  ToastViewport: vi.fn(() => null),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EntityDetailView, EntityFieldType } from '../EntityDetailView';
import { vi, beforeAll } from 'vitest';
import type { EntityField, EntityTab } from '../EntityDetailView';
import { useAuth } from '@/hooks/useAuth';

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'test@example.com' },
    isAdmin: false,
    isSuperAdmin: false,
  })),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/admin/roles/1',
}));

// Mock toast
const toast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  toast,
  useToast: () => ({
    toast,
  }),
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`mock-card ${className}`} data-testid="mock-card">{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`mock-card-header ${className}`} data-testid="mock-card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={`mock-card-title ${className}`} data-testid="mock-card-title">{children}</h3>
  ),
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={`mock-card-description ${className}`} data-testid="mock-card-description">{children}</p>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`mock-card-content ${className}`} data-testid="mock-card-content">{children}</div>
  ),
  CardFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`mock-card-footer ${className}`} data-testid="mock-card-footer">{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant = 'default',
    disabled = false,
    className = '',
    type = 'button',
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`mock-button ${variant} ${className}`}
      data-testid="mock-button"
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    className = '',
    onValueChange,
  }: {
    children: React.ReactNode;
    className?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div className={`mock-tabs ${className}`} data-testid="mock-tabs">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === 'TabsList') {
          return React.cloneElement(child, { onValueChange } as any);
        }
        return child;
      })}
    </div>
  ),
  TabsList: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`mock-tabs-list ${className}`} data-testid="mock-tabs-list">
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
    className = '',
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => (
    <button 
      className={`mock-tabs-trigger ${className}`} 
      data-testid={`mock-tabs-trigger-${value}`}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className = '' }: { 
    children: React.ReactNode; 
    value: string; 
    className?: string;
  }) => (
    <div className={`mock-tabs-panel ${className}`} data-testid={`mock-tabs-panel-${value}`}>
      {children}
    </div>
  ),
}));


// Mock auth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

describe('EntityDetailView', () => {
  const mockEntity: TestEntity = {
    id: '1',
    name: 'Test Entity',
    description: 'Test Description',
    status: 'draft',
    is_featured: false
  } as const;

  // Define a test entity type for our tests
  type TestEntity = {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'published';
    is_featured?: boolean;
  };

  // Create properly typed fields
  const fields: EntityField<TestEntity, keyof TestEntity>[] = [
    {
      key: 'name',
      label: 'Name',
      type: EntityFieldType.TEXT,
      required: true
    },
    {
      key: 'description',
      label: 'Description',
      type: EntityFieldType.TEXTAREA
    },
    {
      key: 'status',
      label: 'Status',
      type: EntityFieldType.SELECT,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' }
      ]
    }
  ];

  // Create a typed tab
  const mockTabs: EntityTab<TestEntity>[] = [{
    id: 'general',
    label: 'General',
    fields
  }];

  const mockOnSave = vi.fn().mockResolvedValue({})
  const mockOnDelete = vi.fn().mockResolvedValue({})
  const mockOnPublish = vi.fn().mockResolvedValue({})
  const mockOnUnpublish = vi.fn().mockResolvedValue({})
  const mockOnFeatureToggle = vi.fn().mockResolvedValue({})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders entity fields', () => {
    render(
      <EntityDetailView<TestEntity>
        entity={mockEntity}
        entityType="Test"
        tabs={mockTabs}
        onSave={mockOnSave as any}
        backHref="/"
      />
    )

    // Check that the card content is rendered with the entity data
    const cardContent = screen.getByTestId('mock-card-content')
    expect(cardContent).toBeInTheDocument()
    
    // Check that the input fields are rendered with the correct values
    const nameInput = document.getElementById('field-name') as HTMLInputElement
    const descriptionTextarea = document.getElementById('field-description') as HTMLTextAreaElement
    
    expect(nameInput).toBeInTheDocument()
    expect(nameInput.value).toBe('Test Entity')
    expect(descriptionTextarea).toBeInTheDocument()
    expect(descriptionTextarea.value).toBe('Test Description')
  })

  test('renders all field types correctly', () => {
    const fields: EntityField<TestEntity>[] = [
      { key: 'name', label: 'Name', type: EntityFieldType.TEXT, required: true },
      { key: 'description', label: 'Description', type: EntityFieldType.TEXTAREA },
      {
        key: 'status',
        label: 'Status',
        type: EntityFieldType.SELECT,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
        ],
      },
      { key: 'is_featured', label: 'Featured', type: EntityFieldType.SWITCH },
    ];

    render(
      <EntityDetailView<TestEntity>
        entity={mockEntity}
        entityType="Test"
        tabs={[{ id: 'general', label: 'General', fields }]}
        onSave={mockOnSave}
        backHref="/"
      />
    );

    // Text input
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('Test Entity');
    expect(nameInput.required).toBe(true);

    // Textarea
    const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    expect(descriptionTextarea).toBeInTheDocument();
    expect(descriptionTextarea.value).toBe('Test Description');

    // Select
    const statusSelect = screen.getByRole('combobox');
    expect(statusSelect).toBeInTheDocument();

    // Switch
    const featuredSwitch = screen.getByRole('switch');
    expect(featuredSwitch).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <EntityDetailView<TestEntity>
        entity={{ ...mockEntity, name: '' }}
        entityType="Test"
        tabs={mockTabs}
        onSave={mockOnSave as any}
        backHref="/"
      />
    )

    // Find the save button by test ID and click it
    const saveButton = screen.getAllByTestId('mock-button').find(button => 
      button.textContent?.includes('Save Changes')
    );
    if (!saveButton) throw new Error('Save button not found');
    fireEvent.click(saveButton);
    
    // Since we're using mocked components, we can't test the actual validation message
    // But we can verify that onSave wasn't called
    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  test('handles form submission successfully', async () => {
    const mockSave = vi.fn().mockResolvedValue({ success: true });
    
    render(
      <EntityDetailView<TestEntity>
        entity={mockEntity}
        entityType="Test"
        tabs={mockTabs}
        onSave={mockSave}
        backHref="/"
      />
    );

    // Find and click the save button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);
    
    // Verify the save function was called with the correct data
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Entity',
        description: 'Test Description',
        status: 'draft',
      }));
    });
  });

  test('handles form submission errors', async () => {
    const errorMessage = 'Failed to save';
    const mockSave = vi.fn().mockRejectedValue(new Error(errorMessage));
    
    render(
      <EntityDetailView<TestEntity>
        entity={mockEntity}
        entityType="Test"
        tabs={mockTabs}
        onSave={mockSave}
        backHref="/"
      />
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);
    
    // Verify error handling
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  test('shows loading state during save', async () => {
    let resolveSave: (value: any) => void;
    const mockSave = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveSave = resolve;
      })
    );
    
    render(
      <EntityDetailView<TestEntity>
        entity={mockEntity}
        entityType="Test"
        tabs={mockTabs}
        onSave={mockSave}
        backHref="/"
      />
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    
    // Resolve the promise
    resolveSave!({ success: true });
    
    // Loading state should be removed
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Publish/Unpublish Workflow', () => {
    test('shows publish button for draft items', () => {
      render(
        <EntityDetailView<TestEntity>
          entity={mockEntity}
          entityType="Test"
          tabs={mockTabs}
          onSave={mockOnSave}
          onPublish={mockOnPublish}
          backHref="/"
        />
      );

      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(publishButton).toBeInTheDocument();
    });

    test('calls onPublish when publish button is clicked', async () => {
      render(
        <EntityDetailView<TestEntity>
          entity={mockEntity}
          entityType="Test"
          tabs={mockTabs}
          onSave={mockOnSave}
          onPublish={mockOnPublish}
          backHref="/"
        />
      );

      const publishButton = screen.getByRole('button', { name: /publish/i });
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(mockOnPublish).toHaveBeenCalledWith(mockEntity);
      });
    });

    test('shows unpublish button for published items', () => {
      render(
        <EntityDetailView<TestEntity>
          entity={{ ...mockEntity, status: 'published' }}
          entityType="Test"
          tabs={mockTabs}
          onSave={mockOnSave}
          onUnpublish={mockOnUnpublish}
          backHref="/"
        />
      );

      const unpublishButton = screen.getByRole('button', { name: /unpublish/i });
      expect(unpublishButton).toBeInTheDocument();
    });

    test('calls onUnpublish when unpublish button is clicked', async () => {
      render(
        <EntityDetailView<TestEntity>
          entity={{ ...mockEntity, status: 'published' }}
          entityType="Test"
          tabs={mockTabs}
          onSave={mockOnSave}
          onUnpublish={mockOnUnpublish}
          backHref="/"
        />
      );

      const unpublishButton = screen.getByRole('button', { name: /unpublish/i });
      fireEvent.click(unpublishButton);
      
      await waitFor(() => {
        expect(mockOnUnpublish).toHaveBeenCalledWith(mockEntity.id);
      });
    });
  });

  describe('Feature Toggle', () => {
    test('shows feature toggle for super admin', () => {
      // Mock useAuth to return a super admin
      vi.mocked(useAuth).mockReturnValueOnce({
        user: { email: 'admin@example.com' },
        isAdmin: true,
        isSuperAdmin: true,
      } as any);

      render(
        <EntityDetailView<TestEntity>
          entity={mockEntity}
          entityType="Test"
          tabs={mockTabs}
          onSave={mockOnSave}
          onFeatureToggle={mockOnFeatureToggle}
          backHref="/"
        />
      );

      const featureToggle = screen.getByRole('switch');
      expect(featureToggle).toBeInTheDocument();
    });

    test('hides feature toggle for non-admin users', () => {
      // Mock useAuth to return a regular user
      vi.mocked(useAuth).mockReturnValueOnce({
        user: { email: 'user@example.com' },
        isAdmin: false,
        isSuperAdmin: false,
      } as any);

      render(
        <EntityDetailView<TestEntity>
          entity={mockEntity}
          entityType="Test"
          tabs={mockTabs}
          onSave={mockOnSave}
          onFeatureToggle={mockOnFeatureToggle}
          backHref="/"
        />
      );

      const featureToggle = screen.queryByRole('switch');
      expect(featureToggle).not.toBeInTheDocument();
    });

    test('calls onFeatureToggle when toggle is clicked', async () => {
      // Mock useAuth to return a super admin
      vi.mocked(useAuth).mockReturnValueOnce({
        user: { email: 'admin@example.com' },
        isAdmin: true,
        isSuperAdmin: true,
      } as any);

      render(
        <EntityDetailView<TestEntity>
          entity={mockEntity}
          entityType="Test"
          tabs={mockTabs}
          onSave={mockOnSave}
          onFeatureToggle={mockOnFeatureToggle}
          backHref="/"
        />
      );

      const featureToggle = screen.getByRole('switch');
      fireEvent.click(featureToggle);
      
      await waitFor(() => {
        expect(mockOnFeatureToggle).toHaveBeenCalledWith(mockEntity.id, true);
      });
    });
  });
})
