import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey || !lat || !lng) {
    return NextResponse.json({ city: '', neighborhood: '', region: '' })
  }

  try {
    // Request multiple result types to get neighborhood precision
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.status === 'OK' && data.results?.length > 0) {
      // Pull components from the most detailed result
      const components = data.results[0].address_components

      const get = (type: string, nameType = 'long_name') =>
        components?.find((c: any) => c.types.includes(type))?.[nameType] || ''

      const neighborhood = get('neighborhood') || get('sublocality_level_1') || ''
      const city = get('locality') || get('postal_town') || ''
      const region = get('administrative_area_level_1', 'short_name') || ''

      return NextResponse.json({ neighborhood, city, region })
    }

    return NextResponse.json({ city: '', neighborhood: '', region: '' })
  } catch {
    return NextResponse.json({ city: '', neighborhood: '', region: '' })
  }
}
