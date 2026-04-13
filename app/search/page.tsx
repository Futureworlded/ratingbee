'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Footer from '../components/Footer'
import AuthModal from '../components/AuthModal'
import styles from './search.module.css'

interface Place {
  place_id: string
  name: string
  vicinity: string
  rating?: number
  user_ratings_total?: number
  types: string[]
  photos?: { photo_reference: string }[]
  opening_hours?: { open_now: boolean }
  price_level?: number
}

const CATEGORIES = [
  { label: 'Restaurants', query: 'restaurants' },
  { label: 'Home Services', query: 'home services' },
  { label: 'Beauty & Spas', query: 'beauty salon' },
  { label: 'Auto', query: 'auto repair' },
  { label: 'Medical', query: 'doctor' },
  { label: 'Legal', query: 'lawyer' },
  { label: 'Pet Services', query: 'veterinarian' },
  { label: 'Fitness', query: 'gym' },
  { label: 'Cleaning', query: 'cleaning service' },
  { label: 'Plumbing', query: 'plumber' },
  { label: 'Electrical', query: 'electrician' },
  { label: 'HVAC', query: 'hvac' },
]

function getGooglePhotoUrl(photoRef: string) {
  return '/api/photo?ref=' + photoRef + '&maxwidth=600'
}

function renderStars(rating: number) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
}

function getCategory(types: string[]) {
  const map: Record<string, string> = {
    restaurant: 'Restaurant', food: 'Food & Dining', cafe: 'Cafe', bar: 'Bar',
    beauty_salon: 'Beauty Salon', hair_care: 'Hair Care', gym: 'Gym & Fitness',
    health: 'Health', doctor: 'Medical', lawyer: 'Legal Services',
    car_repair: 'Auto Repair', plumber: 'Plumbing', electrician: 'Electrical',
    store: 'Retail', lodging: 'Hotel', spa: 'Spa',
    veterinary_care: 'Veterinary', dentist: 'Dentist',
    real_estate_agency: 'Real Estate', insurance_agency: 'Insurance',
    flooring_store: 'Flooring', hardware_store: 'Hardware',
    home_goods_store: 'Home Goods', furniture_store: 'Furniture',
  }
  for (const t of types) { if (map[t]) return map[t] }
  return (types[0] || 'business').replace(/_/g, ' ')
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const city = searchParams.get('city') || ''

  const [what, setWhat] = useState(q)
  const [where, setWhere] = useState(city)

  useEffect(function() {
    // If no city in URL, restore from localStorage
    if (!city && typeof window !== 'undefined') {
      const saved = localStorage.getItem('rb_city')
      if (saved) setWhere(saved)
    }
  }, [])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')

  useEffect(function() {
    if (q || city) fetchPlaces(q, city)
  }, [q, city])

  async function fetchPlaces(query: string, location: string) {
    if (location && typeof window !== 'undefined') localStorage.setItem('rb_city', location)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/places?q=' + encodeURIComponent(query) + '&city=' + encodeURIComponent(location))
      const data = await res.json()
      if (data.results) setPlaces(data.results)
      else setError('No results found. Try a different search.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (what.trim()) params.set('q', what.trim())
    if (where.trim()) params.set('city', where.trim())
    router.push('/search?' + params.toString())
  }

  function handleCategory(query: string) {
    setWhat(query)
    const params = new URLSearchParams()
    params.set('q', query)
    if (where.trim()) params.set('city', where.trim())
    router.push('/search?' + params.toString())
  }

  return (
    <div className={styles.page}>

      <nav className="rb-nav">
        <a href="/" className="rb-nav-logo">
          <img src="/rating-bee.png" alt="RatingBee" className="rb-nav-logo-img" />
        </a>
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <div className={styles.searchField}>
            <input
              type="text"
              placeholder="restaurants, plumbers, salons..."
              value={what}
              onChange={function(e) { setWhat(e.target.value) }}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.divider} />
          <div className={styles.searchField}>
            <input
              type="text"
              placeholder="city or neighborhood"
              value={where}
              onChange={function(e) { setWhere(e.target.value) }}
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className={styles.searchBtn}>Search</button>
        </form>
        <div className="rb-nav-links">
          <a href="/claim" className="rb-nav-link">For Businesses</a>
          <button className="rb-nav-link" style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'14px', fontWeight:'500', color:'var(--gray-dark)' }} onClick={function() { setAuthMode('register'); setShowAuth(true) }}>Register</button>
          <button className="rb-nav-btn" onClick={function() { setAuthMode('login'); setShowAuth(true) }}>Sign In</button>
        </div>
      </nav>

      <div className={styles.catBar}>
        <div className={styles.catBarInner}>
          {CATEGORIES.map(function(cat) {
            return (
              <button
                key={cat.query}
                className={styles.catPill + (q === cat.query ? ' ' + styles.catPillActive : '')}
                onClick={function() { handleCategory(cat.query) }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>

          {!loading && places.length > 0 && (
            <div className={styles.meta}>
              <span className={styles.metaCount}>{places.length} results</span>
              {q && <span> for <strong>"{q}"</strong></span>}
              {city && <span> near <strong>{city}</strong></span>}
            </div>
          )}

          {loading && (
            <div className={styles.stateBox}>
              <img src="/rating-bee.png" alt="" className={styles.stateIcon} />
              <p>Finding the best businesses...</p>
            </div>
          )}

          {error && !loading && <div className={styles.errorBox}>{error}</div>}

          {!loading && !error && places.length === 0 && (q || city) && (
            <div className={styles.stateBox}>
              <img src="/rating-bee.png" alt="" className={styles.stateIcon} />
              <h3>No results found</h3>
              <p>Try broadening your search or a different location.</p>
            </div>
          )}

          {!loading && !q && !city && (
            <div className={styles.stateBox}>
              <img src="/rating-bee.png" alt="" className={styles.stateIcon} />
              <h3>Search for a local business</h3>
              <p>Enter what you are looking for and your city above.</p>
            </div>
          )}

          {!loading && places.length > 0 && (
            <div className={styles.grid}>
              {places.map(function(place) {
                const photoRef = place.photos && place.photos[0] ? place.photos[0].photo_reference : null
                return (
                  <a key={place.place_id} href={'/biz/' + place.place_id} className={styles.card}>
                    <div className={styles.cardPhoto}>
                      {photoRef ? (
                        <img
                          src={getGooglePhotoUrl(photoRef)}
                          alt={place.name}
                          className={styles.photoImg}
                          onError={function(e) {
                            e.currentTarget.style.display = 'none'
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              const ph = document.createElement('div')
                              ph.className = styles.photoPlaceholder
                              ph.innerHTML = '<img src="/rating-bee.png" alt="" class="' + styles.photoFallback + '" />'
                              parent.appendChild(ph)
                            }
                          }}
                        />
                      ) : (
                        <div className={styles.photoPlaceholder}>
                          <img src="/rating-bee.png" alt="" className={styles.photoFallback} />
                        </div>
                      )}
                      {place.opening_hours && place.opening_hours.open_now && (
                        <span className={styles.openBadge}>Open</span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardName}>{place.name}</h3>
                      <div className={styles.cardCat}>{getCategory(place.types)}</div>
                      {place.rating && (
                        <div className={styles.cardRating}>
                          <span className={styles.stars}>{renderStars(place.rating)}</span>
                          <span className={styles.ratingNum}>{place.rating.toFixed(1)}</span>
                          {place.user_ratings_total && (
                            <span className={styles.ratingCount}>({place.user_ratings_total.toLocaleString()})</span>
                          )}
                        </div>
                      )}
                      <div className={styles.cardAddr}>{place.vicinity}</div>
                      {place.price_level && (
                        <div className={styles.cardPrice}>{'$'.repeat(place.price_level)}</div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideCardLabel}>Featured listing</div>
            <div className={styles.featuredBiz}>
              <div className={styles.featuredAvatar}>B</div>
              <div>
                <div className={styles.featuredName}>Your business here</div>
                <div className={styles.featuredCat}>Reach local customers</div>
                <div className={styles.featuredStars}>★★★★★</div>
              </div>
            </div>
            <a href="/claim" className={styles.sideBtn}>Get featured</a>
          </div>

          <div className={styles.adBanner}>
            <div className={styles.adLabel}>Advertisement</div>
            <div className={styles.adContent}>
              <img src="/rating-bee.png" alt="" style={{ width: '36px', height: '36px', margin: '0 auto 10px', display: 'block' }} />
              <div className={styles.adHeadline}>Advertise on RatingBee</div>
              <div className={styles.adSub}>Put your business in front of local customers every month.</div>
              <a href="/claim" className={styles.adBtn}>Learn more</a>
            </div>
          </div>

          <div className={styles.sideSignup}>
            <div className={styles.sideSignupTitle}>New to RatingBee?</div>
            <div className={styles.sideSignupSub}>Claim your free listing and start collecting verified reviews today.</div>
            <a href="/claim" className={styles.sideBtn}>Claim free listing</a>
          </div>
        </aside>
      </div>

      <Footer />

      {showAuth && (
        <AuthModal mode={authMode} onClose={function() { setShowAuth(false) }} />
      )}

    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '120px 2rem', textAlign: 'center' }}>
        <img src="/rating-bee.png" alt="" style={{ width: '60px', margin: '0 auto 16px', display: 'block' }} />
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
