import { useState } from 'react';
import { Search, Share2, Download, RefreshCw, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SearchBarProps {
  onSearch: (city: string) => void;
  onRefresh: () => void;
  onOpenCredits: () => void;
  imageUrl: string | null;
  isLoading: boolean;
  city?: string;
  temperature?: number;
  condition?: 'sunny' | 'rainy' | 'snowy' | 'overcast';
  freeRefreshesLeft: number;
  credits: number;
}

const weatherEmojis: Record<string, string> = {
  sunny: '☀️',
  rainy: '🌧️',
  snowy: '❄️',
  overcast: '☁️',
};

export function SearchBar({ onSearch, onRefresh, onOpenCredits, imageUrl, isLoading, city, temperature, condition, freeRefreshesLeft, credits }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
      setIsSearchOpen(false);
    }
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
    const totalWidth = iconSize + iconGap + brandTextWidth;
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
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for a city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 bg-secondary/50 focus-visible:ring-1"
              autoFocus
              disabled={isLoading}
            />
            <Button type="submit" size="sm" disabled={isLoading || !query.trim()}>
              Go
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setIsSearchOpen(true)}
                disabled={isLoading}
              >
                <Search className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-10 gap-1.5 px-3"
                onClick={onOpenCredits}
              >
                <Coins className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {freeRefreshesLeft > 0 ? `${freeRefreshesLeft} free` : credits}
                </span>
              </Button>
            </div>
            
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
