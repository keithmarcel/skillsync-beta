'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { Upload, Loader2, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Company {
  id: string
  name: string
  logo_url: string | null
  featured_image_url: string | null
  bio: string | null
  hq_city: string | null
  hq_state: string | null
  industry: string | null
  employee_range: string | null
  revenue_range: string | null
}

interface ProfileTabProps {
  company: Company
  onUpdate: () => void
}

export function ProfileTab({ company, onUpdate }: ProfileTabProps) {
  const { toast } = useToast()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const featuredInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFeatured, setUploadingFeatured] = useState(false)
  
  const [formData, setFormData] = useState({
    name: company.name || '',
    bio: company.bio || '',
    hq_city: company.hq_city || '',
    hq_state: company.hq_state || '',
    industry: company.industry || '',
    employee_range: company.employee_range || '',
    revenue_range: company.revenue_range || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', company.id)

      if (error) throw error

      toast({
        title: 'Profile updated',
        description: 'Your company profile has been saved successfully.'
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error updating company:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update company profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (type: 'logo' | 'featured', file: File) => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFeatured
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${company.id}-${type}-${Date.now()}.${fileExt}`
      const filePath = `${type}s/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      const updateField = type === 'logo' ? 'logo_url' : 'featured_image_url'
      const { error: updateError } = await supabase
        .from('companies')
        .update({ [updateField]: publicUrl })
        .eq('id', company.id)

      if (updateError) throw updateError

      toast({
        title: 'Image uploaded',
        description: `${type === 'logo' ? 'Logo' : 'Featured image'} uploaded successfully`
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Upload */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Company Logo</h3>
          {company.logo_url ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 p-8">
                <img 
                  src={company.logo_url} 
                  alt="Company logo" 
                  className="max-w-[200px] max-h-[200px] object-contain"
                />
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload('logo', file)
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full sm:w-auto"
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Replace Logo
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload('logo', file)
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full sm:w-auto"
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </>
                )}
              </Button>
            </>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Square image, at least 200x200px. This logo appears on your featured roles and company profile.
          </p>
        </div>

        {/* Featured Image Upload */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Featured Image</h3>
          {company.featured_image_url && (
            <div className="mb-3">
              <img 
                src={company.featured_image_url} 
                alt="Featured image" 
                className="w-full max-w-md h-40 rounded-lg object-cover border border-gray-200"
              />
            </div>
          )}
          <input
            ref={featuredInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload('featured', file)
            }}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => featuredInputRef.current?.click()}
            disabled={uploadingFeatured}
            className="w-full sm:w-auto"
          >
            {uploadingFeatured ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {company.featured_image_url ? 'Replace' : 'Upload'} Featured Image
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            16:9 ratio, at least 1200x675px. This image appears as a banner on your featured role detail pages.
          </p>
        </div>

        {/* Company Information Section */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Company Information</h3>
          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                Company Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full"
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-2 block">
                Company Description
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell candidates about your company..."
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This appears on your featured roles and company profile.
              </p>
            </div>

            {/* Industry */}
            <div>
              <Label htmlFor="industry" className="text-sm font-medium text-gray-700 mb-2 block">
                Industry
              </Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Technology, Healthcare, Manufacturing"
                className="w-full"
              />
            </div>

            {/* HQ Location */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Headquarters Location</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.hq_city}
                  onChange={(e) => setFormData({ ...formData, hq_city: e.target.value })}
                  className="w-full"
                />
                <Input
                  placeholder="State (e.g., FL)"
                  value={formData.hq_state}
                  onChange={(e) => setFormData({ ...formData, hq_state: e.target.value })}
                  maxLength={2}
                  className="w-full"
                />
              </div>
            </div>

            {/* Employee & Revenue Range */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Company Size</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <select
                    value={formData.employee_range}
                    onChange={(e) => setFormData({ ...formData, employee_range: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Employee count</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1001-5000">1001-5000</option>
                    <option value="5001+">5001+</option>
                  </select>
                </div>
                <div>
                  <select
                    value={formData.revenue_range}
                    onChange={(e) => setFormData({ ...formData, revenue_range: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Revenue range</option>
                    <option value="<$1M">&lt;$1M</option>
                    <option value="$1M-$10M">$1M-$10M</option>
                    <option value="$10M-$50M">$10M-$50M</option>
                    <option value="$50M-$100M">$50M-$100M</option>
                    <option value="$100M-$500M">$100M-$500M</option>
                    <option value="$500M-$1B">$500M-$1B</option>
                    <option value="$1B+">$1B+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-[#114B5F] text-white px-6 flex items-center gap-2"
          >
            {loading ? 'Updating...' : 'Update Company Profile'}
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
