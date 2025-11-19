import type { CSVRow, ProcessedLocation, AggregatedLocation } from '../types';
import { buildAddress } from './csvParser';

/**
 * Create ProcessedLocation from CSV row and geocoding result
 */
export const createProcessedLocation = (
  row: CSVRow,
  lat: number,
  lon: number
): ProcessedLocation => {
  return {
    id: crypto.randomUUID(),
    lat,
    lon,
    category: row.category,
    rawAddress: buildAddress(row),
    sourceRow: row,
  };
};

/**
 * Aggregate locations by coordinates
 * Groups entries at the same address/location
 */
export const aggregateLocations = (
  locations: ProcessedLocation[]
): AggregatedLocation[] => {
  // Group by coordinates (rounded to 6 decimals for ~0.1m precision)
  const locationMap = new Map<string, ProcessedLocation[]>();

  locations.forEach((loc) => {
    const key = `${loc.lat.toFixed(6)},${loc.lon.toFixed(6)}`;

    if (!locationMap.has(key)) {
      locationMap.set(key, []);
    }
    locationMap.get(key)!.push(loc);
  });

  // Create aggregated locations
  const aggregated: AggregatedLocation[] = [];

  locationMap.forEach((entries) => {
    if (entries.length === 0) return;

    // Count categories
    const categoryCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      const cat = entry.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Use first entry's coordinates and address
    const first = entries[0];

    aggregated.push({
      id: crypto.randomUUID(),
      lat: first.lat,
      lon: first.lon,
      address: first.rawAddress,
      totalCount: entries.length,
      categoryCounts,
      entries,
    });
  });

  return aggregated;
};

/**
 * Filter aggregated locations by categories
 */
export const filterByCategories = (
  locations: AggregatedLocation[],
  selectedCategories: string[]
): AggregatedLocation[] => {
  if (selectedCategories.length === 0) {
    return locations;
  }

  return locations.filter((loc) => {
    return selectedCategories.some((cat) => cat in loc.categoryCounts);
  });
};

/**
 * Filter aggregated locations by minimum count
 */
export const filterByMinCount = (
  locations: AggregatedLocation[],
  minCount: number
): AggregatedLocation[] => {
  if (minCount <= 0) {
    return locations;
  }

  return locations.filter((loc) => loc.totalCount >= minCount);
};

/**
 * Apply all filters
 */
export const applyFilters = (
  locations: AggregatedLocation[],
  selectedCategories: string[],
  minCount: number
): AggregatedLocation[] => {
  let filtered = locations;

  // Apply category filter
  filtered = filterByCategories(filtered, selectedCategories);

  // Apply min count filter
  filtered = filterByMinCount(filtered, minCount);

  return filtered;
};

/**
 * Get all unique categories from locations
 */
export const getUniqueCategories = (locations: AggregatedLocation[]): string[] => {
  const categories = new Set<string>();

  locations.forEach((loc) => {
    Object.keys(loc.categoryCounts).forEach((cat) => {
      categories.add(cat);
    });
  });

  return Array.from(categories).sort();
};
