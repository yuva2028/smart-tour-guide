import { Capacitor } from '@capacitor/core'

function getPlugin(name) {
  return (
    globalThis.Capacitor?.Plugins?.[name] ||
    globalThis.window?.Capacitor?.Plugins?.[name] ||
    null
  )
}

export function isNativeShell() {
  return Capacitor.isNativePlatform()
}

export async function getPermissionSummary() {
  const summary = {
    camera: 'prompt',
    geolocation: 'prompt',
  }

  const cameraPlugin = getPlugin('Camera')
  const geoPlugin = getPlugin('Geolocation')

  try {
    if (cameraPlugin?.checkPermissions) {
      const result = await cameraPlugin.checkPermissions()
      summary.camera = result.camera || result.photos || summary.camera
    } else if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({ name: 'camera' })
      summary.camera = result.state
    }
  } catch {
    summary.camera = 'prompt'
  }

  try {
    if (geoPlugin?.checkPermissions) {
      const result = await geoPlugin.checkPermissions()
      summary.geolocation = result.location || result.coarseLocation || summary.geolocation
    } else if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      summary.geolocation = result.state
    }
  } catch {
    summary.geolocation = 'prompt'
  }

  return summary
}

export async function requestNativeTourPermissions() {
  const cameraPlugin = getPlugin('Camera')
  const geoPlugin = getPlugin('Geolocation')
  const motionPlugin = getPlugin('Motion')

  const result = {}

  try {
    if (cameraPlugin?.requestPermissions) {
      result.camera = await cameraPlugin.requestPermissions()
    }
  } catch {
    result.camera = { camera: 'prompt' }
  }

  try {
    if (geoPlugin?.requestPermissions) {
      result.location = await geoPlugin.requestPermissions()
    }
  } catch {
    result.location = { location: 'prompt' }
  }

  try {
    if (motionPlugin?.requestPermissions) {
      result.motion = await motionPlugin.requestPermissions()
    }
  } catch {
    result.motion = { motion: 'prompt' }
  }

  return result
}

export async function triggerHaptics(pattern = [18]) {
  const hapticsPlugin = getPlugin('Haptics')

  try {
    if (hapticsPlugin?.vibrate) {
      await hapticsPlugin.vibrate({ duration: Math.max(...pattern, 18) })
      return
    }
    if (hapticsPlugin?.impact) {
      await hapticsPlugin.impact({ style: 'light' })
      return
    }
  } catch {
    // Fall through to browser vibration.
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}

export async function shareTripPayload(payload) {
  const sharePlugin = getPlugin('Share')

  if (sharePlugin?.share) {
    return sharePlugin.share(payload)
  }

  if (navigator.share) {
    return navigator.share(payload)
  }

  if (payload.text && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload.text)
  }

  return null
}
