'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { InlineSpinner } from '@/components/ui/loading-spinner'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  error?: string
  entityType?: string
  entityId?: string
}

export function ImageUpload({
  value,
  onChange,
  label = 'Upload Image',
  accept = 'image/svg+xml,image/png,image/jpeg,image/jpg',
  maxSizeMB = 2,
  disabled = false,
  error,
  entityType = 'school',
  entityId
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    try {
      setUploading(true)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', entityType)
      if (entityId) {
        formData.append('entityId', entityId)
      }

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { url } = await response.json()
      onChange(url)
    } catch (err) {
      console.error('Upload error:', err)
      alert(err instanceof Error ? err.message : 'Failed to upload image')
      setPreview(value || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      {label && (
        <Label className={error ? 'text-destructive' : ''}>
          {label}
        </Label>
      )}
      
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain p-2"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={uploading}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={disabled || uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? (
              <>
                <InlineSpinner size={16} />
                <span className="ml-2">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {preview ? 'Change Image' : 'Upload Image'}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Accepts: SVG, PNG, JPG (max {maxSizeMB}MB)
          </p>
          
          {value && (
            <p className="text-xs text-muted-foreground truncate">
              Current: {value}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
