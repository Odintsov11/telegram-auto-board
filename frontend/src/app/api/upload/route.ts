import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Отправляем на backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const backendResponse = await fetch(`${backendUrl}/api/upload`, {
      method: 'POST',
      body: formData
    })

    const result = await backendResponse.json()
    
    return NextResponse.json(result, { 
      status: backendResponse.status 
    })

  } catch (error) {
    console.error('Upload API route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload files',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}