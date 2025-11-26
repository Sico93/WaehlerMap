import type { CSVRow, ProcessedLocation, AggregatedLocation, LocationGroup } from '../types';
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
 * Recalculate counts based on selected categories
 * Filters entries and recalculates totalCount and categoryCounts
 */
export const recalculateCountsForCategories = (
  locations: AggregatedLocation[],
  selectedCategories: string[]
): AggregatedLocation[] => {
  if (selectedCategories.length === 0) {
    return locations; // No filter, return as-is
  }

  return locations
    .map(loc => {
      // Filter entries to only include selected categories
      const filteredEntries = loc.entries.filter(entry =>
        selectedCategories.includes(entry.category)
      );

      // Skip if no entries match
      if (filteredEntries.length === 0) {
        return null;
      }

      // Recalculate category counts from filtered entries
      const categoryCounts: Record<string, number> = {};
      filteredEntries.forEach(entry => {
        const cat = entry.category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      return {
        ...loc,
        totalCount: filteredEntries.length,
        categoryCounts,
        entries: filteredEntries,
      };
    })
    .filter((loc): loc is AggregatedLocation => loc !== null);
};

/**
 * Filter aggregated locations by categories (DEPRECATED - use recalculateCountsForCategories)
 * @deprecated Use recalculateCountsForCategories for consistent count display
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
 * Extract city from location (from first entry's source row)
 */
const getCityFromLocation = (location: AggregatedLocation): string | null => {
  if (location.entries.length === 0) return null;
  const city = location.entries[0].sourceRow.city;
  return city ? city.trim().toLowerCase() : null;
};

/**
 * Filter aggregated locations by minimum count
 * If groupByCity is true, locations in the same city are counted together
 */
export const filterByMinCount = (
  locations: AggregatedLocation[],
  minCount: number,
  groupByCity: boolean = false
): AggregatedLocation[] => {
  if (minCount <= 0) {
    return locations;
  }

  // If not grouping by city, use simple individual count check
  if (!groupByCity) {
    return locations.filter((loc) => loc.totalCount >= minCount);
  }

  // Group by city: calculate total persons per city
  const cityTotals = new Map<string, number>();

  locations.forEach((loc) => {
    const city = getCityFromLocation(loc);
    if (city) {
      const current = cityTotals.get(city) || 0;
      cityTotals.set(city, current + loc.totalCount);
    }
  });

  // Filter: keep locations if their city's total >= minCount
  return locations.filter((loc) => {
    const city = getCityFromLocation(loc);
    if (!city) {
      // Locations without city are kept if they individually meet the requirement
      return loc.totalCount >= minCount;
    }
    const cityTotal = cityTotals.get(city) || 0;
    return cityTotal >= minCount;
  });
};

/**
 * Apply all filters
 */
export const applyFilters = (
  locations: AggregatedLocation[],
  selectedCategories: string[],
  minCount: number,
  groupByCity: boolean = false
): AggregatedLocation[] => {
  let filtered = locations;

  // Recalculate counts for selected categories (also filters out locations with no matching categories)
  filtered = recalculateCountsForCategories(filtered, selectedCategories);

  // Apply min count filter (with optional city grouping)
  filtered = filterByMinCount(filtered, minCount, groupByCity);

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

/**
 * Merge multiple locations into a single aggregated location
 */
export const mergeLocations = (
  locations: AggregatedLocation[],
  groupName: string
): AggregatedLocation => {
  if (locations.length === 0) {
    throw new Error('Cannot merge empty location array');
  }

  if (locations.length === 1) {
    return { ...locations[0], address: groupName };
  }

  // Merge all entries
  const allEntries: ProcessedLocation[] = [];
  locations.forEach(loc => allEntries.push(...loc.entries));

  // Merge category counts
  const categoryCounts: Record<string, number> = {};
  locations.forEach(loc => {
    Object.entries(loc.categoryCounts).forEach(([cat, count]) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
    });
  });

  // Find largest location for pin placement
  // If multiple have same size, use first selected (order preserved in locations array)
  const largestLocation = locations.reduce((largest, current) =>
    current.totalCount > largest.totalCount ? current : largest
  );

  return {
    id: crypto.randomUUID(),
    lat: largestLocation.lat,
    lon: largestLocation.lon,
    address: groupName,
    totalCount: allEntries.length,
    categoryCounts,
    entries: allEntries,
    originalLocations: locations, // Store original locations for detailed view
  };
};

/**
 * Apply location groups to merge selected locations
 */
export const applyLocationGroups = (
  locations: AggregatedLocation[],
  groups: LocationGroup[]
): AggregatedLocation[] => {
  if (groups.length === 0) {
    return locations;
  }

  // Create map of location ID to group
  const locationToGroup = new Map<string, LocationGroup>();
  groups.forEach(group => {
    group.locationIds.forEach(id => {
      locationToGroup.set(id, group);
    });
  });

  const result: AggregatedLocation[] = [];
  const processedIds = new Set<string>();

  locations.forEach(loc => {
    if (processedIds.has(loc.id)) {
      return; // Already processed as part of a group
    }

    const group = locationToGroup.get(loc.id);

    if (group) {
      // Find all locations in this group
      const groupLocations = locations.filter(l =>
        group.locationIds.includes(l.id)
      );

      // Merge them
      const merged = mergeLocations(groupLocations, group.name);
      result.push(merged);

      // Mark all as processed
      groupLocations.forEach(l => processedIds.add(l.id));
    } else {
      // Not in any group, keep as-is
      result.push(loc);
      processedIds.add(loc.id);
    }
  });

  return result;
};
