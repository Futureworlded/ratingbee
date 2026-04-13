import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })

    const response = NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.full_name }
    })
    response.cookies.set('rb-session', data.session.access_token, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    response.cookies.set('rb-refresh', data.session.refresh_token, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}
