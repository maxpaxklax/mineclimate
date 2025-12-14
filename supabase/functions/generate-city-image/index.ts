import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { city, condition, temperature } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('[generate-city-image] LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const cityHasSubway = hasSubway(city);
    console.log(`[generate-city-image] Starting for ${city} (subway: ${cityHasSubway}) with ${condition} weather at ${temperature}°`);

    // Build the prompt based on weather condition
    const weatherDescriptions = {
      sunny: 'bright sunny day with clear blue skies, warm golden sunlight casting soft shadows, vibrant colors',
      rainy: 'rainy day with dark clouds, rain drops falling, wet reflective streets, puddles, umbrellas, moody atmosphere',
      snowy: 'snowy winter day with snow-covered rooftops, falling snowflakes, cozy warm lights in windows, white landscape',
      overcast: 'cloudy overcast day with soft diffused light, grey clouds, muted colors, calm atmosphere',
    };

    const undergroundLayer = cityHasSubway
      ? 'underground subway/metro cross-section with trains and tunnels'
      : 'underground cross-section showing natural earth layers, roots, and pipes';

    const prompt = `Create an isometric 3D city illustration of ${city} showing ${weatherDescriptions[condition]}. Portrait format. Three layers: sky with weather, recognizable local architecture and landmarks, ${undergroundLayer}. Modern vector art style.`;

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
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
      || data.choices?.[0]?.message?.image?.url
      || data.data?.[0]?.url;
    
    if (!imageUrl) {
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

    const totalTime = Date.now() - startTime;
    console.log(`[generate-city-image] Success! Image URL length: ${imageUrl.length}, total time: ${totalTime}ms`);

    return new Response(JSON.stringify({ imageUrl }), {
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
