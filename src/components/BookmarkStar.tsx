import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { isCitySaved, saveCity } from '@/lib/savedCities';
import { LocationData, WeatherCondition } from '@/lib/weather';
import { toast } from 'sonner';

interface BookmarkStarProps {
  city: string;
  location: LocationData | null;
  imageUrl: string | null;
  temperature?: number;
  condition?: WeatherCondition;
  onToggle?: (saved: boolean) => void;
}

export function BookmarkStar({ city, location, imageUrl, temperature, condition, onToggle }: BookmarkStarProps) {
  const [saved, setSaved] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    setSaved(isCitySaved(city));
  }, [city]);

  const handleTap = () => {
    if (!location || !imageUrl || temperature === undefined || !condition) return;

    const result = saveCity(location, imageUrl, temperature, condition);

    if (!result.success && result.reason === 'max') {
      toast('You can save up to 5 cities. Remove one first!', { icon: '⭐' });
      return;
    }

    const nowSaved = result.reason === 'added';
    setSaved(nowSaved);
    onToggle?.(nowSaved);

    if (nowSaved) {
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleTap}
        disabled={!imageUrl}
        className="p-2 transition-transform duration-200 active:scale-90 disabled:opacity-30"
        aria-label={saved ? 'Remove from saved cities' : 'Save city'}
      >
        <Star
          className={`h-7 w-7 drop-shadow-lg transition-all duration-300 ${
            saved
              ? 'fill-yellow-400 text-yellow-400 scale-110'
              : 'fill-transparent text-white/80'
          }`}
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
        />
      </button>

      {/* Speech bubble */}
      {showBubble && (
        <div className="absolute right-0 top-full mt-2 animate-fade-in z-30 pointer-events-none">
          <div className="relative bg-background/95 backdrop-blur-sm text-foreground text-xs rounded-xl px-3 py-2 shadow-lg whitespace-nowrap">
            {/* Arrow */}
            <div className="absolute -top-1.5 right-4 w-3 h-3 rotate-45 bg-background/95" />
            Swipe left to visit your saved cities!
          </div>
        </div>
      )}
    </div>
  );
}
