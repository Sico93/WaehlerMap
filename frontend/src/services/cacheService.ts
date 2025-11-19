import type { CacheEntry } from '../types';

const CACHE_KEY = 'waehlermap_geocoding_cache';
const CACHE_VERSION = 'v1';
const CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days

interface CacheStorage {
  version: string;
  entries: Record<string, CacheEntry>;
}

/**
 * Get geocoding cache from LocalStorage
 */
const getCache = (): CacheStorage => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return { version: CACHE_VERSION, entries: {} };
    }

    const parsed: CacheStorage = JSON.parse(cached);

    // Check version compatibility
    if (parsed.version !== CACHE_VERSION) {
      console.warn('Cache version mismatch, clearing cache');
      return { version: CACHE_VERSION, entries: {} };
    }

    return parsed;
  } catch (error) {
    console.error('Error reading cache:', error);
    return { version: CACHE_VERSION, entries: {} };
  }
};

/**
 * Save cache to LocalStorage
 */
const saveCache = (cache: CacheStorage): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving cache:', error);
  }
};

/**
 * Check if cache entry is expired
 */
const isExpired = (entry: CacheEntry): boolean => {
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return now - entry.timestamp > expiryTime;
};

/**
 * Get cached geocoding result for address
 */
export const getCachedLocation = (
  normalizedAddress: string
): { lat: number; lon: number } | null => {
  const cache = getCache();
  const entry = cache.entries[normalizedAddress];

  if (!entry) {
    return null;
  }

  // Check if expired
  if (isExpired(entry)) {
    delete cache.entries[normalizedAddress];
    saveCache(cache);
    return null;
  }

  return { lat: entry.lat, lon: entry.lon };
};

/**
 * Save geocoding result to cache
 */
export const cacheLocation = (
  normalizedAddress: string,
  lat: number,
  lon: number
): void => {
  const cache = getCache();

  cache.entries[normalizedAddress] = {
    address: normalizedAddress,
    lat,
    lon,
    timestamp: Date.now(),
  };

  saveCache(cache);
};

/**
 * Clear all cache
 */
export const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): {
  totalEntries: number;
  expiredEntries: number;
  sizeKB: number;
} => {
  const cache = getCache();
  const entries = Object.values(cache.entries);

  const expiredCount = entries.filter(isExpired).length;

  const sizeKB =
    new Blob([JSON.stringify(cache)]).size / 1024;

  return {
    totalEntries: entries.length,
    expiredEntries: expiredCount,
    sizeKB: Math.round(sizeKB * 100) / 100,
  };
};
