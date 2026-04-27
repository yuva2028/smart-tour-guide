import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import './SmartTourGuide.css'

const INDIA_DEFAULT = { lat: 20.5937, lng: 78.9629, label: 'India (default map)' }
const STORAGE = {
  saved: 'smart-guide-saved-places',
  trips: 'smart-guide-trip-days',
  profile: 'smart-guide-profile',
  offline: 'smart-guide-offline-packs',
  reviews: 'smart-guide-reviews',
  posts: 'smart-guide-posts',
  adminPlaces: 'smart-guide-admin-places',
  visited: 'smart-guide-visited',
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'historical', label: 'Historical' },
  { id: 'food', label: 'Food' },
  { id: 'nature', label: 'Nature' },
  { id: 'temples', label: 'Temples' },
]

const LANGUAGES = [
  { id: 'en-IN', label: 'English' },
  { id: 'hi-IN', label: 'Hindi' },
  { id: 'kn-IN', label: 'Kannada' },
]

const SCREENS = [
  { id: 'home', label: 'Home' },
  { id: 'map', label: 'Map' },
  { id: 'detail', label: 'Details' },
  { id: 'guide', label: 'Guide' },
  { id: 'ar', label: 'AR' },
  { id: 'planner', label: 'Planner' },
  { id: 'saved', label: 'Saved' },
  { id: 'community', label: 'Community' },
  { id: 'profile', label: 'Profile' },
]

const CITY_PACKS = [
  { id: 'bengaluru', label: 'Bengaluru', size: '186 MB', places: 8 },
  { id: 'mysuru', label: 'Mysuru', size: '142 MB', places: 5 },
  { id: 'hampi', label: 'Hampi', size: '214 MB', places: 7 },
]
const INTERESTS = ['History', 'Food', 'Nature', 'Temples', 'Photography', 'Relaxed routes']
const ACCESSIBILITY_MODES = ['Standard', 'Large text', 'Simple UI', 'Voice first']
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const FREE_STACK_LABEL = 'Free dev mode: OpenStreetMap + Overpass + local storage + browser speech'
const IS_NATIVE_ANDROID = Capacitor.isNativePlatform()

const LIVE_CATEGORY_IMAGES = {
  historical:
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  food:
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  nature:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  temples:
    'https://images.unsplash.com/photo-1606298855672-3efb63017be8?auto=format&fit=crop&w=1200&q=80',
}

const PLACES = [
  {
    id: 'bangalore-palace',
    name: 'Bangalore Palace',
    category: 'historical',
    city: 'Bengaluru',
    lat: 12.9987,
    lng: 77.592,
    rating: 4.4,
    openingHours: '10:00 AM - 5:30 PM',
    visitTime: '90 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/8/8f/Bangalore_Mysore_Maharaja_Palace.jpg',
    short:
      'A Tudor-style royal residence with carved interiors, lawns, and a strong city-history layer.',
    details:
      'Built by the Wadiyar family, Bangalore Palace mixes European form with local royal history. It is a strong first stop when a traveler wants architecture, portraits, old halls, and a compact introduction to Bengaluru heritage.',
    audio: {
      'en-IN':
        'You are near Bangalore Palace. Look for the fortified towers, woodwork, and royal portraits. This stop is best explored slowly, room by room.',
      'hi-IN':
        'Aap Bangalore Palace ke paas hain. Yahan ke tower, lakdi ka kaam, aur royal portraits dhyan se dekhiye. Is jagah ko aaram se explore karein.',
      'kn-IN':
        'Neevu Bangalore Palace hattira iddira. Gopuragalu, mara kelasa mattu royal chitragalannu gamanisi. Idu nidhanavagi nodalu uttama sthala.',
    },
    tags: ['Palace', 'Architecture', 'Tickets'],
  },
  {
    id: 'tipu-palace',
    name: "Tipu Sultan's Summer Palace",
    category: 'historical',
    city: 'Bengaluru',
    lat: 12.9596,
    lng: 77.5736,
    rating: 4.1,
    openingHours: '8:30 AM - 5:30 PM',
    visitTime: '45 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/1/13/Tippu_Sultan%27s_Summer_palace.jpg',
    short:
      'A compact Indo-Islamic palace known for teak pillars, arches, and layered Mysore-era history.',
    details:
      'This palace gives a close look at late eighteenth-century design and the political world of Tipu Sultan. It works well as a short, high-value heritage stop inside the city.',
    audio: {
      'en-IN':
        "Tipu Sultan's Summer Palace is close by. Notice the timber columns and painted arches, then imagine the old city around this quiet royal retreat.",
      'hi-IN':
        'Tipu Sultan ka Summer Palace paas mein hai. Lakdi ke pillars aur painted arches dekhiye, phir purane Bengaluru ko imagine kijiye.',
      'kn-IN':
        'Tipu Sultan Summer Palace hattiradalli ide. Mara kambagalu mattu banna archgalannu nodi, hale Bengaluru nagaravannu kalpisikolli.',
    },
    tags: ['History', 'Museum', 'Short stop'],
  },
  {
    id: 'lalbagh',
    name: 'Lalbagh Botanical Garden',
    category: 'nature',
    city: 'Bengaluru',
    lat: 12.95,
    lng: 77.5848,
    rating: 4.5,
    openingHours: '6:00 AM - 7:00 PM',
    visitTime: '2 hr',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/d/d5/Glasshouse_and_fountain_at_lalbagh.jpg',
    short:
      'A large garden with old trees, a glass house, walking routes, and calmer morning light.',
    details:
      'Lalbagh is ideal for a slower nature break between dense city stops. The glass house, lake paths, and botanical sections make it useful for families, photographers, and walkers.',
    audio: {
      'en-IN':
        'Lalbagh is nearby. Start with the glass house, keep to shaded paths, and save the lake side for a calmer pause.',
      'hi-IN':
        'Lalbagh paas mein hai. Glass house se shuru kijiye, shaded paths par chaliye, aur lake side par break lijiye.',
      'kn-IN':
        'Lalbagh hattiradalli ide. Glass house inda prarambhisi, nerala daarigalalli nadeyiri, lake hattira vishranti tegedukolli.',
    },
    tags: ['Garden', 'Morning', 'Family'],
  },
  {
    id: 'bull-temple',
    name: 'Dodda Basavana Gudi',
    category: 'temples',
    city: 'Bengaluru',
    lat: 12.942,
    lng: 77.5687,
    rating: 4.6,
    openingHours: '6:00 AM - 8:00 PM',
    visitTime: '35 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/8/86/Dodda_Ganeshana_Gudi_Hindu_temple%2C_Basavanagudi%2C_Karnataka%2C_India.jpg',
    short:
      'A beloved temple in Basavanagudi centered on a large monolithic Nandi sculpture.',
    details:
      'The Bull Temple is a compact cultural stop with strong neighborhood character. Pair it with nearby food streets and old Bengaluru walks for a grounded local experience.',
    audio: {
      'en-IN':
        'Dodda Basavana Gudi is close. Move quietly inside, notice the monolithic Nandi, and keep time for the Basavanagudi streets nearby.',
      'hi-IN':
        'Dodda Basavana Gudi paas hai. Andar shanti se jaiye, bade Nandi ko dekhiye, aur paas ki Basavanagudi streets ke liye time rakhiye.',
      'kn-IN':
        'Dodda Basavana Gudi hattira ide. Olage shantiyinda hogi, dodda Nandiyannu nodi, Basavanagudi beedigalige samaya idi.',
    },
    tags: ['Temple', 'Local area', 'Free'],
  },
  {
    id: 'cubbon-park',
    name: 'Cubbon Park',
    category: 'nature',
    city: 'Bengaluru',
    lat: 12.9763,
    lng: 77.5929,
    rating: 4.4,
    openingHours: '6:00 AM - 6:00 PM',
    visitTime: '60 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/d/d5/Cubbon_Park_W.jpg',
    short:
      'A central green lung for relaxed walking, museums nearby, and shade between busy stops.',
    details:
      'Cubbon Park works as a rest stop and a connector between civic landmarks. It is especially useful when the day is hot and the traveler needs shade before continuing.',
    audio: {
      'en-IN':
        'Cubbon Park is a good reset point. Use the shaded paths, hydrate, and choose your next museum or food stop from here.',
      'hi-IN':
        'Cubbon Park ek achha rest point hai. Shaded paths use kijiye, paani pijiye, aur yahan se next museum ya food stop chuniye.',
      'kn-IN':
        'Cubbon Park olleya rest point. Nerala daarigalannu balasi, neeru kudiyiri, illinda mundina museum athava food stop ayke madi.',
    },
    tags: ['Walk', 'Shade', 'Free'],
  },
  {
    id: 'vidyarthi-bhavan',
    name: 'Vidyarthi Bhavan',
    category: 'food',
    city: 'Bengaluru',
    lat: 12.9451,
    lng: 77.5715,
    rating: 4.4,
    openingHours: '6:30 AM - 11:30 AM, 2:00 PM - 8:00 PM',
    visitTime: '40 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/9/9d/VidyarthiBhavanEntrance.jpg',
    short:
      'A classic Basavanagudi dosa stop that fits naturally after temple and old-city walks.',
    details:
      'This is a practical food anchor for a Bengaluru route. Expect crowds, quick service, and a strong local breakfast or evening snack experience.',
    audio: {
      'en-IN':
        'Vidyarthi Bhavan is near your route. Expect a queue, order the dosa, and keep this as the food break after Basavanagudi.',
      'hi-IN':
        'Vidyarthi Bhavan route ke paas hai. Queue ho sakti hai, dosa order kijiye, aur ise Basavanagudi ke baad food break banaiye.',
      'kn-IN':
        'Vidyarthi Bhavan nimma route hattira ide. Queue irabahudu, dose order madi, Basavanagudi nantara food break agi balasi.',
    },
    tags: ['Dosa', 'Local classic', 'Crowded'],
  },
  {
    id: 'iskcon-bengaluru',
    name: 'ISKCON Temple Bengaluru',
    category: 'temples',
    city: 'Bengaluru',
    lat: 13.0098,
    lng: 77.5511,
    rating: 4.7,
    openingHours: '4:15 AM - 8:30 PM',
    visitTime: '75 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/1/11/ISKCON_Banglaore_Temple.jpg',
    short:
      'A large hilltop temple complex with structured queues, devotional spaces, and city views.',
    details:
      'ISKCON works best when travelers want a major temple stop with organized facilities. It is farther from the central heritage loop, so use it as a dedicated segment.',
    audio: {
      'en-IN':
        'ISKCON Bengaluru is a larger temple visit. Plan buffer time for queues, keep footwear rules in mind, and use the viewpoint before leaving.',
      'hi-IN':
        'ISKCON Bengaluru ek bada temple visit hai. Queue ke liye extra time rakhiye, footwear rules follow kijiye, aur viewpoint zaroor dekhiye.',
      'kn-IN':
        'ISKCON Bengaluru dodda temple visit. Queue ge samaya idi, footwear niyamavannu palisi, horaduva munna viewpoint nodi.',
    },
    tags: ['Temple', 'Viewpoint', 'Queues'],
  },
  {
    id: 'mysore-palace',
    name: 'Mysore Palace',
    category: 'historical',
    city: 'Mysuru',
    lat: 12.3052,
    lng: 76.6552,
    rating: 4.6,
    openingHours: '10:00 AM - 5:30 PM',
    visitTime: '2 hr',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mysore_Palace_Morning.jpg',
    short:
      "A grand royal palace with ornate halls, courtyards, and one of Karnataka's strongest heritage draws.",
    details:
      'Mysore Palace is best treated as a main anchor for the day, not a quick add-on. The interior route, lighting, and surrounding city stops make it ideal for a dedicated Mysuru trip.',
    audio: {
      'en-IN':
        'Mysore Palace deserves unhurried time. Follow the palace route, pause at the durbar halls, and check lighting schedules before evening.',
      'hi-IN':
        'Mysore Palace ko aaram se dekhiye. Palace route follow kijiye, durbar halls par rukiyega, aur evening lighting schedule check kijiye.',
      'kn-IN':
        'Mysore Palace annu nidhanavagi nodi. Palace route follow madi, durbar hallgalalli nilli, evening lighting schedule check madi.',
    },
    tags: ['Palace', 'Day trip', 'Tickets'],
  },
  {
    id: 'vidhana-soudha',
    name: 'Vidhana Soudha',
    category: 'historical',
    city: 'Bengaluru',
    lat: 12.9797,
    lng: 77.5907,
    rating: 4.6,
    openingHours: 'Exterior viewing only. Check access notices.',
    visitTime: '30 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/9/9b/Vidhana_Soudha_Bangalore.jpg',
    short:
      'A grand civic landmark known for its massive granite facade and ceremonial city presence.',
    details:
      'Vidhana Soudha is one of Bengaluru\'s most recognizable public buildings. It is best experienced from the outside as part of a central-city walk that can include Cubbon Park, museums, and nearby civic landmarks.',
    audio: {
      'en-IN':
        'You are near Vidhana Soudha. Step back for the full granite facade, then use the central vista to connect toward Cubbon Park or nearby museums.',
      'hi-IN':
        'Aap Vidhana Soudha ke paas hain. Poori granite facade dekhne ke liye thoda peeche jaiye, phir Cubbon Park ya museum ki taraf badhiye.',
      'kn-IN':
        'Neevu Vidhana Soudha hattira iddira. Sampoorna granite mukha bhagavannu nodalu swalpa hindakke hogi, nantara Cubbon Park athava museum kade hogi.',
    },
    tags: ['Landmark', 'Architecture', 'Photo stop'],
  },
  {
    id: 'st-marys-basilica',
    name: "St. Mary's Basilica",
    category: 'historical',
    city: 'Bengaluru',
    lat: 12.9842,
    lng: 77.6057,
    rating: 4.6,
    openingHours: '6:00 AM - 8:00 PM',
    visitTime: '35 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/3/3f/St_Mary%27s_Basilica%2C_Bangalore.jpg',
    short:
      'A Gothic-style basilica in Shivajinagar with stained glass, spires, and a busy local setting.',
    details:
      'St. Mary\'s Basilica adds a different architectural and cultural layer to the Bengaluru route. It works well with nearby market walks and short central-city sightseeing.',
    audio: {
      'en-IN':
        "St. Mary's Basilica is close. Notice the pointed arches, stained glass, and how the quiet interior contrasts with the lively streets outside.",
      'hi-IN':
        'St. Mary\'s Basilica paas hai. Pointed arches, stained glass, aur bahar ki lively streets ke saath andar ki shanti ko mehsoos kijiye.',
      'kn-IN':
        'St. Mary\'s Basilica hattira ide. Pointed arches, stained glass mattu horagina busy beedigalige viruddhavada olagina shantiyannu gamanisi.',
    },
    tags: ['Church', 'Architecture', 'Market area'],
  },
  {
    id: 'bannerghatta-park',
    name: 'Bannerghatta Biological Park',
    category: 'nature',
    city: 'Bengaluru',
    lat: 12.8004,
    lng: 77.577,
    rating: 4.1,
    openingHours: '9:30 AM - 5:00 PM. Usually closed Tuesdays.',
    visitTime: '3 hr',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bannerghatta_National_Park.jpg',
    short:
      'A family-friendly wildlife and nature stop on the southern edge of Bengaluru.',
    details:
      'Bannerghatta is best planned as a dedicated half-day outing rather than a quick city hop. It gives travelers a nature-heavy break from palaces, temples, and central landmarks.',
    audio: {
      'en-IN':
        'Bannerghatta Biological Park needs more buffer time. Start early, keep water ready, and treat this as a nature segment outside the central city loop.',
      'hi-IN':
        'Bannerghatta Biological Park ke liye extra time rakhiye. Jaldi shuru kijiye, paani rakhiye, aur ise city loop ke bahar ka nature segment samajhiye.',
      'kn-IN':
        'Bannerghatta Biological Park ge hecchu samaya beku. Begane prarambhisi, neeru ittukolli, idannu city loop inda horagina nature stop agi nodi.',
    },
    tags: ['Wildlife', 'Family', 'Half day'],
  },
  {
    id: 'ranganathaswamy-temple',
    name: 'Sri Ranganathaswamy Temple',
    category: 'temples',
    city: 'Srirangapatna',
    lat: 12.4244,
    lng: 76.6804,
    rating: 4.7,
    openingHours: '7:30 AM - 1:00 PM, 4:00 PM - 8:00 PM',
    visitTime: '60 min',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/f/f0/Sri_Ranganathaswamy_Temple%2C_Srirangapatna.jpg',
    short:
      'A major riverside temple stop near Mysuru with deep Vaishnavite heritage.',
    details:
      'Sri Ranganathaswamy Temple fits naturally into a Mysuru or Srirangapatna route. It offers a slower devotional experience and pairs well with nearby fort, river, and history stops.',
    audio: {
      'en-IN':
        'Sri Ranganathaswamy Temple is a calm heritage stop. Check darshan timings, move respectfully inside, and leave time for nearby Srirangapatna history.',
      'hi-IN':
        'Sri Ranganathaswamy Temple ek shant heritage stop hai. Darshan timing check kijiye, andar samman se jaiye, aur Srirangapatna ke paas ke history stops ke liye time rakhiye.',
      'kn-IN':
        'Sri Ranganathaswamy Temple shantavada heritage stop. Darshana samaya check madi, olage gauravadinda nadeyiri, Srirangapatna history stops ge samaya idi.',
    },
    tags: ['Temple', 'Mysuru route', 'Heritage'],
  },
]

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Local storage can fail in private mode. The app still works for the session.
  }
}

function toRad(value) {
  return (value * Math.PI) / 180
}

function getDistanceKm(from, to) {
  const radius = 6371
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km) {
  if (km < 1) return `${Math.max(20, Math.round(km * 1000))} m`
  return `${km.toFixed(km < 10 ? 1 : 0)} km`
}

function formatEta(km) {
  const minutes = Math.max(4, Math.round((km / 22) * 60))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}

function getBearing(from, to) {
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const lngDelta = toRad(to.lng - from.lng)
  const y = Math.sin(lngDelta) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDelta)
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
}

function getDirectionHintFromBearing(bearing) {
  const normalized = ((bearing % 360) + 360) % 360
  if (normalized < 25 || normalized >= 335) return 'head north'
  if (normalized < 70) return 'head north-east'
  if (normalized < 115) return 'head east'
  if (normalized < 160) return 'head south-east'
  if (normalized < 205) return 'head south'
  if (normalized < 250) return 'head south-west'
  if (normalized < 295) return 'head west'
  return 'head north-west'
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360
}

function getRelativeBearing(targetBearing, heading) {
  const diff = normalizeDegrees(targetBearing - heading)
  return diff > 180 ? diff - 360 : diff
}

function getRouteUrl(place, mode, origin = INDIA_DEFAULT) {
  const engine = mode === 'walking' ? 'fossgis_osrm_foot' : 'fossgis_osrm_car'
  return `https://www.openstreetmap.org/directions?engine=${engine}&route=${origin.lat}%2C${origin.lng}%3B${place.lat}%2C${place.lng}#map=14/${place.lat}/${place.lng}`
}

function getOsrmProfile(mode) {
  if (mode === 'walking') return 'foot'
  if (mode === 'cycling') return 'bike'
  return 'driving'
}

function toRoutePoint(coordinates) {
  return { lng: coordinates[0], lat: coordinates[1] }
}

function getRouteDistanceKm(points, startIndex = 0) {
  return points.slice(startIndex + 1).reduce((sum, point, index) => {
    const previous = points[startIndex + index]
    return sum + getDistanceKm(previous, point)
  }, 0)
}

function getNearestRouteIndex(position, points) {
  if (!points.length) return 0
  return points.reduce(
    (best, point, index) => {
      const distanceKm = getDistanceKm(position, point)
      return distanceKm < best.distanceKm ? { index, distanceKm } : best
    },
    { index: 0, distanceKm: Number.POSITIVE_INFINITY },
  ).index
}

async function fetchOsmRoute(origin, destination, mode) {
  const profile = getOsrmProfile(mode)
  const routeUrl = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`
  const response = await fetch(routeUrl)
  if (!response.ok) throw new Error('OpenStreetMap route failed')
  const data = await response.json()
  const route = data.routes?.[0]
  const points = route?.geometry?.coordinates?.map(toRoutePoint) || []
  if (!points.length) throw new Error('OpenStreetMap route has no geometry')
  return {
    distanceKm: (route.distance || getRouteDistanceKm(points) * 1000) / 1000,
    durationMin: Math.round((route.duration || 0) / 60),
    points,
    steps:
      route.legs?.flatMap((leg) =>
        (leg.steps || []).map((step) => ({
          name: step.name || 'next road',
          instruction: step.maneuver?.type || 'continue',
          distanceKm: (step.distance || 0) / 1000,
        })),
      ) || [],
    source: 'OSRM / OpenStreetMap',
  }
}

function getSearchUrl(place) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${place.name} ${place.city}`)}`
}

function getGoogleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

function getGoogleLensUploadUrl() {
  return 'https://lens.google.com/upload'
}

function getOsmEmbedUrl(place, zoom = 14) {
  const delta = zoom >= 14 ? 0.018 : 0.08
  const left = place.lng - delta
  const right = place.lng + delta
  const top = place.lat + delta
  const bottom = place.lat - delta
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${place.lat}%2C${place.lng}`
}

function getPinPosition(place) {
  const lats = PLACES.map((item) => item.lat)
  const lngs = PLACES.map((item) => item.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const left = ((place.lng - minLng) / (maxLng - minLng || 1)) * 82 + 9
  const top = (1 - (place.lat - minLat) / (maxLat - minLat || 1)) * 78 + 10
  return { left: `${left}%`, top: `${top}%` }
}

function getAverageRating(place, reviews) {
  const placeReviews = reviews.filter((review) => review.placeId === place.id)
  if (!placeReviews.length) return place.rating
  const total = placeReviews.reduce((sum, review) => sum + review.rating, 0)
  return total / placeReviews.length
}

function getEntryFee(place) {
  if (place.category === 'food') return 'Pay per order'
  if (place.tags.includes('Free')) return 'Free entry'
  if (place.tags.includes('Tickets')) return 'Ticketed entry'
  return 'Check current entry fee'
}

function getPersonalScore(place, interests) {
  const raw = `${place.name} ${place.category} ${place.tags.join(' ')} ${place.short}`.toLowerCase()
  const matches = interests.filter((interest) => raw.includes(interest.toLowerCase().split(' ')[0]))
  return Math.min(99, Math.round(place.rating * 16 + matches.length * 10 - place.distanceKm * 0.6))
}

function buildStory(place) {
  const opening = place.category === 'food'
    ? `${place.name} is not just a meal stop; it is a small pause in the rhythm of the city.`
    : `${place.name} is where the city slows down enough for you to notice its older layers.`
  return `${opening} Start by looking for one signature detail, then connect it to the neighborhood around you. ${place.details}`
}

function buildSmartSummary(place) {
  return `${place.name} is best for ${place.tags.slice(0, 2).join(' and ').toLowerCase()}. Plan around ${place.openingHours.toLowerCase()} and keep about ${place.visitTime} for the stop.`
}

function getPlaceSearchText(place) {
  return `${place.name} ${place.city} ${place.category} ${place.tags.join(' ')} ${place.short}`.toLowerCase()
}

function findScanMatches({ places, query, fileName, selectedPlace }) {
  const signal = `${query || ''} ${fileName || ''}`.toLowerCase().replace(/[_-]+/g, ' ')
  const scored = places.map((place) => {
    const text = getPlaceSearchText(place)
    const nameWords = place.name.toLowerCase().split(/\s+/)
    const tagScore = place.tags.filter((tag) => signal.includes(tag.toLowerCase())).length * 18
    const nameScore = nameWords.filter((word) => word.length > 2 && signal.includes(word)).length * 24
    const categoryScore = signal.includes(place.category) ? 16 : 0
    const selectedBoost = selectedPlace?.id === place.id ? 4 : 0
    const queryScore = query && text.includes(query.toLowerCase()) ? 20 : 0
    return {
      place,
      score: nameScore + tagScore + categoryScore + selectedBoost + queryScore + Math.round(place.rating * 2),
    }
  })

  return scored.sort((left, right) => right.score - left.score).slice(0, 3)
}

function buildDayItinerary(places, mode = 'balanced') {
  const limit = mode === 'relaxed' ? 3 : mode === 'deep' ? 4 : 5
  return places
    .slice(0, limit)
    .map((place, index) => ({
      place,
      time: index === 0 ? '9:00 AM' : index === 1 ? '11:00 AM' : index === 2 ? '1:30 PM' : index === 3 ? '3:30 PM' : '5:30 PM',
      note:
        index === 0
          ? 'Start here while energy and light are good.'
          : place.category === 'food'
            ? 'Use this as the meal break.'
            : 'Continue only if the previous stop still leaves enough buffer.',
    }))
}

function addMinutes(time, minutesToAdd) {
  const [hours, minutes] = time.split(':').map(Number)
  const total = hours * 60 + minutes + minutesToAdd
  const nextHours = Math.floor(total / 60) % 24
  const nextMinutes = total % 60
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}

function getVisitMinutes(place, pace) {
  const raw = place.visitTime || ''
  const firstNumber = Number(raw.match(/\d+/)?.[0] || 60)
  const base = raw.toLowerCase().includes('hr') ? firstNumber * 60 : firstNumber
  if (pace === 'relaxed') return Math.round(base * 1.25)
  if (pace === 'fast') return Math.round(base * 0.75)
  return base
}

function buildTripPlan({ places, days, pace, startTime, budget, interests }) {
  const dayCount = Math.max(1, Math.min(5, Number(days) || 1))
  const stopsPerDay = pace === 'relaxed' ? 3 : pace === 'fast' ? 5 : 4
  const scoredPlaces = [...places]
    .sort((left, right) => {
      const leftInterest = interests.some((interest) => getPlaceSearchText(left).includes(interest.toLowerCase().split(' ')[0]))
      const rightInterest = interests.some((interest) => getPlaceSearchText(right).includes(interest.toLowerCase().split(' ')[0]))
      return Number(rightInterest) - Number(leftInterest) || left.distanceKm - right.distanceKm
    })
    .slice(0, dayCount * stopsPerDay)

  return Array.from({ length: dayCount }, (_, dayIndex) => {
    const stops = scoredPlaces.slice(dayIndex * stopsPerDay, (dayIndex + 1) * stopsPerDay)
    let cursor = startTime
    const plannedStops = stops.map((place, index) => {
      const visitMinutes = getVisitMinutes(place, pace)
      const travelBuffer = index === 0 ? 0 : pace === 'fast' ? 20 : 35
      cursor = addMinutes(cursor, travelBuffer)
      const startsAt = cursor
      cursor = addMinutes(cursor, visitMinutes)
      return {
        place,
        startsAt,
        endsAt: cursor,
        visitMinutes,
        note:
          place.category === 'food'
            ? 'Use this as a food break and recovery stop.'
            : index === 0
              ? 'Start here while light and energy are strongest.'
              : 'Keep this stop if travel time feels comfortable.',
      }
    })

    const distanceKm = plannedStops.reduce((sum, stop) => sum + stop.place.distanceKm, 0)
    const estimatedSpend =
      budget === 'budget'
        ? plannedStops.length * 250
        : budget === 'comfort'
          ? plannedStops.length * 650
          : plannedStops.length * 1100

    return {
      dayNumber: dayIndex + 1,
      title: `Day ${dayIndex + 1}: ${plannedStops[0]?.place.city || 'Nearby'} route`,
      distanceKm,
      estimatedSpend,
      stops: plannedStops,
    }
  })
}

function normalizePlaceName(name) {
  return `${name || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function mergePlaces(places) {
  const seen = new Set()
  return places.filter((place) => {
    const key = normalizePlaceName(`${place.name}-${place.city}`)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function escapeSvgText(value) {
  return `${value}`.replace(/[&<>"']/g, (character) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    }
    return replacements[character]
  })
}

function buildImageFallback(place) {
  const label = escapeSvgText(place.name)
  const category = escapeSvgText(
    CATEGORIES.find((item) => item.id === place.category)?.label || 'Tour Guide',
  )
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750">
      <rect width="1200" height="750" fill="#f3f7f5"/>
      <path d="M0 560 C220 430 360 660 580 510 C790 365 930 470 1200 310 L1200 750 L0 750 Z" fill="#d9f1e9"/>
      <path d="M0 650 C250 540 420 710 680 590 C880 500 1000 560 1200 470 L1200 750 L0 750 Z" fill="#ffe6d8"/>
      <rect x="72" y="72" width="1056" height="606" rx="24" fill="none" stroke="#d7dfdc" stroke-width="6"/>
      <text x="86" y="180" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#1d6f6c">${category}</text>
      <text x="86" y="292" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#18201f">${label}</text>
      <text x="86" y="382" font-family="Arial, sans-serif" font-size="34" fill="#4e5a57">Offline guide image</text>
    </svg>
  `
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function classifyOsmPlace(tags) {
  const raw = `${tags.tourism || ''} ${tags.historic || ''} ${tags.amenity || ''} ${
    tags.leisure || ''
  } ${tags.natural || ''} ${tags.religion || ''}`.toLowerCase()

  if (raw.includes('restaurant') || raw.includes('cafe') || raw.includes('fast_food')) {
    return 'food'
  }
  if (raw.includes('place_of_worship') || raw.includes('hindu') || raw.includes('temple')) {
    return 'temples'
  }
  if (raw.includes('park') || raw.includes('garden') || raw.includes('viewpoint') || raw.includes('natural')) {
    return 'nature'
  }
  return 'historical'
}

function classifyGooglePlace(types = []) {
  const joined = types.join(' ').toLowerCase()
  if (
    joined.includes('restaurant') ||
    joined.includes('cafe') ||
    joined.includes('meal_takeaway') ||
    joined.includes('food')
  ) {
    return 'food'
  }
  if (
    joined.includes('hindu_temple') ||
    joined.includes('place_of_worship') ||
    joined.includes('mosque') ||
    joined.includes('church')
  ) {
    return 'temples'
  }
  if (
    joined.includes('park') ||
    joined.includes('garden') ||
    joined.includes('natural_feature') ||
    joined.includes('tourist_attraction')
  ) {
    return 'nature'
  }
  return 'historical'
}

function buildLivePlaceSummary(name, category, tags) {
  const readableCategory = CATEGORIES.find((item) => item.id === category)?.label || 'Place'
  const sourceDetail = tags.description || tags.wikipedia || tags.tourism || tags.historic || tags.amenity
  if (sourceDetail) {
    return `${name} is a nearby ${readableCategory.toLowerCase()} stop found from live map data. Source note: ${sourceDetail}.`
  }
  return `${name} is a nearby ${readableCategory.toLowerCase()} stop found from live map data. Save it or add it to a trip while you still have network.`
}

async function fetchLivePlacesFromOsm(lat, lng, radiusKm) {
  const radiusMeters = Math.max(1000, Math.min(25000, radiusKm * 1000))
  const query = `
    [out:json][timeout:18];
    (
      node(around:${radiusMeters},${lat},${lng})["tourism"~"attraction|museum|viewpoint|gallery|zoo"];
      node(around:${radiusMeters},${lat},${lng})["historic"];
      node(around:${radiusMeters},${lat},${lng})["amenity"~"place_of_worship|restaurant|cafe|fast_food|food_court"];
      node(around:${radiusMeters},${lat},${lng})["leisure"~"park|garden"];
      way(around:${radiusMeters},${lat},${lng})["tourism"~"attraction|museum|viewpoint|gallery|zoo"];
      way(around:${radiusMeters},${lat},${lng})["historic"];
      way(around:${radiusMeters},${lat},${lng})["amenity"~"place_of_worship|restaurant|cafe|fast_food|food_court"];
      way(around:${radiusMeters},${lat},${lng})["leisure"~"park|garden"];
    );
    out center 24;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })
  if (!response.ok) throw new Error('Nearby lookup failed')
  const data = await response.json()

  return (data.elements || [])
    .filter((item) => item.tags?.name)
    .map((item, index) => {
      const placeLat = item.lat ?? item.center?.lat
      const placeLng = item.lon ?? item.center?.lon
      const category = classifyOsmPlace(item.tags)
      const name = item.tags.name
      return {
        id: `live-${item.type}-${item.id}-${index}`,
        name,
        category,
        city: item.tags['addr:city'] || item.tags['addr:town'] || 'Near you',
        lat: placeLat,
        lng: placeLng,
        rating: 4.2,
        openingHours: item.tags.opening_hours || 'Check before visiting',
        visitTime: category === 'food' ? '40 min' : '60 min',
        image: LIVE_CATEGORY_IMAGES[category],
        short: buildLivePlaceSummary(name, category, item.tags),
        details: buildLivePlaceSummary(name, category, item.tags),
        audio: {
          'en-IN': `${name} is nearby. It was found from live map data, so confirm opening hours before you go and save it if the network is weak.`,
          'hi-IN': `${name} paas mein hai. Yeh live map data se mila hai, isliye jaane se pehle timing confirm karein aur weak network ke liye save kar lein.`,
          'kn-IN': `${name} hattiradalli ide. Idu live map data inda sigide, hoguva munna samaya confirm madi mattu network kadime iddare save madi.`,
        },
        tags: ['Live map', CATEGORIES.find((item) => item.id === category)?.label || 'Place'],
        source: 'live',
      }
    })
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
    .slice(0, 24)
}

async function fetchNearbyFromGooglePlaces(lat, lng, radiusKm) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Places key missing')
  }

  const radiusMeters = Math.max(1000, Math.min(25000, radiusKm * 1000))
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.name,places.displayName,places.location,places.types,places.rating,places.formattedAddress,places.currentOpeningHours,places.photos',
    },
    body: JSON.stringify({
      maxResultCount: 18,
      includedTypes: [
        'tourist_attraction',
        'historical_landmark',
        'hindu_temple',
        'museum',
        'park',
        'cafe',
        'restaurant',
      ],
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
          radius: radiusMeters,
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Google Places nearby request failed')
  }

  const data = await response.json()
  return data.places || []
}

async function fetchPlaceDetailsFromGooglePlaces(placeName) {
  if (!GOOGLE_MAPS_API_KEY) return null

  const response = await fetch(`https://places.googleapis.com/v1/${placeName}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask':
        'id,name,displayName,editorialSummary,regularOpeningHours,primaryTypeDisplayName,userRatingCount,photos',
    },
  })

  if (!response.ok) return null
  return response.json()
}

function toLivePlaceFromGoogle(nearby, details) {
  const category = classifyGooglePlace(nearby.types)
  const name = nearby.displayName?.text || details?.displayName?.text || 'Nearby place'
  const detailText =
    details?.editorialSummary?.text ||
    buildLivePlaceSummary(name, category, {
      tourism: nearby.primaryTypeDisplayName?.text || '',
    })
  let openingHours = details?.regularOpeningHours?.weekdayDescriptions?.[0]
  if (!openingHours) {
    if (nearby.currentOpeningHours?.openNow === true) {
      openingHours = 'Open now (see map for full hours)'
    } else if (nearby.currentOpeningHours?.openNow === false) {
      openingHours = 'Currently closed (see map for full hours)'
    } else {
      openingHours = 'Check before visiting'
    }
  }

  const photoName = details?.photos?.[0]?.name || nearby.photos?.[0]?.name
  const imageGallery = (details?.photos || nearby.photos || [])
    .slice(0, 5)
    .map((photo) => `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=900&key=${GOOGLE_MAPS_API_KEY}`)
  const image = photoName
    ? `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&key=${GOOGLE_MAPS_API_KEY}`
    : LIVE_CATEGORY_IMAGES[category]

  return {
    id: `gplaces-${nearby.id || nearby.name}`,
    googlePlaceId: nearby.id || null,
    googlePlaceName: nearby.name || null,
    name,
    category,
    city: nearby.formattedAddress || 'Near you',
    lat: nearby.location?.latitude,
    lng: nearby.location?.longitude,
    rating: nearby.rating || 4.2,
    openingHours,
    visitTime: category === 'food' ? '40 min' : '60 min',
    image,
    images: imageGallery.length ? imageGallery : [image],
    short: detailText,
    details: detailText,
    audio: {
      'en-IN': `${name} is nearby. This place is from Google Places live data. Confirm timing before visiting and save for weak-network travel.`,
      'hi-IN': `${name} paas mein hai. Yeh place Google Places live data se aaya hai. Jaane se pehle timing confirm karein aur weak network ke liye save kar lein.`,
      'kn-IN': `${name} hattiradalli ide. Idu Google Places live data inda bandide. Hoguva munna samaya confirm madi mattu weak network ge save madi.`,
    },
    tags: ['Google Places', CATEGORIES.find((item) => item.id === category)?.label || 'Place'],
    source: 'live',
  }
}

let googleMapsScriptPromise = null

function loadGoogleMapsScript() {
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(false)
  if (window.google?.maps) return Promise.resolve(true)
  if (googleMapsScriptPromise) return googleMapsScriptPromise

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-smart-tour="google-maps"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Maps script failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.smartTour = 'google-maps'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Google Maps script failed'))
    document.head.appendChild(script)
  })

  return googleMapsScriptPromise
}

async function fetchLivePlaces(lat, lng, radiusKm) {
  if (!GOOGLE_MAPS_API_KEY) {
    return fetchLivePlacesFromOsm(lat, lng, radiusKm)
  }

  const nearbyResults = await fetchNearbyFromGooglePlaces(lat, lng, radiusKm)
  const detailResults = await Promise.allSettled(
    nearbyResults.slice(0, 10).map((place) => fetchPlaceDetailsFromGooglePlaces(place.name)),
  )
  const detailMap = detailResults.reduce((accumulator, result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      accumulator[nearbyResults[index].name] = result.value
    }
    return accumulator
  }, {})

  return nearbyResults
    .map((nearby) => toLivePlaceFromGoogle(nearby, detailMap[nearby.name]))
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
}

function AppImage({ place, className = '' }) {
  return (
    <img
      className={className}
      src={place.image}
      alt={place.name}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null
        event.currentTarget.src = buildImageFallback(place)
      }}
    />
  )
}

export default function SmartTourGuide() {
  const initialProfile = readJson(STORAGE.profile, { language: 'en-IN', offlineOnly: false })
  const autoSpokenRef = useRef(new Set())
  const navVoiceLastSpokenAtRef = useRef(0)
  const navVoiceLastDistanceRef = useRef(null)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(new Map())
  const arVideoRef = useRef(null)
  const arStreamRef = useRef(null)
  const lastLiveScanPositionRef = useRef(null)
  const lastNearbyRefreshTokenRef = useRef(0)
  const [screen, setScreen] = useState('home')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [radiusKm, setRadiusKm] = useState(20)
  const [minRating, setMinRating] = useState(0)
  const [sortMode, setSortMode] = useState('distance')
  const [travelMode, setTravelMode] = useState('driving')
  const [language, setLanguage] = useState(initialProfile.language || 'en-IN')
  const [offlineOnly, setOfflineOnly] = useState(Boolean(initialProfile.offlineOnly))
  const [accessibilityMode, setAccessibilityMode] = useState(initialProfile.accessibilityMode || 'Standard')
  const [interests, setInterests] = useState(initialProfile.interests || ['History', 'Food'])
  const [detailImageIndex, setDetailImageIndex] = useState(0)
  const [position, setPosition] = useState(INDIA_DEFAULT)
  const [locationState, setLocationState] = useState(() => (navigator.geolocation ? 'init' : 'default'))
  const [online, setOnline] = useState(() => navigator.onLine)
  const [livePlaces, setLivePlaces] = useState([])
  const [autoRefreshNearby, setAutoRefreshNearby] = useState(true)
  const [nearbyRefreshToken, setNearbyRefreshToken] = useState(0)
  const [nearbyScanStatus, setNearbyScanStatus] = useState('Waiting for location to load dynamic places')
  const [permissionStatus, setPermissionStatus] = useState({
    camera: IS_NATIVE_ANDROID ? 'prompt' : 'browser',
    location: IS_NATIVE_ANDROID ? 'prompt' : 'browser',
  })
  const [liveStatus, setLiveStatus] = useState(() =>
    navigator.geolocation ? 'Waiting for GPS…' : 'GPS unavailable. Showing India map and offline data.',
  )
  const [selectedId, setSelectedId] = useState('bangalore-palace')
  const [savedIds, setSavedIds] = useState(() => readJson(STORAGE.saved, []))
  const [visitedIds, setVisitedIds] = useState(() => readJson(STORAGE.visited, []))
  const [tripDays, setTripDays] = useState(() => readJson(STORAGE.trips, { day1: [], day2: [] }))
  const [offlinePacks, setOfflinePacks] = useState(() => readJson(STORAGE.offline, {}))
  const [reviews, setReviews] = useState(() => readJson(STORAGE.reviews, []))
  const [posts, setPosts] = useState(() => readJson(STORAGE.posts, []))
  const [adminPlaces, setAdminPlaces] = useState(() => readJson(STORAGE.adminPlaces, []))
  const [downloadState, setDownloadState] = useState('idle')
  const [autoAudio, setAutoAudio] = useState(true)
  const [voiceState, setVoiceState] = useState('ready')
  const [navVoiceEnabled, setNavVoiceEnabled] = useState(false)
  const [navVoiceStatus, setNavVoiceStatus] = useState('Navigation voice is off')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Ask me what to visit next, what this place means, or how to plan your day.' },
  ])
  const [scanResult, setScanResult] = useState('')
  const [scanImage, setScanImage] = useState('')
  const [scanFileName, setScanFileName] = useState('')
  const [scanQuery, setScanQuery] = useState('')
  const [scanMatches, setScanMatches] = useState([])
  const [scanStatus, setScanStatus] = useState('Ready to scan')
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, text: '' })
  const [postDraft, setPostDraft] = useState('')
  const [shareStatus, setShareStatus] = useState('Ready to share')
  const [authUser, setAuthUser] = useState(initialProfile.authUser || '')
  const [itineraryMode, setItineraryMode] = useState('balanced')
  const [plannerDays, setPlannerDays] = useState(2)
  const [plannerPace, setPlannerPace] = useState('balanced')
  const [plannerStartTime, setPlannerStartTime] = useState('09:00')
  const [plannerBudget, setPlannerBudget] = useState('budget')
  const [plannerStatus, setPlannerStatus] = useState('Planner is ready')
  const [arActive, setArActive] = useState(false)
  const [arHeading, setArHeading] = useState(0)
  const [arStatus, setArStatus] = useState('AR is ready. Start camera to see nearby labels.')
  const [arDestinationId, setArDestinationId] = useState(selectedId)
  const [arNavigationActive, setArNavigationActive] = useState(false)
  const [arRoute, setArRoute] = useState(null)
  const [arRouteStatus, setArRouteStatus] = useState('Choose a destination and start AR navigation.')
  const [adminDraft, setAdminDraft] = useState({
    name: '',
    category: 'historical',
    city: 'Bengaluru',
    lat: '12.9716',
    lng: '77.5946',
    short: '',
  })

  useEffect(() => {
    writeJson(STORAGE.saved, savedIds)
  }, [savedIds])

  useEffect(() => {
    writeJson(STORAGE.trips, tripDays)
  }, [tripDays])

  useEffect(() => {
    writeJson(STORAGE.offline, offlinePacks)
  }, [offlinePacks])

  useEffect(() => {
    writeJson(STORAGE.profile, { language, offlineOnly, accessibilityMode, interests, authUser })
  }, [accessibilityMode, authUser, interests, language, offlineOnly])

  useEffect(() => {
    writeJson(STORAGE.visited, visitedIds)
  }, [visitedIds])

  useEffect(() => {
    writeJson(STORAGE.reviews, reviews)
  }, [reviews])

  useEffect(() => {
    writeJson(STORAGE.posts, posts)
  }, [posts])

  useEffect(() => {
    writeJson(STORAGE.adminPlaces, adminPlaces)
  }, [adminPlaces])

  useEffect(() => {
    function handleOrientation(event) {
      const compassHeading =
        typeof event.webkitCompassHeading === 'number'
          ? event.webkitCompassHeading
          : typeof event.alpha === 'number'
            ? 360 - event.alpha
            : null
      if (compassHeading === null) return
      setArHeading(normalizeDegrees(compassHeading))
    }

    window.addEventListener('deviceorientationabsolute', handleOrientation, true)
    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [])

  useEffect(() => {
    if (screen !== 'ar' && arActive) {
      if (arStreamRef.current) {
        arStreamRef.current.getTracks().forEach((track) => track.stop())
        arStreamRef.current = null
      }
      if (arVideoRef.current) {
        arVideoRef.current.srcObject = null
      }
      window.setTimeout(() => {
        setArActive(false)
        setArStatus('AR camera stopped')
      }, 0)
    }
  }, [arActive, screen])

  useEffect(
    () => () => {
      if (arStreamRef.current) {
        arStreamRef.current.getTracks().forEach((track) => track.stop())
        arStreamRef.current = null
      }
    },
    [],
  )

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
    }

    function handleOffline() {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let webWatchId = null
    let nativeWatchId = null

    async function startLocationWatch() {
      if (IS_NATIVE_ANDROID) {
        try {
          const status = await Geolocation.requestPermissions()
          if (cancelled) return
          setPermissionStatus((current) => ({ ...current, location: status.location || 'prompt' }))

          const currentPosition = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 12000,
          })
          if (cancelled) return
          setPosition({
            lat: currentPosition.coords.latitude,
            lng: currentPosition.coords.longitude,
            label: 'Android GPS',
          })
          setLocationState('live')
          setLiveStatus('Android location permission granted. GPS locked.')

          nativeWatchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
            (next, error) => {
              if (cancelled) return
              if (error || !next) {
                setLiveStatus('Android GPS update failed. Showing last known or bundled data.')
                return
              }
              setPosition({ lat: next.coords.latitude, lng: next.coords.longitude, label: 'Android GPS' })
              setLocationState('live')
              setLiveStatus('Android GPS live. Showing places near you.')
            },
          )
        } catch {
          if (cancelled) return
          setPermissionStatus((current) => ({ ...current, location: 'denied' }))
          setLocationState('default')
          setPosition(INDIA_DEFAULT)
          setLiveStatus('Android location permission unavailable. Showing bundled data.')
        }
        return
      }

      if (!navigator.geolocation) {
        setLocationState('default')
        setLiveStatus('GPS unavailable. Showing bundled data.')
        return
      }

      webWatchId = navigator.geolocation.watchPosition(
        (next) => {
          setPosition({ lat: next.coords.latitude, lng: next.coords.longitude, label: 'Live GPS' })
          setLocationState('live')
          setLiveStatus('GPS locked. Showing places near you.')
        },
        () => {
          setLocationState('default')
          setPosition(INDIA_DEFAULT)
          setLiveStatus('GPS permission unavailable. Showing India map and offline data.')
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
      )
    }

    startLocationWatch()

    return () => {
      cancelled = true
      if (webWatchId !== null) navigator.geolocation.clearWatch(webWatchId)
      if (nativeWatchId !== null) Geolocation.clearWatch({ id: nativeWatchId }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadLivePlaces() {
      if (locationState !== 'live') return
      if (offlineOnly) {
        setLivePlaces([])
        setLiveStatus('Offline-only mode active. Showing downloaded and bundled places.')
        setNearbyScanStatus('Offline-only mode is using bundled and downloaded places')
        return
      }

      const lastScanPosition = lastLiveScanPositionRef.current
      const movedKm = lastScanPosition ? getDistanceKm(lastScanPosition, position) : Number.POSITIVE_INFINITY
      const manualRefreshRequested = nearbyRefreshToken !== lastNearbyRefreshTokenRef.current
      const shouldScan = manualRefreshRequested || !lastScanPosition || movedKm >= 0.25

      if (autoRefreshNearby && !shouldScan) {
        setNearbyScanStatus(
          `Dynamic places stay live. Move ${Math.max(20, Math.round((0.25 - movedKm) * 1000))} m more to rescan nearby data.`,
        )
        return
      }

      if (!autoRefreshNearby && nearbyRefreshToken === 0 && livePlaces.length > 0) {
        setNearbyScanStatus('Auto refresh is paused. Distances still update from GPS.')
        return
      }

      const scanSource = GOOGLE_MAPS_API_KEY ? 'Google Places' : 'OpenStreetMap'
      setLiveStatus(`Scanning ${scanSource} nearby locations`)
      setNearbyScanStatus(`Scanning ${scanSource} around ${position.label}`)
      try {
        const results = await fetchLivePlaces(position.lat, position.lng, radiusKm)
        if (cancelled) return
        setLivePlaces(results)
        lastLiveScanPositionRef.current = { lat: position.lat, lng: position.lng }
        lastNearbyRefreshTokenRef.current = nearbyRefreshToken
        setLiveStatus(
          results.length
            ? `${results.length} dynamic places found from ${scanSource}`
            : 'No live places found nearby, using demo places',
        )
        setNearbyScanStatus(
          results.length
            ? `Dynamic list updated. It will refresh again after you move about 250 m.`
            : 'No dynamic places found nearby. Bundled places are still sorted by your location.',
        )
      } catch {
        try {
          const fallbackResults = await fetchLivePlacesFromOsm(position.lat, position.lng, radiusKm)
          if (cancelled) return
          setLivePlaces(fallbackResults)
          lastLiveScanPositionRef.current = { lat: position.lat, lng: position.lng }
          lastNearbyRefreshTokenRef.current = nearbyRefreshToken
          setLiveStatus(
            fallbackResults.length
              ? `${fallbackResults.length} live places found from fallback data`
              : 'Live discovery unavailable, using demo places',
          )
          setNearbyScanStatus(
            fallbackResults.length
              ? 'Dynamic OpenStreetMap fallback updated near your current GPS.'
              : 'No dynamic fallback places found nearby. Bundled places are sorted by distance.',
          )
        } catch {
          if (!cancelled) {
            setLivePlaces([])
            setLiveStatus(
              GOOGLE_MAPS_API_KEY
                ? 'Live discovery unavailable, using demo places'
                : 'Free OpenStreetMap discovery unavailable right now. Using bundled places.',
            )
            setNearbyScanStatus('Dynamic lookup is unavailable right now. Bundled places still react to GPS distance.')
          }
        }
      }
    }

    loadLivePlaces()
    return () => {
      cancelled = true
    }
  }, [autoRefreshNearby, livePlaces.length, locationState, nearbyRefreshToken, offlineOnly, position, radiusKm])

  useEffect(() => {
    let cancelled = false
    if ((screen !== 'map' && screen !== 'detail') || !GOOGLE_MAPS_API_KEY) {
      return undefined
    }

    loadGoogleMapsScript()
      .then(() => {
        if (cancelled) return
        setMapReady(true)
        setMapError('')
      })
      .catch(() => {
        if (!cancelled) {
          setMapReady(false)
          setMapError('Google Map unavailable. Check API key or network.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [screen])

  const enrichedPlaces = useMemo(
    () =>
      mergePlaces([...livePlaces, ...adminPlaces, ...PLACES]).map((place) => {
        const distanceKm = getDistanceKm(position, place)
        const averageRating = getAverageRating(place, reviews)
        return {
          ...place,
          rating: averageRating,
          distanceKm,
          eta: formatEta(distanceKm),
          distanceLabel: formatDistance(distanceKm),
          entryFee: place.entryFee || getEntryFee(place),
          recommendationScore: getPersonalScore({ ...place, distanceKm }, interests),
        }
      }).sort((a, b) => a.distanceKm - b.distanceKm),
    [adminPlaces, interests, livePlaces, position, reviews],
  )
  const discoveryPlaces = useMemo(() => {
    if (!offlineOnly) return enrichedPlaces
    const enabledCities = Object.values(offlinePacks).map((pack) => pack.label)
    const curatedOnly = enrichedPlaces.filter((place) => place.source !== 'live')
    if (!enabledCities.length) return curatedOnly
    const offlineMatches = curatedOnly.filter((place) => enabledCities.includes(place.city))
    return offlineMatches.length ? offlineMatches : curatedOnly
  }, [enrichedPlaces, offlineOnly, offlinePacks])

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const result = discoveryPlaces.filter((place) => {
      const matchesCategory = category === 'all' || place.category === category
      const matchesRadius = place.distanceKm <= radiusKm || locationState === 'demo'
      const matchesRating = place.rating >= minRating
      const matchesQuery =
        !normalized ||
        `${place.name} ${place.city} ${place.category} ${place.tags.join(' ')}`
          .toLowerCase()
          .includes(normalized)
      return matchesCategory && matchesRadius && matchesRating && matchesQuery
    })
    return result.sort((left, right) => {
      if (sortMode === 'rating') return right.rating - left.rating || left.distanceKm - right.distanceKm
      if (sortMode === 'personal') return right.recommendationScore - left.recommendationScore
      return left.distanceKm - right.distanceKm
    })
  }, [category, discoveryPlaces, locationState, minRating, query, radiusKm, sortMode])

  const popularPlaces = useMemo(
    () => [...discoveryPlaces].sort((a, b) => b.rating - a.rating).slice(0, 4),
    [discoveryPlaces],
  )
  const nearMeSuggestions = useMemo(() => {
    const nearbyPool =
      locationState === 'live'
        ? filteredPlaces.filter((place) => place.distanceKm <= 2)
        : filteredPlaces
    return nearbyPool.slice(0, 5)
  }, [filteredPlaces, locationState])

  const selectedPlace =
    discoveryPlaces.find((place) => place.id === selectedId) || filteredPlaces[0] || discoveryPlaces[0] || enrichedPlaces[0]
  const arDestination =
    discoveryPlaces.find((place) => place.id === arDestinationId) || selectedPlace || filteredPlaces[0] || discoveryPlaces[0]
  const savedPlaces = savedIds.map((id) => discoveryPlaces.find((place) => place.id === id)).filter(Boolean)
  const selectedReviews = reviews.filter((review) => review.placeId === selectedPlace.id)
  const tripStats = [...tripDays.day1, ...tripDays.day2].length
  const nearEnough = selectedPlace.distanceKm <= 0.35
  const currentNarration = selectedPlace.audio[language] || selectedPlace.audio['en-IN']
  const selectedPlaceImages = selectedPlace.images?.length
    ? selectedPlace.images
    : [selectedPlace.image, LIVE_CATEGORY_IMAGES[selectedPlace.category]].filter(Boolean)
  const navDistanceKm = getDistanceKm(position, selectedPlace)
  const navBearing = getBearing(position, selectedPlace)
  const recommendedPlaces = useMemo(
    () => [...filteredPlaces].sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, 5),
    [filteredPlaces],
  )
  const smartItinerary = useMemo(
    () => buildDayItinerary(recommendedPlaces.length ? recommendedPlaces : discoveryPlaces, itineraryMode),
    [discoveryPlaces, itineraryMode, recommendedPlaces],
  )
  const plannerPlan = useMemo(
    () =>
      buildTripPlan({
        places: filteredPlaces.length ? filteredPlaces : discoveryPlaces,
        days: plannerDays,
        pace: plannerPace,
        startTime: plannerStartTime,
        budget: plannerBudget,
        interests,
      }),
    [discoveryPlaces, filteredPlaces, interests, plannerBudget, plannerDays, plannerPace, plannerStartTime],
  )
  const plannerTotals = useMemo(
    () =>
      plannerPlan.reduce(
        (totals, day) => ({
          stops: totals.stops + day.stops.length,
          distanceKm: totals.distanceKm + day.distanceKm,
          spend: totals.spend + day.estimatedSpend,
        }),
        { stops: 0, distanceKm: 0, spend: 0 },
      ),
    [plannerPlan],
  )
  const arTargets = useMemo(
    () =>
      discoveryPlaces
        .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
        .map((place, index) => {
          const bearing = getBearing(position, place)
          const relativeBearing = getRelativeBearing(bearing, arHeading)
          const visible = Math.abs(relativeBearing) <= 82 || index < 2
          return {
            place,
            bearing,
            relativeBearing,
            visible,
            left: Math.max(8, Math.min(92, 50 + (relativeBearing / 82) * 42)),
            top: Math.max(18, Math.min(72, 22 + index * 9 + Math.min(place.distanceKm, 6) * 2)),
          }
        })
        .sort((a, b) => Math.abs(a.relativeBearing) - Math.abs(b.relativeBearing) || a.place.distanceKm - b.place.distanceKm)
        .slice(0, 8),
    [arHeading, discoveryPlaces, position],
  )
  const visibleArTargets = arTargets.filter((target) => target.visible).slice(0, 5)
  const arNavigation = useMemo(() => {
    if (!arNavigationActive || !arDestination) {
      return {
        active: false,
        arrowBearing: getBearing(position, arDestination || selectedPlace),
        relativeBearing: getRelativeBearing(getBearing(position, arDestination || selectedPlace), arHeading),
        nextPoint: arDestination || selectedPlace,
        remainingKm: arDestination ? getDistanceKm(position, arDestination) : 0,
        nearestIndex: 0,
      }
    }

    const points = arRoute?.points?.length ? arRoute.points : [position, arDestination]
    const nearestIndex = getNearestRouteIndex(position, points)
    const nextIndex = Math.min(points.length - 1, nearestIndex + 4)
    const nextPoint = points
      .slice(nearestIndex + 1)
      .find((point) => getDistanceKm(position, point) > 0.015) || points[nextIndex] || arDestination
    const arrowBearing = getBearing(position, nextPoint)
    const remainingKm = arRoute?.points?.length
      ? getDistanceKm(position, nextPoint) + getRouteDistanceKm(points, nextIndex)
      : getDistanceKm(position, arDestination)

    return {
      active: true,
      arrowBearing,
      relativeBearing: getRelativeBearing(arrowBearing, arHeading),
      nextPoint,
      remainingKm,
      nearestIndex,
    }
  }, [arDestination, arHeading, arNavigationActive, arRoute, position, selectedPlace])

  const updateLivePlaceDetails = useCallback(async (place) => {
    if (!place?.googlePlaceName || !GOOGLE_MAPS_API_KEY) return
    const details = await fetchPlaceDetailsFromGooglePlaces(place.googlePlaceName)
    if (!details) return
    setLivePlaces((current) =>
      current.map((item) => {
        if (item.id !== place.id) return item
        return {
          ...item,
          details: details.editorialSummary?.text || item.details,
          short: details.editorialSummary?.text || item.short,
          openingHours: details.regularOpeningHours?.weekdayDescriptions?.[0] || item.openingHours,
          rating: details.rating || item.rating,
          tags: [
            'Google Places',
            details.primaryTypeDisplayName?.text || item.tags?.[1] || 'Place',
          ],
        }
      }),
    )
  }, [])

  const speakPlace = useCallback((place = selectedPlace) => {
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance || !place) {
      setVoiceState('unsupported')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(place.audio[language] || place.audio['en-IN'])
    utterance.lang = language
    utterance.onstart = () => setVoiceState('speaking')
    utterance.onend = () => setVoiceState('ready')
    utterance.onerror = () => setVoiceState('ready')
    window.speechSynthesis.speak(utterance)
  }, [language, selectedPlace])

  useEffect(() => {
    if (!autoAudio || !nearEnough || autoSpokenRef.current.has(selectedPlace.id)) return
    autoSpokenRef.current.add(selectedPlace.id)
    const timer = window.setTimeout(() => speakPlace(selectedPlace), 0)
    return () => window.clearTimeout(timer)
  }, [autoAudio, nearEnough, selectedPlace, speakPlace])

  useEffect(() => {
    if (!navVoiceEnabled) return
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
      return
    }
    if (locationState !== 'live') {
      return
    }

    const now = Date.now()
    const lastSpokenAt = navVoiceLastSpokenAtRef.current
    const lastDistance = navVoiceLastDistanceRef.current
    const movedEnough = lastDistance === null || Math.abs(navDistanceKm - lastDistance) >= 0.12
    const cadenceElapsed = now - lastSpokenAt >= 30000

    if (!movedEnough && !cadenceElapsed) return

    const direction = getDirectionHintFromBearing(navBearing)
    const guidance =
      navDistanceKm <= 0.08
        ? `You are almost at ${selectedPlace.name}. Destination is within ${formatDistance(navDistanceKm)}.`
        : `${selectedPlace.name} is ${formatDistance(navDistanceKm)} away. Continue and ${direction}.`

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(guidance)
    utterance.lang = language
    utterance.onstart = () => setNavVoiceStatus('Speaking navigation update')
    utterance.onend = () => setNavVoiceStatus(`Next update toward ${selectedPlace.name} soon`)
    utterance.onerror = () => setNavVoiceStatus('Navigation voice had a playback issue')
    window.speechSynthesis.speak(utterance)

    navVoiceLastSpokenAtRef.current = now
    navVoiceLastDistanceRef.current = navDistanceKm
  }, [language, locationState, navBearing, navDistanceKm, navVoiceEnabled, selectedPlace.name])

  function toggleSaved(place) {
    setSavedIds((current) =>
      current.includes(place.id) ? current.filter((id) => id !== place.id) : [place.id, ...current],
    )
  }

  function toggleVisited(place) {
    setVisitedIds((current) =>
      current.includes(place.id) ? current.filter((id) => id !== place.id) : [place.id, ...current],
    )
  }

  function addToTrip(place, day) {
    setTripDays((current) => {
      const existing = current[day] || []
      if (existing.includes(place.id)) return current
      return { ...current, [day]: [...existing, place.id] }
    })
  }

  function savePlannerToTrip() {
    setTripDays((current) => {
      const next = { ...current }
      plannerPlan.forEach((day) => {
        const key = `day${day.dayNumber}`
        const existing = next[key] || []
        const ids = day.stops.map((stop) => stop.place.id)
        next[key] = [...new Set([...existing, ...ids])]
      })
      return next
    })
    setPlannerStatus('Planner saved to your trip days')
  }

  function clearPlannerTrip() {
    setTripDays({ day1: [], day2: [], day3: [], day4: [], day5: [] })
    setPlannerStatus('Saved trip days cleared')
  }

  function removeFromTrip(placeId, day) {
    setTripDays((current) => ({
      ...current,
      [day]: current[day].filter((id) => id !== placeId),
    }))
  }

  function moveTripStop(day, index, direction) {
    setTripDays((current) => {
      const stops = [...current[day]]
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= stops.length) return current
      const [item] = stops.splice(index, 1)
      stops.splice(nextIndex, 0, item)
      return { ...current, [day]: stops }
    })
  }

  async function refreshCurrentLocation() {
    setNearbyScanStatus('Refreshing current location')

    if (IS_NATIVE_ANDROID) {
      try {
        const status = await Geolocation.requestPermissions()
        setPermissionStatus((current) => ({ ...current, location: status.location || 'prompt' }))
        const next = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12000,
        })
        setPosition({ lat: next.coords.latitude, lng: next.coords.longitude, label: 'Android GPS' })
        setLocationState('live')
        setNearbyRefreshToken((current) => current + 1)
        setLiveStatus('Android GPS refreshed. Updating dynamic nearby places.')
      } catch {
        setPermissionStatus((current) => ({ ...current, location: 'denied' }))
        setNearbyScanStatus('Location permission is denied. Enable location permission in Android settings.')
      }
      return
    }

    if (!navigator.geolocation) {
      setNearbyScanStatus('This browser does not support GPS. Use demo movement or test on Android.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (next) => {
        setPosition({ lat: next.coords.latitude, lng: next.coords.longitude, label: 'Live GPS' })
        setLocationState('live')
        setNearbyRefreshToken((current) => current + 1)
        setLiveStatus('GPS refreshed. Updating dynamic nearby places.')
      },
      () => {
        setNearbyScanStatus('Location permission is unavailable. The app is showing bundled places by distance.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    )
  }

  function demoMoveLocation() {
    setPosition((current) => ({
      lat: current.lat + 0.004,
      lng: current.lng + 0.003,
      label: 'Demo moving GPS',
    }))
    setLocationState('live')
    setNearbyRefreshToken((current) => current + 1)
    setLiveStatus('Demo movement applied. Dynamic places are recalculating.')
  }

  function stopArCamera() {
    if (arStreamRef.current) {
      arStreamRef.current.getTracks().forEach((track) => track.stop())
      arStreamRef.current = null
    }
    if (arVideoRef.current) {
      arVideoRef.current.srcObject = null
    }
    setArActive(false)
    setArStatus('AR camera stopped')
  }

  async function startArCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setArStatus('Live AR camera needs Android WebView or a modern browser with camera support.')
      return
    }

    try {
      setArStatus('Requesting camera and motion permissions')
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        await DeviceOrientationEvent.requestPermission()
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      arStreamRef.current = stream
      if (arVideoRef.current) {
        arVideoRef.current.srcObject = stream
        await arVideoRef.current.play()
      }
      setPermissionStatus((current) => ({ ...current, camera: 'granted' }))
      setArActive(true)
      setArStatus('AR live. Point your phone around to line up nearby place labels.')
      refreshCurrentLocation()
    } catch {
      setPermissionStatus((current) => ({ ...current, camera: 'denied' }))
      setArActive(false)
      setArStatus('Camera permission was denied or unavailable. Enable camera permission and try again.')
    }
  }

  function submitReview() {
    if (!reviewDraft.text.trim()) return
    setReviews((current) => [
      {
        id: `review-${Date.now()}`,
        placeId: selectedPlace.id,
        placeName: selectedPlace.name,
        rating: reviewDraft.rating,
        text: reviewDraft.text.trim(),
        author: authUser || 'Local traveler',
        createdAt: new Date().toLocaleDateString(),
      },
      ...current,
    ])
    setReviewDraft({ rating: 5, text: '' })
  }

  function askGuide(question = chatInput) {
    const cleanQuestion = question.trim()
    if (!cleanQuestion) return
    const lower = cleanQuestion.toLowerCase()
    let reply = buildStory(selectedPlace)
    if (lower.includes('next') || lower.includes('recommend')) {
      reply = recommendedPlaces[0]
        ? `Visit ${recommendedPlaces[0].name} next. It scores ${recommendedPlaces[0].recommendationScore}% for your interests and is ${recommendedPlaces[0].distanceLabel} away.`
        : 'Start with the closest saved or highly rated place, then keep the next stop flexible.'
    } else if (lower.includes('summary')) {
      reply = buildSmartSummary(selectedPlace)
    } else if (lower.includes('day') || lower.includes('itinerary')) {
      reply = smartItinerary.map((stop) => `${stop.time}: ${stop.place.name}`).join(' | ')
    } else if (lower.includes('scan') || lower.includes('photo')) {
      reply = scanResult || 'Upload or scan a monument photo, and I will match it against the local place catalog.'
    }
    setChatMessages((current) => [
      ...current,
      { role: 'user', text: cleanQuestion },
      { role: 'assistant', text: reply },
    ])
    setChatInput('')
  }

  function runImageScan() {
    const matches = findScanMatches({
      places: discoveryPlaces,
      query: scanQuery,
      fileName: scanFileName,
      selectedPlace,
    })
    const bestMatch = matches[0]?.place
    const message = bestMatch
      ? `Scan result: ${bestMatch.name}. ${buildSmartSummary(bestMatch)}`
      : 'Scan result: no local match yet. Try adding a hint like palace, temple, garden, dosa, or the place name.'
    setScanMatches(matches)
    setScanResult(message)
    setChatMessages((current) => [...current, { role: 'assistant', text: message }])
  }

  function handleScanFile(file) {
    if (!file) return
    setScanStatus('Image loaded from picker')
    setScanFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setScanImage(String(reader.result || ''))
      const nameHint = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
      setScanQuery((current) => current || nameHint)
    }
    reader.readAsDataURL(file)
  }

  async function openAndroidCamera() {
    if (!IS_NATIVE_ANDROID) {
      setScanStatus('Use the photo upload control in browser mode.')
      return
    }

    try {
      setScanStatus('Opening Android camera')
      const permission = await Camera.requestPermissions({ permissions: ['camera'] })
      setPermissionStatus((current) => ({ ...current, camera: permission.camera || 'prompt' }))
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
      })
      if (!photo.dataUrl) {
        setScanStatus('Camera returned no image. Try again or use upload.')
        return
      }
      setScanImage(photo.dataUrl)
      setScanFileName(`android-camera-${Date.now()}.jpg`)
      setScanStatus('Android camera photo ready. Tap scan to get info.')
    } catch {
      setPermissionStatus((current) => ({ ...current, camera: 'denied' }))
      setScanStatus('Android camera permission denied or cancelled. You can still upload an image.')
    }
  }

  async function openAndroidGallery() {
    if (!IS_NATIVE_ANDROID) {
      setScanStatus('Use the photo upload control in browser mode.')
      return
    }

    try {
      setScanStatus('Opening Android gallery')
      const permission = await Camera.requestPermissions({ permissions: ['photos'] })
      setPermissionStatus((current) => ({ ...current, camera: permission.photos || permission.camera || 'prompt' }))
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      })
      if (!photo.dataUrl) {
        setScanStatus('Gallery returned no image. Try again or use camera.')
        return
      }
      setScanImage(photo.dataUrl)
      setScanFileName(`android-gallery-${Date.now()}.jpg`)
      setScanStatus('Android gallery image ready. Tap scan to get info.')
    } catch {
      setScanStatus('Android gallery permission denied or cancelled. You can still use camera.')
    }
  }

  async function startArNavigation(place = arDestination) {
    if (!place) {
      setArRouteStatus('Pick a destination before starting AR navigation.')
      return
    }

    setArDestinationId(place.id)
    setArNavigationActive(true)
    setArRouteStatus(`Loading OpenStreetMap route to ${place.name}`)

    try {
      if (!arActive) {
        await startArCamera()
      }
      await refreshCurrentLocation()
      const route = await fetchOsmRoute(position, place, travelMode)
      setArRoute(route)
      setArRouteStatus(
        `AR navigation ready: ${formatDistance(route.distanceKm)} route, about ${route.durationMin || formatEta(route.distanceKm)}.`,
      )
    } catch {
      setArRoute(null)
      setArRouteStatus(
        `OpenStreetMap route unavailable right now. AR is guiding straight toward ${place.name} until route data loads.`,
      )
    }
  }

  function stopArNavigation() {
    setArNavigationActive(false)
    setArRoute(null)
    setArRouteStatus('AR navigation stopped. Nearby AR labels are still available.')
  }

  function submitPost() {
    if (!postDraft.trim()) return
    setPosts((current) => [
      {
        id: `post-${Date.now()}`,
        author: authUser || 'Local traveler',
        placeName: selectedPlace.name,
        text: postDraft.trim(),
        image: selectedPlace.image,
        createdAt: new Date().toLocaleDateString(),
      },
      ...current,
    ])
    setPostDraft('')
  }

  async function shareItinerary() {
    const text =
      screen === 'planner'
        ? plannerPlan
            .map((day) =>
              `${day.title}: ${day.stops.map((stop) => `${stop.startsAt} ${stop.place.name}`).join(' -> ')}`,
            )
            .join('\n')
        : smartItinerary.map((stop) => `${stop.time}: ${stop.place.name}`).join(' -> ')
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Smart Tour Guide itinerary', text })
        setShareStatus('Itinerary shared')
      } catch {
        setShareStatus('Share cancelled')
      }
      return
    }

    try {
      await navigator.clipboard?.writeText(text)
      setShareStatus('Itinerary copied to clipboard')
    } catch {
      setShareStatus(text || 'Build an itinerary first')
    }
  }

  function addAdminPlace() {
    if (!adminDraft.name.trim()) return
    const place = {
      id: `admin-${Date.now()}`,
      name: adminDraft.name.trim(),
      category: adminDraft.category,
      city: adminDraft.city.trim() || 'New place',
      lat: Number(adminDraft.lat) || INDIA_DEFAULT.lat,
      lng: Number(adminDraft.lng) || INDIA_DEFAULT.lng,
      rating: 4.2,
      openingHours: 'Check before visiting',
      visitTime: '60 min',
      image: LIVE_CATEGORY_IMAGES[adminDraft.category] || LIVE_CATEGORY_IMAGES.historical,
      short: adminDraft.short.trim() || 'Admin-added tourist place ready for review.',
      details: adminDraft.short.trim() || 'Admin-added tourist place ready for review.',
      audio: {
        'en-IN': `${adminDraft.name} was added by the local admin. Confirm details before visiting.`,
        'hi-IN': `${adminDraft.name} local admin ne add kiya hai. Jaane se pehle details confirm karein.`,
        'kn-IN': `${adminDraft.name} local admin inda add agide. Hoguva munna details confirm madi.`,
      },
      tags: ['Admin added', CATEGORIES.find((item) => item.id === adminDraft.category)?.label || 'Place'],
      source: 'admin',
    }
    setAdminPlaces((current) => [place, ...current])
    setSelectedId(place.id)
    setAdminDraft({ name: '', category: 'historical', city: 'Bengaluru', lat: '12.9716', lng: '77.5946', short: '' })
  }

  async function downloadPack(pack) {
    setDownloadState(`Saving ${pack.label}`)
    const matchingPlaces =
      pack.id === 'bengaluru'
        ? PLACES.filter((place) => place.city === 'Bengaluru')
        : PLACES.filter((place) => place.city === 'Mysuru')
    const payload = {
      id: pack.id,
      label: pack.label,
      savedAt: new Date().toISOString(),
      places: matchingPlaces.length || pack.places,
      includes: ['places', 'compressed images', 'audio scripts', 'trip routes'],
    }

    if ('caches' in window) {
      try {
        const cache = await caches.open(`smart-tour-${pack.id}`)
        await Promise.allSettled(
          matchingPlaces.map(async (place) => {
            const response = await fetch(place.image, { mode: 'no-cors' })
            await cache.put(place.image, response)
          }),
        )
      } catch {
        // The local metadata pack still keeps the route useful offline.
      }
    }

    setOfflinePacks((current) => ({ ...current, [pack.id]: payload }))
    setDownloadState('idle')
  }

  const selectPlace = useCallback(
    (place, nextScreen = screen) => {
      setDetailImageIndex(0)
      setSelectedId(place.id)
      setScreen(nextScreen)
      if (place.googlePlaceName) {
        updateLivePlaceDetails(place).catch(() => {})
      }
    },
    [screen, updateLivePlaceDetails],
  )

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || !window.google?.maps || !selectedPlace) return

    const shouldCenterOnGps = locationState === 'live'
    const centerTarget = shouldCenterOnGps
      ? { lat: selectedPlace.lat, lng: selectedPlace.lng }
      : { lat: position.lat, lng: position.lng }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: centerTarget,
        zoom: shouldCenterOnGps ? 13 : 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
    } else {
      mapInstanceRef.current.panTo(centerTarget)
      mapInstanceRef.current.setZoom(shouldCenterOnGps ? 13 : 5)
    }

    const activeIds = new Set(filteredPlaces.slice(0, 20).map((place) => place.id))

    filteredPlaces.slice(0, 20).forEach((place) => {
      const existing = markerRef.current.get(place.id)
      if (!existing) {
        const marker = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          position: { lat: place.lat, lng: place.lng },
          title: place.name,
        })
        marker.addListener('click', () => selectPlace(place, 'map'))
        markerRef.current.set(place.id, marker)
      } else {
        existing.setPosition({ lat: place.lat, lng: place.lng })
        existing.setTitle(place.name)
      }
    })

    markerRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.setMap(null)
        markerRef.current.delete(id)
      }
    })

    markerRef.current.forEach((marker, id) => {
      marker.setIcon(
        id === selectedPlace.id
          ? {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#1d6f6c',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          : null,
      )
    })
  }, [filteredPlaces, locationState, mapReady, position, selectedPlace, selectPlace])

  function renderPlaceCard(place, compact = false) {
    const isSaved = savedIds.includes(place.id)
    return (
      <article className={`place-card ${selectedPlace.id === place.id ? 'is-selected' : ''}`} key={place.id}>
        <button className="place-card-main" type="button" onClick={() => selectPlace(place, 'detail')}>
          <AppImage place={place} className="place-card-image" />
          <span className="category-pill">{CATEGORIES.find((item) => item.id === place.category)?.label}</span>
          <h3>{place.name}</h3>
          <p>{compact ? place.short : place.details}</p>
          <div className="place-card-meta">
            <span>{place.distanceLabel}</span>
            <span>{place.eta}</span>
            <span>{place.rating.toFixed(1)} rating</span>
          </div>
        </button>
        <div className="place-card-actions">
          <button type="button" onClick={() => toggleSaved(place)}>
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button type="button" onClick={() => addToTrip(place, 'day1')}>
            Day 1
          </button>
          <button type="button" onClick={() => speakPlace(place)}>
            Listen
          </button>
        </div>
      </article>
    )
  }

  function renderTripDay(dayKey, title) {
    const stops = tripDays[dayKey]
      .map((id) => discoveryPlaces.find((place) => place.id === id))
      .filter(Boolean)

    return (
      <section className="app-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{title}</span>
            <h2>{stops.length ? `${stops.length} planned stops` : 'Build this day'}</h2>
          </div>
        </div>
        <div className="trip-stop-list">
          {stops.length ? (
            stops.map((place, index) => (
              <article className="trip-stop" key={`${dayKey}-${place.id}`}>
                <span className="stop-number">{index + 1}</span>
                <div>
                  <h3>{place.name}</h3>
                  <p>
                    {place.visitTime} - {place.distanceLabel} from you
                  </p>
                </div>
                <div className="trip-controls">
                  <button type="button" onClick={() => moveTripStop(dayKey, index, -1)}>
                    Up
                  </button>
                  <button type="button" onClick={() => moveTripStop(dayKey, index, 1)}>
                    Down
                  </button>
                  <button type="button" onClick={() => removeFromTrip(place.id, dayKey)}>
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">Add places from Home or Details to start this route.</div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className={`tour-app accessibility-${accessibilityMode.toLowerCase().replace(/\s+/g, '-')}`}>
      <header className="top-bar">
        <div>
          <span className="eyebrow">Personal guide in your pocket</span>
          <h1>Smart Tour Guide</h1>
        </div>
        <div className="top-status">
          <span>{locationState === 'live' ? 'GPS live' : INDIA_DEFAULT.label}</span>
          <span>{online ? 'Online' : 'Offline'}</span>
          <span>{offlineOnly ? 'Offline-only' : 'Live discovery'}</span>
          <span>{GOOGLE_MAPS_API_KEY ? 'Optional Google APIs on' : 'Free stack'}</span>
          <span>{liveStatus}</span>
        </div>
      </header>

      <nav className="screen-tabs" aria-label="App sections">
        {SCREENS.map((item) => (
          <button
            className={screen === item.id ? 'active' : ''}
            key={item.id}
            type="button"
            onClick={() => setScreen(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main>
        {screen === 'home' && (
          <div className="screen-grid">
            <section className="search-panel">
              <label>
                <span>Search by place, category, or mood</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try palace, dosa, temple, garden"
                />
              </label>
              <div className="category-row">
                {CATEGORIES.map((item) => (
                  <button
                    className={category === item.id ? 'active' : ''}
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="radius-row">
                {[5, 10, 20, 150].map((radius) => (
                  <button
                    className={radiusKm === radius ? 'active' : ''}
                    key={radius}
                    type="button"
                    onClick={() => setRadiusKm(radius)}
                  >
                    {radius} km
                  </button>
                ))}
              </div>
              <div className="filter-grid">
                <label>
                  <span>Minimum rating</span>
                  <select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))}>
                    {[0, 4, 4.3, 4.5].map((rating) => (
                      <option value={rating} key={rating}>
                        {rating ? `${rating}+` : 'Any rating'}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Sort by</span>
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                    <option value="distance">Near me</option>
                    <option value="rating">Rating</option>
                    <option value="personal">My interests</option>
                  </select>
                </label>
              </div>
              <div className="nearby-suggestions">
                <span>Near me suggestions</span>
                <div className="nearby-suggestion-list">
                  {nearMeSuggestions.length ? (
                    nearMeSuggestions.map((place) => (
                      <button key={place.id} type="button" onClick={() => selectPlace(place, 'detail')}>
                        {place.name}
                      </button>
                    ))
                  ) : (
                    <p className="small-note">No nearby suggestions yet. Try increasing radius.</p>
                  )}
                </div>
              </div>
              <div className="live-nearby-panel">
                <div>
                  <span className="eyebrow">Dynamic nearby</span>
                  <strong>{livePlaces.length ? `${livePlaces.length} live places loaded` : 'Bundled places active'}</strong>
                  <p>{nearbyScanStatus}</p>
                </div>
                <div className="profile-stats">
                  <span>{position.label}</span>
                  <span>
                    {Number(position.lat).toFixed(4)}, {Number(position.lng).toFixed(4)}
                  </span>
                  <span>{autoRefreshNearby ? 'Auto refresh on' : 'Auto refresh paused'}</span>
                </div>
                <div className="inline-actions">
                  <button type="button" onClick={refreshCurrentLocation}>
                    Refresh near me
                  </button>
                  <button type="button" onClick={() => setAutoRefreshNearby((current) => !current)}>
                    {autoRefreshNearby ? 'Pause auto refresh' : 'Resume auto refresh'}
                  </button>
                  <button type="button" onClick={demoMoveLocation}>
                    Demo move
                  </button>
                </div>
              </div>
              <p className="small-note">{liveStatus}</p>
            </section>

            <section className="map-stage">
              <div className="map-copy">
                <span className="eyebrow">Nearby now</span>
                <h2>{selectedPlace.name}</h2>
                <p>{selectedPlace.short}</p>
                <div className="inline-actions">
                  <button type="button" onClick={() => setScreen('map')}>
                    Open Map
                  </button>
                  <button type="button" onClick={() => setScreen('detail')}>
                    Place Details
                  </button>
                  <a href={getRouteUrl(selectedPlace, travelMode, position)} target="_blank" rel="noreferrer">
                    Navigate
                  </a>
                </div>
              </div>
              <div className="mini-map" aria-label="Nearby place map preview">
                <span className="user-dot">You</span>
                {discoveryPlaces.slice(0, 8).map((place) => (
                  <button
                    className={`map-pin ${place.id === selectedPlace.id ? 'active' : ''}`}
                    key={place.id}
                    style={getPinPosition(place)}
                    type="button"
                    onClick={() => selectPlace(place, 'map')}
                    title={place.name}
                  >
                    {place.name.slice(0, 1)}
                  </button>
                ))}
              </div>
            </section>

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Smart recommendations</span>
                  <h2>{filteredPlaces.length} suggestions around you</h2>
                </div>
                <button type="button" onClick={() => setScreen('guide')}>
                  Build itinerary
                </button>
              </div>
              <div className="place-grid">{filteredPlaces.map((place) => renderPlaceCard(place, true))}</div>
            </section>

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Popular places</span>
                  <h2>Strong first picks for a short trip</h2>
                </div>
              </div>
              <div className="place-grid">{popularPlaces.map((place) => renderPlaceCard(place, true))}</div>
            </section>
          </div>
        )}

        {screen === 'map' && (
          <div className="detail-layout map-layout">
            <section className="live-map">
              {GOOGLE_MAPS_API_KEY ? (
                <div className="google-map-canvas" ref={mapContainerRef} role="application" aria-label="Interactive map" />
              ) : (
                <iframe
                  title={`Free OpenStreetMap preview for ${selectedPlace.name}`}
                  src={getOsmEmbedUrl(selectedPlace)}
                  loading="lazy"
                />
              )}
              {mapError ? <p className="map-overlay-note">{mapError}</p> : null}
            </section>

            <aside className="detail-panel map-sidebar">
              <div>
                <span className="eyebrow">Map markers</span>
                <h2>Tap a place preview</h2>
              </div>
              <div className="marker-list">
                {filteredPlaces.slice(0, 14).map((place) => (
                  <button
                    className={selectedPlace.id === place.id ? 'active' : ''}
                    key={place.id}
                    type="button"
                    onClick={() => selectPlace(place, 'map')}
                  >
                    <span>{place.name}</span>
                    <small>
                      {place.distanceLabel} - {place.eta}
                    </small>
                  </button>
                ))}
              </div>
              <div className="map-preview-card">
                <AppImage place={selectedPlace} className="detail-image" />
                <h3>{selectedPlace.name}</h3>
                <p>{selectedPlace.short}</p>
                <div className="inline-actions">
                  <button type="button" onClick={() => setScreen('detail')}>
                    Open Details
                  </button>
                  <a href={getRouteUrl(selectedPlace, travelMode, position)} target="_blank" rel="noreferrer">
                    Navigate
                  </a>
                </div>
              </div>
            </aside>
          </div>
        )}

        {screen === 'detail' && (
          <div className="detail-layout">
            <section className="live-map">
              {GOOGLE_MAPS_API_KEY ? (
                <div className="google-map-canvas" ref={mapContainerRef} role="application" aria-label="Interactive map" />
              ) : (
                <iframe
                  title={`Free OpenStreetMap preview for ${selectedPlace.name}`}
                  src={getOsmEmbedUrl(selectedPlace)}
                  loading="lazy"
                />
              )}
              {mapError ? <p className="map-overlay-note">{mapError}</p> : null}
            </section>

            <aside className="detail-panel">
              <div className="detail-carousel">
                <img
                  className="detail-image"
                  src={selectedPlaceImages[detailImageIndex] || selectedPlace.image}
                  alt={selectedPlace.name}
                />
                {selectedPlaceImages.length > 1 ? (
                  <div className="carousel-controls">
                    <button
                      type="button"
                      onClick={() =>
                        setDetailImageIndex((current) =>
                          current === 0 ? selectedPlaceImages.length - 1 : current - 1,
                        )
                      }
                    >
                      Prev
                    </button>
                    <span>
                      {detailImageIndex + 1} / {selectedPlaceImages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailImageIndex((current) =>
                          current === selectedPlaceImages.length - 1 ? 0 : current + 1,
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
              <span className="eyebrow">{selectedPlace.city}</span>
              <h2>{selectedPlace.name}</h2>
              <p>{selectedPlace.details}</p>
              <div className="detail-facts">
                <span>{selectedPlace.openingHours}</span>
                <span>{selectedPlace.rating.toFixed(1)} rating</span>
                <span>{selectedPlace.distanceLabel}</span>
                <span>{selectedPlace.eta}</span>
                <span>{selectedPlace.entryFee}</span>
                <span>{selectedPlace.recommendationScore}% match</span>
                <span>{selectedPlace.source === 'live' ? 'Live map place' : 'Curated place'}</span>
              </div>
              <div className="tag-row">
                {selectedPlace.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="language-row">
                {LANGUAGES.map((item) => (
                  <button
                    className={language === item.id ? 'active' : ''}
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="audio-script">{currentNarration}</p>
              <div className="inline-actions stackable">
                <button type="button" onClick={() => speakPlace(selectedPlace)}>
                  {voiceState === 'speaking' ? 'Playing' : 'Listen Guide'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navVoiceEnabled) {
                      window.speechSynthesis?.cancel?.()
                      setNavVoiceEnabled(false)
                      setNavVoiceStatus('Navigation voice is off')
                      return
                    }
                    navVoiceLastSpokenAtRef.current = 0
                    navVoiceLastDistanceRef.current = null
                    setNavVoiceEnabled(true)
                    setNavVoiceStatus(`Navigation voice started to ${selectedPlace.name}`)
                  }}
                >
                  {navVoiceEnabled ? 'Stop Voice Navigation' : 'Start Voice Navigation'}
                </button>
                <a href={getRouteUrl(selectedPlace, travelMode, position)} target="_blank" rel="noreferrer">
                  Navigate
                </a>
                <a href={getSearchUrl(selectedPlace)} target="_blank" rel="noreferrer">
                  Route Preview
                </a>
                <button type="button" onClick={() => toggleSaved(selectedPlace)}>
                  {savedIds.includes(selectedPlace.id) ? 'Remove Save' : 'Save'}
                </button>
                <button type="button" onClick={() => toggleVisited(selectedPlace)}>
                  {visitedIds.includes(selectedPlace.id) ? 'Visited' : 'Mark visited'}
                </button>
              </div>
              <p className="small-note">{navVoiceStatus}</p>
              <div className="travel-mode">
                {['walking', 'driving', 'transit'].map((mode) => (
                  <button
                    className={travelMode === mode ? 'active' : ''}
                    key={mode}
                    type="button"
                    onClick={() => setTravelMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="inline-actions">
                <button type="button" onClick={() => setScreen('map')}>
                  Back to Map
                </button>
                <button type="button" onClick={() => addToTrip(selectedPlace, 'day1')}>
                  Add to Day 1
                </button>
                <button type="button" onClick={() => addToTrip(selectedPlace, 'day2')}>
                  Add to Day 2
                </button>
              </div>
              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={autoAudio}
                  onChange={(event) => setAutoAudio(event.target.checked)}
                />
                Auto-play guide when within 350 m
              </label>
              <section className="review-panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Ratings and reviews</span>
                    <h3>{selectedReviews.length ? `${selectedReviews.length} traveler notes` : 'Add the first local review'}</h3>
                  </div>
                </div>
                <div className="rating-row">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      className={reviewDraft.rating === rating ? 'active' : ''}
                      key={rating}
                      type="button"
                      onClick={() => setReviewDraft((current) => ({ ...current, rating }))}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewDraft.text}
                  onChange={(event) => setReviewDraft((current) => ({ ...current, text: event.target.value }))}
                  placeholder="Share a useful tip, crowd note, or photo spot"
                  rows="3"
                />
                <button type="button" onClick={submitReview}>
                  Post review
                </button>
                <div className="review-list">
                  {selectedReviews.slice(0, 4).map((review) => (
                    <article className="review-card" key={review.id}>
                      <strong>{review.rating}/5 - {review.author}</strong>
                      <p>{review.text}</p>
                      <span>{review.createdAt}</span>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}

        {screen === 'guide' && (
          <div className="screen-grid">
            <section className="app-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Smart tour guide</span>
                  <h2>Story, voice, next stop, and scan answers</h2>
                </div>
              </div>
              <p>{buildStory(selectedPlace)}</p>
              <p className="audio-script">{buildSmartSummary(selectedPlace)}</p>
              <div className="inline-actions">
                <button type="button" onClick={() => speakPlace(selectedPlace)}>
                  Tell me about this place
                </button>
                <button type="button" onClick={() => askGuide('What should I visit next?')}>
                  What next?
                </button>
              </div>
            </section>

            <section className="app-section scanner-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Google-style scan</span>
                  <h2>Scan a photo and get instant place info</h2>
                </div>
              </div>
              <label className="scan-upload">
                <span>Take photo or upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => handleScanFile(event.target.files?.[0])}
                />
              </label>
              <div className="inline-actions">
                <button type="button" onClick={openAndroidCamera}>
                  Open Android Camera
                </button>
                <button type="button" onClick={openAndroidGallery}>
                  Pick Android Photo
                </button>
              </div>
              <div className="profile-stats">
                <span>Camera: {permissionStatus.camera}</span>
                <span>Location: {permissionStatus.location}</span>
                <span>{scanStatus}</span>
              </div>
              {scanImage ? (
                <img className="scan-preview" src={scanImage} alt="Scanned preview" />
              ) : (
                <div className="empty-state">
                  Use your camera or upload a photo. Add a short hint if the object is not one of the bundled places.
                </div>
              )}
              <label>
                <span>Optional hint</span>
                <input
                  value={scanQuery}
                  onChange={(event) => setScanQuery(event.target.value)}
                  placeholder="Example: palace, temple, Lalbagh, dosa, statue"
                />
              </label>
              <div className="inline-actions">
                <button type="button" onClick={runImageScan}>
                  Scan and get info
                </button>
                <a href={getGoogleSearchUrl(scanQuery || selectedPlace.name)} target="_blank" rel="noreferrer">
                  Search Google
                </a>
                <a href={getGoogleLensUploadUrl()} target="_blank" rel="noreferrer">
                  Open Google Lens
                </a>
              </div>
              <p className="small-note">
                Local scan works without cost. Google Lens opens separately so you choose whether to upload an image to Google.
              </p>
              {scanResult ? <div className="empty-state">{scanResult}</div> : null}
              {scanMatches.length ? (
                <div className="scan-results">
                  {scanMatches.map(({ place, score }) => (
                    <article className="review-card" key={place.id}>
                      <strong>{place.name} - {Math.min(99, score)}% match</strong>
                      <p>{buildSmartSummary(place)}</p>
                      <div className="inline-actions">
                        <button type="button" onClick={() => selectPlace(place, 'detail')}>
                          Open details
                        </button>
                        <a href={getGoogleSearchUrl(`${place.name} ${place.city} information`)} target="_blank" rel="noreferrer">
                          More info
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="app-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">1-day route</span>
                  <h2>Optimized from distance, rating, and interests</h2>
                </div>
              </div>
              <div className="travel-mode">
                {['relaxed', 'balanced', 'deep'].map((mode) => (
                  <button
                    className={itineraryMode === mode ? 'active' : ''}
                    key={mode}
                    type="button"
                    onClick={() => setItineraryMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="trip-stop-list">
                {smartItinerary.map((stop, index) => (
                  <article className="trip-stop" key={`${stop.place.id}-${stop.time}`}>
                    <span className="stop-number">{index + 1}</span>
                    <div>
                      <h3>{stop.time} - {stop.place.name}</h3>
                      <p>{stop.note} {stop.place.distanceLabel} away.</p>
                    </div>
                    <button type="button" onClick={() => addToTrip(stop.place, 'day1')}>
                      Add
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Chatbot guide</span>
                  <h2>Ask anything about this stop or your route</h2>
                </div>
              </div>
              <div className="chat-list">
                {chatMessages.slice(-6).map((message, index) => (
                  <article className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                    <strong>{message.role === 'assistant' ? 'Guide' : 'You'}</strong>
                    <p>{message.text}</p>
                  </article>
                ))}
              </div>
              <div className="chat-input-row">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') askGuide()
                  }}
                  placeholder="Ask: Tell me about this place, summarize it, or plan my day"
                />
                <button type="button" onClick={() => askGuide()}>
                  Ask
                </button>
              </div>
            </section>
          </div>
        )}

        {screen === 'ar' && (
          <div className="screen-grid ar-screen">
            <section className="app-section ar-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Minimum AR view</span>
                  <h2>Camera guide</h2>
                </div>
                <span className="category-pill">{arNavigationActive ? 'AR navigation' : arActive ? 'AR live' : 'Ready'}</span>
              </div>
              <div className="ar-route-controls">
                <label>
                  <span>Navigate to</span>
                  <select
                    value={arDestination?.id || ''}
                    onChange={(event) => {
                      setArDestinationId(event.target.value)
                      setArNavigationActive(false)
                      setArRoute(null)
                      setArRouteStatus('Destination changed. Start AR navigation to load a route.')
                    }}
                  >
                    {discoveryPlaces.slice(0, 30).map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.name} - {place.distanceLabel}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="inline-actions">
                  <button type="button" onClick={() => startArNavigation(arDestination)}>
                    Start AR Navigation
                  </button>
                  <button type="button" onClick={stopArNavigation}>
                    Stop Navigation
                  </button>
                  <a href={getRouteUrl(arDestination || selectedPlace, travelMode, position)} target="_blank" rel="noreferrer">
                    OpenStreetMap Route
                  </a>
                </div>
              </div>
              <div className="ar-viewer">
                <video ref={arVideoRef} className="ar-video" playsInline muted aria-label="AR camera preview" />
                {!arActive && (
                  <div className="ar-placeholder">
                    <span>AR</span>
                    <strong>Start camera to overlay nearby places</strong>
                    <p>Uses your Android camera, GPS location, and compass heading. No paid AR service needed.</p>
                  </div>
                )}
                <div className="ar-reticle" aria-hidden="true" />
                {arNavigationActive && (
                  <div className="ar-nav-layer">
                    <div
                      className="ar-direction-arrow"
                      style={{ transform: `translate(-50%, -50%) rotate(${arNavigation.relativeBearing}deg)` }}
                      aria-hidden="true"
                    >
                      <span />
                    </div>
                    <div className="ar-nav-card">
                      <span className="eyebrow">AR navigation</span>
                      <strong>{arDestination?.name || selectedPlace.name}</strong>
                      <p>
                        {Math.abs(arNavigation.relativeBearing) < 12
                          ? 'Go straight'
                          : arNavigation.relativeBearing > 0
                            ? 'Turn right'
                            : 'Turn left'}{' '}
                        - {formatDistance(arNavigation.remainingKm)} remaining
                      </p>
                    </div>
                  </div>
                )}
                {visibleArTargets.map((target) => (
                  <button
                    className="ar-label"
                    key={target.place.id}
                    style={{ left: `${target.left}%`, top: `${target.top}%` }}
                    type="button"
                    onClick={() => selectPlace(target.place, 'detail')}
                  >
                    <strong>{target.place.name}</strong>
                    <span>
                      {target.place.distanceLabel} - {getDirectionHintFromBearing(target.bearing)}
                    </span>
                  </button>
                ))}
                <div className="ar-hud">
                  <span>Heading {Math.round(arHeading)} deg</span>
                  <span>{visibleArTargets.length} labels</span>
                  <span>{arNavigationActive ? `${Math.round(arNavigation.relativeBearing)} deg to route` : 'Labels mode'}</span>
                  <span>{position.label}</span>
                </div>
              </div>
              <div className="inline-actions">
                <button type="button" onClick={arActive ? stopArCamera : startArCamera}>
                  {arActive ? 'Stop AR Camera' : 'Start AR Camera'}
                </button>
                <button type="button" onClick={refreshCurrentLocation}>
                  Refresh GPS
                </button>
                <button type="button" onClick={demoMoveLocation}>
                  Demo move
                </button>
              </div>
              <p className="small-note">{arStatus}</p>
              <p className="small-note">{arRouteStatus}</p>
            </section>

            <section className="app-section map-sidebar">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">AR targets</span>
                  <h2>Nearby overlays</h2>
                </div>
              </div>
              <div className="marker-list">
                {arTargets.map((target) => (
                  <button key={target.place.id} type="button" onClick={() => selectPlace(target.place, 'detail')}>
                    <strong>{target.place.name}</strong>
                    <small>
                      {target.place.distanceLabel} - bearing {Math.round(target.bearing)} deg -{' '}
                      {Math.round(target.relativeBearing)} deg from view
                    </small>
                  </button>
                ))}
              </div>
              <div className="inline-actions">
                <button type="button" onClick={() => startArNavigation(selectedPlace)}>
                  Navigate selected place
                </button>
              </div>
              <div className="live-nearby-panel">
                <strong>Dynamic places feed</strong>
                <p>{nearbyScanStatus}</p>
                <div className="profile-stats">
                  <span>Camera: {permissionStatus.camera}</span>
                  <span>Location: {permissionStatus.location}</span>
                  <span>{autoRefreshNearby ? 'Auto refresh on' : 'Auto refresh paused'}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {screen === 'saved' && (
          <div className="screen-grid">
            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Saved places</span>
                  <h2>{savedPlaces.length ? `${savedPlaces.length} bookmarks` : 'No bookmarks yet'}</h2>
                </div>
              </div>
              <div className="place-grid">
                {savedPlaces.length ? (
                  savedPlaces.map((place) => renderPlaceCard(place, true))
                ) : (
                  <div className="empty-state">Save places from Home or Details to keep them ready offline.</div>
                )}
              </div>
            </section>

            {renderTripDay('day1', 'Day 1')}
            {renderTripDay('day2', 'Day 2')}

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Trip actions</span>
                  <h2>{tripStats} stops ready</h2>
                </div>
              </div>
              <div className="inline-actions">
                <button type="button" onClick={() => downloadPack(CITY_PACKS[0])}>
                  Download Bengaluru data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTripDays({ day1: [], day2: [] })
                  }}
                >
                  Clear trip
                </button>
              </div>
            </section>
          </div>
        )}

        {screen === 'planner' && (
          <div className="screen-grid">
            <section className="app-section trip-planner-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Trip planner</span>
                  <h2>Build a day-by-day travel plan near your location</h2>
                </div>
              </div>
              <div className="planner-controls">
                <label>
                  <span>Trip days</span>
                  <select value={plannerDays} onChange={(event) => setPlannerDays(Number(event.target.value))}>
                    {[1, 2, 3, 4, 5].map((day) => (
                      <option key={day} value={day}>
                        {day} {day === 1 ? 'day' : 'days'}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Start time</span>
                  <input
                    type="time"
                    value={plannerStartTime}
                    onChange={(event) => setPlannerStartTime(event.target.value)}
                  />
                </label>
                <label>
                  <span>Pace</span>
                  <select value={plannerPace} onChange={(event) => setPlannerPace(event.target.value)}>
                    <option value="relaxed">Relaxed</option>
                    <option value="balanced">Balanced</option>
                    <option value="fast">Fast</option>
                  </select>
                </label>
                <label>
                  <span>Budget style</span>
                  <select value={plannerBudget} onChange={(event) => setPlannerBudget(event.target.value)}>
                    <option value="budget">Budget</option>
                    <option value="comfort">Comfort</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>
              </div>
              <div className="profile-stats">
                <span>{plannerTotals.stops} stops</span>
                <span>{plannerTotals.distanceKm.toFixed(1)} km weighted distance</span>
                <span>Approx INR {plannerTotals.spend}</span>
                <span>{plannerPace} pace</span>
              </div>
              <div className="inline-actions">
                <button type="button" onClick={savePlannerToTrip}>
                  Save plan
                </button>
                <button type="button" onClick={shareItinerary}>
                  Share plan
                </button>
                <button type="button" onClick={clearPlannerTrip}>
                  Clear saved trip
                </button>
              </div>
              <p className="small-note">{plannerStatus}. Plan is generated from nearby places, ratings, interests, and distance.</p>
            </section>

            <section className="app-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Planner inputs</span>
                  <h2>Personalize recommendations</h2>
                </div>
              </div>
              <div className="tag-row">
                {INTERESTS.map((interest) => (
                  <button
                    className={interests.includes(interest) ? 'active' : ''}
                    key={interest}
                    type="button"
                    onClick={() =>
                      setInterests((current) =>
                        current.includes(interest)
                          ? current.filter((item) => item !== interest)
                          : [...current, interest],
                      )
                    }
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <div className="live-nearby-panel">
                <strong>{position.label}</strong>
                <p>{nearbyScanStatus}</p>
                <div className="inline-actions">
                  <button type="button" onClick={refreshCurrentLocation}>
                    Refresh location
                  </button>
                  <button type="button" onClick={demoMoveLocation}>
                    Demo move
                  </button>
                </div>
              </div>
            </section>

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Generated route</span>
                  <h2>{plannerDays}-day plan</h2>
                </div>
              </div>
              <div className="planner-day-grid">
                {plannerPlan.map((day) => (
                  <article className="planner-day-card" key={day.dayNumber}>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">Day {day.dayNumber}</span>
                        <h3>{day.title}</h3>
                      </div>
                      <span className="category-pill">INR {day.estimatedSpend}</span>
                    </div>
                    <div className="profile-stats">
                      <span>{day.stops.length} stops</span>
                      <span>{day.distanceKm.toFixed(1)} km weighted</span>
                    </div>
                    <div className="planner-stop-list">
                      {day.stops.map((stop, index) => (
                        <article className="planner-stop" key={`${day.dayNumber}-${stop.place.id}`}>
                          <span className="stop-number">{index + 1}</span>
                          <div>
                            <strong>
                              {stop.startsAt}-{stop.endsAt} · {stop.place.name}
                            </strong>
                            <p>{stop.note} {stop.place.distanceLabel} away.</p>
                          </div>
                          <div className="inline-actions">
                            <button type="button" onClick={() => selectPlace(stop.place, 'detail')}>
                              Details
                            </button>
                            <a href={getRouteUrl(stop.place, travelMode, position)} target="_blank" rel="noreferrer">
                              Navigate
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {screen === 'community' && (
          <div className="screen-grid">
            <section className="app-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Social feed</span>
                  <h2>Share a travel post with the community</h2>
                </div>
              </div>
              <AppImage place={selectedPlace} className="detail-image" />
              <textarea
                value={postDraft}
                onChange={(event) => setPostDraft(event.target.value)}
                placeholder={`Post a tip or photo note about ${selectedPlace.name}`}
                rows="4"
              />
              <button type="button" onClick={submitPost}>
                Publish post
              </button>
            </section>

            <section className="app-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Group travel</span>
                  <h2>Friend tracking and shared itinerary</h2>
                </div>
              </div>
              <div className="profile-stats">
                <span>You: {position.label}</span>
                <span>Asha: near {selectedPlace.name}</span>
                <span>Ravi: 900 m behind</span>
              </div>
              <p className="small-note">
                Group mode is wired as a local demo. In production this would sync encrypted live locations through Firestore.
              </p>
              <div className="inline-actions">
                <button type="button" onClick={shareItinerary}>
                  Share itinerary
                </button>
                <button type="button" onClick={() => setScreen('saved')}>
                  Open shared route
                </button>
              </div>
              <p className="small-note">{shareStatus}</p>
            </section>

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Community posts</span>
                  <h2>{posts.length ? `${posts.length} shared updates` : 'No posts yet'}</h2>
                </div>
              </div>
              <div className="place-grid">
                {posts.length ? (
                  posts.map((post) => (
                    <article className="place-card" key={post.id}>
                      <img className="place-card-image" src={post.image} alt={post.placeName} />
                      <h3>{post.placeName}</h3>
                      <p>{post.text}</p>
                      <div className="place-card-meta">
                        <span>{post.author}</span>
                        <span>{post.createdAt}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">Publish the first field note from the selected place.</div>
                )}
              </div>
            </section>
          </div>
        )}

        {screen === 'profile' && (
          <div className="screen-grid">
            <section className="app-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Preferences</span>
                  <h2>Language and guide behavior</h2>
                </div>
              </div>
              <div className="language-row">
                {LANGUAGES.map((item) => (
                  <button
                    className={language === item.id ? 'active' : ''}
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={autoAudio}
                  onChange={(event) => setAutoAudio(event.target.checked)}
                />
                Auto-play nearby audio guides
              </label>
              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={offlineOnly}
                  onChange={(event) => setOfflineOnly(event.target.checked)}
                />
                Offline-only mode (downloaded and bundled data only)
              </label>
              <label>
                <span>Traveler profile</span>
                <input
                  value={authUser}
                  onChange={(event) => setAuthUser(event.target.value)}
                  placeholder="Sign in name or email"
                />
              </label>
              <div className="language-row">
                {ACCESSIBILITY_MODES.map((mode) => (
                  <button
                    className={accessibilityMode === mode ? 'active' : ''}
                    key={mode}
                    type="button"
                    onClick={() => setAccessibilityMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="tag-row">
                {INTERESTS.map((interest) => (
                  <button
                    className={interests.includes(interest) ? 'active' : ''}
                    key={interest}
                    type="button"
                    onClick={() =>
                      setInterests((current) =>
                        current.includes(interest)
                          ? current.filter((item) => item !== interest)
                          : [...current, interest],
                      )
                    }
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <div className="profile-stats">
                <span>{savedIds.length} saved</span>
                <span>{visitedIds.length} visited</span>
                <span>{reviews.length} reviews</span>
                <span>{tripStats} trip stops</span>
                <span>{Object.keys(offlinePacks).length} city packs</span>
              </div>
            </section>

            <section className="app-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Offline downloads</span>
                  <h2>City data for low-network travel</h2>
                </div>
              </div>
              <div className="download-list">
                {CITY_PACKS.map((pack) => (
                  <article className="download-row" key={pack.id}>
                    <div>
                      <h3>{pack.label}</h3>
                      <p>
                        {pack.places} places - {pack.size} - places, compressed images, audio
                      </p>
                    </div>
                    <button type="button" onClick={() => downloadPack(pack)}>
                      {offlinePacks[pack.id] ? 'Saved' : 'Download'}
                    </button>
                  </article>
                ))}
              </div>
              <p className="small-note">{downloadState === 'idle' ? 'Packs are stored on this device.' : downloadState}</p>
            </section>

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Admin console</span>
                  <h2>Add dynamic tourist places</h2>
                </div>
              </div>
              <div className="admin-grid">
                <input
                  value={adminDraft.name}
                  onChange={(event) => setAdminDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Place name"
                />
                <select
                  value={adminDraft.category}
                  onChange={(event) => setAdminDraft((current) => ({ ...current, category: event.target.value }))}
                >
                  {CATEGORIES.filter((item) => item.id !== 'all').map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <input
                  value={adminDraft.city}
                  onChange={(event) => setAdminDraft((current) => ({ ...current, city: event.target.value }))}
                  placeholder="City"
                />
                <input
                  value={adminDraft.lat}
                  onChange={(event) => setAdminDraft((current) => ({ ...current, lat: event.target.value }))}
                  placeholder="Latitude"
                />
                <input
                  value={adminDraft.lng}
                  onChange={(event) => setAdminDraft((current) => ({ ...current, lng: event.target.value }))}
                  placeholder="Longitude"
                />
                <input
                  value={adminDraft.short}
                  onChange={(event) => setAdminDraft((current) => ({ ...current, short: event.target.value }))}
                  placeholder="Short description"
                />
              </div>
              <button type="button" onClick={addAdminPlace}>
                Add place
              </button>
              <p className="small-note">
                This free local admin flow stores places in this browser. You can replace it with Firestore later only if you want cloud sync.
              </p>
            </section>

            <section className="app-section wide">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Free development stack</span>
                  <h2>No paid services required for development</h2>
                </div>
              </div>
              <div className="api-grid">
                <span>{FREE_STACK_LABEL}</span>
                <span>Maps: OpenStreetMap embed by default, no billing account needed</span>
                <span>Nearby places: free Overpass/OpenStreetMap fallback plus bundled data</span>
                <span>Backend while developing: localStorage for users, reviews, posts, favorites, admin places</span>
                <span>Voice: browser Web Speech API, no Google TTS bill during development</span>
                <span>AI while developing: local mock chatbot and scan flow, optional cloud AI later</span>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
