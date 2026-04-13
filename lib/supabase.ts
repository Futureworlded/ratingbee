import { createClient } from '@supabase/supabase-js'

// These will be populated from environment variables
// Add to Vercel: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Type definitions matching our schema ────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'user' | 'business_owner' | 'admin'
  created_at: string
}

export interface ClaimedListing {
  id: string
  user_id: string
  place_id: string
  business_name: string
  business_phone: string
  business_email: string
  owner_name: string
  owner_role: string
  verified: boolean
  verification_code?: string
  verification_expires?: string
  plan: 'free' | 'pro' | 'reviewamp'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: string
}

export interface RBReview {
  id: string
  place_id: string
  user_id: string
  author_name: string
  rating: number
  text: string
  source: 'ratingbee' | 'google' | 'tripadvisor'
  helpful_count: number
  not_helpful_count: number
  flagged: boolean
  created_at: string
}

export interface ReviewVote {
  id: string
  review_id: string
  user_id: string
  vote_type: 'up' | 'down' | 'flag'
  created_at: string
}

export interface ReviewReply {
  id: string
  review_id: string
  user_id: string
  author_name: string
  text: string
  is_owner_reply: boolean
  created_at: string
}
