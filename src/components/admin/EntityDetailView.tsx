'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Save, X, ArrowLeft, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ImageUpload } from './ImageUpload'
import { PageLoader, InlineSpinner } from '@/components/ui/loading-spinner'
import { toast } from '@/hooks/use-toast'
import { DestructiveDialog } from '@/components/ui/destructive-dialog'

export const EntityFieldType = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  SWITCH: 'switch',
  DATE: 'date',
  NUMBER: 'number',
  CURRENCY: 'currency',
  RICH_TEXT: 'rich_text',
  IMAGE: 'image',
  FILE: 'file',
  BUTTON: 'button',
  CUSTOM: 'custom'
} as const

export type EntityFieldType = typeof EntityFieldType[keyof typeof EntityFieldType]

export interface EntityFieldOption<T = string | number | boolean> {
  value: T
  label: string
  group?: string
}

export interface EntityField<T = any, K extends keyof T = keyof T> {
  key: K
  label: string
  type: EntityFieldType
  options?: EntityFieldOption[]
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  placeholder?: string
  description?: string
  helpText?: string
  validate?: (value: T[K], formData: T) => string | undefined
  format?: (value: T[K]) => any
  parse?: (value: any) => T[K]
  render?: (value: T[K], formData: T, onChange?: (newValue: any) => void, handleChange?: <K extends keyof T>(key: K, value: any) => void) => React.ReactNode
  groupBy?: string
  multiple?: boolean
  onClick?: (formData: T) => void
  component?: React.ComponentType<{
    value: T[K]
    onChange: (value: T[K]) => void
    field: Omit<EntityField<T, K>, 'component' | 'render' | 'validate'> & {
      value: T[K]
      onChange: (value: T[K]) => void
    }
    entity: T
    error?: string
  }>
}

export interface EntityTab<T> {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  fields: EntityField<T, keyof T>[]
  hidden?: boolean
}

export interface EntityDetailViewProps<T extends { id: string; status?: string; is_featured?: boolean }> {
  entity: T
  entityType: string
  tabs: EntityTab<T>[]
  onSave: (data: T) => Promise<any>
  onDelete?: (id: string) => Promise<void>
  onPublish?: (data: T) => Promise<void>
  onUnpublish?: (id: string) => Promise<void>
  onFeatureToggle?: (id: string, isFeatured: boolean) => Promise<void>
  isNew?: boolean
  loading?: boolean
  backHref: string
  viewHref?: string
  customTitle?: string
  alertMessage?: string
  hasExternalChanges?: boolean
}

export function EntityDetailView<T extends { id: string; status?: string; is_featured?: boolean }>({
  entity,
  entityType,
  tabs,
  onSave,
  onDelete,
  onPublish,
  onUnpublish,
  onFeatureToggle,
  isNew = false,
  loading = false,
  backHref,
  viewHref,
  customTitle,
  alertMessage,
  hasExternalChanges = false
}: EntityDetailViewProps<T>) {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState<T>(entity)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFeaturing, setIsFeaturing] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  // Update form data when entity changes
  useEffect(() => {
    setFormData(entity)
    setIsDirty(false)
  }, [entity])

  // Handle field changes
  const handleChange = useCallback(<K extends keyof T>(
    key: K,
    value: T[K] | string | number | boolean | null | undefined,
    field?: EntityField<T, K>
  ) => {
    let parsedValue: T[K] = value as T[K]
    
    // Parse value if parse function is provided
    if (field?.parse) {
      parsedValue = field.parse(value)
    } else if (field?.type === EntityFieldType.NUMBER) {
      parsedValue = (value === '' || value === null || value === undefined 
        ? null 
        : Number(value)) as T[K]
    } else if (field?.type === EntityFieldType.SWITCH) {
      parsedValue = Boolean(value) as T[K]
    }
    
    setFormData(prev => ({
      ...prev,
      [key]: parsedValue
    }))
    
    // Clear error for this field if it exists
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[String(key)]
      return newErrors
    })
    
    // Mark form as dirty
    if (!isDirty) {
      setIsDirty(true)
    }
  }, [isDirty])

  // Handle form submission
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true)
      await onSave(formData)
      
      toast({
        title: `${entityType} Saved`,
        description: `Successfully saved ${entityType.toLowerCase()}.`
      })
      
      // If this is a new entity, redirect to edit page
      if (isNew && formData.id) {
        router.push(`${backHref}/${formData.id}`)
      }
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error saving', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [formData, onSave, entityType, isNew, backHref, router])

  // Handle publish action
  const handlePublish = useCallback(async () => {
    if (!onPublish) return
    
    try {
      setIsPublishing(true)
      await onPublish(formData)
      
      toast({
        title: `${entityType} Published`,
        description: `Successfully published ${entityType.toLowerCase()}.`
      })
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error publishing', error)
      toast({
        title: 'Publish Failed',
        description: error instanceof Error ? error.message : 'Failed to publish',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsPublishing(false)
    }
  }, [formData, onPublish, entityType])

  // Handle unpublish action
  const handleUnpublish = useCallback(async () => {
    if (!onUnpublish) return
    
    try {
      setIsPublishing(true)
      await onUnpublish(formData.id)
      
      toast({
        title: `${entityType} Unpublished`,
        description: `Successfully unpublished ${entityType.toLowerCase()}.`
      })
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error unpublishing', error)
      toast({
        title: 'Unpublish Failed',
        description: error instanceof Error ? error.message : 'Failed to unpublish',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsPublishing(false)
    }
  }, [formData.id, onUnpublish, entityType])

  // Handle delete action
  const handleDeleteConfirm = useCallback(async () => {
    if (!onDelete) return
    
    try {
      setIsDeleting(true)
      await onDelete(formData.id)
      
      toast({
        title: `${entityType} Deleted`,
        description: `Successfully deleted ${entityType.toLowerCase()}.`
      })
      
      // Redirect back after deletion
      router.push(backHref)
    } catch (error) {
      console.error('Error deleting', error)
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [formData.id, onDelete, entityType, backHref, router])

  // Handle feature toggle
  const handleFeatureToggle = useCallback(async () => {
    if (!onFeatureToggle) return
    
    try {
      setIsFeaturing(true)
      const newFeaturedState = !formData.is_featured
      await onFeatureToggle(formData.id, newFeaturedState)
      
      toast({
        title: `${entityType} ${newFeaturedState ? 'Featured' : 'Unfeatured'}`,
        description: `Successfully ${newFeaturedState ? 'featured' : 'unfeatured'} ${entityType.toLowerCase()}.`
      })
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        is_featured: newFeaturedState
      }))
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error toggling feature', error)
      toast({
        title: 'Feature Toggle Failed',
        description: error instanceof Error ? error.message : 'Failed to toggle feature',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsFeaturing(false)
    }
  }, [formData.id, formData.is_featured, onFeatureToggle, entityType])
  // Render a single form field
  const renderField = useCallback(<K extends keyof T>(
    field: EntityField<T, K> & { key: K }
  ) => {
    if (field.hidden) return null
    
    const value = formData[field.key]
    const error = errors[String(field.key)]
    const fieldId = `field-${String(field.key)}`
    
    // Use custom render function if provided
    if (field.render) {
      return field.render(value, formData, (newValue: any) => handleChange(field.key, newValue, field), handleChange)
    }
    
    // Format value if format function is provided
    const displayValue = field.format ? field.format(value) : value
    
    // Handle custom component
    if (field.component) {
      const FieldComponent = field.component
      const safeField = {
        ...field,
        value,
        onChange: (newValue: T[K]) => handleChange(field.key, newValue, field)
      }
      
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}
          <FieldComponent
            value={value}
            onChange={(newValue: T[K]) => handleChange(field.key, newValue, field)}
            field={safeField}
            entity={formData}
            error={error}
          />
          {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )
    }
    
    // Handle different field types
    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}
            <Input
              id={fieldId}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={error ? 'border-destructive' : ''}
            />
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
        
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}
            <Textarea
              id={fieldId}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={error ? 'border-destructive' : ''}
              rows={4}
            />
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
        
      case 'currency':
        // Strip $ and commas from display value for cleaner input
        const currencyDisplayValue = displayValue ? String(displayValue).replace(/[$,]/g, '') : ''
        
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">$</span>
              <Input
                id={fieldId}
                type="text"
                value={currencyDisplayValue}
                onChange={(e) => {
                  // Strip $ and commas from input before saving
                  const cleanValue = e.target.value.replace(/[$,]/g, '')
                  handleChange(field.key, cleanValue, field)
                }}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className={`pl-7 ${error ? 'border-destructive' : ''}`}
              />
            </div>
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
        
      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}
            <Select
              value={value !== undefined && value !== null && value !== '' ? String(value) : 'none'}
              onValueChange={(val) => {
                // Convert 'none' back to null for database
                const actualValue = val === 'none' ? null : val;
                handleChange(field.key, field.parse ? field.parse(actualValue) : actualValue, field)
              }}
              disabled={field.disabled}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
        
      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(field.key, checked, field)}
              disabled={field.disabled}
              className={error ? 'border-destructive' : ''}
            />
            <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
        
      case 'button':
        return (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => field.onClick?.(formData)}
              disabled={field.disabled}
              className="w-full"
            >
              {field.label}
            </Button>
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
      
      case 'image':
        return (
          <ImageUpload
            value={value as string | null}
            onChange={(url) => handleChange(field.key, url, field)}
            label={field.label}
            disabled={field.disabled}
            error={error}
            entityType={entityType}
            entityId={formData.id}
          />
        )
      
      case 'rich_text':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}
            <Textarea
              id={fieldId}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={error ? 'border-destructive font-mono text-sm' : 'font-mono text-sm'}
              rows={12}
            />
            <p className="text-xs text-muted-foreground">
              Supports HTML: Use &lt;p&gt; for paragraphs, &lt;strong&gt; for bold, &lt;em&gt; for italic
            </p>
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
        
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && <p className="text-xs text-muted-foreground -mt-1 mb-1">{field.description}</p>}
            <Input
              id={fieldId}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={error ? 'border-destructive' : ''}
            />
            {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
    }
  }, [formData, errors, handleChange])

  // Render tab content
  const renderTabContent = useCallback((tab: EntityTab<T>) => {
    if (tab.hidden) return null
    
    return (
      <TabsContent key={tab.id} value={tab.id} className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              {tab.fields.map((field) => (
                <div key={String(field.key)} className="space-y-2">
                  {renderField(field as EntityField<T, keyof T> & { key: keyof T })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    )
  }, [renderField])

  // Filter tabs based on user permissions
  const visibleTabs = useMemo(() => {
    return tabs.filter(tab => !tab.hidden)
  }, [tabs])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <PageLoader text="Loading..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb and actions */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {customTitle || (isNew ? `Create New ${entityType}` : `Edit ${entityType}`)}
            </h1>
            {!isNew && !customTitle && (
              <div className="flex items-center gap-2 mt-1">
                {formData.status === 'published' && (
                  <Badge variant="default">Published</Badge>
                )}
                {formData.status === 'draft' && (
                  <Badge variant="outline">Draft</Badge>
                )}
                {formData.is_featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {viewHref && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(viewHref, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
          )}
          
          {onDelete && !isNew && (
            <DestructiveDialog
              title={`Delete ${entityType}`}
              description={`Are you sure you want to delete this ${entityType.toLowerCase()}? This action cannot be undone.`}
              actionLabel="Delete"
              onConfirm={handleDeleteConfirm}
              onSuccess={() => {}}
              onError={(error) => {}}
            >
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <InlineSpinner size={16} />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </DestructiveDialog>
          )}
          
          {onFeatureToggle && user?.email === 'keith-woods@bisk.com' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFeatureToggle}
              disabled={isFeaturing}
            >
              {isFeaturing ? (
                <InlineSpinner size={16} />
              ) : formData.is_featured ? (
                'Unfeature'
              ) : (
                'Feature'
              )}
            </Button>
          )}
          
          {onPublish && formData.status !== 'published' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <InlineSpinner size={16} />
              ) : (
                formData.status === 'draft' ? (
                  'Publish'
                ) : (
                  'Update'
                )
              )}
            </Button>
          )}
          {!isNew && onUnpublish && formData.status === 'published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <InlineSpinner size={16} />
              ) : (
                'Unpublish'
              )}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || (!isDirty && !hasExternalChanges)}
          >
            {isSaving ? (
              <InlineSpinner size={16} />
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
      {/* Alert Banner */}
      {alertMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">{alertMessage}</p>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => renderTabContent(tab))}
      </Tabs>
    </div>
  )
}
