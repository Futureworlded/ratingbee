import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { placeId, code, email, password, name } = await request.json()

    if (!placeId || !code) {
      return NextResponse.json({ error: 'Place ID and code required.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the pending claim
    const { data: claim, error: claimError } = await supabase
      .from('claimed_listings')
      .select('*')
      .eq('place_id', placeId)
      .eq('verified', false)
      .single()

    if (claimError || !claim) {
      return NextResponse.json({ error: 'No pending claim found.' }, { status: 404 })
    }

    // Check code and expiry
    if (claim.verification_code !== code) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
    }

    if (new Date(claim.verification_expires) < new Date()) {
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 })
    }

    // Create or get user account
    let userId = ''

    if (email && password && name) {
      // Create account if they don't have one
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email, password,
        user_metadata: { full_name: name },
        email_confirm: true, // auto-confirm for business owners who verified via SMS
      })

      if (authError && !authError.message.includes('already registered')) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      userId = authData?.user?.id || ''

      // If already exists, look them up
      if (!userId) {
        const { data: existing } = await supabase.auth.admin.listUsers()
        const found = existing?.users?.find((u: any) => u.email === email)
        userId = found?.id || ''
      }
    }

    // Mark listing as claimed and verified
    const { error: updateError } = await supabase
      .from('claimed_listings')
      .update({
        verified: true,
        verification_code: null,
        verification_expires: null,
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        plan: 'free',
      })
      .eq('place_id', placeId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to verify claim.' }, { status: 500 })
    }

    // Update user role to business_owner
    if (userId) {
      await supabase.from('user_profiles').update({ role: 'business_owner' }).eq('id', userId)
    }

    return NextResponse.json({ success: true, message: 'Business verified and claimed successfully!' })
  } catch {
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 })
  }
}
