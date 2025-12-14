import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import { WeatherData, LocationData } from '@/lib/weather';

interface WeatherCardProps {
  weather: WeatherData;
  location: LocationData;
}

export function WeatherCard({ weather, location }: WeatherCardProps) {
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="absolute bottom-24 left-4 right-4 z-10">
      <div className="weather-card rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">
                {location.city}
                {location.country && `, ${location.country}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">{today}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-3xl">{weather.icon}</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{weather.temperature}°</p>
              <p className="text-xs text-muted-foreground">{weather.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
