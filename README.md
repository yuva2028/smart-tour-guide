# AR City Scout

A mobile-first AR tour guide built with React, Vite, and Capacitor.

## Features

- Detects the user's location with GPS
- Finds nearby tourist locations
- Opens the camera for an AR-style view
- Highlights monuments based on heading and direction
- Speaks a voice guide for the selected location
- Recognizes monuments from a captured frame or uploaded image using AI
- Reconstructs a monument image using AI generation
- Shows an in-app map preview for the selected destination
- Opens turn-by-turn navigation in Google Maps
- Builds day itineraries, dining suggestions, transport suggestions, and safety layers
- Supports offline trip saving, local sharing, concierge chat, and accessibility mode
- Includes native Android prep scripts and ARCore scaffolding

## Run Locally

Install dependencies:

```powershell
npm.cmd install
```

Start on your computer only:

```powershell
npm.cmd run dev
```

Start so a phone on the same Wi-Fi can open it:

```powershell
npm.cmd run dev:mobile
```

Then open the `Network` URL shown in the terminal on your phone.

## Best Phone Experience

- Use Chrome on Android or Safari on iPhone
- Allow camera permission
- Allow location permission
- Allow motion/orientation permission if prompted
- HTTPS is recommended because camera and sensor APIs are more reliable on secure origins

## Deploy So It Works From Anywhere

This app is static, so it can be deployed easily to Vercel or Netlify.

### Option 1: Vercel

1. Push this project to GitHub.
2. Go to [https://vercel.com](https://vercel.com).
3. Import the GitHub repo.
4. Keep the default settings:
   - Framework: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add an environment variable:
   - `OPENAI_API_KEY=your_openai_api_key`
6. Deploy.

After deployment, open the Vercel HTTPS URL on your phone.

### Option 2: Netlify

1. Push this project to GitHub.
2. Go to [https://netlify.com](https://netlify.com).
3. Add a new site from Git.
4. Use:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy.

After deployment, open the Netlify HTTPS URL on your phone.

## AI Modes

The app supports two AI modes:

- Preferred: server-side AI using the `OPENAI_API_KEY` environment variable on deployment
- Fallback: a browser-entered API key stored locally on the device for quick testing

For a real production deployment, use the server-side environment variable and avoid entering a key in the browser.

## Build

```powershell
npm.cmd run build
```

## Android Native Workflow

Run environment checks:

```powershell
npm.cmd run native:doctor
```

Prepare Android assets:

```powershell
npm.cmd run android:prepare
```

Build a debug APK:

```powershell
npm.cmd run android:debug
```

Build a release bundle:

```powershell
npm.cmd run android:release
```

Additional guides:

- [ANDROID_NATIVE_SETUP.md](C:/Users/yuvar/OneDrive/Documents/New%20project/ANDROID_NATIVE_SETUP.md)
- [TECHNICAL_ARCHITECTURE.md](C:/Users/yuvar/OneDrive/Documents/New%20project/TECHNICAL_ARCHITECTURE.md)
- [RELEASE_CHECKLIST.md](C:/Users/yuvar/OneDrive/Documents/New%20project/RELEASE_CHECKLIST.md)

## Preview Production Build

```powershell
npm.cmd run preview:mobile
```
