import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    error: 'Quiz generation endpoint not implemented yet' 
  }, { status: 501 })
}