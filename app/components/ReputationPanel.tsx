'use client'

import { useEffect, useRef, useState } from 'react'

interface ReputationPanelProps {
  businessName: string
  placeId: string
  googleRating?: number
  googleCount?: number
  tripAdvisorRating?: number
  tripAdvisorCount?: number
  tripAdvisorUrl?: string
  claimed?: boolean
  website?: string
  onClaim?: () => void
}

function generateQR(canvas: HTMLCanvasElement, text: string, size: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => { canvas.width = size; canvas.height = size; ctx.drawImage(img, 0, 0, size, size) }
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=1a1a1a&margin=10`
}

function StarDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return <span style={{ color: '#F5A623', fontSize: `${size}px`, letterSpacing: '1px' }}>{'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}</span>
}

const REVIEW_PLATFORMS = [
  { id: 'google', name: 'Google', color: '#4285F4', letter: 'G' },
  { id: 'yelp', name: 'Yelp', color: '#D32323', letter: 'Y' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', letter: 'f' },
  { id: 'tripadvisor', name: 'TripAdvisor', color: '#00AA6C', letter: 'T' },
]

export default function ReputationPanel({ businessName, placeId, googleRating, googleCount, tripAdvisorRating, tripAdvisorCount, tripAdvisorUrl, claimed = false, onClaim }: ReputationPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const reviewUrl = typeof window !== 'undefined' ? `${window.location.origin}/biz/${placeId}#write-review` : `/biz/${placeId}#write-review`

  useEffect(() => { if (canvasRef.current) generateQR(canvasRef.current, reviewUrl, 200) }, [reviewUrl])

  const downloadQR = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `ratingbee-qr-${businessName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  const copyLink = () => { navigator.clipboard.writeText(reviewUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const scores = [googleRating, tripAdvisorRating ? Number(tripAdvisorRating) : undefined].filter(Boolean) as number[]
  const rbScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null

  const getReviewUrl = (id: string) => {
    if (id === 'google') return `https://search.google.com/local/writereview?placeid=${placeId}`
    if (id === 'tripadvisor') return tripAdvisorUrl || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(businessName)}`
    if (id === 'yelp') return `https://www.yelp.com/search?find_desc=${encodeURIComponent(businessName)}`
    return `https://www.facebook.com/search/pages/?q=${encodeURIComponent(businessName)}`
  }

  const scoreCard = (badge: React.ReactNode, rating: number | null | undefined, label: string, count?: number | null, isRB = false) => (
    <div style={{ padding: '16px 8px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.05)', background: isRB ? '#FFFBF0' : 'white' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{badge}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: isRB ? '#F5A623' : '#1A1A1A', lineHeight: '1' }}>{rating ? Number(rating).toFixed(1) : '—'}</div>
      {rating ? <div style={{ marginTop: '4px' }}><StarDisplay rating={Number(rating)} size={10} /></div> : null}
      <div style={{ fontSize: '10px', color: isRB ? '#D4891A' : '#888', marginTop: '4px', fontWeight: isRB ? '600' : '500' }}>{label}</div>
      {count ? <div style={{ fontSize: '10px', color: '#BBB', marginTop: '2px' }}>{Number(count).toLocaleString()} reviews</div> : null}
      {!rating && label === 'TripAdvisor' && <div style={{ fontSize: '10px', color: '#CCC', marginTop: '2px' }}>Loading...</div>}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* THREE SCORES */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#888', fontWeight: '500' }}>Reputation Scores</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {scoreCard(
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>G</div>,
            googleRating, 'Google', googleCount
          )}
          {scoreCard(
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#00AA6C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>T</div>,
            tripAdvisorRating ? Number(tripAdvisorRating) : null, 'TripAdvisor', tripAdvisorCount
          )}
          {scoreCard(
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#D4891A', letterSpacing: '-0.5px' }}>RB</span>
            </div>,
            rbScore, 'RatingBee', null, true
          )}
        </div>
        {!claimed && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.05)', background: '#FAFAFA' }}>
            <button onClick={onClaim} style={{ display: 'block', width: '100%', background: '#F5A623', color: 'white', fontWeight: '600', fontSize: '13px', padding: '10px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Claim to add Yelp, Facebook & more
            </button>
          </div>
        )}
      </div>

      {/* MORE PLATFORMS - LOCKED */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#888', marginBottom: '12px', fontWeight: '500' }}>More platforms</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[{ id: 'yelp', name: 'Yelp', color: '#D32323', letter: 'Y' }, { id: 'facebook', name: 'Facebook', color: '#1877F2', letter: 'f' }, { id: 'bbb', name: 'BBB', color: '#003087', letter: 'B' }, { id: 'nextdoor', name: 'Nextdoor', color: '#8BBF3F', letter: 'N' }].map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: p.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{p.letter}</div>
              <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#AAA' }}>{p.name}</div>
              <div onClick={onClaim} style={{ fontSize: '11px', fontWeight: '500', color: 'white', background: '#CCC', padding: '3px 10px', borderRadius: '100px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Claim to unlock</div>
            </div>
          ))}
        </div>
      </div>

      {/* LEAVE A REVIEW ON */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#888', marginBottom: '12px', fontWeight: '500' }}>Leave a review on</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {REVIEW_PLATFORMS.map(platform => (
            <a key={platform.id} href={getReviewUrl(platform.id)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: '#F4F4F2', border: '1px solid rgba(0,0,0,0.06)', textDecoration: 'none', color: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEF3DC')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F4F4F2')}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: platform.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>{platform.letter}</div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#2D2D2D', flex: 1 }}>Review on {platform.name}</div>
              <div style={{ fontSize: '12px', color: '#AAA' }}>→</div>
            </a>
          ))}
        </div>
      </div>

      {/* QR CODE */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#888', marginBottom: '14px', fontWeight: '500' }}>QR Code — Print and Share</div>
        <div style={{ display: 'inline-block', padding: '12px', background: 'white', border: '2px solid #F4F4F2', borderRadius: '12px', marginBottom: '12px' }}>
          <canvas ref={canvasRef} width={200} height={200} style={{ display: 'block', width: '160px', height: '160px' }} />
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '14px', lineHeight: '1.5' }}>Customers scan this to leave a review instantly. Print it on receipts, invoices, or your front desk.</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={downloadQR} style={{ flex: 1, background: '#1A1A1A', color: 'white', fontSize: '12px', fontWeight: '600', padding: '10px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Download QR</button>
          <button onClick={copyLink} style={{ flex: 1, background: copied ? '#2E7D52' : '#F4F4F2', color: copied ? 'white' : '#2D2D2D', fontSize: '12px', fontWeight: '600', padding: '10px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>{copied ? 'Copied!' : 'Copy Link'}</button>
        </div>
      </div>

    </div>
  )
}
