import type { LocationGroup } from '../types';

const STORAGE_KEY = 'waehlermap_location_groups';

/**
 * Save location groups to LocalStorage
 */
export const saveGroups = (groups: LocationGroup[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error('Failed to save location groups:', error);
  }
};

/**
 * Load location groups from LocalStorage
 */
export const loadGroups = (): LocationGroup[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load location groups:', error);
    return [];
  }
};

/**
 * Clear all location groups from LocalStorage
 */
export const clearGroups = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear location groups:', error);
  }
};
