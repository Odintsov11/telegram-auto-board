import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    
    // Отправляем запрос на backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const backendResponse = await fetch(`${backendUrl}/api/ads/${id}/status`, {
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
    console.error('Update ad status API route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update ad status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}