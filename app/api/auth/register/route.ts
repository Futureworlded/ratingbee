import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    // Use standard signUp so password is stored correctly for login
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (error) {
      const msg = error.message.includes('already registered') || error.message.includes('already been registered')
        ? 'An account with this email already exists.'
        : error.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Also sign them in immediately and return session cookie
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.session) {
      // Account created but auto-login failed — that's OK, ask them to sign in
      return NextResponse.json({ success: true, userId: data.user?.id, autoLogin: false })
    }

    const response = NextResponse.json({
      success: true,
      userId: data.user?.id,
      autoLogin: true,
      user: { id: signInData.user.id, email: signInData.user.email, name }
    })

    // Set session cookies so they go straight to dashboard
    response.cookies.set('rb-session', signInData.session.access_token, {
      httpOnly: true, secure: true, sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    response.cookies.set('rb-refresh', signInData.session.refresh_token, {
      httpOnly: true, secure: true, sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })
  }
}
