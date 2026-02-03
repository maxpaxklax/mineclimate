

## Fix Android Widget Bridge Issue

### Current Situation
You've been working on getting the **Android home screen widget** to display weather data from your MineClimate app. The widget should:
- Show the current city name, temperature, and weather icon
- Display an AI-generated city image
- Update automatically every hour

**The Problem**: The web app can't communicate with the native Android widget because:
1. The `capacitor.config.ts` is currently set to load from a remote URL (Lovable preview), which requires authentication and breaks the native plugin bridge
2. When using live reload, the app showed a Lovable login page instead of your weather app

### The Fix

#### Step 1: Remove Live Reload Configuration
I'll update `capacitor.config.ts` to use local assets instead of the remote URL:

```text
Before:
┌─────────────────────────────────────┐
│ capacitor.config.ts                 │
│ ─────────────────────               │
│ webDir: 'dist'                      │
│ server: {                           │
│   url: 'https://...lovable...'  ← Problem │
│   cleartext: true                   │
│ }                                   │
└─────────────────────────────────────┘

After:
┌─────────────────────────────────────┐
│ capacitor.config.ts                 │
│ ─────────────────────               │
│ webDir: 'dist'                      │
│ (no server block)                   │
└─────────────────────────────────────┘
```

#### Step 2: You'll Need to Rebuild Locally
After I make this change, you'll need to:
1. Pull the latest code to your local machine
2. Run: `npm run build`
3. Run: `npx cap sync android`
4. In Android Studio: Build → Clean Project, then Build → Rebuild Project
5. Run the app on your device/emulator

### What This Fixes
- The app will load from local files (the `dist` folder) instead of a remote URL
- The Capacitor bridge will work properly between JavaScript and native Android
- The `WidgetBridgePlugin` will receive location data when you select a city
- The home screen widget will update with the correct weather data

### Technical Details

**Files involved:**
- `capacitor.config.ts` - Remove the server block (1 file change)
- `android/app/src/main/java/.../MainActivity.kt` - Already has plugin registration (no change needed)
- `android/app/src/main/java/.../WidgetBridgePlugin.kt` - Already configured (no change needed)
- `src/lib/widgetBridge.ts` - Already has the bridge code (no change needed)

**Data flow after the fix:**
```text
User selects city in app
        ↓
Index.tsx calls saveLocationToWidget()
        ↓
widgetBridge.ts detects Android platform
        ↓
Calls native WidgetBridgePlugin.saveLocation()
        ↓
Plugin saves lat/lon/city to SharedPreferences
        ↓
Broadcasts widget update intent
        ↓
WeatherWidgetProvider fetches fresh data
        ↓
Widget displays updated weather
```

