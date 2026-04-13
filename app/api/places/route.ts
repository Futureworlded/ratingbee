import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const city = searchParams.get('city') || ''

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const query = [q, city].filter(Boolean).join(' near ')

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ error: data.status }, { status: 400 })
    }

    const results = data.results || []

    // Deduplicate: if two results share the same name (case-insensitive), keep the one with more reviews
    const seen = new Map<string, any>()
    for (const place of results) {
      const key = place.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!seen.has(key)) {
        seen.set(key, place)
      } else {
        const existing = seen.get(key)
        if ((place.user_ratings_total || 0) > (existing.user_ratings_total || 0)) {
          seen.set(key, place)
        }
      }
    }

    return NextResponse.json({ results: Array.from(seen.values()) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
