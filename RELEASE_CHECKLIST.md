# Native AR Tourism App Release Checklist

## Product Readiness

- Verify nearby attractions, transport, dining, safety, and map flows on-device
- Validate multilingual voice output for the supported locales
- Confirm itinerary generation and concierge responses are helpful offline and online
- Test accessibility mode in bright outdoor conditions
- Confirm postcard creation and trip sharing on Android devices

## Native Mobile Readiness

- Camera permission prompts behave correctly
- Location permission prompts behave correctly
- Motion/orientation permissions work on supported devices
- Haptics trigger only on supported devices
- Service worker and offline trip caching work after reinstall/update
- Quick-action dock remains usable on compact screens

## ARCore Readiness

- ARCore compatibility check added
- Native session bootstrap implemented
- Monument anchors placed in-world instead of HUD-only overlays
- Route arrows tested while moving in real outdoor spaces
- Fallback web overlay remains available for unsupported devices

## Backend Readiness

- `OPENAI_API_KEY` configured securely on the deployment target
- AI routes rate-limited and monitored
- live place data source quotas verified
- official ticketing and opening-hours feeds connected for key monuments
- share links and optional user accounts backed by real persistence

## Android Release Readiness

- Run `npm.cmd run android:release`
- Verify versionCode and versionName
- Add release keystore configuration
- Test release bundle on a real Android device
- Review manifest permissions before store submission
- Capture screenshots for Play Store listing

## Observability

- Client error logging enabled
- API error logging enabled
- location / camera / recognition failure events tracked
- offline usage tracked
- crash and ANR monitoring configured
