'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function VerifyContent() {
  const searchParams = useSearchParams()
  const placeId = searchParams.get('place_id') || ''
  const phone = searchParams.get('phone') || ''

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState<'code' | 'account'>('code')
  const [verifiedCode, setVerifiedCode] = useState('')

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/claim/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, code }),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Verification failed.'); setLoading(false); return }

      // Code verified — now create/link account
      setVerifiedCode(code)
      setStep('account')
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/claim/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, code: verifiedCode, email, password, name }),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Account creation failed.'); setLoading(false); return }

      setSuccess('Your business is claimed and your account is ready!')
      setTimeout(function() { window.location.href = '/dashboard' }, 2000)
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  async function resendCode() {
    window.history.back()
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F3EE', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'40px', maxWidth:'440px', width:'100%', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <a href="/" style={{ display:'block', marginBottom:'24px' }}>
          <img src="/rating-bee.png" alt="RatingBee" style={{ height:'36px', width:'auto' }} />
        </a>

        {success ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>✓</div>
            <div style={{ fontSize:'1.3rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'8px' }}>Business claimed!</div>
            <div style={{ fontSize:'14px', color:'#888' }}>Taking you to your dashboard...</div>
          </div>
        ) : step === 'code' ? (
          <>
            <h1 style={{ fontSize:'1.4rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'8px' }}>Enter your verification code</h1>
            <p style={{ fontSize:'14px', color:'#666', marginBottom:'28px', lineHeight:'1.5' }}>
              We sent a 6-digit code to <strong>{phone}</strong>. Enter it below to verify you own this business.
            </p>

            {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#E53E3E', marginBottom:'16px' }}>{error}</div>}

            <form onSubmit={handleVerifyCode}>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#333', marginBottom:'6px' }}>6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={function(e) { setCode(e.target.value.replace(/\D/g, '')) }}
                  style={{ width:'100%', border:'1px solid rgba(0,0,0,0.15)', borderRadius:'10px', padding:'14px 16px', fontSize:'22px', letterSpacing:'8px', textAlign:'center', outline:'none', fontFamily:'monospace', boxSizing:'border-box' as const }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                style={{ width:'100%', background: code.length === 6 ? '#1c9b6d' : '#ccc', color:'white', border:'none', borderRadius:'100px', padding:'14px', fontSize:'15px', fontWeight:'600', cursor: code.length === 6 ? 'pointer' : 'not-allowed', fontFamily:'inherit', marginBottom:'12px' }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button type="button" onClick={resendCode} style={{ width:'100%', background:'none', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'100px', padding:'12px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', color:'#555' }}>
                Go back to resend code
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'10px', padding:'12px 16px', marginBottom:'24px', fontSize:'13px', color:'#166534' }}>
              Code verified. Now create your account to manage this listing.
            </div>
            <h1 style={{ fontSize:'1.4rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'24px' }}>Create your account</h1>

            {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#E53E3E', marginBottom:'16px' }}>{error}</div>}

            <form onSubmit={handleCreateAccount}>
              {[
                { label:'Full name', type:'text', val:name, set:setName, ph:'Your name' },
                { label:'Email address', type:'email', val:email, set:setEmail, ph:'your@email.com' },
                { label:'Password', type:'password', val:password, set:setPassword, ph:'At least 8 characters' },
              ].map(function(f) {
                return (
                  <div key={f.label} style={{ marginBottom:'16px' }}>
                    <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#333', marginBottom:'6px' }}>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.ph}
                      value={f.val}
                      onChange={function(e) { f.set(e.target.value) }}
                      required
                      minLength={f.type === 'password' ? 8 : undefined}
                      style={{ width:'100%', border:'1px solid rgba(0,0,0,0.15)', borderRadius:'10px', padding:'12px 14px', fontSize:'14px', outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }}
                    />
                  </div>
                )
              })}
              <button
                type="submit"
                disabled={loading}
                style={{ width:'100%', background:'#1c9b6d', color:'white', border:'none', borderRadius:'100px', padding:'14px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', marginTop:'8px' }}
              >
                {loading ? 'Creating account...' : 'Complete Claim'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ClaimVerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
