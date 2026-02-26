import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSwipeCarousel } from '@/hooks/useSwipeCarousel';
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
import { getSavedCities, SavedCity } from '@/lib/savedCities';
import { saveLocationToWidget } from '@/lib/widgetBridge';
import { CityImage } from '@/components/CityImage';
import { WeatherCard } from '@/components/WeatherCard';
import { SearchBar } from '@/components/SearchBar';
import { LocationPermission } from '@/components/LocationPermission';
import { BookmarkStar } from '@/components/BookmarkStar';
import { CarouselDots } from '@/components/CarouselDots';

interface GeneratedImageResponse {
  imageUrl: string;
  city: string;
  generatedAt: string;
  etag: string;
}

const LOCATION_STORAGE_KEY = 'mineclimate_saved_location';

const getSavedLocation = (): LocationData | null => {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[Location] Found saved location:', parsed.city);
      return parsed;
    }
  } catch (e) {
    console.error('[Location] Failed to read saved location:', e);
  }
  return null;
};

const saveLocation = (loc: LocationData) => {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    console.log('[Location] Saved location to localStorage:', loc.city);
  } catch (e) {
    console.error('[Location] Failed to save location:', e);
  }
};

const Index = () => {
  const geolocation = useGeolocation();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermission, setShowPermission] = useState(false);
  const [imageBounds, setImageBounds] = useState<{ left: number; width: number } | null>(null);
  const [savedCities, setSavedCities] = useState<SavedCity[]>([]);

  // Refresh saved cities list
  const refreshSavedCities = useCallback(() => {
    setSavedCities(getSavedCities());
  }, []);

  useEffect(() => {
    refreshSavedCities();
  }, [refreshSavedCities]);

  // Build slides: [current, ...saved]
  const slides = useMemo(() => {
    const current = location ? {
      location,
      imageUrl,
      temperature: weather?.temperature,
      condition: weather?.condition,
      isCurrent: true,
    } : null;

    const saved = savedCities.map(sc => ({
      location: sc.location,
      imageUrl: sc.imageUrl,
      temperature: sc.temperature,
      condition: sc.condition,
      isCurrent: false,
    }));

    return current ? [current, ...saved] : [];
  }, [location, imageUrl, weather, savedCities]);

  const carousel = useSwipeCarousel({
    totalSlides: slides.length,
    onSnapBack: () => {
      toast('Back to your current city!', { icon: '📍', duration: 1500 });
    },
  });

  const activeSlide = slides[carousel.currentIndex];

  const generateImage = useCallback(async (loc: LocationData, w: WeatherData) => {
    setIsGenerating(true);
    
    const timeoutMs = 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[Image Generation] Aborting due to timeout');
      controller.abort();
    }, timeoutMs);
    
    try {
      console.log('[Image Generation] Starting for:', loc.city, w.condition);
      console.log('[Image Generation] Timestamp:', new Date().toISOString());
      
      const startTime = Date.now();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error(`Environment variables missing: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/generate-city-image`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          city: loc.city,
          condition: w.condition,
          temperature: w.temperature,
          hour: new Date().getHours(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const elapsed = Date.now() - startTime;
      console.log(`[Image Generation] Response received in ${elapsed}ms, status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: GeneratedImageResponse = await response.json();

      if (!data.imageUrl) {
        throw new Error('No image URL returned from server');
      }

      setImageUrl(data.imageUrl);
      
      await setCachedImage({
        city: loc.city,
        condition: w.condition,
        imageUrl: data.imageUrl,
        etag: data.etag,
        generatedAt: data.generatedAt,
      });
      
      saveLocationToWidget(loc.latitude, loc.longitude, loc.city)
        .catch((err) => console.error('[Image Generation] Widget refresh failed:', err));
    } catch (e) {
      clearTimeout(timeoutId);
      
      if (e instanceof Error && e.name === 'AbortError') {
        toast.error('Image generation timed out. Please try again.');
      } else {
        console.error('[Image Generation] Failed:', e);
        toast.error('Failed to generate city image');
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const loadWeatherAndImage = useCallback(async (loc: LocationData) => {
    try {
      const weatherData = await fetchWeather(loc.latitude, loc.longitude);
      setWeather(weatherData);
      setLocation(loc);
      
      saveLocation(loc);
      
      saveLocationToWidget(loc.latitude, loc.longitude, loc.city)
        .catch((err) => console.error('[Index] Widget bridge call failed:', err));

      const cached = await getCachedImage(loc.city);
      
      if (cached && isCacheValid(cached, weatherData.condition)) {
        setImageUrl(cached.imageUrl);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        await generateImage(loc, weatherData);
      }
    } catch (e) {
      console.error('Failed to load weather:', e);
      toast.error('Failed to load weather data');
      setIsLoading(false);
    }
  }, [generateImage]);

  // Initial load
  useEffect(() => {
    const savedLoc = getSavedLocation();
    if (savedLoc) {
      loadWeatherAndImage(savedLoc);
      return;
    }

    if (geolocation.loading) return;

    if (geolocation.error || !geolocation.latitude || !geolocation.longitude) {
      setShowPermission(true);
      setIsLoading(false);
      return;
    }

    reverseGeocode(geolocation.latitude, geolocation.longitude)
      .then(loc => loadWeatherAndImage(loc))
      .catch(e => {
        console.error('Reverse geocoding failed:', e);
        setShowPermission(true);
        setIsLoading(false);
      });
  }, [geolocation.loading, geolocation.latitude, geolocation.longitude, geolocation.error, loadWeatherAndImage]);

  const handleSelectLocation = useCallback(async (loc: LocationData) => {
    setIsLoading(true);
    setShowPermission(false);
    // Reset to first slide when selecting new location
    carousel.goTo(0);
    
    try {
      await loadWeatherAndImage(loc);
    } catch (e) {
      console.error('Failed to load location:', e);
      toast.error('Failed to load weather for location');
      setIsLoading(false);
    }
  }, [loadWeatherAndImage, carousel]);

  const handleRefresh = useCallback(async () => {
    if (!location || !weather) return;
    
    await clearCache();
    await generateImage(location, weather);
  }, [location, weather, generateImage]);

  const handleBookmarkToggle = useCallback(() => {
    refreshSavedCities();
  }, [refreshSavedCities]);

  if (showPermission) {
    return (
      <LocationPermission 
        error={geolocation.error || ''} 
        onSelectLocation={handleSelectLocation}
        isLoading={isLoading}
      />
    );
  }

  // Determine what to display based on active slide
  const displayCity = activeSlide?.location.city || location?.city || 'your city';
  const displayTemp = activeSlide?.temperature ?? weather?.temperature;
  const displayCondition = activeSlide?.condition ?? weather?.condition;
  const displayImage = activeSlide?.imageUrl ?? imageUrl;
  const displayLocation = activeSlide?.location ?? location;
  const isOnCurrentCity = carousel.currentIndex === 0;

  return (
    <div 
      className="flex h-screen flex-col"
      style={{ backgroundColor: '#1a1a1a' }}
      onTouchStart={carousel.handleTouchStart}
      onTouchMove={carousel.handleTouchMove}
      onTouchEnd={carousel.handleTouchEnd}
    >
      {/* Bookmark star - top right */}
      {isOnCurrentCity && location && (
        <div className="absolute top-4 right-4 z-30">
          <BookmarkStar
            city={location.city}
            location={location}
            imageUrl={imageUrl}
            temperature={weather?.temperature}
            condition={weather?.condition}
            onToggle={handleBookmarkToggle}
          />
        </div>
      )}

      {/* Horizontal slide strip */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(calc(-${carousel.currentIndex * (100 / slides.length)}% + ${carousel.swipeOffset}px))`,
            transition: carousel.swipeOffset === 0
              ? carousel.snapBackActive
                ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
                : carousel.isAnimating
                  ? 'transform 0.3s ease-out'
                  : 'none'
              : 'none',
          }}
        >
          {slides.map((slide, i) => (
            <div key={slide.location.city + i} className="h-full" style={{ width: `${100 / slides.length}%` }}>
              <CityImage
                imageUrl={slide.imageUrl}
                isGenerating={i === 0 ? (isGenerating || isLoading) : false}
                city={slide.location.city}
                temperature={slide.temperature}
                condition={slide.condition}
                onImageBoundsChange={i === carousel.currentIndex ? setImageBounds : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Carousel dots - only show when not on the first slide */}
      {slides.length > 1 && carousel.currentIndex > 0 && (
        <CarouselDots total={slides.length} current={carousel.currentIndex} />
      )}
      
      {/* Weather card only on current city */}
      {isOnCurrentCity && displayLocation && (
        <WeatherCard location={displayLocation} imageBounds={imageBounds} />
      )}
      
      {/* Saved city label when viewing a bookmark */}
      {!isOnCurrentCity && activeSlide && (
        <div className="absolute bottom-28 md:bottom-32 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
            <span>⭐</span>
            <span>Saved · {new Date(savedCities[carousel.currentIndex - 1]?.savedAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
      
      <SearchBar 
        onSelectLocation={handleSelectLocation}
        onRefresh={handleRefresh}
        imageUrl={displayImage}
        isLoading={isOnCurrentCity ? (isGenerating || isLoading) : false}
        city={displayCity}
        temperature={displayTemp}
        condition={displayCondition}
        imageBounds={imageBounds}
      />
    </div>
  );
};

export default Index;
