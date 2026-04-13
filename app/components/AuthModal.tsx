'use client'

import { useState } from 'react'

type ModalMode = 'register' | 'login' | 'claim' | 'review'

interface AuthModalProps {
  mode: ModalMode
  businessName?: string
  businessId?: string
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ mode, businessName, businessId, onClose, onSuccess }: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState<ModalMode>(mode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stars, setStars] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [ownerRole, setOwnerRole] = useState('')
  const [reviewText, setReviewText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (currentMode === 'register') {
        if (!name || !email || !password) { setError('Please fill in all fields.'); setLoading(false); return }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Registration failed.'); setLoading(false); return }
        if (data.autoLogin) {
          setSuccess('Account created! Taking you to your dashboard...')
          setTimeout(function() { window.location.href = '/dashboard' }, 1000)
        } else {
          setSuccess('Account created! Please sign in.')
        }
      }

      if (currentMode === 'login') {
        if (!email || !password) { setError('Please enter your email and password.'); setLoading(false); return }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Login failed. Check your email and password.'); setLoading(false); return }

        setSuccess('Welcome back!')
        setTimeout(() => { onSuccess?.(); onClose(); window.location.reload() }, 1000)
      }

      if (currentMode === 'claim') {
        if (!name || !email || !businessPhone || !ownerRole) { setError('Please fill in all fields.'); setLoading(false); return }

        const res = await fetch('/api/claim/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerName: name,
            email,
            businessPhone,
            ownerRole,
            placeId: businessId,
            businessName,
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Claim failed. Please try again.'); setLoading(false); return }

        setSuccess(`We sent a 6-digit code to ${businessPhone}. Enter it on the next screen to verify ownership.`)
        setTimeout(() => {
          window.location.href = `/claim/verify?place_id=${businessId}&phone=${encodeURIComponent(businessPhone)}`
        }, 2000)
      }

      if (currentMode === 'review') {
        if (stars === 0) { setError('Please select a star rating.'); setLoading(false); return }
        if (!reviewText.trim() || reviewText.length < 20) { setError('Please write at least 20 characters.'); setLoading(false); return }
        if (!email) { setError('Please enter your email.'); setLoading(false); return }

        const res = await fetch('/api/reviews/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placeId: businessId,
            businessName,
            authorName: name || email.split('@')[0],
            rating: stars,
            text: reviewText,
            email,
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Failed to submit review.'); setLoading(false); return }

        setSuccess('Your review has been submitted! It will appear after moderation.')
        setTimeout(() => { onSuccess?.(); onClose() }, 2000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const titles: Record<ModalMode, string> = {
    register: 'Join RatingBee',
    login: 'Welcome back',
    claim: `Claim ${businessName || 'this business'}`,
    review: `Review ${businessName || 'this business'}`,
  }

  const subs: Record<ModalMode, string> = {
    register: 'Create your free account to leave reviews and track local businesses.',
    login: 'Sign in to your RatingBee account.',
    claim: 'Verify you own this business to respond to reviews and collect new ones.',
    review: 'Share your experience to help the community.',
  }

  return (
    <div className="rb-modal-overlay" onClick={function(e) { if (e.target === e.currentTarget) onClose() }}>
      <div className="rb-modal-wrap">
        <div className="rb-modal">
          <button className="rb-modal-close" onClick={onClose} aria-label="Close">×</button>
          <img src="/rating-bee.png" alt="RatingBee" style={{ height:'40px', width:'auto', margin:'0 auto 20px', display:'block', objectFit:'contain' }} />
          <h2 className="rb-modal-title">{titles[currentMode]}</h2>
          <p className="rb-modal-sub">{subs[currentMode]}</p>

          {error && <div className="rb-form-error">{error}</div>}
          {success && <div className="rb-form-success">{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit}>

              {currentMode === 'review' && (
                <>
                  <div className="rb-form-group">
                    <div className="rb-form-label">Your rating</div>
                    <div className="rb-stars-input">
                      {[1,2,3,4,5].map(function(s) {
                        return (
                          <button key={s} type="button"
                            className={`rb-star-btn ${s <= (hoveredStar || stars) ? 'active' : ''}`}
                            onMouseEnter={function() { setHoveredStar(s) }}
                            onMouseLeave={function() { setHoveredStar(0) }}
                            onClick={function() { setStars(s) }}
                          >★</button>
                        )
                      })}
                    </div>
                    {stars > 0 && <div style={{ fontSize:'13px', color:'var(--gray-mid)' }}>{['','Terrible','Poor','Average','Good','Excellent'][stars]}</div>}
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Your name</label>
                    <input className="rb-form-input" type="text" placeholder="First name or nickname" value={name} onChange={function(e) { setName(e.target.value) }} />
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Your review</label>
                    <textarea className="rb-form-input rb-form-textarea" placeholder="Share your experience — what was great, what could be better..." value={reviewText} onChange={function(e) { setReviewText(e.target.value) }} required />
                    <div style={{ fontSize:'12px', color:'var(--gray-mid)', marginTop:'4px' }}>{reviewText.length} characters — minimum 20</div>
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Email (not shown publicly)</label>
                    <input className="rb-form-input" type="email" placeholder="your@email.com" value={email} onChange={function(e) { setEmail(e.target.value) }} required />
                  </div>
                </>
              )}

              {currentMode === 'claim' && (
                <>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Your full name</label>
                    <input className="rb-form-input" type="text" placeholder="John Smith" value={name} onChange={function(e) { setName(e.target.value) }} required />
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Business email</label>
                    <input className="rb-form-input" type="email" placeholder="owner@yourbusiness.com" value={email} onChange={function(e) { setEmail(e.target.value) }} required />
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Business phone number listed on Google</label>
                    <input className="rb-form-input" type="tel" placeholder="(925) 555-0100" value={businessPhone} onChange={function(e) { setBusinessPhone(e.target.value) }} required />
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Your role</label>
                    <select className="rb-form-input" value={ownerRole} onChange={function(e) { setOwnerRole(e.target.value) }} required>
                      <option value="">Select your role</option>
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="marketing">Marketing Manager</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <p style={{ fontSize:'12px', color:'var(--gray-mid)', marginBottom:'12px', lineHeight:'1.5' }}>
                    We will send a 6-digit verification code to the phone number listed on your Google Business Profile.
                  </p>
                </>
              )}

              {currentMode === 'register' && (
                <>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Full name</label>
                    <input className="rb-form-input" type="text" placeholder="Your name" value={name} onChange={function(e) { setName(e.target.value) }} required />
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Email address</label>
                    <input className="rb-form-input" type="email" placeholder="your@email.com" value={email} onChange={function(e) { setEmail(e.target.value) }} required />
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Password</label>
                    <input className="rb-form-input" type="password" placeholder="At least 8 characters" value={password} onChange={function(e) { setPassword(e.target.value) }} required minLength={8} />
                  </div>
                  <p style={{ fontSize:'12px', color:'var(--gray-mid)', marginBottom:'12px', lineHeight:'1.5' }}>
                    By creating an account you agree to our <a href="/terms" style={{ color:'var(--honey-dark)' }}>Terms of Service</a> and <a href="/privacy" style={{ color:'var(--honey-dark)' }}>Privacy Policy</a>.
                  </p>
                </>
              )}

              {currentMode === 'login' && (
                <>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Email address</label>
                    <input className="rb-form-input" type="email" placeholder="your@email.com" value={email} onChange={function(e) { setEmail(e.target.value) }} required />
                  </div>
                  <div className="rb-form-group">
                    <label className="rb-form-label">Password</label>
                    <input className="rb-form-input" type="password" placeholder="Your password" value={password} onChange={function(e) { setPassword(e.target.value) }} required />
                  </div>
                  <div style={{ textAlign:'right', marginBottom:'12px' }}>
                    <a href="/forgot-password" style={{ fontSize:'13px', color:'var(--honey-dark)' }}>Forgot password?</a>
                  </div>
                </>
              )}

              <button type="submit" className="rb-form-btn" disabled={loading}>
                {loading && <span className="rb-spinner" />}
                {!loading && (
                  currentMode === 'register' ? 'Create Account' :
                  currentMode === 'login' ? 'Sign In' :
                  currentMode === 'claim' ? 'Send Verification Code' :
                  'Submit Review'
                )}
              </button>
            </form>
          )}

          {!success && currentMode === 'register' && (
            <p className="rb-form-switch">Already have an account?{' '}<a onClick={function() { setError(''); setCurrentMode('login') }}>Sign in</a></p>
          )}
          {!success && currentMode === 'login' && (
            <p className="rb-form-switch">Don't have an account?{' '}<a onClick={function() { setError(''); setCurrentMode('register') }}>Create one free</a></p>
          )}
          {!success && (currentMode === 'claim' || currentMode === 'review') && (
            <p className="rb-form-switch">Have an account?{' '}<a onClick={function() { setError(''); setCurrentMode('login') }}>Sign in</a></p>
          )}

        </div>
      </div>
    </div>
  )
}
