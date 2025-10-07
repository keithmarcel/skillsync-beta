import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only SVG, PNG, and JPG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      )
    }

    // Get file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    
    // Determine upload directory based on entity type
    let uploadDir = 'schools' // default
    if (entityType === 'company') {
      uploadDir = 'companies'
    } else if (entityType === 'school' || entityType === 'provider') {
      uploadDir = 'schools'
    }

    // Create filename with timestamp to avoid conflicts
    const timestamp = Date.now()
    const sanitizedName = file.name
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .toLowerCase()
    const filename = `${timestamp}-${sanitizedName}`

    // Ensure upload directory exists
    const publicDir = join(process.cwd(), 'public', uploadDir)
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(publicDir, filename)
    
    await writeFile(filepath, buffer)

    // Return the public URL
    const url = `/${uploadDir}/${filename}`

    return NextResponse.json({ 
      success: true, 
      url,
      message: 'Logo uploaded successfully'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
