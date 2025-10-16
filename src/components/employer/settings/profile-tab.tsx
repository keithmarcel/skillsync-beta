'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { Upload, Loader2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
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
        title: 'Success',
        description: 'Company profile updated successfully'
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error updating company:', error)
      toast({
        title: 'Error',
        description: 'Failed to update company profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (type: 'logo' | 'featured', file: File) => {
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
        title: 'Success',
        description: `${type === 'logo' ? 'Logo' : 'Featured image'} uploaded successfully`
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Branding */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Branding</h3>
          
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">This logo appears on your featured roles and company profile</p>
              
              {company.logo_url ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 p-8">
                    <img 
                      src={company.logo_url} 
                      alt="Company logo" 
                      className="max-w-[200px] max-h-[200px] object-contain"
                    />
                  </div>
                  <label className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Replace Logo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload('logo', file)
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Upload Logo</span>
                    <span className="text-xs text-gray-500 mt-1">Square image, at least 200x200px</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload('logo', file)
                    }}
                  />
                </label>
              )}
            </div>

            {/* Featured Image Upload */}
            <div>
              <Label htmlFor="featured-image">Featured Image</Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">This image appears as a banner on your featured role detail pages</p>
              <div className="mt-2 flex items-center gap-4">
                {company.featured_image_url && (
                  <img 
                    src={company.featured_image_url} 
                    alt="Featured image" 
                    className="w-32 h-20 rounded-lg object-cover border border-gray-200"
                  />
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload Featured Image</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload('featured', file)
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Recommended: 16:9 ratio, at least 1200x675px</p>
            </div>
          </div>
      </div>

      {/* Company Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="bio">Company Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell candidates about your company..."
              />
              <p className="text-xs text-gray-500 mt-1">This appears on your featured roles and company profile</p>
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Technology, Healthcare, Manufacturing"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hq_city">Headquarters City</Label>
                <Input
                  id="hq_city"
                  value={formData.hq_city}
                  onChange={(e) => setFormData({ ...formData, hq_city: e.target.value })}
                  placeholder="Tampa"
                />
              </div>
              <div>
                <Label htmlFor="hq_state">State</Label>
                <Input
                  id="hq_state"
                  value={formData.hq_state}
                  onChange={(e) => setFormData({ ...formData, hq_state: e.target.value })}
                  placeholder="FL"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_range">Employee Count</Label>
                <select
                  id="employee_range"
                  value={formData.employee_range}
                  onChange={(e) => setFormData({ ...formData, employee_range: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select range</option>
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
                <Label htmlFor="revenue_range">Revenue Range</Label>
                <select
                  id="revenue_range"
                  value={formData.revenue_range}
                  onChange={(e) => setFormData({ ...formData, revenue_range: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select range</option>
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

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
