import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password) return NextResponse.json({ error: 'All fields required.' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { full_name: name },
      email_confirm: false,
    })

    if (error) {
      const msg = error.message.includes('already registered')
        ? 'An account with this email already exists.'
        : error.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: data.user?.id })
  } catch {
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })
  }
}
