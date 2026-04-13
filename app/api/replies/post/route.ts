import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('rb-session')?.value
    if (!token) return NextResponse.json({ error: 'Sign in to reply.' }, { status: 401 })

    const { reviewKey, placeId, text } = await request.json()
    if (!reviewKey || !placeId || !text?.trim()) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles').select('full_name, role').eq('id', user.id).single()

    // Check if user is the owner of this listing
    const { data: claimed } = await supabase
      .from('claimed_listings')
      .select('id')
      .eq('place_id', placeId)
      .eq('user_id', user.id)
      .eq('verified', true)
      .single()

    const { data, error } = await supabase.from('review_replies').insert({
      place_id: placeId,
      review_key: reviewKey,
      user_id: user.id,
      author_name: profile?.full_name || user.email?.split('@')[0] || 'User',
      text: text.trim(),
      is_owner_reply: !!claimed,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, reply: data })
  } catch {
    return NextResponse.json({ error: 'Reply failed.' }, { status: 500 })
  }
}
