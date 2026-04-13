'use client'

import { useEffect, useState } from 'react'
import Footer from '../components/Footer'

interface User {
  id: string
  email: string
  name: string
  profile?: { role: string; full_name: string }
}

interface ClaimedListing {
  id: string
  place_id: string
  business_name: string
  business_phone: string
  verified: boolean
  plan: string
  created_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<ClaimedListing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'reviews' | 'settings'>('overview')

  useEffect(function() {
    async function load() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!data.user) { window.location.href = '/' ; return }
        setUser(data.user)

        // Load claimed listings
        const listRes = await fetch('/api/dashboard/listings')
        const listData = await listRes.json()
        if (listData.listings) setListings(listData.listings)
      } catch {
        window.location.href = '/'
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F3EE' }}>
        <div style={{ textAlign:'center' }}>
          <img src="/rating-bee.png" alt="" style={{ height:'48px', margin:'0 auto 16px', display:'block' }} />
          <div style={{ color:'#888', fontSize:'14px' }}>Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  const displayName = user?.profile?.full_name || user?.name || user?.email?.split('@')[0] || 'there'
  const isOwner = user?.profile?.role === 'business_owner' || user?.profile?.role === 'admin'

  const TAB_STYLE = function(active: boolean) {
    return {
      padding: '8px 16px',
      borderRadius: '100px',
      border: 'none',
      background: active ? '#1A1A1A' : 'transparent',
      color: active ? 'white' : '#555',
      fontSize: '14px',
      fontWeight: active ? '600' as const : '400' as const,
      cursor: 'pointer' as const,
      fontFamily: 'inherit',
      transition: 'all 0.15s',
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F3EE' }}>

      {/* TOP NAV */}
      <nav style={{ background:'white', borderBottom:'1px solid rgba(0,0,0,0.07)', padding:'0 24px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <a href="/">
          <img src="/rating-bee.png" alt="RatingBee" style={{ height:'26px', width:'auto' }} />
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'14px', color:'#555' }}>Hi, {displayName}</span>
          <button
            onClick={handleLogout}
            style={{ background:'none', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'100px', padding:'6px 14px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', color:'#555' }}
          >Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'32px 20px' }}>

        {/* HEADER */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ fontSize:'1.8rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'4px' }}>
            Dashboard
          </h1>
          <p style={{ fontSize:'14px', color:'#888' }}>
            {isOwner ? 'Manage your business listings and reviews' : 'Your RatingBee account'}
          </p>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'24px', background:'white', padding:'4px', borderRadius:'100px', border:'1px solid rgba(0,0,0,0.07)', width:'fit-content' }}>
          {(['overview', 'listings', 'reviews', 'settings'] as const).map(function(tab) {
            return (
              <button key={tab} style={TAB_STYLE(activeTab === tab)} onClick={function() { setActiveTab(tab) }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          })}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* STAT CARDS */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginBottom:'24px' }}>
              {[
                { label:'Claimed Listings', value: listings.length.toString(), icon:'🏢', color:'#1c9b6d' },
                { label:'Total Reviews', value:'—', icon:'★', color:'#F5A623' },
                { label:'Avg RatingBee Score', value:'—', icon:'📊', color:'#4285F4' },
                { label:'Plan', value: listings[0]?.plan || 'Free', icon:'💎', color:'#9B59B6' },
              ].map(function(stat) {
                return (
                  <div key={stat.label} style={{ background:'white', borderRadius:'16px', padding:'20px', border:'1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ fontSize:'24px', marginBottom:'8px' }}>{stat.icon}</div>
                    <div style={{ fontSize:'24px', fontWeight:'700', color:stat.color, marginBottom:'4px' }}>{stat.value}</div>
                    <div style={{ fontSize:'13px', color:'#888' }}>{stat.label}</div>
                  </div>
                )
              })}
            </div>

            {/* QUICK ACTIONS */}
            <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid rgba(0,0,0,0.07)', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'16px' }}>Quick actions</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px' }}>
                {[
                  { label:'Claim a business', desc:'Verify ownership of your listing', href:'/search', color:'#1c9b6d' },
                  { label:'Search listings', desc:'Find businesses on RatingBee', href:'/search', color:'#F5A623' },
                  { label:'Write a review', desc:'Share your experience', href:'/search', color:'#4285F4' },
                  { label:'Account settings', desc:'Update your profile', action: function() { setActiveTab('settings') }, color:'#555' },
                ].map(function(action) {
                  return (
                    <div
                      key={action.label}
                      onClick={action.action || function() { window.location.href = action.href! }}
                      style={{ padding:'16px', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'12px', cursor:'pointer', transition:'box-shadow 0.15s' }}
                      onMouseEnter={function(e) { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
                      onMouseLeave={function(e) { e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ fontSize:'14px', fontWeight:'600', color:action.color, marginBottom:'4px' }}>{action.label}</div>
                      <div style={{ fontSize:'12px', color:'#888' }}>{action.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* UPGRADE CTA for free users */}
            {(!listings[0] || listings[0]?.plan === 'free') && (
              <div style={{ background:'linear-gradient(135deg, #1A1A1A, #2D2D2D)', borderRadius:'16px', padding:'28px', color:'white' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
                  <div>
                    <div style={{ fontSize:'1.2rem', fontWeight:'700', fontFamily:'Georgia, serif', marginBottom:'6px' }}>Upgrade to ReviewAmp</div>
                    <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', maxWidth:'400px', lineHeight:'1.5' }}>
                      Write one review and we spread it to Google, Yelp, Facebook and beyond automatically.
                    </div>
                  </div>
                  <button style={{ background:'#F5A623', color:'white', border:'none', borderRadius:'100px', padding:'12px 24px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                    See plans — from $49/mo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif' }}>Your claimed listings</h2>
              <a href="/search" style={{ background:'#1c9b6d', color:'white', borderRadius:'100px', padding:'8px 18px', fontSize:'13px', fontWeight:'600', textDecoration:'none' }}>
                + Claim a business
              </a>
            </div>

            {listings.length === 0 ? (
              <div style={{ background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', border:'1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>🏢</div>
                <div style={{ fontSize:'1.1rem', fontWeight:'600', color:'#1A1A1A', marginBottom:'8px' }}>No listings yet</div>
                <div style={{ fontSize:'14px', color:'#888', marginBottom:'20px' }}>Search for your business and claim your free listing</div>
                <a href="/search" style={{ background:'#F5A623', color:'white', borderRadius:'100px', padding:'10px 24px', fontSize:'14px', fontWeight:'600', textDecoration:'none' }}>Find my business</a>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {listings.map(function(listing) {
                  return (
                    <div key={listing.id} style={{ background:'white', borderRadius:'16px', padding:'20px 24px', border:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
                      <div>
                        <div style={{ fontSize:'16px', fontWeight:'600', color:'#1A1A1A', marginBottom:'4px' }}>{listing.business_name}</div>
                        <div style={{ fontSize:'13px', color:'#888' }}>{listing.business_phone}</div>
                        <div style={{ display:'flex', gap:'8px', marginTop:'8px', flexWrap:'wrap' }}>
                          <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'100px', background: listing.verified ? '#F0FDF4' : '#FEF9EC', color: listing.verified ? '#166534' : '#92400E' }}>
                            {listing.verified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                          <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'100px', background:'#F5F3EE', color:'#555', textTransform:'capitalize' }}>
                            {listing.plan} plan
                          </span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <a href={`/biz/${listing.place_id}`} style={{ background:'white', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'100px', padding:'7px 16px', fontSize:'13px', textDecoration:'none', color:'#333' }}>View listing</a>
                        <button onClick={function() { setActiveTab('reviews') }} style={{ background:'#F5A623', border:'none', borderRadius:'100px', padding:'7px 16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', color:'white' }}>Manage reviews</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'20px' }}>Reviews</h2>
            <div style={{ background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', border:'1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px' }}>★</div>
              <div style={{ fontSize:'1.1rem', fontWeight:'600', color:'#1A1A1A', marginBottom:'8px' }}>Review management coming soon</div>
              <div style={{ fontSize:'14px', color:'#888', lineHeight:'1.5', maxWidth:'320px', margin:'0 auto' }}>
                Once connected to Supabase, you will see all reviews here and be able to respond publicly as the business owner.
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
            <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid rgba(0,0,0,0.07)' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'20px' }}>Profile</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {[
                  { label:'Full name', value: displayName, type:'text' },
                  { label:'Email', value: user?.email || '', type:'email' },
                ].map(function(f) {
                  return (
                    <div key={f.label}>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>{f.label}</label>
                      <input
                        type={f.type}
                        defaultValue={f.value}
                        style={{ width:'100%', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'10px', padding:'10px 12px', fontSize:'14px', outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }}
                      />
                    </div>
                  )
                })}
                <button style={{ background:'#1A1A1A', color:'white', border:'none', borderRadius:'100px', padding:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', marginTop:'4px' }}>
                  Save changes
                </button>
              </div>
            </div>

            <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid rgba(0,0,0,0.07)' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'20px' }}>Security</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {[
                  { label:'New password', type:'password', ph:'New password' },
                  { label:'Confirm password', type:'password', ph:'Confirm new password' },
                ].map(function(f) {
                  return (
                    <div key={f.label}>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.ph}
                        style={{ width:'100%', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'10px', padding:'10px 12px', fontSize:'14px', outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }}
                      />
                    </div>
                  )
                })}
                <button style={{ background:'#1A1A1A', color:'white', border:'none', borderRadius:'100px', padding:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', marginTop:'4px' }}>
                  Update password
                </button>
              </div>

              <div style={{ marginTop:'24px', paddingTop:'20px', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#E53E3E', marginBottom:'8px' }}>Danger zone</div>
                <button style={{ background:'none', border:'1px solid #FCA5A5', borderRadius:'100px', padding:'8px 16px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', color:'#E53E3E' }}>
                  Delete account
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  )
}
