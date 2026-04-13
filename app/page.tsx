'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'

const CATEGORIES = [
  { label: 'Restaurants', query: 'restaurants' },
  { label: 'Home Services', query: 'home services' },
  { label: 'Beauty & Spas', query: 'beauty salon' },
  { label: 'Auto Repair', query: 'auto repair' },
  { label: 'Medical', query: 'doctor' },
  { label: 'Legal', query: 'lawyer' },
  { label: 'Pet Services', query: 'veterinarian' },
  { label: 'Fitness', query: 'gym' },
  { label: 'Cleaning', query: 'cleaning service' },
  { label: 'Plumbing', query: 'plumber' },
  { label: 'Electrical', query: 'electrician' },
  { label: 'HVAC', query: 'hvac' },
]

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

interface GeoState {
  status: 'detecting' | 'found' | 'denied' | 'prompt'
  city: string
  lat: string
  lng: string
}


// Returns current meal period based on time of day
function getMealPeriod(): { label: string; query: string; emoji: string; sub: string } {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return { label: 'Breakfast', query: 'breakfast restaurants', emoji: '🌅', sub: 'Good morning! Find a great breakfast spot near you.' }
  if (hour >= 11 && hour < 15) return { label: 'Lunch', query: 'lunch restaurants', emoji: '☀️', sub: 'Lunchtime! Discover great spots nearby.' }
  if (hour >= 15 && hour < 17) return { label: 'Happy Hour', query: 'bars happy hour', emoji: '🍹', sub: 'Happy hour is on! Find bars and deals near you.' }
  if (hour >= 17 && hour < 21) return { label: 'Dinner', query: 'dinner restaurants', emoji: '🌙', sub: "What's for dinner tonight?" }
  return { label: 'Late Night', query: 'restaurants open late', emoji: '🌃', sub: 'Night owl? Find places open late near you.' }
}

export default function HomePage() {
  const [what, setWhat] = useState('')
  const [where, setWhere] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [geo, setGeo] = useState<GeoState>({ status: 'detecting', city: '', lat: '', lng: '' })
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'login'|'register'>('login')

  useEffect(function() {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll)
    return function() { window.removeEventListener('scroll', onScroll) }
  }, [])
  const router = useRouter()
  const mealPeriod = getMealPeriod()

  // Step 1: Try server-side geo first (Vercel headers)
  useEffect(() => {
    detectLocation()
  }, [])

  const detectLocation = async () => {
    try {
      // Silent IP detection only — no browser permission prompts for visitors
      // GPS can be offered later inside account settings for logged-in users
      const res = await fetch('/api/geo')
      const data = await res.json()

      if (data.detected && data.city) {
        const city = data.city + (data.region ? ', ' + data.region : '')
        setGeo({ status: 'found', city, lat: data.lat, lng: data.lng })
        setWhere(city)
        if (typeof window !== 'undefined') localStorage.setItem('rb_city', city)
        fetchNearby(getMealPeriod().query, city, data.lat, data.lng)
      } else {
        setGeo({ status: 'prompt', city: '', lat: '', lng: '' })
      }
    } catch {
      setGeo({ status: 'prompt', city: '', lat: '', lng: '' })
    }
  }

  const fetchNearby = async (query: string, city: string, lat = '', lng = '') => {
    setLoadingPlaces(true)
    try {
      const params = new URLSearchParams({ city })
      if (lat) params.set('lat', lat)
      if (lng) params.set('lng', lng)
      const res = await fetch(`/api/homepage?${params.toString()}`)
      const data = await res.json()
      if (data.places) setNearbyPlaces(data.places.slice(0, 6))
    } catch {
      // fail silently
    } finally {
      setLoadingPlaces(false)
    }
  }

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cityInput.trim()) return
    setGeo({ status: 'found', city: cityInput.trim(), lat: '', lng: '' })
    setWhere(cityInput.trim())
    if (typeof window !== 'undefined') localStorage.setItem('rb_city', cityInput.trim())
    fetchNearby(getMealPeriod().query, cityInput.trim())
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!what.trim() && !where.trim()) return
    const params = new URLSearchParams()
    if (what.trim()) params.set('q', what.trim())
    if (where.trim()) params.set('city', where.trim())
    router.push(`/search?${params.toString()}`)
  }

  const handleCategory = (query: string) => {
    const params = new URLSearchParams()
    params.set('q', query)
    const city = geo.city || where.trim()
    if (city) params.set('city', city)
    router.push(`/search?${params.toString()}`)
  }

  const getPhotoUrl = (ref: string) => `/api/photo?ref=${ref}&maxwidth=400`

  const renderStars = (rating: number) => {
    const full = Math.floor(rating)
    const half = rating % 1 >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  }

  const getCategory = (types: string[]) => {
    const map: Record<string, string> = {
      restaurant: 'Restaurant', food: 'Food & Dining', cafe: 'Café', bar: 'Bar',
      beauty_salon: 'Beauty Salon', gym: 'Gym', doctor: 'Medical', lawyer: 'Legal',
      car_repair: 'Auto Repair', plumber: 'Plumbing',
    }
    for (const t of types) { if (map[t]) return map[t] }
    return types[0]?.replace(/_/g, ' ') || 'Business'
  }

  const STATS = [
    { number: '2.4M+', label: 'Reviews collected' },
    { number: '180K+', label: 'Local businesses' },
    { number: '94%', label: 'Verified human' },
  ]

  return (
    <div className={styles.page}>

      {/* NAV */}
      <nav className={styles.nav + (scrolled ? ' ' + styles.navScrolled : '')}>
        <a href="/" className={styles.logo}>
          <img 
            src="/rating-bee.png" 
            alt="RatingBee" 
            className={styles.logoImg}
          />
        </a>
        <div className={styles.navRight}>
          <a href="/search" className={styles.navLink}>Explore</a>
          <a href="/claim" className={styles.navLink}>For Businesses</a>
          <button onClick={function(){ setModalMode('register'); setShowModal(true) }} className={styles.navLink} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'14px', fontWeight:'500', color:'var(--gray-dark)' }}>Register</button>
          <button onClick={function(){ setModalMode('login'); setShowModal(true) }} className={styles.claimBtn}>Sign In</button>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero} style={{ backgroundImage:"url('/hero-dining.png')", backgroundSize:"cover", backgroundPosition:"center" }}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroInner}>
          <div className={styles.heroBadge + ' animate-fade-up'}>
            <span className={styles.badgeDot}></span>
            <span style={{ color:'rgba(255,255,255,0.9)', fontSize:'13px', fontWeight:'500' }}>Verified human reviews — not bots, not AI</span>
          </div>

          <h1 className={styles.heroTitle + ' animate-fade-up-delay-1'}>
            Find businesses<br />
            <em>people actually trust</em>
          </h1>

          <p className={styles.heroSub + ' animate-fade-up-delay-2'}>
            {mealPeriod.sub}
          </p>

          {/* SEARCH BAR */}
          <form className={styles.searchBox + ' animate-fade-up-delay-3'} onSubmit={handleSearch}>
            <div className={styles.searchField}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="restaurants, plumbers, salons..."
                value={what}
                onChange={e => setWhat(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchField}>
              <span className={styles.searchIcon}>📍</span>
              <input
                type="text"
                placeholder={geo.status === 'detecting' ? 'Detecting location...' : 'city or zip code'}
                value={where}
                onChange={e => setWhere(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button type="submit" className={styles.searchBtn}>Search</button>
          </form>

          {/* CITY PROMPT — shown when geolocation denied */}
          {geo.status === 'prompt' && (
            <div className={styles.geoPrompt + ' animate-fade-up'}>
              <div className={styles.geoPromptInner}>
                <span className={styles.geoIcon}>📍</span>
                <div>
                  <div className={styles.geoPromptTitle}>What city are you in?</div>
                  <div className={styles.geoPromptSub}>We'll show you the best local businesses nearby.</div>
                </div>
              </div>
              <form className={styles.geoForm} onSubmit={handleCitySubmit}>
                <input
                  type="text"
                  placeholder="Enter your city..."
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  className={styles.geoInput}
                  autoFocus
                />
                <button type="submit" className={styles.geoSubmit}>Go →</button>
              </form>
            </div>
          )}

          {/* CATEGORIES */}
          <div className={styles.categories + ' animate-fade-up-delay-4'}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.query}
                className={styles.catBtn}
                onClick={() => handleCategory(cat.query)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.heroDecor} aria-hidden>
          <div className={styles.hexGrid}>
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} className={styles.hex} style={{animationDelay: `${i * 0.15}s`}} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsBar}>
        {STATS.map(s => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statNumber}>{s.number}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* NEARBY SECTION — only shown when geo found */}
      {(geo.status === 'found' || loadingPlaces) && (
        <section className={styles.nearbySection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {geo.city ? `${mealPeriod.label} near ${geo.city}` : `${mealPeriod.label} spots nearby`}
              </h2>
              <button
                className={styles.seeAll}
                onClick={() => handleCategory('restaurants')}
              >
                See all →
              </button>
            </div>

            {loadingPlaces ? (
              <div className={styles.nearbyLoading}>
                <img src="/rating-bee.png" alt="" style={{height:"44px",width:"auto",margin:"0 auto 12px",display:"block",objectFit:"contain"}} />
                <p>Finding {mealPeriod.label.toLowerCase()} spots near you...</p>
              </div>
            ) : (
              <div className={styles.nearbyGrid}>
                {nearbyPlaces.map(place => (
                  <a
                    key={place.place_id}
                    href={`/biz/${place.place_id}`}
                    className={styles.nearbyCard}
                  >
                    <div className={styles.nearbyPhoto}>
                      {(place as any).photos?.[0] ? (
                        <img
                          src={`/api/photo?ref=${(place as any).photos[0].photo_reference}&maxwidth=600`}
                          alt={place.name}
                          className={styles.nearbyPhotoImg}
                        />
                      ) : (
                        <div className={styles.nearbyPhotoPlaceholder}>
                          <img src="/rating-bee.png" alt="" style={{height:'32px',width:'auto',opacity:0.3,objectFit:'contain'}} />
                        </div>
                      )}
                      {place.opening_hours?.open_now && (
                        <span className={styles.nearbyOpen}>Open</span>
                      )}
                    </div>
                    <div className={styles.nearbyInfo}>
                      <div className={styles.nearbyName}>{place.name}</div>
                      <div className={styles.nearbyCat}>{getCategory(place.types)}</div>
                      {place.rating && (
                        <div className={styles.nearbyRating}>
                          <span className={styles.nearbyStars}>{renderStars(place.rating)}</span>
                          <span className={styles.nearbyRatingNum}>{place.rating.toFixed(1)}</span>
                          {place.user_ratings_total && (
                            <span className={styles.nearbyRatingCount}>({place.user_ratings_total.toLocaleString()})</span>
                          )}
                        </div>
                      )}
                      {place.rating && (
                        <div style={{display:"flex",alignItems:"center",gap:"4px",marginTop:"3px"}}>
                          <img src="/rating-bee.png" alt="" style={{height:"13px",width:"auto",objectFit:"contain",opacity:0.85}} />
                          <span style={{fontSize:"11px",color:"#D4891A",fontWeight:"600"}}>RatingBee {place.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className={styles.nearbyAddr}>{place.vicinity}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* WHY RATINGBEE */}
      <section className={styles.why}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why RatingBee is different</h2>
          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🎥</div>
              <h3>Video reviews</h3>
              <p>Real customers, real faces, real voices. Video reviews cannot be faked or filtered.</p>
            </div>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>📣</div>
              <h3>Amplified everywhere</h3>
              <p>When someone leaves a review on RatingBee it spreads to Google, Yelp, Facebook, and beyond.</p>
            </div>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>✅</div>
              <h3>Verified humans only</h3>
              <p>No bots. No fake reviews. No algorithmic filtering that hides your best feedback to sell ads.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <img src="/rating-bee-white.png" alt="RatingBee" style={{height:"52px",width:"auto",objectFit:"contain",margin:"0 auto 24px",display:"block"}} />
          <h2 className={styles.ctaTitle}>Own a local business?</h2>
          <p className={styles.ctaSub}>
            Claim your RatingBee profile. Start collecting real reviews.<br />
            Watch your reputation spread across every platform automatically.
          </p>
          <a href="/claim" className={styles.ctaBtn}>Claim your free listing →</a>
        </div>
      </section>

      {/* FOOTER */}

      <Footer />
    {showModal && (
      <AuthModal
        mode={modalMode}
        onClose={function(){ setShowModal(false) }}
        onSuccess={function(){ setShowModal(false) }}
      />
    )}
    </div>
  )
}
