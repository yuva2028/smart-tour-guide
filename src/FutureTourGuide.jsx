import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  buildBudgetPlan,
  buildDayPlans,
  buildFallbackChatReply,
  buildItinerary,
  buildLocalizedGuide,
  buildProfileBadges,
  buildSafetyBrief,
  CHAT_PROMPTS,
  getCrowdInsight,
  getSeedReviews,
  getSiteDetails,
  VOICE_LANGUAGES,
} from './tourData.js'
import {
  getPermissionSummary,
  requestNativeTourPermissions,
  shareTripPayload,
  triggerHaptics,
} from './nativeBridge.js'
import {
  annotatePlaces,
  APP_TITLE,
  BUDGET_OPTIONS,
  BUILD_LABEL,
  buildRecommendationDeck,
  buildWeatherSignal,
  CURATED_MONUMENTS,
  DEFAULT_OSM_RADIUS_METERS,
  DEFAULT_TRAVELER,
  DEMO_CENTER,
  DEMO_TRAVELER,
  fetchNearbyFromOsm,
  fetchSupportPlacesFromOsm,
  findPreferredVoice,
  formatCurrencyInr,
  formatDistance,
  formatTimestamp,
  getDirectionHint,
  getFoodOptions,
  getReviewSummary,
  getSafetyOptions,
  getTransportOptions,
  MOBILE_TABS,
  mergeUniquePlaces,
  RADIUS_OPTIONS,
  readStoredJson,
  renderStars,
  reverseGeocode,
  STORAGE_KEYS,
  TRAVEL_MODES,
  TRAVEL_STYLES,
  TRIP_DAY_OPTIONS,
  writeStoredJson,
} from './futureTourRuntime.js'

function MetricCard({ label, value, note }) {
  return (
    <div className="dash-card">
      <span className="dash-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <article className="support-card">
      <span className="mini-label">{review.author}</span>
      <h3>{renderStars(review.rating)}</h3>
      <p>{review.text}</p>
      <div className="support-meta">
        <span>{formatTimestamp(review.createdAt)}</span>
      </div>
    </article>
  )
}

export default function FutureTourGuide() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const watchIdRef = useRef(null)
  const geoSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
  const speechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  const [nearbyPlaces, setNearbyPlaces] = useState(annotatePlaces(CURATED_MONUMENTS, DEMO_CENTER, 20))
  const [position, setPosition] = useState(null)
  const [locationLabel, setLocationLabel] = useState(geoSupported ? 'Detecting your location' : DEMO_CENTER.label)
  const [locationState, setLocationState] = useState(geoSupported ? 'loading' : 'demo')
  const [, setPlacesState] = useState('fallback')
  const [placesStatus, setPlacesStatus] = useState('Using curated landmarks until live location is available')
  const [cameraState, setCameraState] = useState('idle')
  const [heading, setHeading] = useState(20)
  const [radiusKm, setRadiusKm] = useState(10)
  const [selectedPlaceId, setSelectedPlaceId] = useState(CURATED_MONUMENTS[0].id)
  const [activeTab, setActiveTab] = useState('overview')
  const [travelMode, setTravelMode] = useState('walking')
  const [voiceState, setVoiceState] = useState(speechSupported ? 'idle' : 'unsupported')
  const [itineraryPace, setItineraryPace] = useState('balanced')
  const [transportOptions, setTransportOptions] = useState(() => getTransportOptions(CURATED_MONUMENTS[0]))
  const [transportState, setTransportState] = useState('fallback')
  const [foodOptions, setFoodOptions] = useState(() => getFoodOptions(CURATED_MONUMENTS[0]))
  const [foodState, setFoodState] = useState('fallback')
  const [safetyOptions, setSafetyOptions] = useState(() => getSafetyOptions())
  const [safetyState, setSafetyState] = useState('fallback')
  const [permissionSummary, setPermissionSummary] = useState({ camera: 'prompt', geolocation: 'prompt' })
  const [offlineReady, setOfflineReady] = useState(false)
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? !navigator.onLine : false))
  const [savedOfflineTrip, setSavedOfflineTrip] = useState(() => (typeof window !== 'undefined' ? Boolean(window.localStorage.getItem(STORAGE_KEYS.offlineTrip)) : false))
  const [travelerProfile, setTravelerProfile] = useState(() => readStoredJson(STORAGE_KEYS.profile, DEFAULT_TRAVELER))
  const [favoriteIds, setFavoriteIds] = useState(() => readStoredJson(STORAGE_KEYS.favorites, []))
  const [visitedIds, setVisitedIds] = useState(() => readStoredJson(STORAGE_KEYS.visited, []))
  const [reviewsByPlace, setReviewsByPlace] = useState(() => readStoredJson(STORAGE_KEYS.reviews, {}))
  const [tripHistory, setTripHistory] = useState(() => readStoredJson(STORAGE_KEYS.history, []))
  const [savedPlaces, setSavedPlaces] = useState(() => readStoredJson(STORAGE_KEYS.savedPlaces, {}))
  const [chatInput, setChatInput] = useState('')
  const [chatState, setChatState] = useState('ready')
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: 'Ask about nearby places, budget, food, reviews, or what to do next.' }])
  const [reviewDraft, setReviewDraft] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [accessibilityMode, setAccessibilityMode] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('accessibility-mode', accessibilityMode)
    return () => document.body.classList.remove('accessibility-mode')
  }, [accessibilityMode])

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.profile, travelerProfile)
    writeStoredJson(STORAGE_KEYS.favorites, favoriteIds)
    writeStoredJson(STORAGE_KEYS.visited, visitedIds)
    writeStoredJson(STORAGE_KEYS.reviews, reviewsByPlace)
    writeStoredJson(STORAGE_KEYS.history, tripHistory)
    writeStoredJson(STORAGE_KEYS.savedPlaces, savedPlaces)
  }, [travelerProfile, favoriteIds, visitedIds, reviewsByPlace, tripHistory, savedPlaces])

  useEffect(() => {
    async function loadPermissions() {
      setPermissionSummary(await getPermissionSummary())
    }
    loadPermissions()
    navigator.serviceWorker?.ready.then(() => setOfflineReady(true)).catch(() => setOfflineReady(false))
    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }
    function handleOrientation(event) {
      const nextHeading =
        typeof event.webkitCompassHeading === 'number'
          ? event.webkitCompassHeading
          : typeof event.alpha === 'number'
            ? 360 - event.alpha
            : null
      if (nextHeading !== null) setHeading((nextHeading + 360) % 360)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('deviceorientation', handleOrientation, true)
      window.speechSynthesis?.cancel()
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!geoSupported) return undefined
    watchIdRef.current = navigator.geolocation.watchPosition(
      (nextPosition) => {
        const { latitude, longitude } = nextPosition.coords
        setPosition({ lat: latitude, lon: longitude })
        setLocationState('live')
      },
      () => {
        setLocationState('demo')
        setLocationLabel(DEMO_CENTER.label)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [geoSupported])

  useEffect(() => {
    let cancelled = false
    async function loadLocationLabel() {
      if (!position) return
      try {
        const label = await reverseGeocode(position.lat, position.lon)
        if (!cancelled) setLocationLabel(label)
      } catch {
        if (!cancelled) setLocationLabel(`${position.lat.toFixed(4)}, ${position.lon.toFixed(4)}`)
      }
    }
    loadLocationLabel()
    return () => {
      cancelled = true
    }
  }, [position])

  useEffect(() => {
    let cancelled = false
    async function loadPlaces() {
      const origin = position ?? DEMO_CENTER
      const fallback = annotatePlaces(CURATED_MONUMENTS, origin, heading)
      if (!position) {
        setNearbyPlaces(fallback)
        setPlacesStatus('Using curated landmarks until live location is available')
        return
      }
      setPlacesState('loading')
      setPlacesStatus('Scanning nearby attractions and monuments')
      try {
        const livePlaces = await fetchNearbyFromOsm(position.lat, position.lon, Math.max(DEFAULT_OSM_RADIUS_METERS, radiusKm * 1000))
        const curatedNearby = CURATED_MONUMENTS.filter((place) => Math.abs(place.lat - position.lat) < 15 || Math.abs(place.lon - position.lon) < 15)
        const finalPlaces = annotatePlaces(mergeUniquePlaces([...livePlaces, ...curatedNearby]), origin, heading)
        if (!cancelled) {
          setNearbyPlaces(finalPlaces.length > 0 ? finalPlaces : fallback)
          setSelectedPlaceId((current) => (finalPlaces.some((place) => place.id === current) ? current : finalPlaces[0]?.id || fallback[0]?.id || ''))
          setPlacesState(finalPlaces.length > 0 ? 'live' : 'fallback')
          setPlacesStatus(finalPlaces.length > 0 ? 'Live nearby attractions ready' : 'No live landmarks found nearby, switched to curated guide mode')
        }
      } catch {
        if (!cancelled) {
          setNearbyPlaces(fallback)
          setPlacesState('fallback')
          setPlacesStatus('Live map lookup failed, using curated landmark guide')
        }
      }
    }
    loadPlaces()
    return () => {
      cancelled = true
    }
  }, [heading, position, radiusKm])

  useEffect(() => {
    let cancelled = false
    async function loadSupport() {
      if (!position) return
      try {
        const radiusMeters = Math.max(2500, radiusKm * 1000)
        const [transport, food, safety] = await Promise.all([
          fetchSupportPlacesFromOsm(position.lat, position.lon, radiusMeters, 'transport'),
          fetchSupportPlacesFromOsm(position.lat, position.lon, radiusMeters, 'food'),
          fetchSupportPlacesFromOsm(position.lat, position.lon, radiusMeters, 'safety'),
        ])
        if (!cancelled) {
          setTransportOptions(transport.length > 0 ? transport : getTransportOptions())
          setFoodOptions(food.length > 0 ? food : getFoodOptions())
          setSafetyOptions(safety.length > 0 ? safety : getSafetyOptions())
          setTransportState(transport.length > 0 ? 'live' : 'fallback')
          setFoodState(food.length > 0 ? 'live' : 'fallback')
          setSafetyState(safety.length > 0 ? 'live' : 'fallback')
        }
      } catch {
        if (!cancelled) {
          setTransportOptions(getTransportOptions())
          setFoodOptions(getFoodOptions())
          setSafetyOptions(getSafetyOptions())
        }
      }
    }
    loadSupport()
    return () => {
      cancelled = true
    }
  }, [position, radiusKm])

  const selectedPlace = useMemo(() => nearbyPlaces.find((place) => place.id === selectedPlaceId) ?? nearbyPlaces[0] ?? null, [nearbyPlaces, selectedPlaceId])
  const resolvedTransportOptions = useMemo(() => (!position || transportState === 'fallback' ? getTransportOptions(selectedPlace) : transportOptions), [position, transportState, transportOptions, selectedPlace])
  const resolvedFoodOptions = useMemo(() => (!position || foodState === 'fallback' ? getFoodOptions(selectedPlace) : foodOptions), [foodOptions, foodState, position, selectedPlace])
  const resolvedSafetyOptions = useMemo(() => (safetyState === 'fallback' ? getSafetyOptions() : safetyOptions), [safetyOptions, safetyState])
  const siteDetails = useMemo(() => getSiteDetails(selectedPlace), [selectedPlace])
  const crowdInsight = useMemo(() => getCrowdInsight(selectedPlace), [selectedPlace])
  const weatherSignal = useMemo(() => buildWeatherSignal(locationLabel), [locationLabel])
  const itinerary = useMemo(() => buildItinerary({ selectedPlace, nearbyPlaces, foodOptions: resolvedFoodOptions, transportOptions: resolvedTransportOptions, pace: itineraryPace }), [selectedPlace, nearbyPlaces, resolvedFoodOptions, resolvedTransportOptions, itineraryPace])
  const dayPlans = useMemo(() => buildDayPlans({ selectedPlace, nearbyPlaces, foodOptions: resolvedFoodOptions, transportOptions: resolvedTransportOptions, tripDays: travelerProfile.tripDays, budgetTier: travelerProfile.budgetTier, travelStyle: travelerProfile.travelStyle }), [selectedPlace, nearbyPlaces, resolvedFoodOptions, resolvedTransportOptions, travelerProfile])
  const budgetPlan = useMemo(() => buildBudgetPlan({ selectedPlace, foodOptions: resolvedFoodOptions, transportOptions: resolvedTransportOptions, tripDays: travelerProfile.tripDays, budgetTier: travelerProfile.budgetTier }), [selectedPlace, resolvedFoodOptions, resolvedTransportOptions, travelerProfile])
  const safetyBrief = useMemo(() => buildSafetyBrief(locationLabel, resolvedSafetyOptions), [locationLabel, resolvedSafetyOptions])
  const recommendations = useMemo(() => buildRecommendationDeck({ selectedPlace, nearbyPlaces, crowdInsight, budgetPlan, foodOptions: resolvedFoodOptions, travelerProfile }), [selectedPlace, nearbyPlaces, crowdInsight, budgetPlan, resolvedFoodOptions, travelerProfile])
  const knownPlaces = useMemo(() => new Map([...Object.values(savedPlaces), ...CURATED_MONUMENTS, ...nearbyPlaces].filter(Boolean).map((place) => [place.id, place])), [savedPlaces, nearbyPlaces])
  const favoritePlaces = useMemo(() => favoriteIds.map((id) => knownPlaces.get(id)).filter(Boolean), [favoriteIds, knownPlaces])
  const selectedPlaceReviews = useMemo(() => [ ...(reviewsByPlace[selectedPlace?.id] || []), ...getSeedReviews(selectedPlace?.id) ], [reviewsByPlace, selectedPlace])
  const reviewSummary = useMemo(() => getReviewSummary(selectedPlaceReviews), [selectedPlaceReviews])
  const badges = useMemo(() => buildProfileBadges({ favoritesCount: favoriteIds.length, visitedCount: visitedIds.length, reviewCount: Object.values(reviewsByPlace).flat().length, savedTripsCount: savedOfflineTrip ? 1 : 0, profileReady: travelerProfile.profileReady }), [favoriteIds.length, visitedIds.length, reviewsByPlace, savedOfflineTrip, travelerProfile.profileReady])
  const narration = selectedPlace ? buildLocalizedGuide(selectedPlace, locationLabel, travelerProfile.voiceLocale || 'en-IN') : 'Select a place to begin the guide.'
  const routeUrl = selectedPlace ? `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lon}&travelmode=${travelMode}` : '#'
  const mapEmbedUrl = selectedPlace ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedPlace.lon - 0.02}%2C${selectedPlace.lat - 0.02}%2C${selectedPlace.lon + 0.02}%2C${selectedPlace.lat + 0.02}&layer=mapnik&marker=${selectedPlace.lat}%2C${selectedPlace.lon}` : ''
  const show = (...tabs) => tabs.includes(activeTab) || activeTab === 'overview'

  function logActivity(type, title, detail) {
    setTripHistory((current) => [{ id: `${type}-${Date.now()}`, type, title, detail, createdAt: new Date().toISOString() }, ...current].slice(0, 10))
  }

  function savePlaceSnapshot(place) {
    if (!place?.id) return
    setSavedPlaces((current) => ({ ...current, [place.id]: place }))
  }

  function updateTraveler(field, value) {
    setTravelerProfile((current) => ({ ...current, [field]: value }))
  }

  function activateTraveler(useDemo = false) {
    if (useDemo) {
      setTravelerProfile(DEMO_TRAVELER)
      logActivity('profile', 'Demo traveler activated', 'Personalized planning is now enabled.')
      return
    }
    if (!travelerProfile.name.trim() || !travelerProfile.email.trim()) return
    setTravelerProfile((current) => ({ ...current, profileReady: true }))
    logActivity('profile', `${travelerProfile.name} signed in`, 'Local traveler identity activated on this device.')
  }

  async function prepareNativeExperience() {
    await requestNativeTourPermissions()
    setPermissionSummary(await getPermissionSummary())
    await triggerHaptics([18, 12, 18])
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraState('live')
    } catch {
      setCameraState('denied')
    }
  }

  function toggleFavorite(place) {
    if (!place) return
    savePlaceSnapshot(place)
    setFavoriteIds((current) => (current.includes(place.id) ? current.filter((id) => id !== place.id) : [place.id, ...current]))
    logActivity('favorite', place.name, 'Favorite list updated.')
  }

  function markVisited(place) {
    if (!place || visitedIds.includes(place.id)) return
    savePlaceSnapshot(place)
    setVisitedIds((current) => [place.id, ...current])
    logActivity('visited', place.name, 'Marked as explored.')
  }

  function speakGuide() {
    if (!selectedPlace || !speechSupported) return
    window.speechSynthesis.cancel()
    const locale = travelerProfile.voiceLocale || 'en-IN'
    const utterance = new SpeechSynthesisUtterance(narration)
    utterance.lang = locale
    utterance.voice = findPreferredVoice(locale)
    utterance.onstart = () => setVoiceState('speaking')
    utterance.onend = () => setVoiceState('idle')
    utterance.onerror = () => setVoiceState('idle')
    window.speechSynthesis.speak(utterance)
  }

  function saveOfflineTrip() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.offlineTrip, JSON.stringify({ savedAt: new Date().toISOString(), locationLabel, selectedPlace, itinerary, dayPlans, budgetPlan, travelerProfile }))
    }
    setSavedOfflineTrip(true)
    logActivity('offline', 'Offline trip pack saved', `Trip saved for ${locationLabel}.`)
  }

  function submitReview() {
    if (!selectedPlace || !reviewDraft.trim()) return
    const review = { id: `review-${Date.now()}`, author: travelerProfile.name || 'Guest explorer', rating: reviewRating, text: reviewDraft.trim(), createdAt: new Date().toISOString() }
    setReviewsByPlace((current) => ({ ...current, [selectedPlace.id]: [review, ...(current[selectedPlace.id] || [])].slice(0, 6) }))
    setReviewDraft('')
    markVisited(selectedPlace)
  }

  function askConcierge(promptOverride) {
    const question = (promptOverride || chatInput).trim()
    if (!question) return
    setChatState('loading')
    const reply = buildFallbackChatReply({ question, selectedPlace, foodOptions: resolvedFoodOptions, transportOptions: resolvedTransportOptions, itinerary, budgetPlan, dayPlans, favoritePlaces, recommendations })
    setChatMessages((current) => [...current, { role: 'user', text: question }, { role: 'assistant', text: reply }])
    setChatInput('')
    setChatState('ready')
  }

  const quickStats = [
    { label: 'Traveler', value: travelerProfile.name || 'Guest explorer', note: travelerProfile.profileReady ? `${travelerProfile.tripDays}-day ${travelerProfile.travelStyle} trip` : 'Create a local profile to personalize' },
    { label: 'Budget', value: `${formatCurrencyInr(budgetPlan.dailyAverage)} / day`, note: budgetPlan.label },
    { label: 'Momentum', value: `${badges.filter((badge) => badge.unlocked).length} badges`, note: `${favoriteIds.length} favorites, ${visitedIds.length} visited` },
  ]

  return (
    <div className="app-shell field-mode">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />

      <section className="hero-panel">
        <div className="hero-copy">
          <div className="title-row">
            <span className="eyebrow">Futuristic Tour Guide</span>
            <span className="status-pill">
              {travelerProfile.profileReady ? `${travelerProfile.name} signed in` : 'Guest mode active'}
            </span>
          </div>
          <h1>Live discovery, day-wise planning, reviews, and audio guidance in one mobile app.</h1>
          <p className="hero-text">
            {APP_TITLE} blends nearby attraction scanning, budgeting, local traveler profiles,
            and route handoff into a polished mobile-first tour guide.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={startCamera} type="button">
              {cameraState === 'live' ? 'Camera Active' : 'Open Camera'}
            </button>
            <button className="ghost-button" onClick={speakGuide} type="button">
              Speak Guide
            </button>
            <button className="ghost-button" onClick={saveOfflineTrip} type="button">
              Save Offline
            </button>
            <button className="ghost-button" onClick={prepareNativeExperience} type="button">
              Prep Device
            </button>
          </div>
          <div className="mode-strip">
            {TRAVEL_MODES.map((mode) => (
              <button
                key={mode.value}
                className={`mode-chip ${travelMode === mode.value ? 'active' : ''}`}
                onClick={() => setTravelMode(mode.value)}
                type="button"
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="native-status-strip">
            <span className="chip active">{BUILD_LABEL}</span>
            <span className={`chip ${savedOfflineTrip ? 'active' : ''}`}>
              {savedOfflineTrip ? 'Offline saved' : offlineReady ? 'Cache ready' : isOffline ? 'Offline' : 'Online'}
            </span>
            <span className={`chip ${permissionSummary.camera === 'granted' ? 'active' : ''}`}>
              Camera {permissionSummary.camera}
            </span>
            <span className={`chip ${permissionSummary.geolocation === 'granted' ? 'active' : ''}`}>
              Location {permissionSummary.geolocation}
            </span>
          </div>
        </div>

        <div className="hero-dashboard">
          <MetricCard
            label="Location"
            value={locationLabel}
            note={locationState === 'live' ? 'Device GPS' : 'Fallback demo mode'}
          />
          <MetricCard
            label="Target"
            value={selectedPlace?.name || 'No target'}
            note={selectedPlace ? formatDistance(selectedPlace.distanceKm) : '--'}
          />
          {quickStats.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <div className="mobile-tab-bar" role="tablist" aria-label="Tour sections">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`mobile-tab ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className={`panel support-panel ${show('profile') ? 'tab-active' : 'tab-hidden'}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Traveler Login</p>
            <h2>Create a local traveler profile for favorites, reviews, and saved plans</h2>
          </div>
          <span className={`chip ${travelerProfile.profileReady ? 'active' : ''}`}>
            {travelerProfile.profileReady ? 'Profile active' : 'Guest mode'}
          </span>
        </div>

        <div className="form-grid">
          <label className="api-key-block">
            <span className="mini-label">Name</span>
            <input
              className="api-key-input"
              value={travelerProfile.name}
              onChange={(event) => updateTraveler('name', event.target.value)}
              placeholder="Traveler name"
            />
          </label>
          <label className="api-key-block">
            <span className="mini-label">Email</span>
            <input
              className="api-key-input"
              value={travelerProfile.email}
              onChange={(event) => updateTraveler('email', event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <label className="api-key-block">
            <span className="mini-label">Home base</span>
            <input
              className="api-key-input"
              value={travelerProfile.homeBase}
              onChange={(event) => updateTraveler('homeBase', event.target.value)}
              placeholder="Bengaluru"
            />
          </label>
          <div className="support-card">
            <span className="mini-label">Voice locale</span>
            <div className="mode-switch compact-switch">
              {VOICE_LANGUAGES.map((language) => (
                <button
                  key={language.value}
                  className={`mode-chip ${travelerProfile.voiceLocale === language.value ? 'active' : ''}`}
                  onClick={() => updateTraveler('voiceLocale', language.value)}
                  type="button"
                >
                  {language.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mode-switch">
          {TRAVEL_STYLES.map((style) => (
            <button
              key={style.value}
              className={`mode-chip ${travelerProfile.travelStyle === style.value ? 'active' : ''}`}
              onClick={() => updateTraveler('travelStyle', style.value)}
              type="button"
            >
              {style.label}
            </button>
          ))}
        </div>
        <div className="mode-switch">
          {BUDGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`mode-chip ${travelerProfile.budgetTier === option.value ? 'active' : ''}`}
              onClick={() => updateTraveler('budgetTier', option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
          {TRIP_DAY_OPTIONS.map((days) => (
            <button
              key={days}
              className={`mode-chip ${travelerProfile.tripDays === days ? 'active' : ''}`}
              onClick={() => updateTraveler('tripDays', days)}
              type="button"
            >
              {days} day{days > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="inline-actions">
          <button className="primary-button" onClick={() => activateTraveler()} type="button">
            Activate Local Profile
          </button>
          <button className="ghost-button" onClick={() => activateTraveler(true)} type="button">
            Use Demo Traveler
          </button>
          <button
            className="ghost-button"
            onClick={() => setAccessibilityMode((current) => !current)}
            type="button"
          >
            {accessibilityMode ? 'Accessibility On' : 'Accessibility Off'}
          </button>
        </div>
      </section>

      <section className={`camera-panel ${show('ar') ? 'tab-active' : 'tab-hidden'}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Field Camera</p>
            <h2>Camera and heading-aware place targeting</h2>
          </div>
          <span className={`chip ${cameraState === 'live' ? 'active' : ''}`}>{cameraState}</span>
        </div>
        <div className="camera-stage">
          {cameraState === 'live' ? (
            <video ref={videoRef} className="camera-video" playsInline muted autoPlay />
          ) : (
            <div className="image-placeholder">Open the camera to use the mobile field view.</div>
          )}
        </div>
        <div className="nav-summary">
          <div>
            <span className="mini-label">Target</span>
            <strong>{selectedPlace?.name || 'No target'}</strong>
          </div>
          <div>
            <span className="mini-label">Distance</span>
            <strong>{selectedPlace ? formatDistance(selectedPlace.distanceKm) : '--'}</strong>
          </div>
          <div>
            <span className="mini-label">Direction</span>
            <strong>{selectedPlace ? getDirectionHint(selectedPlace.delta) : 'Awaiting target'}</strong>
          </div>
          <div>
            <span className="mini-label">Heading</span>
            <strong>{Math.round(heading)} deg</strong>
          </div>
        </div>
        <input
          className="heading-slider"
          type="range"
          min="0"
          max="359"
          value={heading}
          onChange={(event) => setHeading(Number(event.target.value))}
        />
        <div className="radar-list">
          {nearbyPlaces.slice(0, 5).map((place) => (
            <button
              key={place.id}
              className={`radar-card ${selectedPlace?.id === place.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlaceId(place.id)}
              type="button"
            >
              <strong>{place.name}</strong>
              <span>{formatDistance(place.distanceKm)}</span>
              <small>{getDirectionHint(place.delta)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={`panel places-panel ${show('explore') ? 'tab-active' : 'tab-hidden'}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Nearby Places</p>
            <h2>Live tourist locations ranked around the traveler</h2>
          </div>
          <span className="chip">{nearbyPlaces.length} places</span>
        </div>
        <div className="filter-row">
          {RADIUS_OPTIONS.map((radius) => (
            <button
              key={radius}
              className={`mode-chip ${radiusKm === radius ? 'active' : ''}`}
              onClick={() => setRadiusKm(radius)}
              type="button"
            >
              {radius} km
            </button>
          ))}
        </div>
        <p className="inline-note">{placesStatus}</p>
        <div className="places-list">
          {nearbyPlaces.map((place) => {
            const reviewMeta = getReviewSummary([
              ...(reviewsByPlace[place.id] || []),
              ...getSeedReviews(place.id),
            ])

            return (
              <article key={place.id} className={`place-card ${selectedPlace?.id === place.id ? 'selected' : ''}`}>
                <button className="place-card-button" onClick={() => setSelectedPlaceId(place.id)} type="button">
                  <div className="place-card-top">
                    <div>
                      <div className="place-rank">#{place.rank}</div>
                      <h3>{place.name}</h3>
                      <p>
                        {place.category} - {place.city || 'Nearby'}
                      </p>
                    </div>
                    <span className="distance-pill">{formatDistance(place.distanceKm)}</span>
                  </div>
                  <p className="place-summary">{place.summary}</p>
                  <div className="place-meta">
                    <span>{getDirectionHint(place.delta)}</span>
                    <span>{place.confidence}% match</span>
                    <span>{reviewMeta.count ? `${reviewMeta.average.toFixed(1)} stars` : 'New place'}</span>
                  </div>
                </button>
                <div className="place-actions">
                  <button className="ghost-button" onClick={() => toggleFavorite(place)} type="button">
                    {favoriteIds.includes(place.id) ? 'Saved' : 'Save'}
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => markVisited(place)}
                    type="button"
                    disabled={visitedIds.includes(place.id)}
                  >
                    {visitedIds.includes(place.id) ? 'Visited' : 'Visited?'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className={`panel support-panel ${show('explore') ? 'tab-active' : 'tab-hidden'}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Place Details</p>
            <h2>History, timings, map preview, and smart recommendations</h2>
          </div>
          <span className="chip">{selectedPlace?.category || 'No target'}</span>
        </div>

        {selectedPlace ? (
          <>
            <div className="detail-grid">
              <div className="detail-visual">
                <span className="mini-label">{siteDetails.neighborhood}</span>
                <h3>{selectedPlace.name}</h3>
                <p>{siteDetails.signatureView}</p>
              </div>
              <div className="support-card">
                <div className="nav-summary">
                  <div>
                    <span className="mini-label">Entry</span>
                    <strong>{siteDetails.entryFee}</strong>
                  </div>
                  <div>
                    <span className="mini-label">Hours</span>
                    <strong>{siteDetails.hours}</strong>
                  </div>
                  <div>
                    <span className="mini-label">Stay</span>
                    <strong>{siteDetails.duration}</strong>
                  </div>
                  <div>
                    <span className="mini-label">Rating</span>
                    <strong>{reviewSummary.count ? `${reviewSummary.average.toFixed(1)} / 5` : 'New place'}</strong>
                  </div>
                </div>
              </div>
            </div>
            <iframe
              className="map-frame"
              title={`Map preview for ${selectedPlace.name}`}
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="detail-chip-list">
              {[...siteDetails.bestFor, ...siteDetails.photoMoments].map((item) => (
                <span key={item} className="detail-chip">
                  {item}
                </span>
              ))}
            </div>
            <div className="support-list">
              {recommendations.map((item) => (
                <article key={item.title} className="support-card">
                  <span className="mini-label">{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="image-placeholder">Select a place to unlock the detail panel.</div>
        )}
      </section>

      <section className={`panel support-panel ${show('plan') ? 'tab-active' : 'tab-hidden'}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Planner</p>
            <h2>Day-wise itinerary, transport, dining, and budget strategy</h2>
          </div>
          <span className="chip">{budgetPlan.label}</span>
        </div>
        <div className="mode-switch">
          {['fast', 'balanced', 'deep'].map((pace) => (
            <button
              key={pace}
              className={`mode-chip ${itineraryPace === pace ? 'active' : ''}`}
              onClick={() => setItineraryPace(pace)}
              type="button"
            >
              {pace === 'deep' ? 'Deep Dive' : pace[0].toUpperCase() + pace.slice(1)}
            </button>
          ))}
        </div>
        <div className="nav-summary">
          <div>
            <span className="mini-label">Trip total</span>
            <strong>{formatCurrencyInr(budgetPlan.total)}</strong>
          </div>
          <div>
            <span className="mini-label">Daily target</span>
            <strong>{formatCurrencyInr(budgetPlan.dailyAverage)}</strong>
          </div>
          <div>
            <span className="mini-label">Weather cue</span>
            <strong>{weatherSignal.label}</strong>
          </div>
          <div>
            <span className="mini-label">Best window</span>
            <strong>{crowdInsight.bestWindow}</strong>
          </div>
        </div>
        <p className="inline-note">{weatherSignal.detail}</p>
        <div className="support-list">
          {itinerary.map((step, index) => (
            <article key={`${step.title}-${index}`} className="support-card">
              <span className="mini-label">Stop {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
        <div className="trip-day-list">
          {dayPlans.map((day) => (
            <article key={day.dayNumber} className="trip-day-card">
              <span className="mini-label">Day {day.dayNumber}</span>
              <h3>{day.title}</h3>
              <p>{day.summary}</p>
              <div className="support-meta">
                <span>{day.focus}</span>
                <span>{day.spend}</span>
              </div>
              <div className="trip-day-stops">
                {day.stops.map((stop) => (
                  <span key={stop} className="detail-chip">
                    {stop}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="story-strip">
          <div className="support-card">
            <span className="mini-label">Transport</span>
            <h3>{resolvedTransportOptions[0]?.name || 'Transit suggestions loading'}</h3>
            <p>{resolvedTransportOptions[0]?.summary || 'Nearby stations and taxi points appear here.'}</p>
          </div>
          <div className="support-card">
            <span className="mini-label">Dining</span>
            <h3>{resolvedFoodOptions[0]?.name || 'Dining suggestions loading'}</h3>
            <p>{resolvedFoodOptions[0]?.summary || 'Nearby food suggestions appear here.'}</p>
          </div>
          <div className="support-card">
            <span className="mini-label">Safety</span>
            <h3>{safetyBrief.title}</h3>
            <p>{safetyBrief.nearby.join(', ') || 'Nearby support points will appear here.'}</p>
          </div>
        </div>
      </section>

      <section className={`panel support-panel ${show('profile', 'explore') ? 'tab-active' : 'tab-hidden'}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Reviews + Community</p>
            <h2>Ratings and traveler comments for the selected stop</h2>
          </div>
          <span className="chip">
            {reviewSummary.count ? `${reviewSummary.average.toFixed(1)} / 5` : 'No reviews yet'}
          </span>
        </div>
        <div className="support-card">
          <div className="rating-row">
            {Array.from({ length: 5 }, (_, index) => index + 1).map((rating) => (
              <button
                key={rating}
                className={`rating-chip ${reviewRating === rating ? 'active' : ''}`}
                onClick={() => setReviewRating(rating)}
                type="button"
              >
                {renderStars(rating)}
              </button>
            ))}
          </div>
          <label className="api-key-block">
            <span className="mini-label">Comment</span>
            <textarea
              className="textarea-input"
              rows="4"
              value={reviewDraft}
              onChange={(event) => setReviewDraft(event.target.value)}
              placeholder="What should the next traveler know?"
            />
          </label>
          <div className="inline-actions">
            <button className="primary-button" onClick={submitReview} type="button">
              Publish Review
            </button>
            <button
              className="ghost-button"
              onClick={() => toggleFavorite(selectedPlace)}
              type="button"
              disabled={!selectedPlace}
            >
              {selectedPlace && favoriteIds.includes(selectedPlace.id) ? 'Remove Favorite' : 'Add Favorite'}
            </button>
          </div>
        </div>
        <div className="support-list">
          {selectedPlaceReviews.length > 0 ? (
            selectedPlaceReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <div className="image-placeholder">Reviews will appear here after travelers add notes.</div>
          )}
        </div>
      </section>

      <section className={`panel support-panel ${show('plan', 'profile') ? 'tab-active' : 'tab-hidden'}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Navigation + Profile</p>
            <h2>Spoken guide, route handoff, badges, and recent activity</h2>
          </div>
          <span className="chip">{voiceState === 'speaking' ? 'Speaking' : 'Ready'}</span>
        </div>
        <div className="mode-switch">
          {VOICE_LANGUAGES.map((language) => (
            <button
              key={language.value}
              className={`mode-chip ${travelerProfile.voiceLocale === language.value ? 'active' : ''}`}
              onClick={() => updateTraveler('voiceLocale', language.value)}
              type="button"
            >
              {language.label}
            </button>
          ))}
        </div>
        <p className="narrative-text">{narration}</p>
        <div className="inline-actions">
          <a
            className={`primary-button nav-button ${!selectedPlace ? 'disabled-link' : ''}`}
            href={selectedPlace ? routeUrl : '#'}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              if (!selectedPlace) event.preventDefault()
            }}
          >
            Open Navigation
          </a>
          <button className="ghost-button" onClick={speakGuide} type="button">
            Play Voice
          </button>
          <button
            className="ghost-button"
            onClick={() =>
              shareTripPayload({
                title: APP_TITLE,
                text: `${APP_TITLE}\nHighlight: ${selectedPlace?.name || 'No target'}\nBudget target: ${formatCurrencyInr(budgetPlan.dailyAverage)} / day`,
              })
            }
            type="button"
          >
            Share
          </button>
        </div>
        <div className="chat-list">
          {chatMessages.slice(-4).map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
              <strong>{message.role === 'assistant' ? 'Guide' : 'You'}</strong>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
        <div className="prompt-row">
          {CHAT_PROMPTS.map((prompt) => (
            <button key={prompt} className="mode-chip" onClick={() => askConcierge(prompt)} type="button">
              {prompt}
            </button>
          ))}
        </div>
        <label className="api-key-block">
          <span className="mini-label">Ask the guide</span>
          <input
            className="api-key-input"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask about next stops, budget, food, or timing"
          />
        </label>
        <button className="primary-button nav-button" onClick={() => askConcierge()} type="button">
          {chatState === 'loading' ? 'Thinking' : 'Ask Concierge'}
        </button>
        <div className="support-list">
          {badges.map((badge) => (
            <article key={badge.title} className="support-card">
              <span className="mini-label">{badge.unlocked ? 'Unlocked' : 'Locked'}</span>
              <h3>{badge.title}</h3>
              <p>{badge.detail}</p>
            </article>
          ))}
        </div>
        <div className="activity-list">
          {tripHistory.length > 0 ? (
            tripHistory.map((entry) => (
              <article key={entry.id} className="support-card">
                <span className="mini-label">{entry.type}</span>
                <h3>{entry.title}</h3>
                <p>{entry.detail}</p>
                <div className="support-meta">
                  <span>{formatTimestamp(entry.createdAt)}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="image-placeholder">Your traveler history will appear here as you save, review, and finish stops.</div>
          )}
        </div>
      </section>
    </div>
  )
}
