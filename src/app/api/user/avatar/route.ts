import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Avatar upload API called')
    
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 User authenticated:', user?.id)
    
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File
    console.log('📁 File received:', file?.name, file?.type, file?.size)
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // Create admin client for storage operations
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`
    
    console.log('📤 Uploading to storage:', fileName)
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      throw uploadError
    }
    
    console.log('✅ Storage upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName)
      
    console.log('🔗 Public URL:', publicUrl)

    // Update profile with avatar URL using authenticated client
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile update error:', profileError)
      throw profileError
    }
    
    console.log('✅ Profile updated with avatar URL')

    return NextResponse.json({ avatar_url: publicUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
