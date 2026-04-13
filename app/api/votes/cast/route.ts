import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('rb-session')?.value
    if (!token) return NextResponse.json({ error: 'Sign in to vote.' }, { status: 401 })

    const { reviewKey, placeId, voteType } = await request.json()
    if (!reviewKey || !placeId || !voteType) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })

    // Check existing vote
    const { data: existing } = await supabase
      .from('google_review_votes')
      .select('id, vote_type')
      .eq('review_key', reviewKey)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      if (existing.vote_type === voteType) {
        // Toggle off
        await supabase.from('google_review_votes').delete().eq('id', existing.id)
        return NextResponse.json({ success: true, action: 'removed' })
      } else {
        // Change vote
        await supabase.from('google_review_votes').update({ vote_type: voteType }).eq('id', existing.id)
        return NextResponse.json({ success: true, action: 'changed' })
      }
    }

    await supabase.from('google_review_votes').insert({
      place_id: placeId,
      review_key: reviewKey,
      user_id: user.id,
      vote_type: voteType,
    })

    return NextResponse.json({ success: true, action: 'added' })
  } catch {
    return NextResponse.json({ error: 'Vote failed.' }, { status: 500 })
  }
}
