import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const city = request.headers.get('x-vercel-ip-city') || ''
  const region = request.headers.get('x-vercel-ip-country-region') || ''
  const country = request.headers.get('x-vercel-ip-country') || ''
  const lat = request.headers.get('x-vercel-ip-latitude') || ''
  const lng = request.headers.get('x-vercel-ip-longitude') || ''

  return NextResponse.json({
    city: city ? decodeURIComponent(city) : '',
    region,
    country,
    lat,
    lng,
    detected: !!city,
  })
}
