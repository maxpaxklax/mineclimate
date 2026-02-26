// Weather condition mapping
export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'overcast';

export interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
}

export interface HourlySlot {
  time: Date;
  temperature: number;
  condition: WeatherCondition;
  icon: string;
  precipitationProbability: number;
}

export interface ForecastDay {
  date: Date;
  tempHigh: number;
  tempLow: number;
  condition: WeatherCondition;
  icon: string;
  hourly: HourlySlot[];
}

export interface LocationData {
  city: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

// WMO Weather interpretation codes mapping
// https://open-meteo.com/en/docs
function mapWMOCodeToCondition(code: number): { condition: WeatherCondition; description: string } {
  // Clear sky
  if (code === 0) {
    return { condition: 'sunny', description: 'Clear sky' };
  }
  // Mainly clear, partly cloudy
  if (code >= 1 && code <= 2) {
    return { condition: 'sunny', description: 'Partly cloudy' };
  }
  // Overcast
  if (code === 3) {
    return { condition: 'overcast', description: 'Overcast' };
  }
  // Fog
  if (code >= 45 && code <= 48) {
    return { condition: 'overcast', description: 'Foggy' };
  }
  // Drizzle
  if (code >= 51 && code <= 57) {
    return { condition: 'rainy', description: 'Drizzle' };
  }
  // Rain
  if (code >= 61 && code <= 67) {
    return { condition: 'rainy', description: 'Rainy' };
  }
  // Snow
  if (code >= 71 && code <= 77) {
    return { condition: 'snowy', description: 'Snowy' };
  }
  // Rain showers
  if (code >= 80 && code <= 82) {
    return { condition: 'rainy', description: 'Rain showers' };
  }
  // Snow showers
  if (code >= 85 && code <= 86) {
    return { condition: 'snowy', description: 'Snow showers' };
  }
  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return { condition: 'rainy', description: 'Thunderstorm' };
  }
  
  return { condition: 'overcast', description: 'Cloudy' };
}

export function getWeatherIcon(condition: WeatherCondition): string {
  switch (condition) {
    case 'sunny':
      return '☀️';
    case 'rainy':
      return '🌧️';
    case 'snowy':
      return '❄️';
    case 'overcast':
      return '☁️';
  }
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = await response.json();
  const { condition, description } = mapWMOCodeToCondition(data.current.weather_code);
  
  return {
    temperature: Math.round(data.current.temperature_2m),
    condition,
    description,
    icon: getWeatherIcon(condition),
  };
}

export async function fetchForecast(latitude: number, longitude: number): Promise<ForecastDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto&forecast_days=7`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch forecast data');
  }
  
  const data = await response.json();

  // Group hourly data by date (every 2 hours)
  const hourlyByDate: Record<string, HourlySlot[]> = {};
  if (data.hourly) {
    data.hourly.time.forEach((timeStr: string, i: number) => {
      const dt = new Date(timeStr);
      const hour = dt.getHours();
      // Only keep every 2 hours
      if (hour % 2 !== 0) return;
      const dateKey = timeStr.substring(0, 10);
      if (!hourlyByDate[dateKey]) hourlyByDate[dateKey] = [];
      const { condition } = mapWMOCodeToCondition(data.hourly.weather_code[i]);
      hourlyByDate[dateKey].push({
        time: dt,
        temperature: Math.round(data.hourly.temperature_2m[i]),
        condition,
        icon: getWeatherIcon(condition),
        precipitationProbability: data.hourly.precipitation_probability?.[i] ?? 0,
      });
    });
  }
  
  return data.daily.time.map((dateStr: string, i: number) => {
    const { condition } = mapWMOCodeToCondition(data.daily.weather_code[i]);
    return {
      date: new Date(dateStr),
      tempHigh: Math.round(data.daily.temperature_2m_max[i]),
      tempLow: Math.round(data.daily.temperature_2m_min[i]),
      condition,
      icon: getWeatherIcon(condition),
      hourly: hourlyByDate[dateStr] || [],
    };
  });
}

export async function searchCities(query: string): Promise<LocationData[]> {
  const trimmedQuery = query.trim();
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmedQuery)}&count=5&language=en&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search city');
  }
  
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    return [];
  }
  
  return data.results.map((result: any) => ({
    city: result.name,
    country: result.country || '',
    admin1: result.admin1 || '',
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
  // Open-Meteo doesn't have reverse geocoding, so we'll use a simple approach
  // by searching nearby and using the location data
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=city&count=1&language=en&format=json`;
  
  // For reverse geocoding, we'll use BigDataCloud free API
  const reverseUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
  
  try {
    const response = await fetch(reverseUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        city: data.city || data.locality || 'Unknown Location',
        country: data.countryName || '',
        latitude,
        longitude,
      };
    }
  } catch (e) {
    console.error('Reverse geocoding failed:', e);
  }
  
  return {
    city: 'Unknown Location',
    country: '',
    latitude,
    longitude,
  };
}
