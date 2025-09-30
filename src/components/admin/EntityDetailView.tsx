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
import { Loader2, Save, X, ArrowLeft, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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
  validate?: (value: T[K], formData: T) => string | undefined
  format?: (value: T[K]) => any
  parse?: (value: any) => T[K]
  render?: (value: T[K], formData: T) => React.ReactNode
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
  viewHref
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
      
      console.log("Entity saved successfully");
      
      // If this is a new entity, redirect to edit page
      if (isNew && formData.id) {
        router.push(`${backHref}/${formData.id}`)
      }
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error saving', error)
      console.error('Failed to save:', error instanceof Error ? error.message : 'Failed to save')
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
      
      console.log(`${entityType} published successfully`)
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error publishing', error)
      console.error('Failed to publish:', error instanceof Error ? error.message : 'Failed to publish')
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
      
      console.log(`${entityType} unpublished successfully`)
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error unpublishing', error)
      console.error('Failed to unpublish:', error instanceof Error ? error.message : 'Failed to unpublish')
      throw error
    } finally {
      setIsPublishing(false)
    }
  }, [formData.id, onUnpublish, entityType])

  // Handle delete action
  const handleDelete = useCallback(async () => {
    if (!onDelete || !window.confirm(`Are you sure you want to delete this ${entityType.toLowerCase()}?`)) {
      return
    }
    
    try {
      setIsDeleting(true)
      await onDelete(formData.id)
      
      console.error("Failed to save entity");
      
      // Redirect back after deletion
      router.push(backHref)
    } catch (error) {
      console.error('Error deleting', error)
      console.error('Failed to delete:', error instanceof Error ? error.message : 'Failed to delete')
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
      await onFeatureToggle(formData.id, !formData.is_featured)
      
      console.log("Feature status updated");
      
      console.log(formData.is_featured 
        ? `${entityType} removed from featured` 
        : `${entityType} marked as featured`)
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        is_featured: !prev.is_featured
      }))
      
      setIsDirty(false)
    } catch (error) {
      console.error('Error toggling featured status', error)
      console.error('Failed to update featured status:', error instanceof Error ? error.message : 'Failed to update featured status')
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
      return field.render(value, formData)
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
          <FieldComponent
            value={value}
            onChange={(newValue: T[K]) => handleChange(field.key, newValue, field)}
            field={safeField}
            entity={formData}
            error={error}
          />
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
            <Input
              id={fieldId}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={error ? 'border-destructive' : ''}
            />
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
            <Textarea
              id={fieldId}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={error ? 'border-destructive' : ''}
              rows={4}
            />
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
            <Input
              id={fieldId}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={error ? 'border-destructive' : ''}
            />
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
        <Loader2 className="h-8 w-8 animate-spin" />
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
          <h1 className="text-2xl font-bold">
            {isNew ? `Create New ${entityType}` : `Edit ${entityType}`}
          </h1>
          {!isNew && formData.status === 'published' && (
            <Badge variant="default">Published</Badge>
          )}
          {!isNew && formData.status === 'draft' && (
            <Badge variant="outline">Draft</Badge>
          )}
          {!isNew && formData.is_featured && (
            <Badge variant="secondary">Featured</Badge>
          )}
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
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          )}
          
          {onFeatureToggle && user?.email === 'keith-woods@bisk.com' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFeatureToggle}
              disabled={isFeaturing}
            >
              {isFeaturing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Publish'
              )}
            </Button>
          )}
          
          {onUnpublish && formData.status === 'published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Unpublish'
              )}
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
      
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
