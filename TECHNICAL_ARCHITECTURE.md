# AR Tour Guide Technical Architecture

## Goal
Deliver a production-ready mobile AR tour guide that supports:

- live GPS attraction discovery
- AR camera guidance and monument targeting
- monument recognition and reconstruction
- AI voice guide and concierge chat
- navigation, itinerary, transport, dining, safety, and sharing
- offline trip packs for field use

## Client Architecture

### Mobile App
- `React + Vite` for UI
- `Capacitor` for Android packaging and access to native plugins
- `Service Worker` for offline shell caching and trip-pack reuse
- `SpeechSynthesis` for browser/native-compatible voice playback
- `MediaDevices.getUserMedia` for camera capture
- `Geolocation` + `DeviceOrientation` for live position and heading

### Required Native Upgrades For Full Production AR
- `ARCore` on Android for plane tracking and world anchors
- `Capacitor Camera` and `Capacitor Geolocation` plugins for stronger native reliability
- compass / motion permission handling via native bridge
- optional `Mapbox`, `Google Maps SDK`, or `MapLibre` for embedded turn-by-turn maps

## Backend Services

### API Gateway
- route authenticated app requests
- enforce rate limits
- issue signed upload URLs and secure AI calls

### Core Services
- `Places Service`
  - attraction ingestion from OpenStreetMap, Google Places, TripAdvisor-like partner APIs, and curated CMS data
  - dedupe and rank tourist places, restaurants, transport, and safety nodes
- `Route Service`
  - walking/driving/transit routes
  - accessibility-aware route variants
  - ETA and rerouting
- `Monument Intelligence Service`
  - image recognition
  - visual matching against curated monument knowledge base
  - reconstruction prompt generation
- `Concierge Service`
  - answer local travel questions with context grounding
  - multilingual responses
- `Crowd & Operations Service`
  - forecast crowds from historical trends, weather, holidays, and ticketing patterns
  - return best visit windows and queue risk
- `Ticketing Service`
  - opening hours
  - ticket price
  - official booking link
  - closure alerts
- `Social Service`
  - collaborative itineraries
  - shared trip links
  - optional friend live-location consent flows

## Data Layer

### Storage
- `PostgreSQL + PostGIS`
  - geospatial attraction indexing
  - monument metadata
  - restaurant/transport/safety POIs
- `Redis`
  - route cache
  - nearby query cache
  - AI response cache
- `Object Storage`
  - captured images
  - postcard renders
  - reconstruction outputs
  - offline trip bundles

### Search
- `OpenSearch` or `Meilisearch`
  - place search
  - fuzzy monument matching
  - itinerary suggestions

## AI Stack

### Recognition
- vision model for monument identification from photo or live frame
- optional retrieval against monument embeddings and curated metadata

### Reconstruction
- image generation with source photo conditioning
- optional 3D asset generation pipeline for destroyed monuments

### Voice + Concierge
- text generation for local historical narration
- TTS service for richer multilingual voices when browser speech is not enough

## Offline Strategy

### Phase 1
- cache app shell
- cache most recent itinerary, selected place, and nearby lists
- cache saved voice text and postcard assets

### Phase 2
- downloadable city packs
- precomputed route tiles
- compact monument metadata bundles
- low-res AR model bundles

## Security
- never expose permanent provider keys in the mobile bundle
- proxy AI and premium place APIs through server routes
- short-lived auth tokens for uploads and share actions
- audit logs for moderation-sensitive AI outputs

## Recommended Production Flow

1. App gets GPS and heading.
2. Places service returns nearby attractions, transport, food, and safety nodes.
3. User opens AR camera.
4. Native AR stack renders anchored labels and arrows.
5. User captures a frame.
6. Monument intelligence service identifies the site and returns timeline, ticketing, and narration context.
7. Concierge service answers contextual questions.
8. Route service provides turn-by-turn navigation and accessible alternatives.
9. Offline trip pack stores current plan locally for later use.

## What Is Implemented In This Repo Now

- front-end product surfaces for all requested features
- service worker shell caching
- concierge API route scaffold
- live OSM-based nearby attraction, transport, dining, and safety discovery
- browser-based camera, speech, navigation handoff, itinerary, timeline, sharing, and postcard flows

## What Still Needs External Services Or Native SDKs

- real AR world anchoring instead of HUD-style overlays
- authoritative ticketing and booking feeds
- production-grade multilingual translation and TTS
- persistent user accounts, synced social trips, and shared itineraries
- high-quality crowd forecasting
- 3D reconstruction asset pipeline for destroyed monuments
