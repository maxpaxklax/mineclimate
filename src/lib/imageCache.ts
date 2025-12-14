import { WeatherCondition } from './weather';

const DB_NAME = 'weather-city-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface CachedImage {
  id: string;
  city: string;
  condition: WeatherCondition;
  imageData: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('city', 'city', { unique: false });
      }
    };
  });
}

export async function getCachedImage(city: string): Promise<CachedImage | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(city.toLowerCase());
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (e) {
    console.error('Failed to get cached image:', e);
    return null;
  }
}

export async function setCachedImage(
  city: string,
  condition: WeatherCondition,
  imageData: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data: CachedImage = {
        id: city.toLowerCase(),
        city,
        condition,
        imageData,
        timestamp: Date.now(),
      };
      
      const request = store.put(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Failed to cache image:', e);
  }
}

export function isCacheValid(cached: CachedImage, currentCondition: WeatherCondition): boolean {
  const now = Date.now();
  const age = now - cached.timestamp;
  
  // Cache is invalid if older than 3 hours
  if (age > CACHE_DURATION_MS) {
    return false;
  }
  
  // Cache is invalid if weather condition changed
  if (cached.condition !== currentCondition) {
    return false;
  }
  
  return true;
}

export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('Image cache cleared');
        resolve();
      };
    });
  } catch (e) {
    console.error('Failed to clear cache:', e);
  }
}
