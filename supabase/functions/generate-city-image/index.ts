import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  city: string;
  condition: 'sunny' | 'rainy' | 'snowy' | 'overcast';
  temperature: number;
}

// Cities with metro/subway systems (normalized to lowercase for matching)
const citiesWithSubway = new Set([
  'london', 'paris', 'new york', 'tokyo', 'berlin', 'madrid', 'barcelona', 'rome', 'milan',
  'moscow', 'beijing', 'shanghai', 'hong kong', 'singapore', 'seoul', 'osaka', 'nagoya',
  'mexico city', 'são paulo', 'buenos aires', 'santiago', 'lima', 'bogotá', 'medellín',
  'cairo', 'dubai', 'istanbul', 'tehran', 'delhi', 'mumbai', 'kolkata', 'chennai', 'bangalore',
  'amsterdam', 'rotterdam', 'brussels', 'vienna', 'prague', 'budapest', 'warsaw', 'bucharest',
  'athens', 'lisbon', 'stockholm', 'oslo', 'copenhagen', 'helsinki', 'munich', 'hamburg',
  'frankfurt', 'cologne', 'düsseldorf', 'nuremberg', 'chicago', 'boston', 'washington',
  'philadelphia', 'los angeles', 'san francisco', 'atlanta', 'miami', 'toronto', 'montreal',
  'vancouver', 'sydney', 'melbourne', 'guangzhou', 'shenzhen', 'wuhan', 'chengdu', 'nanjing',
  'taipei', 'kaohsiung', 'kuala lumpur', 'bangkok', 'jakarta', 'manila', 'hanoi', 'kyiv',
  'minsk', 'tbilisi', 'baku', 'almaty', 'tashkent', 'algiers', 'tunis', 'casablanca',
  'lyon', 'marseille', 'toulouse', 'lille', 'rennes', 'naples', 'turin', 'genoa', 'catania',
  'bilbao', 'valencia', 'seville', 'málaga', 'palma', 'glasgow', 'newcastle', 'liverpool',
  'manchester', 'birmingham', 'leeds', 'bristol', 'edinburgh', 'cardiff', 'belfast',
]);

function hasSubway(city: string): boolean {
  const normalized = city.toLowerCase().trim();
  return citiesWithSubway.has(normalized);
}

// Create a URL-safe slug from city name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Compute SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Decode base64 data URL to Uint8Array
function decodeBase64DataUrl(dataUrl: string): Uint8Array {
  // Strip the data URL prefix if present
  let base64String = dataUrl;
  if (dataUrl.startsWith('data:')) {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex !== -1) {
      base64String = dataUrl.substring(commaIndex + 1);
    }
  }
  
  // Decode base64 to binary
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { city, condition, temperature } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('[generate-city-image] LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[generate-city-image] Supabase credentials not configured');
      throw new Error('Supabase credentials not configured');
    }

    // Initialize Supabase client with service role for storage access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const cityHasSubway = hasSubway(city);
    console.log(`[generate-city-image] Starting for ${city} (subway: ${cityHasSubway}) with ${condition} weather at ${temperature}°`);

    // Build the prompt based on weather condition
    const weatherDescriptions = {
      sunny: 'bright sunny day with clear blue skies, warm golden sunlight, vibrant saturated colors, cheerful atmosphere',
      rainy: 'rainy day with dramatic clouds, rain drops falling, wet reflective streets, puddles, umbrellas, rich deep colors',
      snowy: 'magical snowy winter day with snow-covered rooftops, falling snowflakes, cozy warm glowing lights in windows, pristine white snow',
      overcast: 'cloudy overcast day with soft diffused light, grey clouds, subtle muted tones, calm peaceful atmosphere',
    };

    const undergroundLayer = cityHasSubway
      ? 'underground subway/metro cross-section with train tunnels and detailed metro station with passengers'
      : 'underground cross-section showing natural brown earth layers, tree roots, utility pipes';

    const prompt = `Create a highly detailed isometric 3D diorama illustration of ${city} showing ${weatherDescriptions[condition]}. Portrait format composition with three distinct layers: sky layer with weather effects, middle layer featuring recognizable ${city} architecture landmarks and city life with tiny people cars and trees, ${undergroundLayer}. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Integrate the current weather conditions directly into the city environment to create an immersive atmospheric mood. Use a clean, minimalistic composition with a soft, solid-colored background.`;

    console.log(`[generate-city-image] Calling AI gateway with prompt length: ${prompt.length}`);

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[generate-city-image] Request timeout after 55s');
      controller.abort();
    }, 55000);

    let response;
    try {
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          modalities: ['image'],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const fetchTime = Date.now() - startTime;
    console.log(`[generate-city-image] AI gateway responded in ${fetchTime}ms with status ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-city-image] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    console.log('[generate-city-image] Parsing response...');
    const data = await response.json();
    console.log('[generate-city-image] Response parsed, checking for image...');

    // Extract the image from the response - check multiple possible locations
    const base64ImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
      || data.choices?.[0]?.message?.image?.url
      || data.data?.[0]?.url;
    
    if (!base64ImageUrl) {
      // Log detailed response for debugging
      const responseStr = JSON.stringify(data);
      console.error('[generate-city-image] No image found. Full response:', responseStr.substring(0, 1000));
      
      // Check if the model returned text instead of an image
      const textContent = data.choices?.[0]?.message?.content;
      if (textContent && typeof textContent === 'string') {
        console.error('[generate-city-image] Model returned text instead of image:', textContent.substring(0, 200));
      }
      
      throw new Error('No image generated - model returned text instead of image');
    }

    console.log(`[generate-city-image] Image received, base64 length: ${base64ImageUrl.length}`);

    // Decode base64 to binary
    const imageBytes = decodeBase64DataUrl(base64ImageUrl);
    console.log(`[generate-city-image] Decoded image bytes: ${imageBytes.length}`);

    // Generate deterministic file path
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const citySlug = slugify(city);
    const stableKey = `${citySlug}-${dateStr}-${condition}`;
    const etag = await sha256(stableKey);
    const shortHash = etag.substring(0, 16);
    
    const filePath = `city/${citySlug}/${dateStr}/${shortHash}.png`;
    console.log(`[generate-city-image] Upload path: ${filePath}, etag: ${shortHash}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('city-images')
      .upload(filePath, imageBytes, {
        contentType: 'image/png',
        cacheControl: 'public, max-age=86400',
        upsert: true,
      });

    if (uploadError) {
      console.error('[generate-city-image] Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log(`[generate-city-image] Upload successful: ${uploadData.path}`);

    // Get public URL (bucket is public)
    const { data: urlData } = supabase.storage
      .from('city-images')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;
    const generatedAt = now.toISOString();

    const totalTime = Date.now() - startTime;
    console.log(`[generate-city-image] Success! URL length: ${imageUrl.length}, etag: ${shortHash}, total time: ${totalTime}ms`);

    return new Response(JSON.stringify({ 
      imageUrl,
      city,
      generatedAt,
      etag: shortHash,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[generate-city-image] Timeout after ${totalTime}ms`);
      return new Response(JSON.stringify({ error: 'Image generation timed out. Please try again.' }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.error(`[generate-city-image] Error after ${totalTime}ms:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
