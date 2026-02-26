import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fetchForecast, ForecastDay, HourlySlot, LocationData } from '@/lib/weather';
import { useIsMobile } from '@/hooks/use-mobile';
import { Droplets } from 'lucide-react';

interface WeatherCardProps {
  location: LocationData;
  imageBounds?: { left: number; width: number } | null;
}

export function WeatherCard({ location, imageBounds }: WeatherCardProps) {
  const isMobile = useIsMobile();
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!location) return;
    
    setIsLoading(true);
    setExpandedIndex(null);
    fetchForecast(location.latitude, location.longitude)
      .then(setForecast)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [location.latitude, location.longitude]);

  const toggleDay = (index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

  return (
    <div 
      className="absolute bottom-20 z-10 left-4 right-4 md:bottom-20 md:left-1/2 md:right-auto md:-translate-x-1/2"
      style={imageBounds && !isMobile ? { 
        width: `${imageBounds.width - 32}px`,
        maxWidth: `${imageBounds.width - 32}px`,
      } : undefined}
    >
      <div className="weather-card rounded-2xl p-3 backdrop-blur-xl">
        {/* Daily forecast strip */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-14 h-20 bg-muted/30 rounded-xl animate-pulse" />
            ))
          ) : (
            forecast.map((day, i) => (
              <button
                key={day.date.toISOString()}
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl min-w-[3.5rem] transition-colors duration-200 ${
                  expandedIndex === i 
                    ? 'bg-muted/40 ring-1 ring-foreground/10' 
                    : 'bg-muted/20 active:bg-muted/30'
                }`}
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {i === 0 ? 'Today' : format(day.date, 'EEE')}
                </span>
                <span className="text-xl">{day.icon}</span>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-foreground">{day.tempHigh}°</span>
                  <span className="text-[10px] text-muted-foreground">{day.tempLow}°</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Hourly expand row */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: expandedIndex !== null ? '120px' : '0px',
            opacity: expandedIndex !== null ? 1 : 0,
            marginTop: expandedIndex !== null ? '8px' : '0px',
          }}
        >
          {expandedIndex !== null && forecast[expandedIndex] && (
            <HourlyRow hourly={forecast[expandedIndex].hourly} />
          )}
        </div>
      </div>
    </div>
  );
}

function HourlyRow({ hourly }: { hourly: HourlySlot[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide rounded-xl bg-muted/10 p-2">
      {hourly.length === 0 ? (
        <span className="text-xs text-muted-foreground px-2 py-3">No hourly data</span>
      ) : (
        hourly.map((slot) => (
          <div
            key={slot.time.toISOString()}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg min-w-[2.75rem]"
          >
            <span className="text-[9px] font-medium text-muted-foreground">
              {format(slot.time, 'HH:mm')}
            </span>
            <span className="text-base leading-none">{slot.icon}</span>
            <span className="text-[11px] font-semibold text-foreground">{slot.temperature}°</span>
            {slot.precipitationProbability > 0 && (
              <div className="flex items-center gap-0.5">
                <Droplets className="h-2 w-2 text-blue-400" />
                <span className="text-[8px] text-blue-400 font-medium">{slot.precipitationProbability}%</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
