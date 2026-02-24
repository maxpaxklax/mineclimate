

## Match Generated Image Lighting to Time of Day

### What Changes
The generated city image will reflect the actual time of day at the city's location -- dawn, morning, midday, afternoon, golden hour, dusk, or nighttime -- with appropriate lighting, sky colors, and atmosphere.

### How It Works

**1. Client sends local hour to the edge function**

In `src/pages/Index.tsx`, pass the current hour (0-23) alongside the existing `city`, `condition`, and `temperature` fields when calling the image generation function. We use the user's device clock as a reasonable proxy for local time (most users search for cities in their timezone or nearby).

**2. Edge function maps the hour to a lighting description**

In `supabase/functions/generate-city-image/index.ts`:
- Accept a new `hour` field (0-23) in the request body
- Map it to a time-of-day period and lighting description:

```text
  5-7   -> dawn: soft pink-orange sunrise glow on the horizon, long shadows, sky transitioning from deep blue to warm pastels
  7-10  -> morning: fresh warm morning light, low-angle golden sun, gentle shadows, crisp clear atmosphere
  10-16 -> midday: bright overhead sunlight, short shadows, vivid saturated colors (current default for sunny)
  16-18 -> golden hour: warm golden-hour light, long dramatic shadows, rich amber and orange tones, sun low on horizon
  18-20 -> dusk: twilight sky with deep purple and orange gradients, city lights beginning to glow, fading daylight
  20-5  -> night: dark night sky with stars/moon, city illuminated by warm streetlights and glowing windows, cool blue shadows
```

- Inject this lighting description into the prompt alongside the weather description
- For night + rainy/snowy, combine both atmospheres (e.g., "rainy night with neon reflections on wet streets")

**3. Update caching to account for time period**

In `src/lib/imageCache.ts`:
- The `isCacheValid` function already invalidates after 3 hours, which roughly aligns with time-of-day period changes
- No cache schema changes needed -- the 3-hour expiry naturally triggers regeneration as lighting changes

**4. Update storage path to include time period**

In the edge function, the storage path hash (`stableKey`) will include the time period so that different times of day produce different cached files:
```text
Current: `${citySlug}-${dateStr}-${condition}`
New:     `${citySlug}-${dateStr}-${condition}-${timePeriod}`
```

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-city-image/index.ts` | Add `hour` to request body, map to lighting description, inject into prompt, update storage key |
| `src/pages/Index.tsx` | Pass `hour: new Date().getHours()` in the generate-image request body |

### Technical Details

The prompt will change from:
> "...showing bright sunny day with clear blue skies..."

To something like:
> "...showing bright sunny day with clear blue skies, during golden hour with warm golden light, long dramatic shadows, rich amber and orange tones, sun low on horizon..."

This gives the AI model explicit lighting direction while keeping the weather atmosphere intact.

