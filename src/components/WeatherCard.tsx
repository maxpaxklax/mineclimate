import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fetchForecast, ForecastDay, LocationData } from '@/lib/weather';

interface WeatherCardProps {
  location: LocationData;
}

export function WeatherCard({ location }: WeatherCardProps) {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!location) return;
    
    setIsLoading(true);
    fetchForecast(location.latitude, location.longitude)
      .then(setForecast)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [location.latitude, location.longitude]);

  return (
    <div className="absolute bottom-24 left-4 right-4 z-10">
      <div className="weather-card rounded-2xl p-3 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-14 h-20 bg-muted/30 rounded-xl animate-pulse" />
            ))
          ) : (
            forecast.map((day, i) => (
              <div 
                key={day.date.toISOString()} 
                className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl bg-muted/20 min-w-[3.5rem]"
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {i === 0 ? 'Today' : format(day.date, 'EEE')}
                </span>
                <span className="text-xl">{day.icon}</span>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-foreground">{day.tempHigh}°</span>
                  <span className="text-[10px] text-muted-foreground">{day.tempLow}°</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}