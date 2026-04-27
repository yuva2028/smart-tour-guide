import { Component, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import MonumentViewer from './MonumentViewer.jsx'
import {
  buildFallbackChatReply,
  buildItinerary,
  buildLocalizedGuide,
  buildSafetyBrief,
  CHAT_PROMPTS,
  getCrowdInsight,
  getSiteDetails,
  VOICE_LANGUAGES,
} from './tourData.js'
import {
  getPermissionSummary,
  isNativeShell as detectNativeShell,
  requestNativeTourPermissions,
  shareTripPayload,
  triggerHaptics,
} from './nativeBridge.js'

const CURATED_MONUMENTS = [
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    category: 'Mausoleum',
    lat: 27.1751,
    lon: 78.0421,
    city: 'Agra',
    summary:
      'A white marble masterpiece built by Shah Jahan, celebrated for symmetry, craftsmanship, and its riverside setting.',
    funFact:
      'The marble glows from soft rose at sunrise to bright ivory under the midday sun.',
  },
  {
    id: 'india-gate',
    name: 'India Gate',
    category: 'War memorial',
    lat: 28.6129,
    lon: 77.2295,
    city: 'New Delhi',
    summary:
      'An iconic ceremonial arch in the heart of Delhi, honoring soldiers and anchoring the Rajpath vista.',
    funFact:
      "Its sightline defines one of the city's most recognizable processional axes.",
  },
  {
    id: 'qutub-minar',
    name: 'Qutub Minar',
    category: 'Minaret',
    lat: 28.5244,
    lon: 77.1855,
    city: 'New Delhi',
    summary:
      'A soaring red sandstone minaret wrapped in carved inscriptions and medieval Indo-Islamic detail.',
    funFact:
      'Its fluted shafts and stacked balconies create a dramatic vertical rhythm from the ground up.',
  },
  {
    id: 'gateway-of-india',
    name: 'Gateway of India',
    category: 'Monument',
    lat: 18.922,
    lon: 72.8347,
    city: 'Mumbai',
    summary:
      'A basalt waterfront arch facing Mumbai Harbor, long associated with arrivals, departures, and city identity.',
    funFact:
      "Its plaza is one of the fastest ways to feel the city's waterfront energy.",
  },
  {
    id: 'red-fort',
    name: 'Red Fort',
    category: 'Fortress',
    lat: 28.6562,
    lon: 77.241,
    city: 'New Delhi',
    summary:
      'A grand Mughal fort complex known for monumental red sandstone walls and ceremonial halls.',
    funFact:
      "India's Independence Day address is delivered from this fort each year.",
  },
  {
    id: 'charminar',
    name: 'Charminar',
    category: 'Mosque and monument',
    lat: 17.3616,
    lon: 78.4747,
    city: 'Hyderabad',
    summary:
      "Hyderabad's landmark square monument, framed by four minarets and a dense historic bazaar.",
    funFact:
      'Its upper levels were designed to open broad views across the old city.',
  },
]

const DEMO_CENTER = { lat: 20.5937, lon: 78.9629, label: 'India demo mode' }
const DEFAULT_OSM_RADIUS_METERS = 8000
const OPENAI_STORAGE_KEY = 'ar-tour-openai-key'
const RADIUS_OPTIONS = [2, 5, 10, 25]
const MOBILE_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'ar', label: 'AR View' },
  { value: 'explore', label: 'Explore' },
  { value: 'plan', label: 'Plan' },
]
const TRAVEL_MODES = [
  { value: 'walking', label: 'Walk' },
  { value: 'driving', label: 'Drive' },
  { value: 'transit', label: 'Transit' },
]
const ITINERARY_PACES = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'deep', label: 'Deep Dive' },
]
const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'monument', label: 'Monuments' },
  { value: 'fort', label: 'Forts' },
  { value: 'museum', label: 'Museums' },
  { value: 'tower', label: 'Towers' },
]
const BUILD_LABEL = 'Android Fix Build 2026-03-30 21:35'

function toRadians(value) {
  return (value * Math.PI) / 180
}

function toDegrees(value) {
  return (value * 180) / Math.PI
}

function getDistanceKm(fromLat, fromLon, toLat, toLon) {
  const earthRadiusKm = 6371
  const deltaLat = toRadians(toLat - fromLat)
  const deltaLon = toRadians(toLon - fromLon)
  const originLat = toRadians(fromLat)
  const targetLat = toRadians(toLat)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(deltaLon / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getBearing(fromLat, fromLon, toLat, toLon) {
  const originLat = toRadians(fromLat)
  const targetLat = toRadians(toLat)
  const deltaLon = toRadians(toLon - fromLon)
  const y = Math.sin(deltaLon) * Math.cos(targetLat)
  const x =
    Math.cos(originLat) * Math.sin(targetLat) -
    Math.sin(originLat) * Math.cos(targetLat) * Math.cos(deltaLon)

  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

function getHeadingDelta(target, current) {
  return ((target - current + 540) % 360) - 180
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatDistance(km) {
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} m`
  }

  return `${km.toFixed(km < 10 ? 1 : 0)} km`
}

function getDirectionHint(delta) {
  if (Math.abs(delta) <= 8) {
    return 'Straight ahead'
  }
  if (Math.abs(delta) <= 25) {
    return delta < 0 ? 'Slightly left' : 'Slightly right'
  }

  return delta < 0
    ? `Turn ${Math.round(Math.abs(delta))} deg left`
    : `Turn ${Math.round(delta)} deg right`
}

function buildVoiceGuide(place, area) {
  return `${place.name} is ahead. This ${place.category.toLowerCase()} near ${
    place.city || area || 'your current location'
  } is known for ${place.summary.toLowerCase()} ${place.funFact}`
}

function buildNavigationGuide(place, area) {
  return `Navigation update. ${place.name} is ${formatDistance(
    place.distanceKm,
  )} away near ${place.city || area || 'your area'}. ${getDirectionHint(
    place.delta,
  )}. Keep moving toward bearing ${Math.round(place.bearing)} degrees.`
}

function normalizePlaceName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function annotatePlaces(places, origin) {
  return places.map((place) => ({
    ...place,
    distanceKm: getDistanceKm(origin.lat, origin.lon, place.lat, place.lon),
    bearing: getBearing(origin.lat, origin.lon, place.lat, place.lon),
  }))
}

function mergeUniquePlaces(places) {
  const seen = new Set()

  return places.filter((place) => {
    const key = normalizePlaceName(place.name)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function matchesCategory(place, selectedCategory) {
  if (selectedCategory === 'all') {
    return true
  }

  const category = `${place.category || ''} ${place.name || ''}`.toLowerCase()

  if (selectedCategory === 'monument') {
    return (
      category.includes('monument') ||
      category.includes('memorial') ||
      category.includes('historic') ||
      category.includes('mausoleum') ||
      category.includes('minaret')
    )
  }

  return category.includes(selectedCategory)
}

function parseJsonBlock(text) {
  if (!text) {
    return null
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fencedMatch ? fencedMatch[1] : text

  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function getGeneratedImageDataUrl(responseJson) {
  const outputs = responseJson?.output ?? []

  for (const item of outputs) {
    if (Array.isArray(item.content)) {
      for (const content of item.content) {
        if (content?.type === 'output_text' && typeof content.text === 'string') {
          const markdownImage = content.text.match(/!\[[^\]]*\]\((data:image\/[^)]+)\)/i)
          if (markdownImage) {
            return markdownImage[1]
          }
        }
      }
    }

    if (item?.type === 'image_generation_call' && item?.result) {
      if (Array.isArray(item.result) && item.result[0]?.b64_json) {
        return `data:image/png;base64,${item.result[0].b64_json}`
      }
      if (typeof item.result === 'string' && item.result.startsWith('data:image/')) {
        return item.result
      }
    }
  }

  return null
}

class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="image-placeholder">
          3D view is unavailable on this device right now, but the rest of the tour app can still be used.
        </div>
      )
    }

    return this.props.children
  }
}

function getPlacePrimaryTag(tags, fallback) {
  return (
    tags.historic ||
    tags.tourism ||
    tags.amenity ||
    tags.railway ||
    tags.highway ||
    tags.public_transport ||
    tags.heritage ||
    fallback
  )
}

function deriveTransportType(tags) {
  const raw = `${tags.public_transport || ''} ${tags.amenity || ''} ${
    tags.railway || ''
  } ${tags.highway || ''}`.toLowerCase()

  if (raw.includes('subway')) {
    return 'Metro'
  }
  if (raw.includes('train') || raw.includes('station')) {
    return 'Rail'
  }
  if (raw.includes('bus')) {
    return 'Bus'
  }
  if (raw.includes('tram')) {
    return 'Tram'
  }
  if (raw.includes('ferry')) {
    return 'Ferry'
  }

  return 'Transit'
}

function computeRestaurantScore(tags) {
  let score = 70

  if (tags.cuisine) score += 8
  if (tags.opening_hours) score += 6
  if (tags.website || tags.contact_website) score += 8
  if (tags.phone || tags.contact_phone) score += 4
  if (tags.outdoor_seating === 'yes') score += 4
  if (tags.internet_access === 'wlan') score += 3
  if (tags.takeaway === 'yes') score += 2

  return Math.min(99, score)
}

async function parseApiResponse(response) {
  let data = null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`)
  }

  return data
}

async function reverseGeocode(lat, lon) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
  )
  if (!response.ok) {
    throw new Error('Location lookup failed')
  }

  const data = await response.json()
  const address = data.address ?? {}

  return (
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state ||
    data.display_name ||
    'your current area'
  )
}

async function fetchNearbyFromOsm(lat, lon, radiusMeters = DEFAULT_OSM_RADIUS_METERS) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radiusMeters},${lat},${lon})["tourism"~"attraction|museum|viewpoint|artwork|gallery|theme_park|zoo"];
      node(around:${radiusMeters},${lat},${lon})["historic"];
      node(around:${radiusMeters},${lat},${lon})["heritage"];
      node(around:${radiusMeters},${lat},${lon})["memorial"="yes"];
      way(around:${radiusMeters},${lat},${lon})["tourism"~"attraction|museum|viewpoint|artwork|gallery|theme_park|zoo"];
      way(around:${radiusMeters},${lat},${lon})["historic"];
      way(around:${radiusMeters},${lat},${lon})["heritage"];
      way(around:${radiusMeters},${lat},${lon})["memorial"="yes"];
      relation(around:${radiusMeters},${lat},${lon})["tourism"~"attraction|museum|viewpoint|artwork|gallery|theme_park|zoo"];
      relation(around:${radiusMeters},${lat},${lon})["historic"];
      relation(around:${radiusMeters},${lat},${lon})["heritage"];
      relation(around:${radiusMeters},${lat},${lon})["memorial"="yes"];
    );
    out center 18;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })
  if (!response.ok) {
    throw new Error('Nearby places lookup failed')
  }

  const data = await response.json()

  return (data.elements ?? [])
    .filter((item) => item.tags?.name)
    .map((item, index) => {
      const pointLat = item.lat ?? item.center?.lat
      const pointLon = item.lon ?? item.center?.lon

      return {
        id: `osm-${item.type}-${item.id}-${index}`,
        name: item.tags.name,
        category: getPlacePrimaryTag(item.tags, 'landmark'),
        lat: pointLat,
        lon: pointLon,
        city: item.tags['addr:city'] || item.tags['addr:town'] || '',
        summary:
          item.tags.description ||
          `${item.tags.name} is a nearby point of interest detected from OpenStreetMap.`,
        funFact:
          item.tags.wikipedia
            ? `Reference available as ${item.tags.wikipedia}.`
            : 'Point your camera toward it to unlock the AR guide card.',
        source: 'live',
      }
    })
    .filter((place) => place.lat && place.lon)
}

async function fetchSupportPlacesFromOsm(lat, lon, radiusMeters, mode) {
  const query =
    mode === 'transport'
      ? `
        [out:json][timeout:25];
        (
          node(around:${radiusMeters},${lat},${lon})["public_transport"];
          node(around:${radiusMeters},${lat},${lon})["amenity"~"bus_station|taxi|ferry_terminal|parking"];
          node(around:${radiusMeters},${lat},${lon})["railway"~"station|tram_stop|subway_entrance|halt"];
          way(around:${radiusMeters},${lat},${lon})["public_transport"];
          way(around:${radiusMeters},${lat},${lon})["amenity"~"bus_station|taxi|ferry_terminal|parking"];
          way(around:${radiusMeters},${lat},${lon})["railway"~"station|tram_stop|subway_entrance|halt"];
        );
        out center 18;
      `
      : mode === 'safety'
        ? `
        [out:json][timeout:25];
        (
          node(around:${radiusMeters},${lat},${lon})["amenity"~"hospital|clinic|pharmacy|police"];
          way(around:${radiusMeters},${lat},${lon})["amenity"~"hospital|clinic|pharmacy|police"];
        );
        out center 18;
      `
      : `
        [out:json][timeout:25];
        (
          node(around:${radiusMeters},${lat},${lon})["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream"];
          way(around:${radiusMeters},${lat},${lon})["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream"];
        );
        out center 18;
      `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })

  if (!response.ok) {
    throw new Error(`${mode} lookup failed`)
  }

  const data = await response.json()

  return (data.elements ?? [])
    .filter((item) => item.tags?.name)
    .map((item, index) => {
      const pointLat = item.lat ?? item.center?.lat
      const pointLon = item.lon ?? item.center?.lon
      const base = {
        id: `${mode}-${item.type}-${item.id}-${index}`,
        name: item.tags.name,
        lat: pointLat,
        lon: pointLon,
        distanceKm: getDistanceKm(lat, lon, pointLat, pointLon),
      }

      if (mode === 'transport') {
        const transportType = deriveTransportType(item.tags)

        return {
          ...base,
          type: transportType,
          category: getPlacePrimaryTag(item.tags, 'transit'),
          summary:
            item.tags.description ||
            `${transportType} access point near your current sightseeing area.`,
        }
      }

      if (mode === 'safety') {
        return {
          ...base,
          type: item.tags.amenity || 'support',
          category: getPlacePrimaryTag(item.tags, 'safety'),
          summary:
            item.tags.description ||
            `${item.tags.name} is a nearby safety support point for travelers.`,
        }
      }

      return {
        ...base,
        cuisine: item.tags.cuisine || 'Local favorites',
        category: getPlacePrimaryTag(item.tags, 'restaurant'),
        score: computeRestaurantScore(item.tags),
        summary:
          item.tags.description ||
          `${item.tags.name} is a nearby food stop suitable during your monument tour.`,
      }
    })
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon))
    .sort((left, right) =>
      mode === 'food'
        ? right.score - left.score || left.distanceKm - right.distanceKm
        : left.distanceKm - right.distanceKm,
    )
    .slice(0, mode === 'food' ? 6 : 8)
}

function App() {
  const videoRef = useRef(null)
  const uploadInputRef = useRef(null)
  const streamRef = useRef(null)
  const watchIdRef = useRef(null)
  const orientationReadyRef = useRef(false)
  const geoSupported =
    typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
  const speechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  const [apiKey, setApiKey] = useState(() =>
    typeof window !== 'undefined'
      ? window.localStorage.getItem(OPENAI_STORAGE_KEY) ?? ''
      : '',
  )
  const [aiMode, setAiMode] = useState('auto')
  const [position, setPosition] = useState(null)
  const [locationLabel, setLocationLabel] = useState(
    geoSupported ? 'Detecting your location' : DEMO_CENTER.label,
  )
  const [locationState, setLocationState] = useState(geoSupported ? 'loading' : 'demo')
  const [locationError, setLocationError] = useState(
    geoSupported ? '' : 'Geolocation is not supported in this browser.',
  )
  const [nearbyPlaces, setNearbyPlaces] = useState(
    annotatePlaces(CURATED_MONUMENTS.slice(0, 6), DEMO_CENTER),
  )
  const [placesState, setPlacesState] = useState('fallback')
  const [placesStatus, setPlacesStatus] = useState(
    'Using curated landmarks until live location is available',
  )
  const [cameraState, setCameraState] = useState('idle')
  const [compassState, setCompassState] = useState('manual')
  const [heading, setHeading] = useState(0)
  const [manualHeading, setManualHeading] = useState(20)
  const [selectedPlaceId, setSelectedPlaceId] = useState(CURATED_MONUMENTS[0]?.id ?? '')
  const [autoFollow, setAutoFollow] = useState(true)
  const [radiusKm, setRadiusKm] = useState(10)
  const [categoryFilter, setCategoryFilter] = useState('monument')
  const [voiceState, setVoiceState] = useState(speechSupported ? 'idle' : 'unsupported')
  const [navigationVoiceEnabled, setNavigationVoiceEnabled] = useState(false)
  const [voicesReady, setVoicesReady] = useState(false)
  const [captureImage, setCaptureImage] = useState('')
  const [captureSource, setCaptureSource] = useState('none')
  const [recognitionState, setRecognitionState] = useState('idle')
  const [recognitionError, setRecognitionError] = useState('')
  const [recognitionResult, setRecognitionResult] = useState(null)
  const [reconstructionState, setReconstructionState] = useState('idle')
  const [reconstructionError, setReconstructionError] = useState('')
  const [reconstructionImage, setReconstructionImage] = useState('')
  const [reconstructionPrompt, setReconstructionPrompt] = useState('')
  const [reconstructionMode, setReconstructionMode] = useState('photoreal')
  const [transportOptions, setTransportOptions] = useState([])
  const [transportState, setTransportState] = useState('idle')
  const [foodOptions, setFoodOptions] = useState([])
  const [foodState, setFoodState] = useState('idle')
  const [safetyOptions, setSafetyOptions] = useState([])
  const [safetyState, setSafetyState] = useState('idle')
  const [travelMode, setTravelMode] = useState('walking')
  const [activeTab, setActiveTab] = useState('overview')
  const [voiceLocale, setVoiceLocale] = useState('en-IN')
  const [itineraryPace, setItineraryPace] = useState('balanced')
  const [offlineReady, setOfflineReady] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [savedOfflineTrip, setSavedOfflineTrip] = useState(false)
  const [accessibilityMode, setAccessibilityMode] = useState(false)
  const [timelineIndex, setTimelineIndex] = useState(0)
  const [chatInput, setChatInput] = useState('')
  const [chatState, setChatState] = useState('idle')
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask for a nearby plan, food recommendation, history summary, safety help, or transport advice.',
    },
  ])
  const [postcardStyle, setPostcardStyle] = useState('classic')
  const [postcardStatus, setPostcardStatus] = useState('idle')
  const [isNativeShell, setIsNativeShell] = useState(false)
  const [isCompactMobile, setIsCompactMobile] = useState(false)
  const [fieldMode, setFieldMode] = useState(true)
  const [permissionSummary, setPermissionSummary] = useState({
    camera: 'prompt',
    geolocation: 'prompt',
  })

  const effectiveHeading = compassState === 'live' ? heading : manualHeading

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OPENAI_STORAGE_KEY, apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    setIsNativeShell(detectNativeShell())

    function updateViewportProfile() {
      setIsCompactMobile(window.innerWidth <= 720)
    }

    updateViewportProfile()
    window.addEventListener('resize', updateViewportProfile)

    return () => {
      window.removeEventListener('resize', updateViewportProfile)
    }
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return undefined
    }

    async function loadPermissionSummary() {
      const summary = await getPermissionSummary()
      setPermissionSummary(summary)
    }

    loadPermissionSummary()

    return undefined
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return undefined
    }

    navigator.serviceWorker?.ready
      .then(() => setOfflineReady(true))
      .catch(() => setOfflineReady(false))

    setIsOffline(typeof navigator.onLine === 'boolean' ? !navigator.onLine : false)

    function handleOnline() {
      setIsOffline(false)
    }

    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const storedTrip = window.localStorage.getItem('ar-tour-offline-trip')
    setSavedOfflineTrip(Boolean(storedTrip))

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('accessibility-mode', accessibilityMode)
    return () => {
      document.body.classList.remove('accessibility-mode')
    }
  }, [accessibilityMode])

  useEffect(() => {
    if (!speechSupported) {
      return undefined
    }

    function updateVoices() {
      setVoicesReady(window.speechSynthesis.getVoices().length > 0)
    }

    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
    }
  }, [speechSupported])

  useEffect(() => {
    if (!geoSupported) {
      return undefined
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (nextPosition) => {
        const { latitude, longitude, accuracy } = nextPosition.coords
        setPosition({ lat: latitude, lon: longitude, accuracy })
        setLocationState('live')
        setLocationError('')
      },
      (error) => {
        setLocationState('demo')
        setLocationError(error.message)
        setLocationLabel(DEMO_CENTER.label)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [geoSupported])

  useEffect(() => {
    let cancelled = false

    async function loadLocationMeta() {
      if (!position) {
        return
      }

      try {
        const label = await reverseGeocode(position.lat, position.lon)
        if (!cancelled) {
          setLocationLabel(label)
        }
      } catch {
        if (!cancelled) {
          setLocationLabel('your current area')
        }
      }
    }

    loadLocationMeta()

    return () => {
      cancelled = true
    }
  }, [position])

  useEffect(() => {
    let cancelled = false

    async function loadPlaces() {
      const origin = position ?? DEMO_CENTER

      if (!position) {
        return
      }

      setPlacesState('loading')
      setPlacesStatus('Scanning nearby monuments and attractions')

      try {
        const livePlaces = await fetchNearbyFromOsm(
          position.lat,
          position.lon,
          Math.max(DEFAULT_OSM_RADIUS_METERS, radiusKm * 1000),
        )
        const curatedNearby = CURATED_MONUMENTS.filter(
          (place) =>
            getDistanceKm(position.lat, position.lon, place.lat, place.lon) <= 35,
        ).map((place) => ({ ...place, source: 'curated' }))

        const combined = mergeUniquePlaces(
          annotatePlaces([...livePlaces, ...curatedNearby], origin).sort(
            (left, right) => left.distanceKm - right.distanceKm,
          ),
        ).slice(0, 40)

        const fallback = annotatePlaces(CURATED_MONUMENTS, origin)
          .sort((left, right) => left.distanceKm - right.distanceKm)
          .slice(0, 20)

        const finalPlaces = combined.length > 0 ? combined : fallback

        if (!cancelled) {
          setNearbyPlaces(finalPlaces)
          setSelectedPlaceId((currentId) =>
            finalPlaces.some((place) => place.id === currentId)
              ? currentId
              : (finalPlaces[0]?.id ?? ''),
          )
          setPlacesState(combined.length > 0 ? 'live' : 'fallback')
          setPlacesStatus(
            combined.length > 0
              ? 'Live nearby attractions ready'
              : 'No live landmarks found nearby, switched to curated guide mode',
          )
        }
      } catch {
        const fallback = annotatePlaces(CURATED_MONUMENTS, origin)
          .sort((left, right) => left.distanceKm - right.distanceKm)
          .slice(0, 20)

        if (!cancelled) {
          setNearbyPlaces(fallback)
          setSelectedPlaceId((currentId) => currentId || fallback[0]?.id || '')
          setPlacesState('fallback')
          setPlacesStatus('Map lookup failed, switched to curated landmark guide')
        }
      }
    }

    loadPlaces()

    return () => {
      cancelled = true
    }
  }, [position, radiusKm])

  useEffect(() => {
    let cancelled = false

    async function loadSupportPlaces() {
      if (!position) {
        return
      }

      setTransportState('loading')
      setFoodState('loading')
      setSafetyState('loading')

      try {
        const radiusMeters = Math.max(2500, radiusKm * 1000)
        const [transport, food, safety] = await Promise.all([
          fetchSupportPlacesFromOsm(position.lat, position.lon, radiusMeters, 'transport'),
          fetchSupportPlacesFromOsm(position.lat, position.lon, radiusMeters, 'food'),
          fetchSupportPlacesFromOsm(position.lat, position.lon, radiusMeters, 'safety'),
        ])

        if (!cancelled) {
          setTransportOptions(transport)
          setFoodOptions(food)
          setSafetyOptions(safety)
          setTransportState('ready')
          setFoodState('ready')
          setSafetyState('ready')
        }
      } catch {
        if (!cancelled) {
          setTransportOptions([])
          setFoodOptions([])
          setSafetyOptions([])
          setTransportState('error')
          setFoodState('error')
          setSafetyState('error')
        }
      }
    }

    loadSupportPlaces()

    return () => {
      cancelled = true
    }
  }, [position, radiusKm])

  useEffect(() => {
    function handleOrientation(event) {
      const nextHeading =
        typeof event.webkitCompassHeading === 'number'
          ? event.webkitCompassHeading
          : typeof event.alpha === 'number'
            ? 360 - event.alpha
            : null

      if (nextHeading === null) {
        return
      }

      orientationReadyRef.current = true
      setHeading((nextHeading + 360) % 360)
      setCompassState('live')
    }

    window.addEventListener('deviceorientation', handleOrientation, true)

    const timeoutId = window.setTimeout(() => {
      if (!orientationReadyRef.current) {
        setCompassState((current) => (current === 'loading' ? 'manual' : current))
      }
    }, 3500)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('deviceorientation', handleOrientation, true)
      window.speechSynthesis?.cancel()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const enrichedPlaces = useMemo(
    () =>
      nearbyPlaces.map((place, index) => {
        const delta = getHeadingDelta(place.bearing ?? 0, effectiveHeading)
        const confidence = clamp(100 - Math.abs(delta) * 2.5 - place.distanceKm * 3, 6, 100)

        return {
          ...place,
          rank: index + 1,
          delta,
          confidence,
        }
      }),
    [effectiveHeading, nearbyPlaces],
  )

  const filteredPlaces = useMemo(() => {
    const withinRadius = enrichedPlaces.filter((place) => place.distanceKm <= radiusKm)
    const categoryMatched = withinRadius.filter((place) =>
      matchesCategory(place, categoryFilter),
    )

    return categoryMatched.length > 0 ? categoryMatched : withinRadius
  }, [categoryFilter, enrichedPlaces, radiusKm])

  const targetedPlace = useMemo(() => {
    const candidates = filteredPlaces
      .filter((place) => Math.abs(place.delta) <= 24)
      .sort((left, right) => {
        if (Math.abs(left.delta) !== Math.abs(right.delta)) {
          return Math.abs(left.delta) - Math.abs(right.delta)
        }
        return left.distanceKm - right.distanceKm
      })

    return candidates[0] ?? null
  }, [filteredPlaces])

  const selectedPlace = useMemo(() => {
    const aiMatchedPlace =
      recognitionResult?.name &&
      filteredPlaces.find(
        (place) => normalizePlaceName(place.name) === normalizePlaceName(recognitionResult.name),
      )

    if (autoFollow && targetedPlace) {
      return targetedPlace
    }

    return (
      aiMatchedPlace ??
      filteredPlaces.find((place) => place.id === selectedPlaceId) ??
      targetedPlace ??
      filteredPlaces[0] ??
      null
    )
  }, [autoFollow, filteredPlaces, recognitionResult, selectedPlaceId, targetedPlace])

  const routeUrl = selectedPlace
    ? `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lon}&travelmode=${travelMode}`
    : '#'
  const mapEmbedUrl = selectedPlace
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedPlace.lon - 0.02}%2C${selectedPlace.lat - 0.02}%2C${selectedPlace.lon + 0.02}%2C${selectedPlace.lat + 0.02}&layer=mapnik&marker=${selectedPlace.lat}%2C${selectedPlace.lon}`
    : ''
  const narration = selectedPlace
    ? buildVoiceGuide(selectedPlace, locationLabel)
    : 'Point your device toward a marker or select a place to begin narration.'
  const radarPlaces = filteredPlaces.slice(0, 6)
  const quickStats = [
    {
      label: 'Tourist spots',
      value: `${filteredPlaces.length}`,
      note: placesState === 'live' ? 'Live nearby scan' : 'Curated fallback',
    },
    {
      label: 'Transport links',
      value: `${transportOptions.length}`,
      note: transportState === 'ready' ? 'Stations and stops' : 'Syncing access',
    },
    {
      label: 'Food picks',
      value: `${foodOptions.length}`,
      note: foodState === 'ready' ? 'Dining suggestions' : 'Finding good stops',
    },
  ]
  const localizedNarration = selectedPlace
    ? buildLocalizedGuide(selectedPlace, locationLabel, voiceLocale)
    : narration
  const siteDetails = getSiteDetails(selectedPlace)
  const timeline = siteDetails.timeline || []
  const timelineStep = timeline[timelineIndex] || timeline[0] || null
  const crowdInsight = getCrowdInsight(selectedPlace)
  const itinerary = buildItinerary({
    selectedPlace,
    nearbyPlaces: filteredPlaces,
    foodOptions,
    transportOptions,
    pace: itineraryPace,
  })
  const safetyBrief = buildSafetyBrief(locationLabel, safetyOptions)
  const wayfindingHint = selectedPlace
    ? `${getDirectionHint(selectedPlace.delta)} and keep ${formatDistance(
        selectedPlace.distanceKm,
      )} remaining.`
    : 'Choose a target to start AR wayfinding.'
  const fieldStatus = fieldMode
    ? 'Field mode keeps the UI tighter for one-hand outdoor use.'
    : 'Explorer mode shows the full planning interface.'

  useEffect(() => {
    setTimelineIndex(0)
  }, [selectedPlace?.id])

  async function requestCompass() {
    const orientationEvent = window.DeviceOrientationEvent

    if (typeof orientationEvent === 'undefined') {
      setCompassState('manual')
      return
    }

    if (typeof orientationEvent.requestPermission === 'function') {
      setCompassState('loading')
      try {
        const permission = await orientationEvent.requestPermission()
        setCompassState(permission === 'granted' ? 'loading' : 'manual')
      } catch {
        setCompassState('manual')
      }
      return
    }

    setCompassState('loading')
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported')
      return
    }
    if (streamRef.current) {
      setCameraState('live')
      return
    }

    setCameraState('starting')
    triggerHaptics([14, 24, 14])

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraState('live')
      triggerHaptics([24])
    } catch {
      setCameraState('denied')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraState('idle')
  }

  function stopVoiceGuide() {
    if (speechSupported) {
      window.speechSynthesis.cancel()
    }
    setVoiceState(speechSupported ? 'idle' : 'unsupported')
  }

  function speakGuide(place) {
    if (!place || !speechSupported) {
      return
    }

    stopVoiceGuide()
    const utterance = new SpeechSynthesisUtterance(
      buildLocalizedGuide(place, locationLabel, voiceLocale),
    )
    utterance.rate = 1
    utterance.pitch = 1.03
    utterance.volume = 1
    utterance.lang = voiceLocale

    const allVoices = window.speechSynthesis.getVoices()
    const preferredVoice =
      allVoices.find((voice) => voice.lang?.toLowerCase() === voiceLocale.toLowerCase()) ||
      allVoices.find((voice) =>
        voice.lang?.toLowerCase().startsWith(voiceLocale.split('-')[0].toLowerCase()),
      ) ||
      allVoices.find((voice) => voice.lang?.toLowerCase().startsWith('en'))
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setVoiceState('speaking')
    utterance.onend = () => setVoiceState('idle')
    utterance.onerror = () => setVoiceState('idle')
    window.speechSynthesis.speak(utterance)
  }

  function pinPlace(placeId) {
    triggerHaptics([12])
    setAutoFollow(false)
    setSelectedPlaceId(placeId)
  }

  function followTarget() {
    triggerHaptics([10, 16, 10])
    setAutoFollow(true)
  }

  function captureFromCamera() {
    if (!videoRef.current) {
      return
    }

    const video = videoRef.current
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return
    }

    ctx.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCaptureImage(dataUrl)
    setCaptureSource('camera')
    setRecognitionResult(null)
    setRecognitionError('')
    setReconstructionImage('')
    setReconstructionError('')
    setReconstructionMode('photoreal')
  }

  function onUploadImage(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCaptureImage(reader.result)
        setCaptureSource('upload')
        setRecognitionResult(null)
        setRecognitionError('')
        setReconstructionImage('')
        setReconstructionError('')
        setReconstructionMode('photoreal')
      }
    }
    reader.readAsDataURL(file)
  }

  async function requestRecognitionPayload() {
    try {
      const serverResponse = await fetch('/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: captureImage }),
      })

      const serverData = await parseApiResponse(serverResponse)
      setAiMode('server')
      return serverData
    } catch (serverError) {
      if (!apiKey.trim()) {
        throw serverError
      }

      const browserResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text:
                    'You are an expert monument recognizer. Identify the monument in this image. Reply with JSON only using this shape: {"name":"","city":"","country":"","confidence":0,"summary":"","historical_period":"","architectural_style":"","best_match_reason":"","reconstruction_prompt":""}. If uncertain, still provide the most likely monument and lower confidence.',
                },
                {
                  type: 'input_image',
                  image_url: captureImage,
                },
              ],
            },
          ],
        }),
      })

      const browserData = await parseApiResponse(browserResponse)
      setAiMode('browser')
      return browserData
    }
  }

  async function requestReconstructionPayload(prompt) {
    try {
      const serverResponse = await fetch('/api/reconstruct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: captureImage, prompt }),
      })

      const serverData = await parseApiResponse(serverResponse)
      setAiMode('server')
      return serverData
    } catch (serverError) {
      if (!apiKey.trim()) {
        throw serverError
      }

      const browserResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          tools: [{ type: 'image_generation' }],
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: prompt,
                },
                {
                  type: 'input_image',
                  image_url: captureImage,
                },
              ],
            },
          ],
        }),
      })

      const browserData = await parseApiResponse(browserResponse)
      setAiMode('browser')
      return browserData
    }
  }

  async function recognizeMonument() {
    if (!captureImage) {
      setRecognitionError('Capture a camera frame or upload an image first.')
      return
    }

    setRecognitionState('loading')
    setRecognitionError('')

    try {
      const data = await requestRecognitionPayload()
      const parsed = parseJsonBlock(data.output_text)

      if (!parsed) {
        throw new Error('The AI response could not be parsed as JSON.')
      }

      setRecognitionResult(parsed)
      setReconstructionPrompt(parsed.reconstruction_prompt || '')
      setRecognitionState('success')

      if (parsed.name) {
        const matched = filteredPlaces.find(
          (place) => normalizePlaceName(place.name) === normalizePlaceName(parsed.name),
        )
        if (matched) {
          setSelectedPlaceId(matched.id)
          setAutoFollow(false)
        }
      }
    } catch (error) {
      setRecognitionState('error')
      setRecognitionError(error.message || 'Recognition failed.')
    }
  }

  async function reconstructMonument() {
    if (!captureImage) {
      setReconstructionError('Capture a camera frame or upload an image first.')
      return
    }

    setReconstructionState('loading')
    setReconstructionError('')

    const selectedName = recognitionResult?.name || selectedPlace?.name || 'the monument'
    const basePrompt =
      reconstructionPrompt ||
      `Reconstruct ${selectedName} as it likely looked in its original prime, preserving the same viewpoint and composition as the source image. Keep the output historically respectful, richly detailed, and architecturally coherent.`
    const modePrompt =
      reconstructionMode === 'three-d'
        ? `${basePrompt} Render it as a 3D-style heritage reconstruction concept with strong depth, volumetric lighting, sculpted geometry, material realism, elevated perspective readability, and presentation quality similar to a premium architectural visualization or game-environment asset preview.`
        : reconstructionMode === 'museum'
          ? `${basePrompt} Present it like a polished museum restoration concept board with clean restored surfaces, controlled lighting, and interpretive reconstruction clarity.`
          : `${basePrompt} Make the output photorealistic and cinematic.`

    try {
      const data = await requestReconstructionPayload(modePrompt)
      const generatedImage = getGeneratedImageDataUrl(data)

      if (!generatedImage) {
        throw new Error('The AI response did not include a reconstruction image.')
      }

      setReconstructionImage(generatedImage)
      setReconstructionState('success')
    } catch (error) {
      setReconstructionState('error')
      setReconstructionError(error.message || 'Reconstruction failed.')
    }
  }

  function saveOfflineTrip() {
    const payload = {
      savedAt: new Date().toISOString(),
      locationLabel,
      selectedPlace,
      itinerary,
      foodOptions,
      transportOptions,
      safetyBrief,
    }

    window.localStorage.setItem('ar-tour-offline-trip', JSON.stringify(payload))
    setSavedOfflineTrip(true)
    triggerHaptics([20])
  }

  async function shareTrip() {
    const shareText = [
      `AR Tour around ${locationLabel}`,
      selectedPlace ? `Current highlight: ${selectedPlace.name}` : 'Current highlight unavailable',
      itinerary[0]?.detail || 'Open the itinerary in the app.',
    ].join('\n')

    try {
      await shareTripPayload({
        title: 'AR Tour Guide',
        text: shareText,
        url: window.location.href,
      })
      triggerHaptics([18])
    } catch {
      // Ignore share cancellation.
    }
  }

  async function prepareNativeExperience() {
    await requestNativeTourPermissions()
    const summary = await getPermissionSummary()
    setPermissionSummary(summary)
    triggerHaptics([18, 12, 18])
  }

  async function askConcierge(promptOverride) {
    const question = (promptOverride || chatInput).trim()
    if (!question) {
      return
    }

    const nextMessages = [...chatMessages, { role: 'user', text: question }]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatState('loading')

    const context = {
      locationLabel,
      selectedPlace,
      itinerary,
      foodOptions: foodOptions.slice(0, 3),
      transportOptions: transportOptions.slice(0, 3),
      safetyBrief,
      crowdInsight,
    }

    try {
      let replyText = ''

      try {
        const serverResponse = await fetch('/api/concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, context }),
        })
        const serverData = await parseApiResponse(serverResponse)
        replyText = serverData.output_text || ''
        if (replyText) {
          setAiMode('server')
        }
      } catch (serverError) {
        if (!apiKey.trim()) {
          throw serverError
        }

        const browserResponse = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            input: [
              {
                role: 'system',
                content: [
                  {
                    type: 'input_text',
                    text:
                      'You are a concise AR tour guide concierge. Answer with practical suggestions in 120 words or less.',
                  },
                ],
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: `Question: ${question}\nContext: ${JSON.stringify(context)}`,
                  },
                ],
              },
            ],
          }),
        })
        const browserData = await parseApiResponse(browserResponse)
        replyText = browserData.output_text || ''
        setAiMode('browser')
      }

      const finalReply =
        replyText ||
        buildFallbackChatReply({
          question,
          selectedPlace,
          foodOptions,
          transportOptions,
          itinerary,
        })

      setChatMessages((current) => [...current, { role: 'assistant', text: finalReply }])
      setChatState('success')
    } catch {
      const fallback = buildFallbackChatReply({
        question,
        selectedPlace,
        foodOptions,
        transportOptions,
        itinerary,
      })
      setChatMessages((current) => [...current, { role: 'assistant', text: fallback }])
      setChatState('fallback')
    }
  }

  function createPostcard() {
    const source = captureImage || reconstructionImage
    if (!source || !selectedPlace) {
      setPostcardStatus('missing')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 1600
    const context = canvas.getContext('2d')

    if (!context) {
      setPostcardStatus('error')
      return
    }

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      context.fillStyle = postcardStyle === 'heritage' ? '#eadac2' : '#08111d'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 80, 90, 1040, 980)
      context.fillStyle = postcardStyle === 'neon' ? '#8cf2ff' : '#f3f2eb'
      context.font = '700 64px Space Grotesk'
      context.fillText(selectedPlace.name, 80, 1180)
      context.font = '400 34px Space Grotesk'
      context.fillText(locationLabel, 80, 1240)
      context.fillText(siteDetails.restorationStory.slice(0, 96), 80, 1320, 1040)
      context.strokeStyle = postcardStyle === 'heritage' ? '#8d5c33' : '#6efcff'
      context.lineWidth = 6
      context.strokeRect(56, 56, 1088, 1488)

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${normalizePlaceName(selectedPlace.name).replace(/\s+/g, '-')}-postcard.png`
      link.click()
      setPostcardStatus('ready')
    }
    image.onerror = () => setPostcardStatus('error')
    image.src = source
  }

  useEffect(() => {
    if (!speechSupported || !navigationVoiceEnabled || !selectedPlace) {
      return undefined
    }

    const distanceText = formatDistance(selectedPlace.distanceKm)
    const directionText = getDirectionHint(selectedPlace.delta)
    const utterance = new SpeechSynthesisUtterance(
      buildNavigationGuide(selectedPlace, locationLabel),
    )
    utterance.rate = 1
    utterance.pitch = 1
    utterance.lang = voiceLocale

    const allVoices = window.speechSynthesis.getVoices()
    const preferredVoice =
      allVoices.find((voice) => voice.lang?.toLowerCase() === voiceLocale.toLowerCase()) ||
      allVoices.find((voice) =>
        voice.lang?.toLowerCase().startsWith(voiceLocale.split('-')[0].toLowerCase()),
      ) ||
      allVoices.find((voice) => voice.lang?.toLowerCase().startsWith('en'))
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setVoiceState('speaking')

    const intervalId = window.setInterval(() => {
      const nextUtterance = new SpeechSynthesisUtterance(
        `${selectedPlace.name}. ${distanceText} away. ${directionText}.`,
      )
      nextUtterance.rate = 1
      nextUtterance.pitch = 1
      nextUtterance.lang = voiceLocale
      if (preferredVoice) {
        nextUtterance.voice = preferredVoice
      }
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(nextUtterance)
    }, 18000)

    return () => {
      window.clearInterval(intervalId)
      window.speechSynthesis.cancel()
      setVoiceState('idle')
    }
  }, [
    locationLabel,
    navigationVoiceEnabled,
    selectedPlace,
    speechSupported,
    voiceLocale,
  ])

  return (
    <div className={`app-shell ${fieldMode ? 'field-mode' : ''} ${isCompactMobile ? 'compact-mobile' : ''}`}>
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />

      <section className="hero-panel">
        <div className="hero-copy">
          <div className="title-row">
            <span className="eyebrow">Neural Tour Interface</span>
            <span className="status-pill">
              {cameraState === 'live' ? 'AR stream online' : 'Ready for field scan'}
            </span>
          </div>
          <h1>Living heritage tours with cinematic AR wayfinding, story layers, and AI monument intelligence.</h1>
          <p className="hero-text">
            Discover nearby landmarks, navigate with a field-ready AR layer, unlock local
            stories, rebuild lost architecture, and move through a city like you have a
            private heritage guide in your pocket.
          </p>
          <div className="brand-ribbon">
            <div className="brand-ribbon-card">
              <span className="dash-label">Field Edition</span>
              <strong>Designed for outdoor touring</strong>
              <small>Fast actions, bold contrast, one-hand-friendly mobile flow.</small>
            </div>
            <div className="brand-ribbon-card">
              <span className="dash-label">Story Engine</span>
              <strong>Travel meets reconstruction</strong>
              <small>Voice, timeline, concierge, and monument restoration all in one loop.</small>
            </div>
          </div>
          <div className="hero-actions">
            <button className="primary-button" onClick={startCamera} type="button">
              {cameraState === 'live'
                ? 'Camera Active'
                : cameraState === 'starting'
                  ? 'Starting Camera'
                  : 'Launch AR View'}
            </button>
            <button className="ghost-button" onClick={requestCompass} type="button">
              Enable Compass
            </button>
            <button className="ghost-button" onClick={prepareNativeExperience} type="button">
              Prep Device
            </button>
            <button className="ghost-button" onClick={followTarget} type="button">
              Auto Track Target
            </button>
            <button
              className="ghost-button"
              onClick={() => setNavigationVoiceEnabled((current) => !current)}
              type="button"
            >
              {navigationVoiceEnabled ? 'Stop Voice Navigation' : 'Start Voice Navigation'}
            </button>
            <button className="ghost-button" onClick={stopVoiceGuide} type="button">
              Stop Voice
            </button>
          </div>
          <div className="mode-strip" role="group" aria-label="Travel mode">
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
          <div className="signal-bar">
            <div>
              <span>Guide mode</span>
              <strong>{autoFollow ? 'Auto target lock' : 'Manual pinned target'}</strong>
            </div>
            <div>
              <span>Voice system</span>
              <strong>
                {navigationVoiceEnabled
                  ? 'Navigation mode'
                  : voiceState === 'unsupported'
                  ? 'Unavailable'
                  : voiceState === 'speaking'
                    ? 'Narrating live'
                    : voicesReady
                      ? 'Ready'
                      : 'Loading voices'}
              </strong>
            </div>
            <div>
              <span>AI vision</span>
              <strong>
                {aiMode === 'server'
                  ? 'Server secured'
                  : apiKey
                    ? 'Browser key ready'
                    : 'Awaiting API key or server env'}
              </strong>
            </div>
            <div>
              <span>Navigation mode</span>
              <strong>{TRAVEL_MODES.find((mode) => mode.value === travelMode)?.label}</strong>
            </div>
            <div>
              <span>Offline readiness</span>
              <strong>{offlineReady ? 'Cached shell ready' : isOffline ? 'Offline now' : 'Preparing cache'}</strong>
            </div>
          </div>
          <div className="native-status-strip">
            <span className="chip active">{BUILD_LABEL}</span>
            <span className={`chip ${isNativeShell ? 'active' : ''}`}>
              {isNativeShell ? 'Capacitor shell' : 'Browser shell'}
            </span>
            <span className={`chip ${permissionSummary.camera === 'granted' ? 'active' : ''}`}>
              Camera {permissionSummary.camera}
            </span>
            <span className={`chip ${permissionSummary.geolocation === 'granted' ? 'active' : ''}`}>
              Location {permissionSummary.geolocation}
            </span>
            <span className={`chip ${fieldMode ? 'active' : ''}`}>
              {fieldMode ? 'Field mode' : 'Explorer mode'}
            </span>
          </div>
        </div>

        <div className="hero-dashboard">
          <div className="dash-card">
            <span className="dash-label">Geo status</span>
            <strong>
              {locationState === 'live'
                ? 'Locked'
                : locationState === 'loading'
                  ? 'Searching'
                  : 'Demo mode'}
            </strong>
            <small>
              {position
                ? `${locationLabel} · accuracy ${Math.round(position.accuracy)} m`
                : locationLabel}
            </small>
          </div>
          <div className="dash-card">
            <span className="dash-label">Nearby scan</span>
            <strong>{nearbyPlaces.length} places indexed</strong>
            <small>{placesStatus}</small>
          </div>
          <div className="dash-card">
            <span className="dash-label">Compass</span>
            <strong>
              {compassState === 'live'
                ? `${Math.round(effectiveHeading)} deg`
                : compassState === 'loading'
                  ? 'Calibrating'
                  : 'Manual heading'}
            </strong>
            <small>
              {compassState === 'live'
                ? 'Live device orientation'
                : 'Move the slider or allow motion permissions'}
            </small>
          </div>
          <div className="radar-card">
            <div className="radar-ring ring-1" />
            <div className="radar-ring ring-2" />
            <div className="radar-ring ring-3" />
            <div className="radar-sweep" />
            {radarPlaces.map((place) => {
              const angle = toRadians(place.bearing - effectiveHeading - 90)
              const radius = clamp(place.distanceKm * 16, 18, 72)
              const x = 90 + Math.cos(angle) * radius
              const y = 90 + Math.sin(angle) * radius

              return (
                <button
                  key={place.id}
                  className={`radar-point ${
                    selectedPlace?.id === place.id ? 'selected' : ''
                  }`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  onClick={() => pinPlace(place.id)}
                  type="button"
                  aria-label={`Select ${place.name}`}
                />
              )
            })}
            <div className="radar-center" />
          </div>
          <div className="dash-card quick-stats-card">
            {quickStats.map((item) => (
              <div key={item.label} className="quick-stat">
                <span className="dash-label">{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
          <div className="dash-card native-brief">
            <span className="dash-label">Native polish</span>
            <strong>{isNativeShell ? 'Android-ready shell detected' : 'Web-first preview mode'}</strong>
            <small>{fieldStatus}</small>
          </div>
        </div>
      </section>

      <nav className="mobile-tab-bar" aria-label="Mobile sections">
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
      </nav>

      <div className="quick-action-dock" aria-label="Field actions">
        <button className="ghost-button" onClick={startCamera} type="button">
          Camera
        </button>
        <button className="ghost-button" onClick={requestCompass} type="button">
          Compass
        </button>
        <button className="ghost-button" onClick={prepareNativeExperience} type="button">
          Prep
        </button>
        <button className="ghost-button" onClick={saveOfflineTrip} type="button">
          Offline
        </button>
        <button
          className={`ghost-button ${fieldMode ? 'dock-active' : ''}`}
          onClick={() => setFieldMode((current) => !current)}
          type="button"
        >
          {fieldMode ? 'Field' : 'Explore'}
        </button>
      </div>

      <main className="content-grid">
        <section className={`camera-panel ${activeTab === 'overview' || activeTab === 'ar' ? 'tab-active' : 'tab-hidden'}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">AR Command Deck</p>
              <h2>Live camera overlay with target lock, AI recognition, and route handoff</h2>
            </div>
            <div className="panel-badges">
              <span className={`chip ${cameraState === 'live' ? 'active' : ''}`}>
                {cameraState === 'live'
                  ? 'Camera online'
                  : cameraState === 'starting'
                    ? 'Starting'
                    : 'Standby'}
              </span>
              <span className={`chip ${placesState === 'live' ? 'active' : ''}`}>
                {placesState === 'live' ? 'Live landmarks' : 'Fallback landmarks'}
              </span>
              <span className={`chip ${accessibilityMode ? 'active' : ''}`}>
                {accessibilityMode ? 'Accessibility on' : 'Standard view'}
              </span>
            </div>
          </div>

          <div className="camera-stage">
            <video ref={videoRef} autoPlay muted playsInline className="camera-feed" />
            <div className={`camera-backdrop ${cameraState === 'live' ? 'hidden' : ''}`}>
              <div className="backdrop-content">
                <span className="backdrop-kicker">AR viewport ready</span>
                <strong>Open the camera, capture a frame, then let AI identify the monument.</strong>
                <p>
                  The AI recognizer works from either a live camera frame or an uploaded photo.
                  Reconstruction uses the same captured image as visual context.
                </p>
              </div>
            </div>

            <div className="camera-overlay">
              <div className="hud-row">
                <span className="chip">Heading {Math.round(effectiveHeading)} deg</span>
                <span className="chip">
                  {selectedPlace ? getDirectionHint(selectedPlace.delta) : 'Awaiting target'}
                </span>
                <span className="chip">
                  {selectedPlace ? `${Math.round(selectedPlace.confidence)}% lock` : 'No lock'}
                </span>
              </div>

              <div className="wayfinding-banner">
                <span className="mini-label">AR waypoint</span>
                <strong>{wayfindingHint}</strong>
              </div>

              <div className="reticle" aria-hidden="true">
                <div className="reticle-core" />
              </div>

              {selectedPlace && (
                <div
                  className="wayfinding-arrow"
                  style={{ transform: `translateX(-50%) rotate(${selectedPlace.delta}deg)` }}
                  aria-hidden="true"
                />
              )}

              {filteredPlaces.slice(0, 6).map((place, index) => {
                const horizontalOffset = 50 + clamp(place.delta, -52, 52)
                const topOffset = clamp(18 + Math.abs(place.delta) * 0.58 + index * 2, 18, 70)
                const locked = selectedPlace?.id === place.id

                return (
                  <button
                    key={place.id}
                    className={`ar-marker ${locked ? 'locked' : ''}`}
                    style={{
                      left: `${clamp(horizontalOffset, 8, 92)}%`,
                      top: `${locked ? 34 : topOffset}%`,
                    }}
                    onClick={() => pinPlace(place.id)}
                    type="button"
                  >
                    <span>{place.name}</span>
                    <small>
                      {formatDistance(place.distanceKm)} · {Math.round(place.confidence)}%
                    </small>
                  </button>
                )
              })}

              <div className="focus-card">
                <div className="focus-card-head">
                  <div>
                    <p className="eyebrow">Target lock</p>
                    <h3>{selectedPlace?.name ?? 'No active target'}</h3>
                  </div>
                  <span className="focus-score">
                    {selectedPlace ? `${Math.round(selectedPlace.confidence)}%` : '--'}
                  </span>
                </div>

                <p className="focus-summary">
                  {recognitionResult?.summary ||
                    selectedPlace?.summary ||
                    'Aim toward a monument marker or choose one from the nearby list.'}
                </p>

                {selectedPlace && (
                  <div className="focus-grid">
                    <div>
                      <span className="mini-label">Distance</span>
                      <strong>{formatDistance(selectedPlace.distanceKm)}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Bearing</span>
                      <strong>{Math.round(selectedPlace.bearing)} deg</strong>
                    </div>
                    <div>
                      <span className="mini-label">Direction</span>
                      <strong>{getDirectionHint(selectedPlace.delta)}</strong>
                    </div>
                  </div>
                )}

                <div className="focus-actions">
                  <button
                    className="primary-button"
                    onClick={() => speakGuide(selectedPlace)}
                    type="button"
                    disabled={!selectedPlace || voiceState === 'unsupported'}
                  >
                    {voiceState === 'speaking' ? 'Narrating' : 'Play Voice Guide'}
                  </button>
                  <a
                    className={`ghost-button link-button ${!selectedPlace ? 'disabled-link' : ''}`}
                    href={selectedPlace ? routeUrl : '#'}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      if (!selectedPlace) {
                        event.preventDefault()
                      }
                    }}
                  >
                    Navigate
                  </a>
                  <button
                    className="ghost-button"
                    onClick={() => setNavigationVoiceEnabled((current) => !current)}
                    type="button"
                    disabled={!selectedPlace || voiceState === 'unsupported'}
                  >
                    {navigationVoiceEnabled ? 'Voice Nav On' : 'Voice Nav'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="control-grid">
            <section className="control-panel">
              <div className="control-top">
                <p className="eyebrow">Direction Simulator</p>
                <strong>
                  {compassState === 'live'
                    ? 'Live orientation is feeding the overlay'
                    : 'Desktop fallback keeps the guide fully usable'}
                </strong>
              </div>

              <input
                className="heading-slider"
                type="range"
                min="0"
                max="359"
                value={manualHeading}
                onChange={(event) => {
                  setManualHeading(Number(event.target.value))
                  if (compassState !== 'manual') {
                    setCompassState('manual')
                  }
                }}
              />

              <div className="mini-stats">
                <span>Manual heading {manualHeading} deg</span>
                <button className="text-button" onClick={followTarget} type="button">
                  Return to auto targeting
                </button>
              </div>
              <div className="toggle-row">
                <button
                  className={`mode-chip ${accessibilityMode ? 'active' : ''}`}
                  onClick={() => setAccessibilityMode((current) => !current)}
                  type="button"
                >
                  Accessibility
                </button>
                <button
                  className={`mode-chip ${savedOfflineTrip ? 'active' : ''}`}
                  onClick={saveOfflineTrip}
                  type="button"
                >
                  {savedOfflineTrip ? 'Offline saved' : 'Save offline'}
                </button>
              </div>
            </section>

            <section className="control-panel">
              <div className="control-top">
                <p className="eyebrow">Systems</p>
                <strong>Direct control over camera capture and narration</strong>
              </div>

              <div className="camera-actions">
                <button className="ghost-button" onClick={startCamera} type="button">
                  Start Camera
                </button>
                <button className="ghost-button" onClick={stopCamera} type="button">
                  Stop Camera
                </button>
                <button className="ghost-button" onClick={captureFromCamera} type="button">
                  Capture Frame
                </button>
                <button
                  className="ghost-button"
                  onClick={() => speakGuide(selectedPlace)}
                  type="button"
                  disabled={!selectedPlace || voiceState === 'unsupported'}
                >
                  Replay Voice
                </button>
                <button className="ghost-button" onClick={createPostcard} type="button">
                  Create Postcard
                </button>
              </div>
              <div className="toggle-row">
                {VOICE_LANGUAGES.map((language) => (
                  <button
                    key={language.value}
                    className={`mode-chip ${voiceLocale === language.value ? 'active' : ''}`}
                    onClick={() => setVoiceLocale(language.value)}
                    type="button"
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {locationError && <p className="inline-note">Location issue: {locationError}</p>}
          {cameraState === 'denied' && (
            <p className="inline-note">
              Camera permission was denied. The guide still supports nearby places,
              targeting, AI upload recognition, voice, and navigation, but live AR view
              needs camera access.
            </p>
          )}
          {voiceState === 'unsupported' && (
            <p className="inline-note">
              Speech synthesis is unavailable in this browser. Spoken narration is disabled.
            </p>
          )}
        </section>

        <aside className="sidebar">
          <section className={`panel ai-panel ${activeTab === 'overview' || activeTab === 'ar' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">AI Lab</p>
                <h2>Real monument recognizer and monument re-constructor</h2>
              </div>
              <span className="chip">
                {captureSource === 'none' ? 'No capture yet' : captureSource}
              </span>
            </div>

            <label className="api-key-block">
              <span className="mini-label">OpenAI API key</span>
              <input
                className="api-key-input"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
              />
              <small>
                Optional if your deployment sets `OPENAI_API_KEY` on the server. Otherwise
                this key is stored only in this browser via local storage.
              </small>
            </label>

            <div className="ai-actions">
              <button
                className="ghost-button"
                onClick={() => uploadInputRef.current?.click()}
                type="button"
              >
                Upload Photo
              </button>
              <button
                className="primary-button"
                onClick={recognizeMonument}
                type="button"
                disabled={recognitionState === 'loading'}
              >
                {recognitionState === 'loading' ? 'Recognizing' : 'Recognize Monument'}
              </button>
              <button
                className="ghost-button"
                onClick={reconstructMonument}
                type="button"
                disabled={reconstructionState === 'loading'}
              >
                {reconstructionState === 'loading' ? 'Reconstructing' : 'Reconstruct Monument'}
              </button>
            </div>

            <div className="mode-switch" role="group" aria-label="Reconstruction mode">
              <button
                className={`mode-chip ${
                  reconstructionMode === 'photoreal' ? 'active' : ''
                }`}
                onClick={() => setReconstructionMode('photoreal')}
                type="button"
              >
                Photoreal Restore
              </button>
              <button
                className={`mode-chip ${reconstructionMode === 'three-d' ? 'active' : ''}`}
                onClick={() => setReconstructionMode('three-d')}
                type="button"
              >
                3D Style
              </button>
              <button
                className={`mode-chip ${reconstructionMode === 'museum' ? 'active' : ''}`}
                onClick={() => setReconstructionMode('museum')}
                type="button"
              >
                Museum Concept
              </button>
            </div>

            <p className="inline-note">
              Current reconstruction mode:{' '}
              {reconstructionMode === 'three-d'
                ? '3D-style architectural visualization'
                : reconstructionMode === 'museum'
                  ? 'Museum restoration concept'
                  : 'Photoreal restored monument'}
            </p>

            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              onChange={onUploadImage}
              hidden
            />

            {captureImage && (
              <div className="image-grid">
                <div className="image-card">
                  <span className="mini-label">Captured source</span>
                  <img className="preview-image" src={captureImage} alt="Captured monument source" />
                </div>
                <div className="image-card">
                  <span className="mini-label">AI reconstruction</span>
                  {reconstructionImage ? (
                    <img
                      className="preview-image"
                      src={reconstructionImage}
                      alt="AI reconstructed monument"
                    />
                  ) : (
                    <div className="image-placeholder">Reconstruction output appears here</div>
                  )}
                </div>
              </div>
            )}

            {recognitionResult && (
              <div className="recognition-card">
                <div className="panel-header recognition-head">
                  <div>
                    <p className="eyebrow">Recognition result</p>
                    <h2>{recognitionResult.name || 'Likely match detected'}</h2>
                  </div>
                  <span className="focus-score">
                    {recognitionResult.confidence !== undefined
                      ? `${Math.round(recognitionResult.confidence * 100)}%`
                      : '--'}
                  </span>
                </div>
                <p className="narrative-text">{recognitionResult.summary}</p>
                <div className="recognition-meta">
                  <div>
                    <span className="mini-label">Location</span>
                    <strong>
                      {[recognitionResult.city, recognitionResult.country]
                        .filter(Boolean)
                        .join(', ') || 'Unknown'}
                    </strong>
                  </div>
                  <div>
                    <span className="mini-label">Period</span>
                    <strong>{recognitionResult.historical_period || 'Unknown'}</strong>
                  </div>
                  <div>
                    <span className="mini-label">Style</span>
                    <strong>{recognitionResult.architectural_style || 'Unknown'}</strong>
                  </div>
                </div>
                {recognitionResult.best_match_reason && (
                  <p className="fun-fact">
                    AI reasoning: {recognitionResult.best_match_reason}
                  </p>
                )}
              </div>
            )}

            {recognitionError && <p className="inline-note">Recognition issue: {recognitionError}</p>}
            {reconstructionError && (
              <p className="inline-note">Reconstruction issue: {reconstructionError}</p>
            )}
          </section>

          <section className={`panel places-panel ${activeTab === 'overview' || activeTab === 'explore' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Nearby Places</p>
                <h2>Live tourist locations ranked by distance and heading match</h2>
              </div>
              <span className="chip">{filteredPlaces.length} nearby now</span>
            </div>

            <div className="filter-panel">
              <div className="filter-group">
                <span className="mini-label">Radius</span>
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
              </div>

              <div className="filter-group">
                <span className="mini-label">Category</span>
                <div className="filter-row">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`mode-chip ${
                        categoryFilter === option.value ? 'active' : ''
                      }`}
                      onClick={() => setCategoryFilter(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="inline-note">
              Showing places within {radiusKm} km of {locationLabel}.
            </p>

            <div className="places-list">
              {filteredPlaces.map((place) => (
                <article
                  key={place.id}
                  className={`place-card ${
                    selectedPlace?.id === place.id ? 'selected' : ''
                  }`}
                >
                  <button
                    className="place-card-button"
                    onClick={() => pinPlace(place.id)}
                    type="button"
                  >
                    <div className="place-card-top">
                      <div>
                        <div className="place-rank">#{place.rank}</div>
                        <h3>{place.name}</h3>
                        <p>
                          {place.category}
                          {place.city ? ` · ${place.city}` : ''}
                        </p>
                      </div>
                      <span className="distance-pill">{formatDistance(place.distanceKm)}</span>
                    </div>
                    <p className="place-summary">{place.summary}</p>
                    <div className="place-meta">
                      <span>{getDirectionHint(place.delta)}</span>
                      <span>{Math.round(place.confidence)}% match</span>
                    </div>
                  </button>
                  <div className="place-actions">
                    <button className="ghost-button" onClick={() => speakGuide(place)} type="button">
                      Voice
                    </button>
                    <a
                      className="ghost-button link-button"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=${travelMode}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Route
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {filteredPlaces.length === 0 && (
              <div className="image-placeholder">
                No places matched this filter. Try a larger radius or switch category.
              </div>
            )}
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Transport</p>
                <h2>Nearby transportation for reaching more attractions</h2>
              </div>
              <span className="chip">{transportOptions.length || '--'} options</span>
            </div>

            <div className="support-list">
              {transportOptions.map((option) => (
                <article key={option.id} className="support-card">
                  <div>
                    <span className="mini-label">{option.type}</span>
                    <h3>{option.name}</h3>
                    <p>{option.summary}</p>
                  </div>
                  <div className="support-meta">
                    <span>{formatDistance(option.distanceKm)}</span>
                    <a
                      className="ghost-button link-button"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${option.lat},${option.lon}&travelmode=walking`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Reach stop
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {transportState === 'loading' && (
              <p className="inline-note">Looking for stations, stops, metro entries, and taxi hubs.</p>
            )}
            {transportState === 'ready' && transportOptions.length === 0 && (
              <div className="image-placeholder">
                No transport hubs were detected nearby in the current live map radius.
              </div>
            )}
            {transportState === 'error' && (
              <p className="inline-note">
                Nearby transport could not be loaded from live map data right now.
              </p>
            )}
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Dining</p>
                <h2>Best nearby restaurant suggestions for travelers</h2>
              </div>
              <span className="chip">{foodOptions.length || '--'} suggestions</span>
            </div>

            <div className="support-list">
              {foodOptions.map((option) => (
                <article key={option.id} className="support-card">
                  <div>
                    <span className="mini-label">{option.cuisine}</span>
                    <h3>{option.name}</h3>
                    <p>{option.summary}</p>
                  </div>
                  <div className="support-meta">
                    <span>{option.score}% match</span>
                    <span>{formatDistance(option.distanceKm)}</span>
                    <a
                      className="ghost-button link-button"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${option.name} ${locationLabel}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open place
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {foodState === 'loading' && (
              <p className="inline-note">Ranking local restaurants, cafes, and quick food stops nearby.</p>
            )}
            {foodState === 'ready' && foodOptions.length === 0 && (
              <div className="image-placeholder">
                No restaurant suggestions were detected nearby in the current live map radius.
              </div>
            )}
            {foodState === 'error' && (
              <p className="inline-note">
                Restaurant suggestions could not be loaded from live map data right now.
              </p>
            )}
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Smart Itinerary</p>
                <h2>Auto-built day plan based on nearby attractions and pace</h2>
              </div>
              <span className="chip">{itinerary.length} stops</span>
            </div>

            <div className="mode-switch">
              {ITINERARY_PACES.map((pace) => (
                <button
                  key={pace.value}
                  className={`mode-chip ${itineraryPace === pace.value ? 'active' : ''}`}
                  onClick={() => setItineraryPace(pace.value)}
                  type="button"
                >
                  {pace.label}
                </button>
              ))}
            </div>

            <div className="support-list">
              {itinerary.map((step, index) => (
                <article key={`${step.title}-${index}`} className="support-card">
                  <div>
                    <span className="mini-label">Stop {index + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="support-meta">
              <span>{savedOfflineTrip ? 'Saved for offline reuse' : 'Save to keep this itinerary offline'}</span>
              <button className="ghost-button" onClick={shareTrip} type="button">
                Share trip
              </button>
            </div>
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Entry Info</p>
                <h2>Tickets, opening hours, and booking handoff for the selected site</h2>
              </div>
            </div>

            <div className="nav-summary">
              <div>
                <span className="mini-label">Ticketing</span>
                <strong>{siteDetails.entryFee}</strong>
              </div>
              <div>
                <span className="mini-label">Opening hours</span>
                <strong>{siteDetails.hours}</strong>
              </div>
              <div>
                <span className="mini-label">Best visit window</span>
                <strong>{crowdInsight.bestWindow}</strong>
              </div>
            </div>

            <a className="ghost-button link-button" href={siteDetails.bookingUrl} target="_blank" rel="noreferrer">
              Open booking or official info
            </a>
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">History Timeline</p>
                <h2>Past-to-present reconstruction context for the monument</h2>
              </div>
              <span className="chip">{timelineStep?.year || 'Timeline'}</span>
            </div>

            {timeline.length > 0 && (
              <>
                <input
                  className="heading-slider"
                  type="range"
                  min="0"
                  max={Math.max(0, timeline.length - 1)}
                  value={timelineIndex}
                  onChange={(event) => setTimelineIndex(Number(event.target.value))}
                />
                <div className="support-card">
                  <span className="mini-label">{timelineStep?.year}</span>
                  <h3>{timelineStep?.label}</h3>
                  <p>{timelineStep?.note}</p>
                </div>
                <p className="inline-note">{siteDetails.restorationStory}</p>
              </>
            )}
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Crowd Insight</p>
                <h2>Best visit timing, calmer slots, and photo opportunity guidance</h2>
              </div>
              <span className="chip">{crowdInsight.level}</span>
            </div>

            <div className="nav-summary">
              <div>
                <span className="mini-label">Crowd level</span>
                <strong>{crowdInsight.level}</strong>
              </div>
              <div>
                <span className="mini-label">Best time</span>
                <strong>{crowdInsight.bestWindow}</strong>
              </div>
              <div>
                <span className="mini-label">Photo tip</span>
                <strong>{crowdInsight.photoWindow}</strong>
              </div>
            </div>
            <p className="inline-note">{crowdInsight.tip}</p>
          </section>

          <section className={`panel narrative-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">AI Voice Guide</p>
                <h2>Real-time spoken summary for the selected monument</h2>
              </div>
              <span className={`chip ${voiceState === 'speaking' ? 'active' : ''}`}>
                {voiceState === 'speaking' ? 'Speaking live' : 'Ready'}
              </span>
            </div>

            <div className="mode-switch">
              {VOICE_LANGUAGES.map((language) => (
                <button
                  key={language.value}
                  className={`mode-chip ${voiceLocale === language.value ? 'active' : ''}`}
                  onClick={() => setVoiceLocale(language.value)}
                  type="button"
                >
                  {language.label}
                </button>
              ))}
            </div>
            <p className="narrative-text">{localizedNarration}</p>
            {selectedPlace && <p className="fun-fact">Guide note: {selectedPlace.funFact}</p>}
          </section>

          <section className={`panel nav-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Navigation</p>
                <h2>Route handoff with live target awareness</h2>
              </div>
            </div>

            <div className="nav-summary">
              <div>
                <span className="mini-label">Current route target</span>
                <strong>{selectedPlace?.name ?? 'No target selected'}</strong>
              </div>
              <div>
                <span className="mini-label">Mode</span>
                <strong>{autoFollow ? 'Auto lock' : 'Pinned target'}</strong>
              </div>
              <div>
                <span className="mini-label">Voice navigation</span>
                <strong>{navigationVoiceEnabled ? 'Active' : 'Off'}</strong>
              </div>
              <div>
                <span className="mini-label">Travel mode</span>
                <strong>{TRAVEL_MODES.find((mode) => mode.value === travelMode)?.label}</strong>
              </div>
            </div>

            <div className="nav-action-stack">
              <a
                className={`primary-button nav-button ${!selectedPlace ? 'disabled-link' : ''}`}
                href={selectedPlace ? routeUrl : '#'}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  if (!selectedPlace) {
                    event.preventDefault()
                  }
                }}
              >
                Open {TRAVEL_MODES.find((mode) => mode.value === travelMode)?.label} Navigation
              </a>
              <button
                className="ghost-button nav-button"
                onClick={() => setNavigationVoiceEnabled((current) => !current)}
                type="button"
                disabled={!selectedPlace || voiceState === 'unsupported'}
              >
                {navigationVoiceEnabled
                  ? 'Stop Spoken Navigation'
                  : 'Start Spoken Navigation'}
              </button>
            </div>
          </section>

          <section className={`panel nav-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Map Preview</p>
                <h2>Live destination preview for mobile route confidence</h2>
              </div>
            </div>

            {selectedPlace ? (
              <iframe
                className="map-frame"
                title={`Map preview for ${selectedPlace.name}`}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="image-placeholder">Choose a target to load the map preview.</div>
            )}
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Safety Layer</p>
                <h2>Emergency contacts, nearby support points, and travel safety tips</h2>
              </div>
              <span className="chip">{safetyOptions.length || '--'} support points</span>
            </div>

            <div className="support-card">
              <span className="mini-label">{safetyBrief.title}</span>
              <h3>Essentials nearby</h3>
              <p>{safetyBrief.nearby.join(', ') || 'Support locations are still loading.'}</p>
            </div>

            <div className="nav-summary">
              {safetyBrief.contacts.map((contact) => (
                <div key={contact}>
                  <span className="mini-label">Contact</span>
                  <strong>{contact}</strong>
                </div>
              ))}
            </div>

            <div className="support-list">
              {safetyBrief.tips.map((tip) => (
                <article key={tip} className="support-card">
                  <p>{tip}</p>
                </article>
              ))}
            </div>

            {safetyState === 'error' && (
              <p className="inline-note">Safety support points could not be loaded from live map data right now.</p>
            )}
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Local Concierge</p>
                <h2>Ask the tour assistant about history, food, timing, transport, or next stops</h2>
              </div>
              <span className="chip">{chatState === 'loading' ? 'Thinking' : 'Ready'}</span>
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
              <span className="mini-label">Ask a question</span>
              <input
                className="api-key-input"
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about timing, food, transport, safety, or what to do next"
              />
            </label>
            <button className="primary-button nav-button" onClick={() => askConcierge()} type="button">
              Ask concierge
            </button>
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'ar' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Photo Mode</p>
                <h2>Create AR postcards from captured or reconstructed monument views</h2>
              </div>
              <span className="chip">{postcardStatus === 'ready' ? 'Downloaded' : 'Ready'}</span>
            </div>

            <div className="mode-switch">
              {[
                { value: 'classic', label: 'Classic' },
                { value: 'heritage', label: 'Heritage' },
                { value: 'neon', label: 'Neon' },
              ].map((style) => (
                <button
                  key={style.value}
                  className={`mode-chip ${postcardStyle === style.value ? 'active' : ''}`}
                  onClick={() => setPostcardStyle(style.value)}
                  type="button"
                >
                  {style.label}
                </button>
              ))}
            </div>
            <p className="inline-note">
              Capture a live frame or use the reconstruction output, then generate a branded shareable postcard.
            </p>
            <button className="ghost-button nav-button" onClick={createPostcard} type="button">
              Generate postcard
            </button>
            {postcardStatus === 'missing' && (
              <p className="inline-note">Capture a frame or create a reconstruction before generating a postcard.</p>
            )}
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Offline + Sharing</p>
                <h2>Save the trip for low-network use and share it with friends</h2>
              </div>
            </div>

            <div className="nav-summary">
              <div>
                <span className="mini-label">Service worker</span>
                <strong>{offlineReady ? 'Installed' : 'Pending'}</strong>
              </div>
              <div>
                <span className="mini-label">Current network</span>
                <strong>{isOffline ? 'Offline' : 'Online'}</strong>
              </div>
              <div>
                <span className="mini-label">Trip pack</span>
                <strong>{savedOfflineTrip ? 'Saved locally' : 'Not saved yet'}</strong>
              </div>
            </div>

            <div className="nav-action-stack">
              <button className="primary-button nav-button" onClick={saveOfflineTrip} type="button">
                Save current trip offline
              </button>
              <button className="ghost-button nav-button" onClick={shareTrip} type="button">
                Share live trip
              </button>
            </div>
          </section>

          <section className={`panel support-panel ${activeTab === 'overview' || activeTab === 'plan' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Accessibility</p>
                <h2>Support for larger text, calmer visuals, and easier route decisions</h2>
              </div>
              <span className={`chip ${accessibilityMode ? 'active' : ''}`}>
                {accessibilityMode ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <p className="inline-note">
              Accessibility mode increases readability, reduces visual strain, and keeps the AR tour usable in motion.
            </p>
            <div className="nav-action-stack">
              <button
                className="primary-button nav-button"
                onClick={() => setAccessibilityMode((current) => !current)}
                type="button"
              >
                {accessibilityMode ? 'Turn off accessibility mode' : 'Turn on accessibility mode'}
              </button>
              <button className="ghost-button nav-button" onClick={() => setTravelMode('walking')} type="button">
                Prefer easier walking mode
              </button>
            </div>
          </section>

          <section className={`panel nav-panel ${activeTab === 'ar' ? 'tab-active' : 'tab-hidden'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">AR Heritage Viewer</p>
                <h2>3D monument view with destroyed-site reconstruction support</h2>
              </div>
            </div>

            <ViewerErrorBoundary>
              <MonumentViewer
                selectedPlace={selectedPlace}
                recognitionResult={recognitionResult}
                reconstructionImage={reconstructionImage}
              />
            </ViewerErrorBoundary>
            <p className="inline-note">
              Drag to rotate, pinch or scroll to zoom. When AI reconstruction is available,
              the viewer becomes a companion panel for imagining restored or destroyed heritage
              sites in context.
            </p>
            <p className="inline-note">
              AR-ready flow: live GPS finds monuments, camera identifies them, the voice guide
              explains them, and this viewer gives users a richer visual interpretation.
            </p>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
