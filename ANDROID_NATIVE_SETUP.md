# Android Native Setup

## Purpose
This document captures the migration path from the current mobile-friendly web AR experience to a stronger Capacitor + native Android stack.

## 1. Capacitor Plugin Migration

Install these plugins when network access is available:

```powershell
npm.cmd install @capacitor/camera @capacitor/geolocation @capacitor/share @capacitor/haptics @capacitor/filesystem @capacitor/device
```

Then sync Android:

```powershell
npm.cmd run cap:sync:android
```

## 2. Recommended Native Plugin Mapping

- Camera capture: `@capacitor/camera`
- Location and permission flow: `@capacitor/geolocation`
- Haptic feedback: `@capacitor/haptics`
- Sharing trip links and postcards: `@capacitor/share`
- Offline pack storage: `@capacitor/filesystem`
- Device capability checks: `@capacitor/device`

The app already includes a bridge layer in [src/nativeBridge.js](C:/Users/yuvar/OneDrive/Documents/New%20project/src/nativeBridge.js) so the UI can adopt these plugins with minimal React changes.

## 3. ARCore Integration Plan

The Android project now includes:

- ARCore manifest metadata
- optional AR camera feature declaration
- native placeholder bridge in [ArTourSessionBridge.java](C:/Users/yuvar/OneDrive/Documents/New%20project/android/app/src/main/java/com/arcityscout/app/ar/ArTourSessionBridge.java)

Next implementation steps:

1. Add the Google ARCore dependency in `android/app/build.gradle`.
2. Create a Capacitor plugin that wraps `ArTourSessionBridge`.
3. Expose methods such as:
   - `startSession`
   - `stopSession`
   - `placeMonumentAnchor`
   - `placeRouteArrow`
   - `getTrackingState`
4. Replace the current browser HUD markers with native anchored overlays.

## 4. Android Build Flow

Use these scripts:

```powershell
npm.cmd run native:doctor
npm.cmd run android:prepare
npm.cmd run android:debug
npm.cmd run android:release
```

Notes:

- `android:prepare` builds web assets and syncs them into Android.
- `android:debug` assembles a debug APK.
- `android:release` builds a release bundle for Play Store submission.

## 5. Local Testing Checklist

1. Run `npm.cmd install`.
2. Run `npm.cmd run android:prepare`.
3. Open Android Studio with `npm.cmd run cap:open:android`.
4. Test camera, location, motion, offline, sharing, and reconstruction.
5. Validate on at least one real Android device outdoors.
