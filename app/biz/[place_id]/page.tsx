'use client'

import { useEffect, useState, useCallback } from 'react'
import Footer from '../../components/Footer'
import AuthModal from '../../components/AuthModal'
import styles from './biz.module.css'

interface Review {
  author_name: string
  profile_photo_url?: string
  rating: number
  text: string
  relative_time_description: string
}

interface PlaceDetails {
  name: string
  place_id: string
  formatted_address: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  reviews?: Review[]
  photos?: { photo_reference: string }[]
  opening_hours?: { open_now: boolean; weekday_text: string[] }
  types: string[]
}

interface TaResult {
  rating: string | null
  numReviews: string | null
  taUrl: string | null
  taReviews: any[]
}

const TA_TYPES = new Set([
  'restaurant','food','cafe','bar','night_club','bakery',
  'lodging','hotel','rv_park','campground',
  'tourist_attraction','museum','amusement_park','zoo',
  'aquarium','art_gallery','stadium','bowling_alley','casino',
  'movie_theater','spa','travel_agency',
])

function isTaEligible(types: string[]) {
  return types.some(function(t) { return TA_TYPES.has(t) })
}

function ExpandableReview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const LIMIT = 280
  const isLong = text.length > LIMIT
  return (
    <p style={{ fontSize: '14px', color: '#2D2D2D', lineHeight: '1.6', margin: 0 }}>
      {isLong && !expanded ? text.slice(0, LIMIT) + '...' : text}
      {isLong && (
        <button
          onClick={function() { setExpanded(function(x) { return !x }) }}
          style={{ background: 'none', border: 'none', color: '#D4891A', fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginLeft: '6px', padding: 0, fontFamily: 'inherit' }}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </p>
  )
}

export default function BizPage({ params }: { params: Promise<{ place_id: string }> }) {
  const [place, setPlace] = useState<PlaceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [hoursOpen, setHoursOpen] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [modalMode, setModalMode] = useState<'review'|'claim'|'register'|'login'|null>(null)
  const [taResult, setTaResult] = useState<TaResult | null>(null)
  const [taLoading, setTaLoading] = useState(false)
  const [taEligible, setTaEligible] = useState(false)
  const [searchWhat, setSearchWhat] = useState('')
  const [searchWhere, setSearchWhere] = useState('')
  const [votes, setVotes] = useState<Record<string, 'up'|'down'|'flag'|null>>({})
  const [replyingTo, setReplyingTo] = useState<string|null>(null)
  const [bumped, setBumped] = useState<Record<string, boolean>>({})
  const [replies, setReplies] = useState<Record<string, Array<{name:string; text:string; date:string; isOwner:boolean}>>>({})
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [flagging, setFlagging] = useState<string|null>(null)
  const [flagReason, setFlagReason] = useState('')

  function toggleBump(id: string) {
    setBumped(function(prev) {
      return { ...prev, [id]: !prev[id] }
    })
  }

  function submitReply(voteId: string) {
    const text = replyTexts[voteId]?.trim()
    if (!text) return
    setReplies(function(prev) {
      const existing = prev[voteId] || []
      return { ...prev, [voteId]: [...existing, { name: 'You', text, date: 'Just now', isOwner: false }] }
    })
    setReplyTexts(function(prev) { return { ...prev, [voteId]: '' } })
    setReplyingTo(null)
  }

  function castVote(id: string, type: 'up'|'down'|'flag') {
    setVotes(function(prev) {
      const current = prev[id]
      // clicking same vote toggles it off
      if (current === type) return { ...prev, [id]: null }
      return { ...prev, [id]: type }
    })
  }

  useEffect(function() {
    // Restore user's city from previous detection
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rb_city')
      if (saved) setSearchWhere(saved)
    }
  }, [])

  useEffect(function() {
    async function init() {
      try {
        const { place_id } = await params
        const res = await fetch('/api/place?place_id=' + place_id)
        const data = await res.json()
        if (data.result) {
          setPlace(data.result)
          const eligible = isTaEligible(data.result.types || [])
          setTaEligible(eligible)
          if (eligible) fetchTA(data.result.name, data.result.formatted_address || '')
        } else {
          setErrorMsg('Business not found.')
        }
      } catch {
        setErrorMsg('Failed to load business.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [params])

  async function fetchTA(name: string, address: string) {
    setTaLoading(true)
    try {
      let res = await fetch('/api/tripadvisor?action=search&name=' + encodeURIComponent(name) + '&address=' + encodeURIComponent(address))
      let data = await res.json()
      if (!data.found) {
        res = await fetch('/api/tripadvisor?action=search&name=' + encodeURIComponent(name) + '&address=')
        data = await res.json()
      }
      if (data.found) {
        setTaResult({ rating: data.rating || null, numReviews: data.numReviews || null, taUrl: data.taUrl || null, taReviews: data.taReviews || [] })
      }
    } catch (e) {
      console.error('TA error:', e)
    } finally {
      setTaLoading(false)
    }
  }

  const photoCount = place && place.photos ? Math.min(place.photos.length, 3) : 0

  const goNext = useCallback(function() {
    if (photoCount < 2) return
    setSlideIndex(function(n) { return (n + 1) % photoCount })
  }, [photoCount])

  const goPrev = useCallback(function() {
    if (photoCount < 2) return
    setSlideIndex(function(n) { return (n - 1 + photoCount) % photoCount })
  }, [photoCount])

  useEffect(function() {
    if (photoCount < 2) return
    const t = setInterval(goNext, 5000)
    return function() { clearInterval(t) }
  }, [goNext, photoCount])

  function stars(rating: number) {
    const full = Math.floor(rating)
    const half = rating % 1 >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  }

  function starsBoxed(rating: number) {
    const full = Math.floor(rating)
    const half = rating % 1 >= 0.5
    const empty = 5 - full - (half ? 1 : 0)
    const starStyle = (filled: boolean) => ({
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      width: '26px',
      height: '26px',
      border: filled ? '1px solid rgba(245,166,35,0.5)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: '6px',
      fontSize: '15px',
      color: filled ? '#F5A623' : '#CCC',
      background: filled ? 'rgba(245,166,35,0.06)' : 'white',
      marginRight: '3px',
      lineHeight: '1',
    })
    return (
      <span style={{ display:'inline-flex', alignItems:'center' }}>
        {Array.from({ length: full }).map(function(_, i) {
          return <span key={'f'+i} style={starStyle(true)}>★</span>
        })}
        {half && <span key="h" style={starStyle(true)}>½</span>}
        {Array.from({ length: empty }).map(function(_, i) {
          return <span key={'e'+i} style={starStyle(false)}>☆</span>
        })}
      </span>
    )
  }

  function category(types: string[]) {
    const map: Record<string,string> = {
      restaurant:'Restaurant', food:'Food & Dining', cafe:'Cafe',
      bar:'Bar & Nightlife', beauty_salon:'Beauty Salon', hair_care:'Hair Care',
      gym:'Gym & Fitness', health:'Health', doctor:'Medical', lawyer:'Legal Services',
      car_repair:'Auto Repair', plumber:'Plumbing', electrician:'Electrical',
      veterinary_care:'Veterinary', dentist:'Dentist', lodging:'Hotel',
      flooring_store:'Flooring', hardware_store:'Hardware', store:'Retail',
      home_goods_store:'Home Goods', furniture_store:'Furniture',
    }
    for (const t of types) { if (map[t]) return map[t] }
    return (types[0] || 'business').replace(/_/g, ' ')
  }

  function handleMiniSearch(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (searchWhat.trim()) p.set('q', searchWhat.trim())
    if (searchWhere.trim()) {
      p.set('city', searchWhere.trim())
      localStorage.setItem('rb_city', searchWhere.trim())
    }
    window.location.href = '/search?' + p.toString()
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <nav className="rb-nav">
          <a href="/" className="rb-nav-logo"><img src="/rating-bee.png" alt="RatingBee" className="rb-nav-logo-img" /></a>
        </nav>
        <div className={styles.loadingCenter}>
          <img src="/rating-bee.png" alt="" className={styles.loadingIcon} />
          <p>Loading business info...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !place) {
    return (
      <div className={styles.loadingPage}>
        <nav className="rb-nav">
          <a href="/" className="rb-nav-logo"><img src="/rating-bee.png" alt="RatingBee" className="rb-nav-logo-img" /></a>
        </nav>
        <div className={styles.loadingCenter}>
          <p>{errorMsg || 'Business not found.'}</p>
          <a href="/search" className={styles.backBtn}>Back to search</a>
        </div>
      </div>
    )
  }

  const photos = (place.photos || []).slice(0, 3).map(function(p) {
    return '/api/photo?ref=' + p.photo_reference + '&maxwidth=1200'
  })

  const taRating = taResult && taResult.rating ? parseFloat(taResult.rating) : null

  // RatingBee score = Google score only (TA only added when eligible AND found)
  const scores: number[] = []
  if (place.rating) scores.push(place.rating)
  if (taEligible && taRating) scores.push(taRating)
  const rbScore = scores.length > 0 ? Math.round(scores.reduce(function(a,b){return a+b},0) / scores.length * 10) / 10 : null

  const googleRevs = (place.reviews || []).slice(0, 5).map(function(r) {
    return { src:'g', name:r.author_name, photo:r.profile_photo_url||'', rating:r.rating, text:r.text||'', date:r.relative_time_description }
  })
  const taRevs = (taResult && taResult.taReviews ? taResult.taReviews : []).slice(0, 3).map(function(r: any) {
    return { src:'t', name:r.user&&r.user.username?r.user.username:'TripAdvisor User', photo:'', rating:r.rating||4, text:r.text||'', date:r.publishedDate?r.publishedDate.slice(0,7):'' }
  })
  const allRevs: Array<{src:string;name:string;photo:string;rating:number;text:string;date:string}> = []
  let gi=0, ti=0
  while (gi < googleRevs.length || ti < taRevs.length) {
    if (gi < googleRevs.length) allRevs.push(googleRevs[gi++])
    if (gi < googleRevs.length) allRevs.push(googleRevs[gi++])
    if (ti < taRevs.length) allRevs.push(taRevs[ti++])
  }

  return (
    <div className={styles.page}>


      {/* NAV: logo left | search center | links right */}
      <nav className='biz-nav-grid' style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.6fr', alignItems:'center', gap:'12px', padding:'0 20px', height:'56px', background:'white', borderBottom:'1px solid rgba(0,0,0,0.07)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/" style={{ display:'flex', alignItems:'center' }}>
          <img src="/rating-bee.png" alt="RatingBee" style={{ height:'26px', width:'auto', display:'block' }} />
        </a>
        <form onSubmit={handleMiniSearch} className='biz-nav-search' style={{ display:'flex', background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'100px', overflow:'hidden', height:'36px', width:'100%' }}>
          <input type="text" placeholder="Search businesses..." value={searchWhat} onChange={function(e){setSearchWhat(e.target.value)}} style={{ flex:1, border:'none', outline:'none', padding:'0 14px', fontSize:'14px', background:'transparent', fontFamily:'inherit', minWidth:0 }} />
          <input type="text" placeholder="City" value={searchWhere} onChange={function(e){setSearchWhere(e.target.value)}} style={{ width:'140px', minWidth:'100px', border:'none', outline:'none', padding:'0 12px', fontSize:'14px', background:'transparent', fontFamily:'inherit', borderLeft:'1px solid rgba(0,0,0,0.1)', color:'#1A1A1A', fontWeight:'500' }} />
          <button type="submit" style={{ background:'#F5A623', color:'white', border:'none', padding:'0 16px', cursor:'pointer', fontWeight:'600', fontSize:'14px', fontFamily:'inherit', borderRadius:'0 100px 100px 0', flexShrink:0 }}>Go</button>
        </form>
        <div className="biz-nav-links" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'10px' }}>
          <a href="/claim" style={{ fontSize:'14px', color:'#333', textDecoration:'none', fontWeight:'500', whiteSpace:'nowrap' }}>For Businesses</a>
          <button onClick={function(){setModalMode('register')}} style={{ background:'none', border:'none', fontSize:'14px', color:'#555', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', fontWeight:'500' }}>Register</button>
          <button onClick={function(){setModalMode('login')}} style={{ background:'#F5A623', color:'white', border:'none', borderRadius:'100px', padding:'7px 18px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>Sign In</button>
        </div>
      </nav>

      {/* SLIDESHOW */}
      <div className={styles.slideshow}>
        {photos.length > 0 ? (
          <div className={styles.slides}>
            {photos.map(function(url, i) {
              return (
                <div key={i} className={styles.slide} style={{ transform:'translateX('+((i-slideIndex)*100)+'%)', opacity:i===slideIndex?1:0, cursor:'pointer' }} onClick={function(){setLightboxIdx(slideIndex);setLightboxOpen(true)}}>
                  <img src={url} alt={place.name+' photo '+(i+1)} className={styles.slideImg} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.slidePlaceholder}>
            <img src="/rating-bee.png" alt="" className={styles.slidePlaceholderIcon} />
          </div>
        )}
        {photos.length > 1 && <button className={styles.slidePrev} onClick={goPrev}>&#8249;</button>}
        {photos.length > 1 && <button className={styles.slideNext} onClick={goNext}>&#8250;</button>}
        {photos.length > 1 && (
          <div className={styles.slideDots}>
            {photos.map(function(_,i){ return <button key={i} className={styles.slideDot+(i===slideIndex?' '+styles.slideDotActive:'')} onClick={function(){setSlideIndex(i)}} /> })}
          </div>
        )}
        <div className={styles.slideOverlay} />
      </div>

      <div className={styles.main}>

        {/* HEADER */}
        <div className={styles.header}>
          <div style={{ flex:1 }}>
            <div className={styles.category}>{category(place.types)}</div>
            <h1 className={styles.bizName}>{place.name}</h1>
            {place.rating && (
              <div className={styles.headerRating}>
                <span className={styles.ratingStars}>{stars(place.rating)}</span>
                <span className={styles.ratingNum}>{place.rating.toFixed(1)}</span>
                {place.user_ratings_total ? <span className={styles.ratingCount}>({place.user_ratings_total.toLocaleString()} reviews)</span> : null}
                {place.opening_hours && (
                  <span className={place.opening_hours.open_now ? styles.openNow : styles.closedNow}>
                    {place.opening_hours.open_now ? '● Open now' : '● Closed'}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <button className={styles.actionPrimary} onClick={function(){setModalMode('review')}}>Write a Review</button>
            <button className={styles.actionSecondary} onClick={function(){navigator.clipboard&&navigator.clipboard.writeText(window.location.href)}}>Share</button>
          </div>
        </div>



        {/* BODY: left column (scores + reviews + cta) | right sidebar (info + map + claim) */}
        <div className={styles.body}>

          <div className={styles.leftCol}>

            {/* SCORES STRIP — 2 columns (Google + RatingBee) or 3 if TA eligible */}
            <div style={{ display:'grid', gridTemplateColumns: taEligible ? '1fr 1fr 1fr' : '1fr 1fr', background:'white', borderRadius:'16px', border:'1px solid rgba(0,0,0,0.07)', marginBottom:'16px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>

              {/* Google */}
              <div style={{ padding:'20px 16px', textAlign:'center', borderRight:'1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#4285F4', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'700', margin:'0 auto 10px' }}>G</div>
                <div style={{ fontSize:'28px', fontWeight:'700', color:'#1A1A1A', lineHeight:1 }}>{place.rating ? place.rating.toFixed(1) : '-'}</div>
                {place.rating ? <div style={{ color:'#F5A623', fontSize:'14px', margin:'5px 0 3px' }}>{stars(place.rating)}</div> : null}
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A1A1A', marginTop:'4px' }}>Google</div>
                {place.user_ratings_total ? <div style={{ fontSize:'12px', color:'#666', marginTop:'3px' }}>{place.user_ratings_total.toLocaleString()} reviews</div> : null}
              </div>

              {/* TripAdvisor — only when eligible */}
              {taEligible && (
                <div style={{ padding:'20px 16px', textAlign:'center', borderRight:'1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#00AA6C', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'700', margin:'0 auto 10px' }}>T</div>
                  {taRating ? (
                    <>
                      <div style={{ fontSize:'28px', fontWeight:'700', color:'#1A1A1A', lineHeight:1 }}>{taRating.toFixed(1)}</div>
                      <div style={{ color:'#F5A623', fontSize:'14px', margin:'5px 0 3px' }}>{stars(taRating)}</div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A1A1A', marginTop:'4px' }}>TripAdvisor</div>
                      {taResult && taResult.numReviews ? <div style={{ fontSize:'12px', color:'#666', marginTop:'3px' }}>{parseInt(taResult.numReviews).toLocaleString()} reviews</div> : null}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize:'28px', fontWeight:'700', color:'#CCC', lineHeight:1 }}>-</div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A1A1A', marginTop:'14px' }}>TripAdvisor</div>
                      <div style={{ fontSize:'12px', color:'#AAA', marginTop:'3px' }}>{taLoading ? 'Loading...' : 'Not listed'}</div>
                    </>
                  )}
                </div>
              )}

              {/* RatingBee */}
              <div style={{ padding:'20px 16px', textAlign:'center', background:'white' }}>
                <div style={{ margin:'0 auto 10px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <img src="/rating-bee.png" alt="RatingBee" style={{ height:'28px', width:'auto', objectFit:'contain' }} />
                </div>
                <div style={{ fontSize:'28px', fontWeight:'700', color:rbScore?'#1A1A1A':'#CCC', lineHeight:1 }}>{rbScore ? rbScore.toFixed(1) : '-'}</div>
                {rbScore ? <div style={{ color:'#F5A623', fontSize:'14px', margin:'5px 0 3px' }}>{stars(rbScore)}</div> : null}
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A1A1A', marginTop:'4px' }}>RatingBee</div>
                <div style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.06em', textTransform:'uppercase', color:'#888', marginTop:'3px' }}>Score</div>
              </div>

            </div>

            {/* REVIEWS */}
            {allRevs.length > 0 && (
              <div className={styles.reviewsSection}>
                <h2 className={styles.reviewsTitle}>Reviews</h2>
                <div className={styles.reviewsList}>
                  {allRevs.map(function(r, idx) {
                    const badgeBg = r.src==='g'?'#4285F4':'#00AA6C'
                    const badgeLbl = r.src==='g'?'G':'T'
                    const voteId = r.src + '-' + idx
                    const myVote = votes[voteId] || null
                    const isFlagged = myVote === 'flag'
                    return (
                      <div key={idx}
                        className={styles.reviewCard + (bumped[voteId] ? ' ' + styles.reviewCardActive : '')}
                        style={{ opacity: isFlagged ? 0.5 : 1 }}>

                        {/* DESKTOP: side-by-side. MOBILE: stacked (vote bar below review) */}
                        <div className="rv-card-inner">

                          {/* LEFT SIDE — vote rail + reply panel expanding from it */}
                          <div className="rv-left-side">

                            {/* VOTE RAIL */}
                            <div className="rv-vote-rail">
                              <div className="rv-vote-buttons">

                              {/* Thumbs up */}
                              <button
                                onClick={function(){ castVote(voteId, 'up') }}
                                title="Helpful"
                                className="rv-vote-btn"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={myVote==='up' ? '#1c9b6d' : 'none'} stroke="#1c9b6d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: myVote==='up' ? 1 : 0.6 }}>
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                                </svg>
                              </button>

                              {/* Thumbs down */}
                              <button
                                onClick={function(){ castVote(voteId, 'down') }}
                                title="Not helpful"
                                className="rv-vote-btn"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={myVote==='down' ? '#E53E3E' : 'none'} stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: myVote==='down' ? 1 : 0.6 }}>
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                                  <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                                </svg>
                              </button>

                              {/* Flag */}
                              <button
                                onClick={function(){ if(isFlagged){ castVote(voteId,'flag') } else { setFlagging(voteId); setFlagReason('') } }}
                                title={isFlagged ? 'Flagged — click to unflag' : 'Flag this review'}
                                className="rv-vote-btn"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={myVote==='flag' ? '#E53E3E' : 'none'} stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: myVote==='flag' ? 1 : 0.6 }}>
                                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                                  <line x1="4" y1="22" x2="4" y2="15"/>
                                </svg>
                              </button>

                              {/* Reply */}
                              <button
                                onClick={function(){ setReplyingTo(replyingTo === voteId ? null : voteId) }}
                                title="Reply to this review"
                                className="rv-vote-btn"
                                style={{ marginTop:'4px' }}
                              >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill={replyingTo === voteId ? '#F5A623' : 'none'} stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: replyingTo === voteId ? 1 : 0.6 }}>
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                              </button>

                              {/* Bump — keep this review visible */}
                              <button
                                onClick={function(){ toggleBump(voteId) }}
                                title={bumped[voteId] ? 'Bumped — this review is being kept active' : 'Bump this review to keep it visible'}
                                className="rv-vote-btn"
                                style={{ marginTop:'2px' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: bumped[voteId] ? 1 : 0.4 }}>
                                  <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
                                </svg>
                              </button>

                            </div>
                              {/* Vertical divider — desktop only */}
                              <div className="rv-divider" />
                            </div>

                            {/* REPLY PANEL — expands from left, pushes review right */}
                            {replyingTo === voteId && (
                              <div style={{ width:'220px', flexShrink:0, background:'#F8F7F4', borderRadius:'10px', border:'1px solid rgba(0,0,0,0.07)', padding:'12px', marginRight:'12px', animation:'slideIn 0.2s ease' }}>
                                <div style={{ fontSize:'12px', fontWeight:'700', color:'#1A1A1A', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Add your reply</div>
                                <textarea
                                  placeholder="Write your reply..."
                                  rows={4}
                                  value={replyTexts[voteId] || ''}
                                  onChange={function(e) { setReplyTexts(function(prev) { return {...prev, [voteId]: e.target.value} }) }}
                                  style={{ width:'100%', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'8px', padding:'8px 10px', fontSize:'13px', fontFamily:'inherit', resize:'none', outline:'none', boxSizing:'border-box' as const, color:'#1A1A1A', background:'white', marginBottom:'8px' }}
                                />
                                <button
                                  onClick={function(){ submitReply(voteId) }}
                                  style={{ display:'block', width:'100%', background:'#1c9b6d', color:'white', border:'none', borderRadius:'100px', padding:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', marginBottom:'6px' }}
                                >Post reply</button>
                                <button
                                  onClick={function(){ setReplyingTo(null) }}
                                  style={{ display:'block', width:'100%', background:'none', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'100px', padding:'7px', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', color:'#666' }}
                                >Cancel</button>
                              </div>
                            )}

                          </div>{/* rv-left-side */}

                          {/* REVIEW CONTENT — gets pushed right when reply panel opens */}
                          <div style={{ flex:1, minWidth:0 }}>
                          <div className={styles.reviewTop}>
                            <div className={styles.reviewerInfo}>
                              {r.photo ? <img src={r.photo} alt={r.name} className={styles.reviewerPhoto} /> : <div className={styles.reviewerInitial}>{r.name[0]?r.name[0].toUpperCase():'?'}</div>}
                              <div>
                                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                                  <span className={styles.reviewerName}>{r.name}</span>
                                  {r.src === 'g' && <span style={{ fontSize:'12px', color:'#F5A623', fontWeight:'500' }}>&#10003; Verified</span>}
                                </div>
                                <div className={styles.reviewDate}>{r.date}</div>
                              </div>
                            </div>
                            <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:badgeBg, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', flexShrink:0 }}>{badgeLbl}</div>
                          </div>
                          <div style={{ marginBottom:'8px', marginTop:'4px' }}>{starsBoxed(r.rating)}</div>
                          {isFlagged && (
                            <div style={{ fontSize:'12px', color:'#E53E3E', fontWeight:'500', marginBottom:'4px' }}>
                              You flagged this review as potentially inaccurate.
                            </div>
                          )}
                          {r.text ? <ExpandableReview text={r.text} /> : null}

                          {/* BUMP INDICATOR */}
                          {bumped[voteId] && (
                            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'8px', fontSize:'12px', color:'#F5A623', fontWeight:'600' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5A623" stroke="#F5A623" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
                              You bumped this review — keeping it visible
                            </div>
                          )}

                          {/* REPLY COUNT */}
                          {(replies[voteId] || []).length > 0 && (
                            <div className={styles.replyCount}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2z"/></svg>
                              {(replies[voteId] || []).length} {(replies[voteId] || []).length === 1 ? 'reply' : 'replies'}
                            </div>
                          )}

                          {/* REPLY THREAD */}
                          {(replies[voteId] || []).length > 0 && (
                            <div className={styles.replyThread}>
                              {(replies[voteId] || []).map(function(rep, ri) {
                                return (
                                  <div key={ri} className={styles.replyItem}>
                                    <div className={styles.replyAvatar + (rep.isOwner ? ' ' + styles.replyOwnerAvatar : '')}>
                                      {rep.name[0] ? rep.name[0].toUpperCase() : '?'}
                                    </div>
                                    <div className={styles.replyContent}>
                                      <div className={styles.replyMeta}>
                                        <span className={styles.replyAuthor}>{rep.name}</span>
                                        {rep.isOwner && <span className={styles.replyOwnerBadge}>Owner</span>}
                                        <span className={styles.replyDate}>{rep.date}</span>
                                      </div>
                                      <div className={styles.replyText}>{rep.text}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          </div>

                        </div>{/* rv-card-inner */}

                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* WRITE REVIEW CTA — dark background, NO logo */}
            <div className={styles.writeReviewSection}>
              <h3>Visited {place.name}?</h3>
              <p>Share your experience and help others find great local businesses.</p>
              <button className={styles.writeReviewBtn} onClick={function(){setModalMode('review')}}>Write a review</button>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div className={styles.sidebar}>

            {/* BUSINESS INFO */}
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Business info</h3>
              {place.formatted_address && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <div className={styles.infoLabel}>Address</div>
                    <span className={styles.infoValue}>{place.formatted_address}</span>
                    <a href={'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place.formatted_address)} target="_blank" rel="noopener noreferrer" className={styles.infoLink}>Get directions</a>
                  </div>
                </div>
              )}
              {place.formatted_phone_number && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
                  <div>
                    <div className={styles.infoLabel}>Phone</div>
                    <a href={"tel:"+place.formatted_phone_number} className={styles.infoValue} style={{color:"inherit",textDecoration:"none"}}>{place.formatted_phone_number}</a>
                  </div>
                </div>
              )}
              {place.website && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <div>
                    <div className={styles.infoLabel}>Website</div>
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className={styles.infoLink}>{place.website.replace(/^https?:\/\/(www\.)?/,'').split('/')[0]}</a>
                  </div>
                </div>
              )}
              {place.opening_hours && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <div className={styles.infoLabel}>Hours</div>
                    <button className={styles.hoursToggle} onClick={function(){setHoursOpen(function(o){return !o})}}>
                      {place.opening_hours.open_now ? 'Open now' : 'Closed'} {hoursOpen ? '▲' : '▼'}
                    </button>
                    {hoursOpen && place.opening_hours.weekday_text && (
                      <div className={styles.hoursList}>
                        {place.opening_hours.weekday_text.map(function(h,i){ return <div key={i} className={styles.hoursRow}>{h}</div> })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MAP + TAKE ME THERE */}
            <div style={{ borderRadius:'16px', overflow:'hidden', border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <iframe title="map" width="100%" height="200" style={{ border:0, display:'block' }} loading="lazy" src={'https://www.google.com/maps?q='+encodeURIComponent(place.formatted_address)+'&output=embed'} />
              <a href={'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place.formatted_address)} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#F5A623', color:'white', fontSize:'13px', fontWeight:'600', padding:'12px', textDecoration:'none' }}>
                Take Me There
              </a>
            </div>

            {/* CLAIM BOX — no logo */}
            <div style={{ background:'#FFFBF0', border:'1px solid rgba(245,166,35,0.3)', borderRadius:'16px', padding:'24px', textAlign:'center' }}>
              <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', marginBottom:'8px', marginTop:0 }}>Own this business?</h4>
              <p style={{ fontSize:'13px', color:'#555', lineHeight:1.5, marginBottom:'16px', marginTop:0 }}>Claim your free listing to respond to reviews and manage your reputation across all platforms.</p>
              <button onClick={function(){setModalMode('claim')}} style={{ display:'block', width:'100%', background:'#1c9b6d', color:'white', fontSize:'13px', fontWeight:'600', padding:'11px 20px', borderRadius:'100px', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Claim this listing</button>
            </div>

          </div>
        </div>
      </div>

      <Footer />

      {lightboxOpen && photos.length > 0 && (
        <div onClick={function(){setLightboxOpen(false)}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <button onClick={function(){setLightboxOpen(false)}} style={{ position:'absolute', top:'16px', right:'16px', background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:'40px', height:'40px', borderRadius:'50%', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>x</button>
          <div style={{ position:'absolute', top:'20px', left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.7)', fontSize:'13px' }}>{lightboxIdx+1} / {photos.length}</div>
          <img src={photos[lightboxIdx]||''} alt={place.name} onClick={function(e){e.stopPropagation()}} style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:'8px' }} />
          {photos.length > 1 && <button onClick={function(e){e.stopPropagation();setLightboxIdx(function(n){return (n-1+photos.length)%photos.length})}} style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:'48px', height:'48px', borderRadius:'50%', fontSize:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>&#8249;</button>}
          {photos.length > 1 && <button onClick={function(e){e.stopPropagation();setLightboxIdx(function(n){return (n+1)%photos.length})}} style={{ position:'absolute', right:'16px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:'48px', height:'48px', borderRadius:'50%', fontSize:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>&#8250;</button>}
        </div>
      )}

      {modalMode==='review' && <AuthModal mode="review" businessName={place.name} businessId={place.place_id} onClose={function(){setModalMode(null)}} />}

      {/* FLAG REASON MODAL */}
      {flagging && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'28px', maxWidth:'420px', width:'100%', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'6px' }}>Flag this review</h3>
            <p style={{ fontSize:'13px', color:'#666', marginBottom:'20px', lineHeight:'1.5' }}>
              Please tell us why this review should be flagged. Flagging requires a RatingBee account so we can prevent abuse.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
              {[
                'Fake or paid review',
                'Conflict of interest (competitor or owner)',
                'Contains false information',
                'Inappropriate or offensive content',
                'Spam or advertising',
                'Review for wrong business',
              ].map(function(reason) {
                return (
                  <label key={reason} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', border:'1.5px solid', borderColor: flagReason===reason ? '#E53E3E' : 'rgba(0,0,0,0.1)', borderRadius:'10px', cursor:'pointer', fontSize:'14px', color:'#333', background: flagReason===reason ? '#FFF5F5' : 'white', transition:'all 0.15s' }}>
                    <input type="radio" name="flagReason" value={reason} checked={flagReason===reason} onChange={function(){ setFlagReason(reason) }} style={{ accentColor:'#E53E3E' }} />
                    {reason}
                  </label>
                )
              })}
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button
                onClick={function(){ setFlagging(null); setFlagReason('') }}
                style={{ flex:1, background:'none', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'100px', padding:'10px', fontSize:'14px', cursor:'pointer', fontFamily:'inherit', color:'#555' }}
              >Cancel</button>
              <button
                onClick={function(){
                  if (!flagReason) return
                  castVote(flagging, 'flag')
                  setFlagging(null)
                  setFlagReason('')
                  setModalMode('login')
                }}
                disabled={!flagReason}
                style={{ flex:1, background: flagReason ? '#E53E3E' : '#ccc', color:'white', border:'none', borderRadius:'100px', padding:'10px', fontSize:'14px', fontWeight:'600', cursor: flagReason ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'background 0.15s' }}
              >Submit Flag</button>
            </div>

            <p style={{ fontSize:'12px', color:'#999', textAlign:'center', marginTop:'12px' }}>
              You will be asked to sign in or create a free account to submit.
            </p>
          </div>
        </div>
      )}
      {modalMode==='claim' && <AuthModal mode="claim" businessName={place.name} businessId={place.place_id} businessPhone={place.formatted_phone_number} onClose={function(){setModalMode(null)}} />}
      {(modalMode==='register'||modalMode==='login') && <AuthModal mode={modalMode} businessName="" businessId="" onClose={function(){setModalMode(null)}} />}

    </div>
  )
}
