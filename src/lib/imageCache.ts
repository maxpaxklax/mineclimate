import { WeatherCondition } from './weather';

const DB_NAME = 'weather-city-images';
const STORE_NAME = 'images';
const DB_VERSION = 2; // Bump version for new schema
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface CachedImage {
  id: string;
  city: string;
  condition: WeatherCondition;
  imageUrl: string; // Now stores HTTPS URL, not base64
  etag: string;
  generatedAt: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Delete old store if exists (schema changed from base64 to URL)
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('city', 'city', { unique: false });
      store.createIndex('etag', 'etag', { unique: false });
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
    console.error('[ImageCache] Failed to get cached image:', e);
    return null;
  }
}

export interface CacheImageParams {
  city: string;
  condition: WeatherCondition;
  imageUrl: string;
  etag: string;
  generatedAt: string;
}

export async function setCachedImage(params: CacheImageParams): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data: CachedImage = {
        id: params.city.toLowerCase(),
        city: params.city,
        condition: params.condition,
        imageUrl: params.imageUrl,
        etag: params.etag,
        generatedAt: params.generatedAt,
        timestamp: Date.now(),
      };
      
      console.log('[ImageCache] Caching image:', { 
        city: params.city, 
        etag: params.etag,
        urlLength: params.imageUrl.length 
      });
      
      const request = store.put(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[ImageCache] Image cached successfully');
        resolve();
      };
    });
  } catch (e) {
    console.error('[ImageCache] Failed to cache image:', e);
  }
}

export function isCacheValid(cached: CachedImage, currentCondition: WeatherCondition): boolean {
  const now = Date.now();
  const age = now - cached.timestamp;
  
  // Cache is invalid if older than 3 hours
  if (age > CACHE_DURATION_MS) {
    console.log('[ImageCache] Cache expired:', { age, maxAge: CACHE_DURATION_MS });
    return false;
  }
  
  // Cache is invalid if weather condition changed
  if (cached.condition !== currentCondition) {
    console.log('[ImageCache] Condition changed:', { cached: cached.condition, current: currentCondition });
    return false;
  }
  
  console.log('[ImageCache] Cache valid, etag:', cached.etag);
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
        console.log('[ImageCache] Cache cleared');
        resolve();
      };
    });
  } catch (e) {
    console.error('[ImageCache] Failed to clear cache:', e);
  }
}
