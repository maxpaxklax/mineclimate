Yes, I understand the issue: when an image is pinch-zoomed, a one-finger horizontal pan inside the zoomed image should move only the zoomed image. Right now that same horizontal touch movement can still reach the page-level saved-image carousel, so the next saved image starts sliding into view.

Plan:

1. Track whether the active image is zoomed
   - Add an `onZoomChange` callback from `CityImage` to `Index`.
   - Whenever `scale > 1`, report that the active image is zoomed.
   - Reset the zoom state when the image returns to normal scale or when a new image URL loads.

2. Disable the saved-image carousel while zoomed
   - Update `useSwipeCarousel` to accept a `disabled` option.
   - When disabled, ignore carousel `touchstart`, `touchmove`, and `touchend` handling and clear any partial swipe offset.
   - Pass `disabled: isImageZoomed` from `Index` so horizontal pans are reserved for zoomed-image movement only.

3. Harden touch-event blocking inside the image
   - Keep `CityImage` preventing default touch behavior for two-finger pinch and one-finger pan while zoomed.
   - Ensure touch end/cancel paths fully clear pinch/pan refs.
   - Add `onTouchCancel` handling so Safari/Android interrupted gestures do not leave stale gesture state.

4. Keep normal carousel behavior unchanged when not zoomed
   - If the image is at normal scale, swiping left/right should still navigate to saved images.
   - If the image is zoomed, swiping/panning should only move the zoomed image and not reveal saved images.

Technical details:
- Files to update: `src/components/CityImage.tsx`, `src/hooks/useSwipeCarousel.ts`, and `src/pages/Index.tsx`.
- No database/backend changes are needed.
- I will avoid touching the generated backend integration files.