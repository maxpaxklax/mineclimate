

## Add Airplane Animation to Weather Effects

### What Changes
Add an occasional airplane flying across the sky alongside the existing birds during sunny and overcast conditions. The airplane will appear roughly every 4th animation cycle, fly in a straight line (no flapping), move faster, and sit higher than the birds.

### Changes

**1. `src/components/WeatherEffects.tsx`**
- Add an `AirplaneSVG` component - a side-profile airplane silhouette (filled, not stroked like the birds)
- Generate 1 airplane with a longer delay and faster speed using the existing `generateBirds`-style pseudo-random function
- The airplane flies higher (top 5-15%) and faster (duration ~12-15s) than birds (top 10-40%, duration 20-35s)
- Render the airplane inside the same image-bounds-constrained container as the birds
- Airplane is slightly larger than birds (w-10 md:w-14) and uses the same `animate-bird-fly` CSS animation (straight line left-to-right)
- No wing flapping -- just a static silhouette gliding across

**2. `src/index.css`**
- Add a new `animate-plane-fly` keyframe that's similar to `bird-fly` but with a straighter path (less vertical movement) and a subtle slight bobbing effect
- The plane starts off-screen left, flies to off-screen right at a consistent altitude

### Technical Details

The airplane SVG shape:
```text
Fuselage: elongated oval body
Wings: swept-back triangular shapes (top and bottom)
Tail fin: small triangle at the rear
```

Timing logic:
- 1 airplane generated with a long initial delay (~25-40s) so it doesn't appear immediately
- Animation duration ~12-15s (faster than birds at 20-35s)
- The animation loops, so the plane reappears periodically after completing each pass

