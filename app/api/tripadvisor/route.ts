import { NextRequest, NextResponse } from 'next/server'

const TA_KEY = process.env.TRIPADVISOR_API_KEY
const BASE = 'https://api.content.tripadvisor.com/api/v1'

// Search TripAdvisor for a business by name + address, return locationId + photos + rating
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || ''
  const address = searchParams.get('address') || ''
  const action = searchParams.get('action') || 'search' // search | photos

  if (!TA_KEY) {
    return NextResponse.json({ error: 'TripAdvisor API key not configured' }, { status: 500 })
  }

  try {
    if (action === 'search') {
      // Step 1: Search for the location
      const query = encodeURIComponent(`${name} ${address}`)
      const searchUrl = `${BASE}/location/search?searchQuery=${query}&language=en&key=${TA_KEY}`
      console.log('[TA] Searching:', decodeURIComponent(query))
      const searchRes = await fetch(searchUrl, { headers: { 'Referer': 'https://ratingbee.vercel.app', 'Origin': 'https://ratingbee.vercel.app' } })
      const searchData = await searchRes.json()
      console.log('[TA] Search status:', searchRes.status, 'Results:', searchData.data?.length ?? 0, searchData.error || '')

      if (!searchData.data || searchData.data.length === 0) {
        console.log('[TA] No results found for query:', decodeURIComponent(query))
        return NextResponse.json({ found: false, debug: { query: decodeURIComponent(query), status: searchRes.status, error: searchData.error } })
      }

      const location = searchData.data[0]
      const locationId = location.location_id

      // Step 2: Get photos for that location (up to 5)
      const photosUrl = `${BASE}/location/${locationId}/photos?language=en&limit=5&key=${TA_KEY}`
      const photosRes = await fetch(photosUrl, { headers: { 'Referer': 'https://ratingbee.vercel.app', 'Origin': 'https://ratingbee.vercel.app' } })
      const photosData = await photosRes.json()

      // Step 3: Get location details for rating
      const detailsUrl = `${BASE}/location/${locationId}/details?language=en&currency=USD&key=${TA_KEY}`
      const detailsRes = await fetch(detailsUrl, { headers: { 'Referer': 'https://ratingbee.vercel.app', 'Origin': 'https://ratingbee.vercel.app' } })
      const detailsData = await detailsRes.json()

      const photos = (photosData.data || []).map((p: any) => ({
        url: p.images?.original?.url || p.images?.large?.url || p.images?.medium?.url || '',
        caption: p.caption || '',
        source: p.source?.name || 'TripAdvisor',
      })).filter((p: any) => p.url)

      // Step 4: Get reviews (up to 5)
      let taReviews: any[] = []
      try {
        const reviewsUrl = `${BASE}/location/${locationId}/reviews?language=en&limit=5&key=${TA_KEY}`
        const reviewsRes = await fetch(reviewsUrl, { headers: { 'Referer': 'https://ratingbee.vercel.app', 'Origin': 'https://ratingbee.vercel.app' } })
        const reviewsData = await reviewsRes.json()
        taReviews = reviewsData.data || []
      } catch { /* reviews optional */ }

      return NextResponse.json({
        found: true,
        locationId,
        name: location.name,
        rating: detailsData.rating || null,
        numReviews: detailsData.num_reviews || null,
        rankingData: detailsData.ranking_data || null,
        photos,
        taReviews,
        taUrl: detailsData.web_url || null,
        attribution: {
          text: 'Photos from TripAdvisor',
          logo: 'https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logoset_solid_green.svg',
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('TripAdvisor API error:', err)
    return NextResponse.json({ error: 'Failed to fetch from TripAdvisor' }, { status: 500 })
  }
}
