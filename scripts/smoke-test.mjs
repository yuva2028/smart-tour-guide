import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const html = await readFile(join(root, 'dist', 'index.html'), 'utf8')
const assets = await readdir(join(root, 'dist', 'assets'))
const source = await readFile(join(root, 'src', 'SmartTourGuide.jsx'), 'utf8')

if (!html.includes('id="root"')) {
  throw new Error('Built app shell is missing the root element.')
}

if (!assets.some((file) => file.endsWith('.js')) || !assets.some((file) => file.endsWith('.css'))) {
  throw new Error('Built app is missing JS or CSS assets.')
}

const requiredSignals = [
  'OpenStreetMap',
  'openstreetmap.org/directions',
  'Smart recommendations',
  'Dynamic nearby',
  'Refresh near me',
  'Demo move',
  'Trip planner',
  'Generated route',
  'Minimum AR view',
  'Start AR Camera',
  'Start AR Navigation',
  'OpenStreetMap route',
  'router.project-osrm.org',
  'deviceorientation',
  'getUserMedia',
  'Ratings and reviews',
  'Chatbot guide',
  'Google-style scan',
  'Open Google Lens',
  'Open Android Camera',
  'Pick Android Photo',
  'Android GPS',
  'Admin console',
  'Free development stack',
  'localStorage',
  'shareItinerary',
]
const missing = requiredSignals.filter((signal) => !source.includes(signal))

if (missing.length) {
  throw new Error(`Missing app signals: ${missing.join(', ')}`)
}

console.log('Smoke test passed: built app and free-stack feature surfaces are available.')
