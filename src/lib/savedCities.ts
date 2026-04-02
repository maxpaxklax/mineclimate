import { LocationData, WeatherCondition } from './weather';

const STORAGE_KEY = 'mineclimate_saved_cities';
const MAX_SAVED = 5;

export interface SavedCity {
  location: LocationData;
  imageUrl: string;
  temperature: number;
  condition: WeatherCondition;
  savedAt: number;
}

export function getSavedCities(): SavedCity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(cities: SavedCity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

export function isImageSaved(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;
  return getSavedCities().some((city) => city.imageUrl === imageUrl);
}

export function saveCity(
  location: LocationData,
  imageUrl: string,
  temperature: number,
  condition: WeatherCondition,
): { success: boolean; reason?: string } {
  const cities = getSavedCities();

  if (isImageSaved(imageUrl)) {
    const filtered = cities.filter((city) => city.imageUrl !== imageUrl);
    persist(filtered);
    return { success: true, reason: 'removed' };
  }

  if (cities.length >= MAX_SAVED) {
    return { success: false, reason: 'max' };
  }

  cities.push({
    location,
    imageUrl,
    temperature,
    condition,
    savedAt: Date.now(),
  });
  persist(cities);
  return { success: true, reason: 'added' };
}

export function removeCity(cityName: string) {
  const cities = getSavedCities().filter(
    c => c.location.city.toLowerCase() !== cityName.toLowerCase(),
  );
  persist(cities);
}
