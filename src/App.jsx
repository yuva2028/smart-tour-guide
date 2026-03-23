import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import MonumentViewer from './MonumentViewer.jsx'

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
const OSM_RADIUS_METERS = 2500
const OPENAI_STORAGE_KEY = 'ar-tour-openai-key'

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

async function fetchNearbyFromOsm(lat, lon) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${OSM_RADIUS_METERS},${lat},${lon})["tourism"~"attraction|museum|viewpoint|artwork"];
      node(around:${OSM_RADIUS_METERS},${lat},${lon})["historic"];
      way(around:${OSM_RADIUS_METERS},${lat},${lon})["tourism"~"attraction|museum|viewpoint|artwork"];
      way(around:${OSM_RADIUS_METERS},${lat},${lon})["historic"];
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
        category:
          item.tags.historic ||
          item.tags.tourism ||
          item.tags.heritage ||
          'landmark',
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
  const [voiceState, setVoiceState] = useState(speechSupported ? 'idle' : 'unsupported')
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

  const effectiveHeading = compassState === 'live' ? heading : manualHeading

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OPENAI_STORAGE_KEY, apiKey)
    }
  }, [apiKey])

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
        const livePlaces = await fetchNearbyFromOsm(position.lat, position.lon)
        const curatedNearby = CURATED_MONUMENTS.filter(
          (place) =>
            getDistanceKm(position.lat, position.lon, place.lat, place.lon) <= 35,
        ).map((place) => ({ ...place, source: 'curated' }))

        const combined = mergeUniquePlaces(
          annotatePlaces([...livePlaces, ...curatedNearby], origin).sort(
            (left, right) => left.distanceKm - right.distanceKm,
          ),
        ).slice(0, 10)

        const fallback = annotatePlaces(CURATED_MONUMENTS, origin)
          .sort((left, right) => left.distanceKm - right.distanceKm)
          .slice(0, 6)

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
          .slice(0, 6)

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
  }, [position])

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

  const targetedPlace = useMemo(() => {
    const candidates = enrichedPlaces
      .filter((place) => Math.abs(place.delta) <= 24)
      .sort((left, right) => {
        if (Math.abs(left.delta) !== Math.abs(right.delta)) {
          return Math.abs(left.delta) - Math.abs(right.delta)
        }
        return left.distanceKm - right.distanceKm
      })

    return candidates[0] ?? null
  }, [enrichedPlaces])

  const selectedPlace = useMemo(() => {
    const aiMatchedPlace =
      recognitionResult?.name &&
      enrichedPlaces.find(
        (place) => normalizePlaceName(place.name) === normalizePlaceName(recognitionResult.name),
      )

    if (autoFollow && targetedPlace) {
      return targetedPlace
    }

    return (
      aiMatchedPlace ??
      enrichedPlaces.find((place) => place.id === selectedPlaceId) ??
      targetedPlace ??
      enrichedPlaces[0] ??
      null
    )
  }, [autoFollow, enrichedPlaces, recognitionResult, selectedPlaceId, targetedPlace])

  const routeUrl = selectedPlace
    ? `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lon}&travelmode=walking`
    : '#'
  const mapEmbedUrl = selectedPlace
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedPlace.lon - 0.02}%2C${selectedPlace.lat - 0.02}%2C${selectedPlace.lon + 0.02}%2C${selectedPlace.lat + 0.02}&layer=mapnik&marker=${selectedPlace.lat}%2C${selectedPlace.lon}`
    : ''
  const narration = selectedPlace
    ? buildVoiceGuide(selectedPlace, locationLabel)
    : 'Point your device toward a marker or select a place to begin narration.'
  const radarPlaces = enrichedPlaces.slice(0, 6)

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
    const utterance = new SpeechSynthesisUtterance(buildVoiceGuide(place, locationLabel))
    utterance.rate = 1
    utterance.pitch = 1.03
    utterance.volume = 1

    const allVoices = window.speechSynthesis.getVoices()
    const preferredVoice =
      allVoices.find((voice) => voice.lang?.toLowerCase().startsWith('en-in')) ||
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
    setAutoFollow(false)
    setSelectedPlaceId(placeId)
  }

  function followTarget() {
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
        const matched = enrichedPlaces.find(
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

  return (
    <div className="app-shell">
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
          <h1>Futuristic AR guide with real AI monument recognition and reconstruction.</h1>
          <p className="hero-text">
            GPS, live nearby landmarks, camera AR overlay, voice guidance, and now
            image-based AI monument recognition plus historical-style monument reconstruction
            from a captured frame.
          </p>
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
            <button className="ghost-button" onClick={followTarget} type="button">
              Auto Track Target
            </button>
            <button className="ghost-button" onClick={stopVoiceGuide} type="button">
              Stop Voice
            </button>
          </div>
          <div className="signal-bar">
            <div>
              <span>Guide mode</span>
              <strong>{autoFollow ? 'Auto target lock' : 'Manual pinned target'}</strong>
            </div>
            <div>
              <span>Voice system</span>
              <strong>
                {voiceState === 'unsupported'
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
        </div>
      </section>

      <main className="content-grid">
        <section className="camera-panel">
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

              <div className="reticle" aria-hidden="true">
                <div className="reticle-core" />
              </div>

              {enrichedPlaces.slice(0, 6).map((place, index) => {
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
          <section className="panel ai-panel">
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

          <section className="panel places-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Nearby Places</p>
                <h2>Live tourist locations ranked by distance and heading match</h2>
              </div>
              <span className="chip">{nearbyPlaces.length} indexed</span>
            </div>

            <div className="places-list">
              {enrichedPlaces.map((place) => (
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
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=walking`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Route
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel narrative-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">AI Voice Guide</p>
                <h2>Real-time spoken summary for the selected monument</h2>
              </div>
              <span className={`chip ${voiceState === 'speaking' ? 'active' : ''}`}>
                {voiceState === 'speaking' ? 'Speaking live' : 'Ready'}
              </span>
            </div>

            <p className="narrative-text">{narration}</p>
            {selectedPlace && <p className="fun-fact">Guide note: {selectedPlace.funFact}</p>}
          </section>

          <section className="panel nav-panel">
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
            </div>

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
              Open Walking Navigation
            </a>
          </section>

          <section className="panel nav-panel">
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

          <section className="panel nav-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">3D Viewer</p>
                <h2>Interactive monument viewer with touch rotation and zoom</h2>
              </div>
            </div>

            <MonumentViewer
              selectedPlace={selectedPlace}
              recognitionResult={recognitionResult}
              reconstructionImage={reconstructionImage}
            />
            <p className="inline-note">
              Drag to rotate, pinch or scroll to zoom. The viewer adapts its 3D monument
              form from the selected or recognized landmark type.
            </p>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
