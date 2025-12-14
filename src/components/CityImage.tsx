import { cn } from '@/lib/utils';
import { Loader2, Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';

interface CityImageProps {
  imageUrl: string | null;
  isGenerating: boolean;
  city: string;
  temperature?: number;
  condition?: 'sunny' | 'rainy' | 'snowy' | 'overcast';
}

const weatherIcons = {
  sunny: Sun,
  rainy: CloudRain,
  snowy: Snowflake,
  overcast: Cloud,
};

interface EdgeColors {
  top: string;
  bottom: string;
}

function sampleEdgeColors(img: HTMLImageElement): EdgeColors {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return { top: 'rgb(135, 206, 235)', bottom: 'rgb(210, 180, 140)' };
  }

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  // Sample multiple pixels from top and bottom edges and average them
  const sampleCount = 20;
  const width = canvas.width;
  const height = canvas.height;

  let topR = 0, topG = 0, topB = 0;
  let bottomR = 0, bottomG = 0, bottomB = 0;

  for (let i = 0; i < sampleCount; i++) {
    const x = Math.floor((width / sampleCount) * i + width / (sampleCount * 2));
    
    // Top edge - sample a few rows down to get consistent sky color
    const topPixel = ctx.getImageData(x, 5, 1, 1).data;
    topR += topPixel[0];
    topG += topPixel[1];
    topB += topPixel[2];

    // Bottom edge - sample a few rows up
    const bottomPixel = ctx.getImageData(x, height - 6, 1, 1).data;
    bottomR += bottomPixel[0];
    bottomG += bottomPixel[1];
    bottomB += bottomPixel[2];
  }

  topR = Math.round(topR / sampleCount);
  topG = Math.round(topG / sampleCount);
  topB = Math.round(topB / sampleCount);

  bottomR = Math.round(bottomR / sampleCount);
  bottomG = Math.round(bottomG / sampleCount);
  bottomB = Math.round(bottomB / sampleCount);

  return {
    top: `rgb(${topR}, ${topG}, ${topB})`,
    bottom: `rgb(${bottomR}, ${bottomG}, ${bottomB})`,
  };
}

export function CityImage({ imageUrl, isGenerating, city, temperature, condition }: CityImageProps) {
  const [edgeColors, setEdgeColors] = useState<EdgeColors | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const WeatherIcon = condition ? weatherIcons[condition] : null;
  const today = format(new Date(), 'EEEE, MMMM d');

  useEffect(() => {
    if (!imageUrl) {
      setEdgeColors(null);
      setImageLoaded(false);
      setImageError(false);
      return;
    }

    console.log('[CityImage] Loading image, URL length:', imageUrl.length);
    setImageLoaded(false);
    setImageError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('[CityImage] Image loaded successfully');
      const colors = sampleEdgeColors(img);
      setEdgeColors(colors);
      setImageLoaded(true);
    };
    
    img.onerror = (e) => {
      console.error('[CityImage] Image failed to load:', e);
      setImageError(true);
      setImageLoaded(false);
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  return (
    <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/30">
      {/* Top gradient overlay */}
      {edgeColors && (
        <div 
          className="absolute inset-x-0 top-0 h-[25%] z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${edgeColors.top} 0%, ${edgeColors.top} 40%, transparent 100%)`,
          }}
        />
      )}
      
      {/* Bottom gradient overlay */}
      {edgeColors && (
        <div 
          className="absolute inset-x-0 bottom-0 h-[25%] z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${edgeColors.bottom} 0%, ${edgeColors.bottom} 40%, transparent 100%)`,
          }}
        />
      )}

      {/* Background color matching edges */}
      {edgeColors && (
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${edgeColors.top} 0%, ${edgeColors.top} 20%, ${edgeColors.bottom} 80%, ${edgeColors.bottom} 100%)`,
          }}
        />
      )}
      
      {imageUrl ? (
        <>
          <img
            ref={imgRef}
            src={imageUrl}
            alt={`Isometric city view of ${city}`}
            className={cn(
              "relative z-[5] h-full w-full object-contain transition-opacity duration-500",
              isGenerating && "opacity-60"
            )}
          />
          
          {/* Text overlay - positioned to overlap image on mobile */}
          <div className="absolute inset-x-0 top-[15%] md:top-8 z-20 flex flex-col items-center text-center pointer-events-none">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {city}
            </h1>
            {WeatherIcon && (
              <WeatherIcon className="mt-2 h-6 w-6 md:h-8 md:w-8 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
            )}
            <p className="mt-1 text-xs md:text-sm text-white/90 drop-shadow-md" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {today}
            </p>
            {temperature !== undefined && (
              <p className="mt-1 text-lg md:text-xl font-semibold text-white drop-shadow-lg" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                {Math.round(temperature)}°C
              </p>
            )}
          </div>
        </>
      ) : imageError ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
          <div className="text-center">
            <p className="text-sm text-destructive">Failed to load image</p>
            <p className="mt-2 text-xs text-muted-foreground">Try refreshing</p>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Generating your city...
            </p>
          </div>
        </div>
      )}
      
      {isGenerating && imageUrl && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/20 backdrop-blur-sm">
          <div className="rounded-full bg-background/90 p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
