import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY

const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 15 // 15 min — shorter so open_now stays fresh

// Meal period: label, search query, and eligible Google place types
function getMealPeriod() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return {
    label: 'Breakfast',
    query: 'breakfast cafe',
    types: ['cafe', 'bakery', 'restaurant', 'food'],
    icon: '☀️'
  }
  if (hour >= 11 && hour < 15) return {
    label: 'Lunch',
    query: 'lunch restaurant',
    types: ['restaurant', 'food', 'cafe', 'meal_takeaway', 'meal_delivery'],
    icon: '🌤️'
  }
  if (hour >= 15 && hour < 18) return {
    label: 'Happy Hour',
    query: 'bar happy hour drinks',
    types: ['bar', 'night_club', 'restaurant', 'food'],
    icon: '🍻'
  }
  if (hour >= 18 && hour < 22) return {
    label: 'Dinner',
    query: 'dinner restaurant',
    types: ['restaurant', 'food', 'meal_takeaway'],
    icon: '🌙'
  }
  return {
    label: 'Late Night',
    query: 'open late night bar',
    types: ['bar', 'night_club', 'restaurant'],
    icon: '🌃'
  }
}

function isEligible(placeTypes: string[], mealTypes: string[]) {
  return placeTypes.some(t => mealTypes.includes(t))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') || 'San Francisco, CA'
  const lat = searchParams.get('lat') || ''
  const lng = searchParams.get('lng') || ''

  const meal = getMealPeriod()

  // Cache key includes lat/lng for precision — same coords = same cache bucket
  const cacheKey = `${meal.label}|${lat || city}|${lng}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true, meal })
  }

  if (!GOOGLE_KEY) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 })
  }

  try {
    let googleUrl: string

    if (lat && lng) {
      // GPS coordinates available — use Nearby Search with tight 5km radius
      // opennow=true filters to only currently open places
      googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}` +
        `&radius=5000` +
        `&keyword=${encodeURIComponent(meal.query)}` +
        `&opennow=true` +
        `&rankby=prominence` +
        `&key=${GOOGLE_KEY}`
    } else {
      // Fall back to text search by city — wider radius
      googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(meal.query + ' near ' + city)}` +
        `&opennow=true` +
        `&key=${GOOGLE_KEY}`
    }

    const googleRes = await fetch(googleUrl)
    const googleData = await googleRes.json()
    const rawPlaces = googleData.results || []

    // Filter to meal-appropriate types only, then take top 6
    const filtered = rawPlaces
      .filter((p: any) => isEligible(p.types || [], meal.types))
      .slice(0, 6)

    // If filtering is too aggressive (< 3 results), fall back to unfiltered top 6
    const places = filtered.length >= 3 ? filtered : rawPlaces.slice(0, 6)

    const enriched = places.map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      opening_hours: place.opening_hours,
      price_level: place.price_level,
      photos: place.photos || [],
    }))

    const result = { places: enriched, meal, city }
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json({ ...result, cached: false })

  } catch (err) {
    console.error('Homepage API error:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
