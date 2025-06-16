// 📄 frontend/src/app/api/ads/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Отправляем запрос на backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/ads/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const result = await backendResponse.json()
    
    return NextResponse.json(result, { 
      status: backendResponse.status 
    })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}