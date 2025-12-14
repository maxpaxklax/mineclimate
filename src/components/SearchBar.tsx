import { useState, useEffect } from 'react';
import { Search, Share2, Download, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { searchCities, LocationData } from '@/lib/weather';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSelectLocation: (location: LocationData) => void;
  onRefresh: () => void;
  imageUrl: string | null;
  isLoading: boolean;
  city?: string;
  temperature?: number;
  condition?: 'sunny' | 'rainy' | 'snowy' | 'overcast';
}

const weatherEmojis: Record<string, string> = {
  sunny: '☀️',
  rainy: '🌧️',
  snowy: '❄️',
  overcast: '☁️',
};

export function SearchBar({ onSelectLocation, onRefresh, imageUrl, isLoading, city, temperature, condition }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

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

    // Configure text style
    const scale = img.width / 400; // Scale based on image size
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    
    // Add text shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetY = 2 * scale;

    const centerX = canvas.width / 2;
    const fontSize = 18 * scale;
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`;

    // Line 1: City • ☀️ • 25°C
    const line1Parts: string[] = [];
    if (city) line1Parts.push(city);
    if (condition) line1Parts.push(weatherEmojis[condition] || '');
    if (temperature !== undefined) line1Parts.push(`${Math.round(temperature)}°C`);
    
    // Line 2: Date
    const today = format(new Date(), 'EEEE, MMMM d');

    const line1 = line1Parts.join('  •  ');
    const lineHeight = fontSize * 1.4;
    
    ctx.fillText(line1, centerX, 32 * scale);
    ctx.fillText(today, centerX, 32 * scale + lineHeight);
    
    // Add Mineclima branding at bottom right with icon
    const brandFontSize = 14 * scale;
    ctx.font = `600 ${brandFontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'right';
    
    const brandText = 'Mineclima';
    const iconSize = brandFontSize * 1.2;
    const padding = 20 * scale;
    const iconGap = 6 * scale;
    
    // Draw weather icon (sun emoji as brand icon)
    const brandTextWidth = ctx.measureText(brandText).width;
    const startX = canvas.width - padding - brandTextWidth;
    const brandY = canvas.height - padding;
    
    // Draw the brand text
    ctx.fillText(brandText, canvas.width - padding, brandY);
    
    // Draw a simple sun icon to the left of the text
    ctx.font = `${iconSize}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('☀️', startX - iconSize - iconGap, brandY);

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
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${city || 'weather-city'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (e) {
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
    <div className="fixed bottom-0 left-0 right-0 z-20 safe-area-bottom">
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
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleDownload}
                disabled={!imageUrl || isLoading}
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={onRefresh}
                disabled={!imageUrl || isLoading}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleShare}
                disabled={!imageUrl || isLoading}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
