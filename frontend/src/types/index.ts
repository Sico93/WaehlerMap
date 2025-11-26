/**
 * Type definitions for WaehlerMap application
 */

// CSV Row from uploaded file
export interface CSVRow {
  address?: string;
  category: string;
  street?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  country?: string;
  additionalInfo?: string;
}

// Processed location after geocoding
export interface ProcessedLocation {
  id: string;
  lat: number;
  lon: number;
  category: string;
  rawAddress: string;
  sourceRow: CSVRow;
}

// Aggregated location (multiple entries at same address)
export interface AggregatedLocation {
  id: string;
  lat: number;
  lon: number;
  address: string;
  totalCount: number;
  categoryCounts: Record<string, number>; // e.g., { "DTS": 15, "ISP": 8, "GK": 3 }
  entries: ProcessedLocation[];
}

// Geocoding result from Nominatim
export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Geocoding cache entry
export interface CacheEntry {
  address: string;
  lat: number;
  lon: number;
  timestamp: number;
}

// Geocoding error
export interface GeocodingError {
  address: string;
  reason: string;
  attempts: number;
}

// Filter state
export interface FilterState {
  selectedCategories: string[];
  minCount: number;
  groupByCity: boolean; // Group locations by city for minimum count filter
}

// Geocoding progress
export interface GeocodingProgress {
  total: number;
  processed: number;
  cached: number;
  failed: number;
  current: string;
}

// Location Group (manual linking)
export interface LocationGroup {
  id: string;
  name: string;
  locationIds: string[]; // IDs of locations in this group
  createdAt: number; // timestamp
}
