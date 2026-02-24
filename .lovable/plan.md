

## Instant Widget Update After Image Generation

### What It Does
After the app generates and stores a new city image, it will immediately trigger a widget refresh so the home screen widget shows the new image right away -- instead of waiting up to 1 hour for the next scheduled update.

### How It Works Today
1. User selects a city -> app generates an image -> stores it in cloud storage
2. The `WidgetBridge` plugin sends only **location data** (lat, lon, city) to the native side
3. The widget refreshes on its own schedule (hourly) and fetches the latest image from storage

### Changes

**1. `src/pages/Index.tsx`**
- After a new image is successfully generated (line ~133, after `setImageUrl(data.imageUrl)`), call `saveLocationToWidget()` again to trigger a native widget refresh
- This reuses the existing bridge -- no new plugin method needed
- The native side already fetches the latest image from storage on each update, so triggering a refresh is enough

**2. `src/lib/widgetBridge.ts`** (optional improvement)
- No changes strictly required -- the existing `saveLocation` call triggers `ACTION_APPWIDGET_UPDATE` which calls `fetchAndUpdateWidget`, which already fetches the latest image from storage

### Why This Works Without Native Changes
The native `WidgetBridgePlugin.saveLocation()` already:
1. Saves lat/lon/city to SharedPreferences
2. Sends an `ACTION_APPWIDGET_UPDATE` broadcast
3. The widget provider's `onUpdate` calls `fetchAndUpdateWidget` which hits the `widget-data` edge function
4. That function looks up the latest image in storage -- which will now be the freshly generated one

So simply calling `saveLocationToWidget()` again after image generation is all that's needed.

### Technical Detail
In `Index.tsx`, inside the `generateImage` callback, after the image URL is set and cached (~line 142), add:

```text
// After setCachedImage succeeds:
saveLocationToWidget(loc.latitude, loc.longitude, loc.city)
```

This is a single-line addition that reuses all existing infrastructure.

