import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')
  const maxwidth = searchParams.get('maxwidth') || '400'

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey || !ref) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${ref}&key=${apiKey}`

  try {
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
  }
}
