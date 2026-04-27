export const BUILD_LABEL = 'Futuristic Tour Guide Build 2026-03-30 23:30'
export const APP_TITLE = 'Aurora Tour Guide'
export const DEMO_CENTER = { lat: 20.5937, lon: 78.9629, label: 'India demo mode' }
export const DEFAULT_OSM_RADIUS_METERS = 8000
export const STORAGE_KEYS = {
  profile: 'aurora-tour-profile',
  favorites: 'aurora-tour-favorites',
  visited: 'aurora-tour-visited',
  reviews: 'aurora-tour-reviews',
  history: 'aurora-tour-history',
  savedPlaces: 'aurora-tour-saved-places',
  offlineTrip: 'ar-tour-offline-trip',
}
export const RADIUS_OPTIONS = [2, 5, 10, 25]
export const MOBILE_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'ar', label: 'AR View' },
  { value: 'explore', label: 'Explore' },
  { value: 'plan', label: 'Plan' },
  { value: 'profile', label: 'Profile' },
]
export const TRAVEL_MODES = [
  { value: 'walking', label: 'Walk' },
  { value: 'driving', label: 'Drive' },
  { value: 'transit', label: 'Transit' },
]
export const ITINERARY_PACES = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'deep', label: 'Deep Dive' },
]
export const TRAVEL_STYLES = [
  { value: 'culture', label: 'Culture First' },
  { value: 'food', label: 'Food Trails' },
  { value: 'photo', label: 'Photo Hunt' },
  { value: 'relaxed', label: 'Relaxed Pace' },
]
export const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'premium', label: 'Premium' },
]
export const TRIP_DAY_OPTIONS = [1, 2, 3, 5]
export const DEFAULT_TRAVELER = {
  name: '',
  email: '',
  homeBase: 'Bengaluru',
  tripDays: 2,
  budgetTier: 'balanced',
  travelStyle: 'culture',
  voiceLocale: 'en-IN',
  profileReady: false,
}
export const DEMO_TRAVELER = {
  name: 'Aarav Explorer',
  email: 'aarav@aurora.guide',
  homeBase: 'Bengaluru',
  tripDays: 3,
  budgetTier: 'balanced',
  travelStyle: 'culture',
  voiceLocale: 'en-IN',
  profileReady: true,
}
export const CURATED_MONUMENTS = [
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
    funFact: 'Its sightline defines one of the city\'s most recognizable processional axes.',
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
    funFact: 'Its plaza is one of the fastest ways to feel the city\'s waterfront energy.',
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
    funFact: 'India\'s Independence Day address is delivered from this fort each year.',
  },
  {
    id: 'charminar',
    name: 'Charminar',
    category: 'Monument',
    lat: 17.3616,
    lon: 78.4747,
    city: 'Hyderabad',
    summary:
      'Hyderabad\'s landmark square monument, framed by four minarets and a dense historic bazaar.',
    funFact: 'Its upper levels were designed to open broad views across the old city.',
  },
]

function toRadians(value) {
  return (value * Math.PI) / 180
}

function toDegrees(value) {
  return (value * 180) / Math.PI
}

export function getDistanceKm(fromLat, fromLon, toLat, toLon) {
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

function normalizePlaceName(name) {
  return `${name || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function mergeUniquePlaces(places) {
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

export function annotatePlaces(places, origin, heading) {
  return places
    .map((place) => {
      const distanceKm = getDistanceKm(origin.lat, origin.lon, place.lat, place.lon)
      const bearing = getBearing(origin.lat, origin.lon, place.lat, place.lon)
      const delta = getHeadingDelta(bearing, heading)

      return {
        ...place,
        distanceKm,
        bearing,
        delta,
        confidence: Math.max(8, Math.round(100 - Math.abs(delta) * 2.2 - distanceKm * 3)),
      }
    })
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .map((place, index) => ({
      ...place,
      rank: index + 1,
    }))
}

export function formatDistance(km) {
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} m`
  }

  return `${km.toFixed(km < 10 ? 1 : 0)} km`
}

export function getDirectionHint(delta) {
  if (Math.abs(delta) <= 8) return 'Straight ahead'
  if (Math.abs(delta) <= 25) return delta < 0 ? 'Slightly left' : 'Slightly right'
  return delta < 0 ? `Turn ${Math.round(Math.abs(delta))} deg left` : `Turn ${Math.round(delta)} deg right`
}

export function formatCurrencyInr(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return value || 'Just now'
  }
}

export function readStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeStoredJson(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore local storage issues in stable mode.
  }
}

export function getTransportOptions(place) {
  const city = place?.city || 'Nearby'
  return [
    { id: `${city}-metro`, name: `${city} Metro / Rail Access`, type: 'Transit', distanceKm: 0.8, summary: 'Nearby rapid transit access for moving between attractions.' },
    { id: `${city}-bus`, name: `${city} Bus Hub`, type: 'Bus', distanceKm: 1.1, summary: 'Nearby bus access for extending your tour.' },
    { id: `${city}-taxi`, name: `${city} Taxi Pick-up`, type: 'Taxi', distanceKm: 0.4, summary: 'Quick point-to-point mobility for the next site.' },
  ]
}

export function getFoodOptions(place) {
  const city = place?.city || 'Nearby'
  return [
    { id: `${city}-food-1`, name: `${city} Heritage Cafe`, cuisine: 'Local favorites', score: 86, distanceKm: 0.5, summary: 'Recommended meal stop for the current touring area.' },
    { id: `${city}-food-2`, name: `${city} Traveller Bistro`, cuisine: 'Quick meals', score: 82, distanceKm: 0.8, summary: 'A practical stop between major attractions.' },
    { id: `${city}-food-3`, name: `${city} Viewpoint Kitchen`, cuisine: 'Regional dishes', score: 79, distanceKm: 1.1, summary: 'A relaxed food option after your monument visit.' },
  ]
}

export function getSafetyOptions() {
  return [
    { id: 'support-1', name: 'Nearest hospital', type: 'hospital', distanceKm: 1.4, summary: 'Emergency medical support for travelers.' },
    { id: 'support-2', name: 'Tourist police', type: 'police', distanceKm: 1.1, summary: 'Help desk or security support for visitors.' },
    { id: 'support-3', name: 'Pharmacy', type: 'pharmacy', distanceKm: 0.6, summary: 'Basic medical and travel essentials nearby.' },
  ]
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
  const raw = `${tags.public_transport || ''} ${tags.amenity || ''} ${tags.railway || ''} ${tags.highway || ''}`.toLowerCase()
  if (raw.includes('subway') || raw.includes('metro')) return 'Metro'
  if (raw.includes('station') || raw.includes('train')) return 'Rail'
  if (raw.includes('bus')) return 'Bus'
  if (raw.includes('tram')) return 'Tram'
  if (raw.includes('ferry')) return 'Ferry'
  if (raw.includes('taxi')) return 'Taxi'
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

export function renderStars(value) {
  return `${'★'.repeat(Math.max(0, Math.min(5, value)))}${'☆'.repeat(Math.max(0, 5 - value))}`
}

export function getReviewSummary(reviews) {
  if (!reviews.length) return { average: 0, count: 0 }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return { average: total / reviews.length, count: reviews.length }
}

export function buildWeatherSignal(locationLabel) {
  const hour = new Date().getHours()
  if (hour < 9) return { label: 'Cool start', detail: `Morning conditions around ${locationLabel} are better for longer walking loops and monument photography.` }
  if (hour < 17) return { label: 'Midday caution', detail: `Plan shade, hydration, and indoor breaks while touring around ${locationLabel}.` }
  return { label: 'Evening glow', detail: `Golden-hour and blue-hour conditions make ${locationLabel} ideal for lighter walking and city views.` }
}

export function buildRecommendationDeck({
  selectedPlace,
  nearbyPlaces,
  crowdInsight,
  budgetPlan,
  foodOptions,
  travelerProfile,
}) {
  const quieterStop =
    nearbyPlaces.find((place) => place.id !== selectedPlace?.id && place.distanceKm <= 3 && place.confidence >= 55) ||
    nearbyPlaces.find((place) => place.id !== selectedPlace?.id)
  const foodStop = foodOptions[0]
  const styleLabel =
    TRAVEL_STYLES.find((option) => option.value === travelerProfile.travelStyle)?.label ||
    'Culture First'

  return [
    quieterStop
      ? { title: 'Hidden gem next', detail: `${quieterStop.name} looks like a smoother follow-up stop with ${formatDistance(quieterStop.distanceKm)} travel from your current zone.`, badge: 'Quiet route' }
      : null,
    { title: 'Budget move', detail: `${budgetPlan.tip} Current day-average target: ${formatCurrencyInr(budgetPlan.dailyAverage)}.`, badge: budgetPlan.label },
    foodStop
      ? { title: 'Best pause window', detail: `${foodStop.name} is your strongest nearby food option after the main monument run.`, badge: foodStop.cuisine }
      : null,
    { title: 'Crowd + style sync', detail: `${crowdInsight.tip} Your active profile is tuned for ${styleLabel.toLowerCase()}.`, badge: crowdInsight.level },
  ].filter(Boolean)
}

export function findPreferredVoice(locale) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((voice) => voice.lang?.toLowerCase() === locale.toLowerCase()) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith(locale.split('-')[0].toLowerCase())) ||
    null
  )
}

export async function reverseGeocode(lat, lon) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
  if (!response.ok) throw new Error('Location lookup failed')
  const data = await response.json()
  const address = data.address ?? {}
  return address.city || address.town || address.village || address.county || address.state || data.display_name || 'your current area'
}

export async function fetchNearbyFromOsm(lat, lon, radiusMeters = DEFAULT_OSM_RADIUS_METERS) {
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
    );
    out center 18;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
  if (!response.ok) throw new Error('Nearby places lookup failed')
  const data = await response.json()

  return (data.elements ?? [])
    .filter((item) => item.tags?.name)
    .map((item, index) => ({
      id: `osm-${item.type}-${item.id}-${index}`,
      name: item.tags.name,
      category: getPlacePrimaryTag(item.tags, 'landmark'),
      lat: item.lat ?? item.center?.lat,
      lon: item.lon ?? item.center?.lon,
      city: item.tags['addr:city'] || item.tags['addr:town'] || '',
      summary: item.tags.description || `${item.tags.name} is a nearby point of interest detected from OpenStreetMap.`,
      funFact: item.tags.wikipedia ? `Reference available as ${item.tags.wikipedia}.` : 'Point your camera toward it to unlock the guide card.',
      source: 'live',
    }))
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon))
}

export async function fetchSupportPlacesFromOsm(lat, lon, radiusMeters, mode) {
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

  const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
  if (!response.ok) throw new Error(`${mode} lookup failed`)
  const data = await response.json()

  return (data.elements ?? [])
    .filter((item) => item.tags?.name)
    .map((item, index) => {
      const pointLat = item.lat ?? item.center?.lat
      const pointLon = item.lon ?? item.center?.lon
      const base = { id: `${mode}-${item.type}-${item.id}-${index}`, name: item.tags.name, lat: pointLat, lon: pointLon, distanceKm: getDistanceKm(lat, lon, pointLat, pointLon) }

      if (mode === 'transport') return { ...base, type: deriveTransportType(item.tags), summary: item.tags.description || `${deriveTransportType(item.tags)} access point near your current sightseeing area.` }
      if (mode === 'safety') return { ...base, type: item.tags.amenity || 'support', summary: item.tags.description || `${item.tags.name} is a nearby safety support point for travelers.` }
      return { ...base, cuisine: item.tags.cuisine || 'Local favorites', score: computeRestaurantScore(item.tags), summary: item.tags.description || `${item.tags.name} is a nearby food stop suitable during your monument tour.` }
    })
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon))
    .sort((left, right) => (mode === 'food' ? right.score - left.score || left.distanceKm - right.distanceKm : left.distanceKm - right.distanceKm))
    .slice(0, mode === 'food' ? 6 : 8)
}
