import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('rb-session')?.value
    if (!token) return NextResponse.json({ user: null })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ user: null })

    const { data: profile } = await supabase
      .from('user_profiles').select('*').eq('id', user.id).single()

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.user_metadata?.full_name, profile } })
  } catch {
    return NextResponse.json({ user: null })
  }
}
