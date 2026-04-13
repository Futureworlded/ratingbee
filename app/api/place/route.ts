import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('place_id')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey || !placeId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const fields = [
    'name', 'place_id', 'formatted_address', 'formatted_phone_number',
    'website', 'rating', 'user_ratings_total', 'reviews', 'photos',
    'opening_hours', 'types', 'price_level', 'geometry', 'business_status'
  ].join(',')

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.status }, { status: 400 })
    }

    return NextResponse.json({ result: data.result })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 })
  }
}
