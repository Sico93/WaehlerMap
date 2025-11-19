import type { GeocodingResult, GeocodingError } from '../types';
import { getCachedLocation, cacheLocation } from './cacheService';
import { normalizeAddress } from './csvParser';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1500; // 1.5 seconds between requests (Nominatim limit: 1 req/sec)
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// User-Agent for Nominatim (required by their usage policy)
const USER_AGENT = 'WaehlerMap/1.0 (OpenSource Map Aggregator)';

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Geocode a single address using Nominatim
 * Includes retry logic and error handling
 */
const geocodeAddressAPI = async (
  address: string,
  attempt: number = 1
): Promise<{ lat: number; lon: number } | null> => {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GeocodingResult[] = await response.json();

    if (data.length === 0) {
      return null; // Address not found
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
  } catch (error) {
    console.error(`Geocoding attempt ${attempt} failed for "${address}":`, error);

    // Retry logic
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS);
      return geocodeAddressAPI(address, attempt + 1);
    }

    return null; // All retries failed
  }
};

/**
 * Geocode address with caching
 */
export const geocodeAddress = async (
  address: string
): Promise<{ lat: number; lon: number } | null> => {
  const normalized = normalizeAddress(address);

  // Check cache first
  const cached = getCachedLocation(normalized);
  if (cached) {
    console.log(`Cache hit for: ${address}`);
    return cached;
  }

  // Rate limiting: wait before API call
  await sleep(RATE_LIMIT_MS);

  // Call Nominatim API
  console.log(`Geocoding: ${address}`);
  const result = await geocodeAddressAPI(address);

  // Cache successful result
  if (result) {
    cacheLocation(normalized, result.lat, result.lon);
  }

  return result;
};

/**
 * Geocode multiple addresses with progress callback
 */
export const geocodeAddresses = async (
  addresses: Map<string, any>,
  onProgress?: (current: number, total: number, address: string, cached: boolean) => void,
  onError?: (error: GeocodingError) => void
): Promise<Map<string, { lat: number; lon: number }>> => {
  const results = new Map<string, { lat: number; lon: number }>();
  const addressList = Array.from(addresses.keys());
  const total = addressList.length;

  let processed = 0;

  for (const address of addressList) {
    const normalized = normalizeAddress(address);

    // Check cache
    const cached = getCachedLocation(normalized);
    if (cached) {
      results.set(address, cached);
      processed++;
      onProgress?.(processed, total, address, true);
      continue;
    }

    // Geocode via API
    await sleep(RATE_LIMIT_MS);

    const result = await geocodeAddressAPI(address);
    processed++;

    if (result) {
      results.set(address, result);
      cacheLocation(normalized, result.lat, result.lon);
      onProgress?.(processed, total, address, false);
    } else {
      // Handle error
      onError?.({
        address,
        reason: 'Adresse konnte nicht gefunden werden',
        attempts: MAX_RETRIES,
      });
      onProgress?.(processed, total, address, false);
    }
  }

  return results;
};
