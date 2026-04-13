import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { placeId, businessName, authorName, rating, text, email } = await request.json()

    if (!placeId || !rating || !text || text.length < 20) {
      return NextResponse.json({ error: 'Invalid review data.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check session — reviews can be submitted without account but get moderated
    const token = request.cookies.get('rb-session')?.value
    let userId = '00000000-0000-0000-0000-000000000000'

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) userId = user.id
    }

    const { data, error } = await supabase.from('rb_reviews').insert({
      place_id: placeId,
      user_id: userId,
      author_name: authorName || email?.split('@')[0] || 'Anonymous',
      rating,
      text,
      flagged: false,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, reviewId: data.id })
  } catch {
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 })
  }
}
