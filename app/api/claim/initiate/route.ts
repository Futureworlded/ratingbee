import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { ownerName, email, businessPhone, ownerRole, placeId, businessName } = await request.json()

    if (!ownerName || !email || !businessPhone || !ownerRole || !placeId) {
      return NextResponse.json({ error: 'All fields required.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if already claimed
    const { data: existing } = await supabase
      .from('claimed_listings')
      .select('id, verified')
      .eq('place_id', placeId)
      .single()

    if (existing?.verified) {
      return NextResponse.json({ error: 'This business has already been claimed.' }, { status: 400 })
    }

    const code = generateCode()
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min

    // Upsert claim record with verification code
    const { error: upsertError } = await supabase
      .from('claimed_listings')
      .upsert({
        place_id: placeId,
        business_name: businessName || '',
        business_phone: businessPhone,
        business_email: email,
        owner_name: ownerName,
        owner_role: ownerRole,
        verified: false,
        verification_code: code,
        verification_expires: expires,
        user_id: '00000000-0000-0000-0000-000000000000', // placeholder until they verify + sign up
      }, { onConflict: 'place_id' })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to initiate claim.' }, { status: 500 })
    }

    // Send SMS via GHL webhook
    const GHL_WEBHOOK = process.env.GHL_CLAIM_WEBHOOK_URL
    if (GHL_WEBHOOK) {
      await fetch(GHL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: businessPhone,
          code,
          businessName: businessName || 'your business',
          ownerName,
        }),
      })
    }

    return NextResponse.json({ success: true, message: `Code sent to ${businessPhone}` })
  } catch {
    return NextResponse.json({ error: 'Claim initiation failed.' }, { status: 500 })
  }
}
