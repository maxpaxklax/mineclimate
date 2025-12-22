import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  fetchWeather, 
  reverseGeocode, 
  WeatherData, 
  LocationData 
} from '@/lib/weather';
import { 
  getCachedImage, 
  setCachedImage, 
  isCacheValid,
  clearCache 
} from '@/lib/imageCache';
import { CityImage } from '@/components/CityImage';
import { WeatherCard } from '@/components/WeatherCard';
import { SearchBar } from '@/components/SearchBar';
import { LocationPermission } from '@/components/LocationPermission';

interface GeneratedImageResponse {
  imageUrl: string;
  city: string;
  generatedAt: string;
  etag: string;
}

const Index = () => {
  const geolocation = useGeolocation();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermission, setShowPermission] = useState(false);
  const [imageBounds, setImageBounds] = useState<{ left: number; width: number } | null>(null);

  const generateImage = useCallback(async (loc: LocationData, w: WeatherData) => {
    setIsGenerating(true);
    
    const timeoutMs = 60000; // 60 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[Image Generation] Aborting due to timeout');
      controller.abort();
    }, timeoutMs);
    
    try {
      console.log('[Image Generation] Starting for:', loc.city, w.condition);
      console.log('[Image Generation] Timestamp:', new Date().toISOString());
      
      const startTime = Date.now();
      
      // Use direct fetch instead of supabase.functions.invoke for proper timeout support
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-city-image`;
      console.log('[Image Generation] Calling:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          city: loc.city,
          condition: w.condition,
          temperature: w.temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const elapsed = Date.now() - startTime;
      console.log(`[Image Generation] Response received in ${elapsed}ms, status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Image Generation] HTTP error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: GeneratedImageResponse = await response.json();
      console.log('[Image Generation] Parsed response:', { 
        city: data.city, 
        etag: data.etag, 
        generatedAt: data.generatedAt,
        urlLength: data.imageUrl?.length 
      });

      if (!data.imageUrl) {
        console.warn('[Image Generation] No imageUrl in response:', data);
        throw new Error('No image URL returned from server');
      }

      console.log('[Image Generation] Setting imageUrl (HTTPS):', data.imageUrl.substring(0, 80) + '...');
      setImageUrl(data.imageUrl);
      
      // Cache the metadata (URL, etag, generatedAt)
      await setCachedImage({
        city: loc.city,
        condition: w.condition,
        imageUrl: data.imageUrl,
        etag: data.etag,
        generatedAt: data.generatedAt,
      });
      console.log('[Image Generation] Image cached successfully');
    } catch (e) {
      clearTimeout(timeoutId);
      
      if (e instanceof Error && e.name === 'AbortError') {
        console.error('[Image Generation] Timeout after', timeoutMs, 'ms');
        toast.error('Image generation timed out. Please try again.');
      } else {
        console.error('[Image Generation] Failed:', e);
        toast.error('Failed to generate city image');
      }
    } finally {
      console.log('[Image Generation] Completing, setting isGenerating to false');
      setIsGenerating(false);
    }
  }, []);

  const loadWeatherAndImage = useCallback(async (loc: LocationData) => {
    try {
      // Fetch weather
      const weatherData = await fetchWeather(loc.latitude, loc.longitude);
      setWeather(weatherData);
      setLocation(loc);

      // Check cache
      const cached = await getCachedImage(loc.city);
      
      if (cached && isCacheValid(cached, weatherData.condition)) {
        // Use cached image URL
        console.log('[Weather] Using cached image:', { city: loc.city, etag: cached.etag });
        setImageUrl(cached.imageUrl);
        setIsLoading(false);
      } else {
        // Generate new image
        console.log('[Weather] Cache miss, generating new image for:', loc.city);
        setIsLoading(false);
        await generateImage(loc, weatherData);
      }
    } catch (e) {
      console.error('Failed to load weather:', e);
      toast.error('Failed to load weather data');
      setIsLoading(false);
    }
  }, [generateImage]);

  // Initial load based on geolocation
  useEffect(() => {
    if (geolocation.loading) return;

    if (geolocation.error || !geolocation.latitude || !geolocation.longitude) {
      setShowPermission(true);
      setIsLoading(false);
      return;
    }

    // Get city name from coordinates
    reverseGeocode(geolocation.latitude, geolocation.longitude)
      .then(loc => {
        loadWeatherAndImage(loc);
      })
      .catch(e => {
        console.error('Reverse geocoding failed:', e);
        setShowPermission(true);
        setIsLoading(false);
      });
  }, [geolocation.loading, geolocation.latitude, geolocation.longitude, geolocation.error, loadWeatherAndImage]);

  const handleSelectLocation = useCallback(async (loc: LocationData) => {
    setIsLoading(true);
    setShowPermission(false);
    
    try {
      await loadWeatherAndImage(loc);
    } catch (e) {
      console.error('Failed to load location:', e);
      toast.error('Failed to load weather for location');
      setIsLoading(false);
    }
  }, [loadWeatherAndImage]);

  const handleRefresh = useCallback(async () => {
    if (!location || !weather) return;
    
    await clearCache();
    await generateImage(location, weather);
  }, [location, weather, generateImage]);

  if (showPermission) {
    return (
      <LocationPermission 
        error={geolocation.error || ''} 
        onSelectLocation={handleSelectLocation}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <CityImage 
        imageUrl={imageUrl} 
        isGenerating={isGenerating || isLoading} 
        city={location?.city || 'your city'}
        temperature={weather?.temperature}
        condition={weather?.condition}
        onImageBoundsChange={setImageBounds}
      />
      
      {location && (
        <WeatherCard location={location} imageBounds={imageBounds} />
      )}
      
      <SearchBar 
        onSelectLocation={handleSelectLocation}
        onRefresh={handleRefresh}
        imageUrl={imageUrl}
        isLoading={isGenerating || isLoading}
        city={location?.city || 'your city'}
        temperature={weather?.temperature}
        condition={weather?.condition}
        imageBounds={imageBounds}
      />
    </div>
  );
};

export default Index;
