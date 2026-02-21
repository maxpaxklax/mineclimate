import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WidgetData {
  city: string;
  temperature: number;
  condition: string;
  imageUrl: string | null;
  updatedAt: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const city = url.searchParams.get('city');

    if (!lat || !lon || !city) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: lat, lon, city' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Widget data request for ${city} at (${lat}, ${lon})`);

    // Fetch current weather from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    const temperature = Math.round(weatherData.current.temperature_2m);
    const weatherCode = weatherData.current.weather_code;

    // Map weather code to condition
    const condition = mapWeatherCodeToCondition(weatherCode);

    // Check for cached image in Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look for the most recent image for this city
    const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const today = new Date().toISOString().split('T')[0];

    const { data: files } = await supabase.storage
      .from('city-images')
      .list(`city/${citySlug}/${today}`, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

    let imageUrl: string | null = null;

    if (files && files.length > 0) {
      const { data: urlData } = supabase.storage
        .from('city-images')
        .getPublicUrl(`city/${citySlug}/${today}/${files[0].name}`);
      imageUrl = urlData.publicUrl;
    } else {
      // Try to find any recent image for this city (last 7 days)
      for (let i = 1; i <= 7; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        const dateStr = pastDate.toISOString().split('T')[0];
        
        const { data: pastFiles } = await supabase.storage
          .from('city-images')
          .list(`city/${citySlug}/${dateStr}`, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

        if (pastFiles && pastFiles.length > 0) {
          const { data: urlData } = supabase.storage
            .from('city-images')
            .getPublicUrl(`city/${citySlug}/${dateStr}/${pastFiles[0].name}`);
          imageUrl = urlData.publicUrl;
          break;
        }
      }
    }

    const widgetData: WidgetData = {
      city,
      temperature,
      condition,
      imageUrl,
      updatedAt: new Date().toISOString(),
    };

    console.log(`Widget data response:`, widgetData);

    return new Response(
      JSON.stringify(widgetData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Widget data error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mapWeatherCodeToCondition(code: number): string {
  // WMO Weather interpretation codes
  if (code === 0) return 'sunny';
  if (code >= 1 && code <= 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 85 && code <= 86) return 'snowy';
  if (code >= 95 && code <= 99) return 'stormy';
  return 'cloudy';
}
