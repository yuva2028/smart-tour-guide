/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'

const BUILD_LABEL = 'Smart Tour Guide Build 2026-04-20'
const isNativeShell = Capacitor.isNativePlatform()

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

function StartupShell({ title, message, detail = '' }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: 'min(680px, 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(146, 224, 255, 0.16)',
          background:
            'linear-gradient(180deg, rgba(8, 15, 28, 0.9), rgba(5, 10, 18, 0.94))',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
          padding: '24px',
          color: '#f2fbff',
          fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
        }}
      >
        <p
          style={{
            margin: 0,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            color: 'rgba(151, 210, 232, 0.7)',
          }}
        >
          Smart Tour Guide
        </p>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: '0.78rem',
            color: '#8cf2ff',
          }}
        >
          {BUILD_LABEL}
        </p>
        <h1 style={{ margin: '12px 0 10px', fontSize: '1.8rem', lineHeight: 1.05 }}>
          {title}
        </h1>
        <p style={{ margin: 0, color: 'rgba(242, 251, 255, 0.78)', lineHeight: 1.65 }}>
          {message}
        </p>
        {detail && (
          <pre
            style={{
              marginTop: '16px',
              padding: '14px',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(146, 224, 255, 0.12)',
              color: '#9fefff',
              fontSize: '0.86rem',
            }}
          >
            {detail}
          </pre>
        )}
      </div>
    </div>
  )
}

function showStartupMessage(title, message, detail = '') {
  root.render(
    <StrictMode>
      <StartupShell title={title} message={message} detail={detail} />
    </StrictMode>,
  )
}

showStartupMessage(
  'Starting the tour guide',
  'Loading nearby discovery, maps, audio guides, saved trips, and offline packs.',
)

window.addEventListener('error', (event) => {
  showStartupMessage(
    'Startup error detected',
    'The app hit a runtime error on this device before the main interface finished loading.',
    event.error?.stack || event.message || 'Unknown startup error',
  )
})

window.addEventListener('unhandledrejection', (event) => {
  const reason =
    typeof event.reason === 'string'
      ? event.reason
      : event.reason?.stack || JSON.stringify(event.reason)

  showStartupMessage(
    'Unhandled startup promise',
    'A startup task failed before the main interface could finish loading.',
    reason || 'Unknown promise rejection',
  )
})

async function bootstrap() {
  try {
    if ('serviceWorker' in navigator) {
      if (isNativeShell) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))

        if ('caches' in window) {
          const cacheKeys = await caches.keys()
          await Promise.all(cacheKeys.map((key) => caches.delete(key)))
        }
      }
    }

    const module = await import('./App.stable.jsx')
    const App = module.default

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    showStartupMessage(
      'App bootstrap failed',
      'The main React app could not be loaded on this device. The details below will help us fix it.',
      error?.stack || error?.message || 'Unknown bootstrap error',
    )
  }
}

bootstrap()

if (!isNativeShell && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
