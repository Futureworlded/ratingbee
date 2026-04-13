'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const type = searchParams.get('type')

  useEffect(function() {
    // Supabase redirects here after email confirmation
    // The hash contains the session tokens
    const hash = window.location.hash
    if (hash.includes('access_token') || hash.includes('type=signup') || !hash) {
      setTimeout(function() {
        setStatus('success')
        setTimeout(function() { window.location.href = '/dashboard' }, 1500)
      }, 1000)
    } else if (hash.includes('error')) {
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(function() { window.location.href = '/dashboard' }, 1500)
    }
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F3EE', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'48px 40px', textAlign:'center', maxWidth:'400px', width:'100%', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <img src="/rating-bee.png" alt="RatingBee" style={{ height:'52px', width:'auto', margin:'0 auto 24px', display:'block' }} />

        {status === 'loading' && (
          <>
            <div style={{ fontSize:'1.3rem', fontWeight:'700', color:'#1A1A1A', marginBottom:'8px', fontFamily:'Georgia, serif' }}>Verifying your account...</div>
            <div style={{ fontSize:'14px', color:'#888' }}>Just a moment</div>
            <div style={{ marginTop:'24px', display:'flex', justifyContent:'center' }}>
              <div style={{ width:'32px', height:'32px', border:'3px solid #F5A623', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>✓</div>
            <div style={{ fontSize:'1.3rem', fontWeight:'700', color:'#1A1A1A', marginBottom:'8px', fontFamily:'Georgia, serif' }}>
              {type === 'recovery' ? 'Password reset ready' : 'Email verified!'}
            </div>
            <div style={{ fontSize:'14px', color:'#888' }}>Taking you to your dashboard...</div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize:'1.3rem', fontWeight:'700', color:'#E53E3E', marginBottom:'8px', fontFamily:'Georgia, serif' }}>Verification failed</div>
            <div style={{ fontSize:'14px', color:'#888', marginBottom:'24px' }}>The link may have expired. Please try signing up again.</div>
            <a href="/" style={{ background:'#F5A623', color:'white', padding:'10px 24px', borderRadius:'100px', textDecoration:'none', fontSize:'14px', fontWeight:'600' }}>Back to home</a>
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  )
}
