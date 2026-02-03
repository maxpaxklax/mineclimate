

## Fix "Failed to Create City Image" Issue

### Problem Identified
The image generation occasionally fails. After investigation:
- The edge function itself is working (I tested it and successfully generated a Berlin image)
- The configuration is correct and the LOVABLE_API_KEY is set

### Root Cause
The code is using an older model name `google/gemini-2.5-flash-image-preview` which may have intermittent issues. The current recommended model is `google/gemini-2.5-flash-image`.

### The Fix

#### Update the AI Model Name
Change the model from the preview version to the stable version in the edge function:

```text
Before:
model: 'google/gemini-2.5-flash-image-preview'

After:
model: 'google/gemini-2.5-flash-image'
```

This one-line change in `supabase/functions/generate-city-image/index.ts` should improve reliability.

### Technical Details

**File to modify:**
- `supabase/functions/generate-city-image/index.ts` (line 138)

**What this fixes:**
- Uses the stable, recommended image generation model
- Should reduce intermittent "No image generated" errors
- Better reliability for image generation across all cities

### Testing After the Fix
After I make this change:
1. In the Lovable preview, search for a new city you haven't viewed before
2. The app should generate a fresh image (may take 10-20 seconds)
3. You should see the AI-generated city image appear

For Android testing:
1. Pull the latest code and rebuild (`npm run build && npx cap sync android`)
2. Run the app and select a new city
3. Verify the image generates correctly

