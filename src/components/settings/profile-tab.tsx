'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { type Profile } from '@/hooks/useAuth'
import { Save } from 'lucide-react'

interface ProfileTabProps {
  profile: Profile
}

export function ProfileTab({ profile }: ProfileTabProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    linkedin_url: profile.linkedin_url || '',
    bio: profile.bio || '',
    visible_to_employers: profile.visible_to_employers ?? false,
    avatar_url: profile.avatar_url || ''
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const initials = profile.first_name && profile.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : 'U'

  // Add cache-busting to avatar URL
  const avatarUrlWithCache = profile.avatar_url 
    ? `${profile.avatar_url}?t=${Date.now()}` 
    : undefined

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPG, PNG, and WebP files are allowed.',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 2MB.',
        variant: 'destructive'
      })
      return
    }

    // Validate image dimensions
    const img = new Image()
    const previewUrl = URL.createObjectURL(file)
    
    img.onload = () => {
      // Check minimum dimensions (335x335)
      if (img.width < 335 || img.height < 335) {
        toast({
          title: 'Image too small',
          description: `Image must be at least 335×335 pixels. Your image is ${img.width}×${img.height}.`,
          variant: 'destructive'
        })
        URL.revokeObjectURL(previewUrl)
        return
      }

      // Store the file for upload when user clicks Save
      setAvatarFile(file)
      setAvatarPreview(previewUrl)
      
      toast({
        title: 'Avatar selected',
        description: 'Click "Save Settings" to upload your new avatar.'
      })
    }
    
    img.onerror = () => {
      toast({
        title: 'Invalid image',
        description: 'Could not load the selected image.',
        variant: 'destructive'
      })
      URL.revokeObjectURL(previewUrl)
    }
    
    img.src = previewUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: If visible_to_employers is checked, require name and LinkedIn
    if (formData.visible_to_employers) {
      if (!formData.first_name || !formData.last_name) {
        toast({
          title: 'Name required',
          description: 'Your full name is required to allow employers to invite you to apply.',
          variant: 'destructive'
        })
        return
      }
      if (!formData.linkedin_url) {
        toast({
          title: 'LinkedIn URL required',
          description: 'Your LinkedIn URL is required to allow employers to invite you to apply.',
          variant: 'destructive'
        })
        return
      }
    }

    // Validate LinkedIn URL format if provided
    if (formData.linkedin_url) {
      const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/i
      if (!linkedinPattern.test(formData.linkedin_url)) {
        toast({
          title: 'Invalid LinkedIn URL',
          description: 'Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)',
          variant: 'destructive'
        })
        return
      }
    }

    setLoading(true)

    try {
      // Upload avatar first if a new one was selected
      if (avatarFile) {
        console.log('🔄 Uploading avatar file:', avatarFile.name)
        const avatarFormData = new FormData()
        avatarFormData.append('avatar', avatarFile)

        const avatarResponse = await fetch('/api/user/avatar', {
          method: 'POST',
          body: avatarFormData
        })

        console.log('📡 Avatar upload response:', avatarResponse.status)

        if (!avatarResponse.ok) {
          const error = await avatarResponse.json()
          console.error('❌ Avatar upload failed:', error)
          throw new Error(error.error || 'Failed to upload avatar')
        }

        const avatarResult = await avatarResponse.json()
        console.log('✅ Avatar uploaded:', avatarResult.avatar_url)
        
        // Update formData with the new avatar URL
        formData.avatar_url = avatarResult.avatar_url
      }

      console.log('💾 Saving profile with data:', formData)

      // Then update the profile
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      console.log('📡 Profile update response:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Profile update failed:', error)
        throw new Error(error.error || 'Failed to update profile')
      }

      const result = await response.json()
      console.log('✅ Profile saved:', result)

      toast({
        title: 'Profile updated',
        description: 'Your profile settings have been saved successfully.'
      })
      
      // Reload to update navbar
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">User Avatar</Label>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage 
                src={avatarPreview || avatarUrlWithCache} 
                alt={`${profile.first_name} ${profile.last_name}`} 
              />
              <AvatarFallback className="text-lg bg-teal-100 text-teal-700 font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAvatarClick}
                className="text-sm"
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats are jpg, png and webp. Minimum size is 335×335. Max file size is 2mb.
              </p>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Name</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <Input
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Once set, this information can not be changed from this page. Contact support for questions.
          </p>
        </div>

        {/* LinkedIn URL */}
        <div>
          <Label htmlFor="linkedin_url" className="text-sm font-medium text-gray-700 mb-2 block">
            LinkedIn URL
          </Label>
          <Input
            id="linkedin_url"
            type="url"
            placeholder="https://www.linkedin.com/in/yourname"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            className="w-full"
          />
        </div>

        {/* Employer Visibility Checkbox */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-start gap-3">
            <Checkbox
              id="visible_to_employers"
              checked={formData.visible_to_employers}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, visible_to_employers: checked as boolean })
              }
              className="mt-0.5 data-[state=checked]:bg-cyan-800 data-[state=checked]:border-cyan-800"
            />
            <div className="flex-1">
              <Label
                htmlFor="visible_to_employers"
                className="text-sm font-medium text-gray-900 cursor-pointer leading-tight"
              >
                Allow Employers to Invite You to Apply
              </Label>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Option appears to employers when you've met the required proficiency score on any 'Hiring Now' assessment. Your full name and LinkedIn URL are required to activate this option.{' '}
                <a
                  href="https://biskamplified.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 underline"
                >
                  Privacy policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-2 block">
            Bio
          </Label>
          <Textarea
            id="bio"
            placeholder="I'm a product designer and hoping to upskill in software engineering!"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tell us a bit about yourself and your career goals.
          </p>
        </div>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-[#114B5F] text-white px-6 flex items-center gap-2"
          >
            {loading ? 'Updating...' : 'Update Profile Settings'}
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
