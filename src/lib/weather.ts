// Weather condition mapping
export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'overcast';

export interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
}

export interface LocationData {
  city: string;
  country: string;
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

export async function searchCity(query: string): Promise<LocationData | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search city');
  }
  
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    return null;
  }
  
  const result = data.results[0];
  return {
    city: result.name,
    country: result.country || '',
    latitude: result.latitude,
    longitude: result.longitude,
  };
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
