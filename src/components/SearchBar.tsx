import { useState, useEffect } from 'react';
import { Search, Share2, Download, RefreshCw, Loader2, MapPin, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { searchCities, LocationData } from '@/lib/weather';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface SearchBarProps {
  onSelectLocation: (location: LocationData) => void;
  onRefresh: () => void;
  imageUrl: string | null;
  isLoading: boolean;
  city?: string;
  temperature?: number;
  condition?: 'sunny' | 'rainy' | 'snowy' | 'overcast';
  imageBounds?: { left: number; width: number } | null;
}

const weatherEmojis: Record<string, string> = {
  sunny: '☀️',
  rainy: '🌧️',
  snowy: '❄️',
  overcast: '☁️',
};

export function SearchBar({ onSelectLocation, onRefresh, imageUrl, isLoading, city, temperature, condition, imageBounds }: SearchBarProps) {
  const isMobile = useIsMobile();
  const { canInstall, isIOS, hasNativePrompt, install } = usePWAInstall();
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasShownHint, setHasShownHint] = useState(() => {
    return localStorage.getItem('mineclimate-regenerate-hint-shown') === 'true';
  });
  
  const debouncedQuery = useDebounce(query, 300);

  // Show one-time hint after first image loads
  useEffect(() => {
    if (imageUrl && !isLoading && !hasShownHint) {
      const timer = setTimeout(() => {
        toast('Tap the refresh button to generate a new version of your city!', {
          duration: 6000,
          icon: '✨',
        });
        localStorage.setItem('mineclimate-regenerate-hint-shown', 'true');
        setHasShownHint(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [imageUrl, isLoading, hasShownHint]);

  const handleInstall = async () => {
    const result = await install();
    
    if (result === 'installed') {
      toast.success('App installed!');
    } else if (result === 'ios') {
      toast('Tap the Share button, then "Add to Home Screen"', {
        duration: 5000,
        icon: '📱',
      });
    } else if (result === 'manual') {
      toast('Use your browser menu to "Add to Home Screen" or "Install App"', {
        duration: 5000,
        icon: '📱',
      });
    }
  };

  useEffect(() => {
    async function search() {
      if (debouncedQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchCities(debouncedQuery);
        setSearchResults(results);
      } catch (e) {
        console.error('Search failed:', e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
    
    search();
  }, [debouncedQuery]);

  const handleSelectResult = (location: LocationData) => {
    onSelectLocation(location);
    setQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleClose = () => {
    setIsSearchOpen(false);
    setQuery('');
    setSearchResults([]);
  };

  const formatLocationLabel = (location: LocationData) => {
    const parts = [location.city];
    if (location.admin1) parts.push(location.admin1);
    if (location.country) parts.push(location.country);
    return parts.join(', ');
  };

  const createImageWithOverlay = async (): Promise<Blob | null> => {
    if (!imageUrl) return null;
    
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const img = new Image();
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });

    // Create canvas with image dimensions
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    // Draw base image
    ctx.drawImage(img, 0, 0);

    // Scale based on image size (assuming ~400px base width)
    const scale = img.width / 400;
    const centerX = canvas.width / 2;

    // Text shadow for all text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetY = 2 * scale;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // City name only (large, bold, centered at top)
    if (city) {
      const cityFontSize = 28 * scale;
      ctx.font = `700 ${cityFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(city, centerX, 40 * scale);
    }

    // Branding at bottom right
    const brandFontSize = 14 * scale;
    const padding = 20 * scale;
    ctx.font = `600 ${brandFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'right';
    
    const brandText = 'mineclimate';
    const brandTextWidth = ctx.measureText(brandText).width;
    const brandY = canvas.height - padding;
    
    ctx.fillText(brandText, canvas.width - padding, brandY);
    
    // Sun icon left of brand
    ctx.font = `${brandFontSize * 1.2}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('☀️', canvas.width - padding - brandTextWidth - brandFontSize * 1.5, brandY);

    URL.revokeObjectURL(img.src);

    return new Promise((resolve) => {
      canvas.toBlob((canvasBlob) => resolve(canvasBlob), 'image/png');
    });
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const blob = await createImageWithOverlay();
      if (!blob) {
        toast.error('Failed to create image');
        return;
      }

      const fileName = `${city || 'weather-city'}.png`;

      // On mobile / Capacitor WebView, the <a download> trick doesn't work.
      // Use the Web Share API to let the user save to gallery / files.
      if (navigator.share && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        const file = new File([blob], fileName, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: fileName,
        });
        toast.success('Image shared!');
        return;
      }

      // Desktop fallback: normal download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (e) {
      // User cancelled share dialog is not an error
      if (e instanceof Error && e.name === 'AbortError') return;
      toast.error('Failed to download image');
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    
    try {
      const blob = await createImageWithOverlay();
      if (!blob) {
        toast.error('Failed to create image');
        return;
      }

      if (navigator.share) {
        const file = new File([blob], `${city || 'weather-city'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: city ? `Weather in ${city}` : 'Weather City',
          text: city && temperature !== undefined 
            ? `Check out the weather in ${city}: ${Math.round(temperature)}°C!` 
            : 'Check out this beautiful weather city image!',
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-20 safe-area-bottom md:left-1/2 md:right-auto md:-translate-x-1/2"
      style={imageBounds && !isMobile ? { 
        width: `${imageBounds.width}px`,
        maxWidth: `${imageBounds.width}px`,
      } : undefined}
    >
      <div className="search-bar mx-4 mb-4 rounded-2xl p-3">
        {isSearchOpen ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search for a city..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 bg-secondary/50 focus-visible:ring-1 pr-8"
                  autoFocus
                  disabled={isLoading}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl bg-background/95 backdrop-blur-sm">
                {searchResults.map((location, index) => (
                  <button
                    key={`${location.latitude}-${location.longitude}-${index}`}
                    type="button"
                    onClick={() => handleSelectResult(location)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{formatLocationLabel(location)}</span>
                  </button>
                ))}
              </div>
            )}
            
            {debouncedQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                No cities found
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => !isLoading && setIsSearchOpen(true)}
              disabled={isLoading}
              className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-secondary/50 disabled:opacity-50"
            >
              <Search className="h-5 w-5 shrink-0" />
              <span className="text-sm">Search for a city...</span>
            </button>
            
            <TooltipProvider>
              <div className="flex gap-1">
                {canInstall && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={handleInstall}
                      >
                        <Smartphone className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Install App</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={handleDownload}
                      disabled={!imageUrl || isLoading}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={onRefresh}
                      disabled={!imageUrl || isLoading}
                    >
                      <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={handleShare}
                      disabled={!imageUrl || isLoading}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
}
