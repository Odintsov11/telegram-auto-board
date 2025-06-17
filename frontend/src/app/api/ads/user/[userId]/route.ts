import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    
    // Отправляем запрос на backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const backendResponse = await fetch(`${backendUrl}/api/ads/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await backendResponse.json()
    
    return NextResponse.json(result, { 
      status: backendResponse.status 
    })

  } catch (error) {
    console.error('Get user ads API route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get user ads',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}