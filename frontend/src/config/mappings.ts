/**
 * Configuration for CSV column and department mappings
 *
 * This file allows flexible mapping of:
 * 1. CSV column names to internal field names
 * 2. Department values (long names, abbreviations) to internal codes and display names
 */

/**
 * COLUMN MAPPING
 * Maps CSV column names to internal field names
 * Key = CSV column name (case-insensitive), Value = internal field name
 *
 * Example: If your CSV has "Kategorie" instead of "category", add:
 * 'kategorie': 'category'
 */
export const COLUMN_MAPPING: Record<string, string> = {
  // Address fields
  'address': 'address',
  'adresse': 'address',
  'anschrift': 'address',

  // Category/Department field
  'category': 'category',
  'kategorie': 'category',
  'abteilung': 'category',
  'bereich': 'category',

  // Street
  'street': 'street',
  'straße': 'street',
  'strasse': 'street',

  // House number
  'housenumber': 'houseNumber',
  'hausnummer': 'houseNumber',
  'hnr': 'houseNumber',

  // ZIP code
  'zip': 'zip',
  'plz': 'zip',
  'postleitzahl': 'zip',

  // City
  'city': 'city',
  'stadt': 'city',
  'ort': 'city',

  // Country
  'country': 'country',
  'land': 'country',

  // Additional info
  'additionalinfo': 'additionalInfo',
  'zusatzinfo': 'additionalInfo',
  'bemerkung': 'additionalInfo',
  'hinweis': 'additionalInfo',
};

/**
 * Department/Category mapping
 * Maps CSV values (long names, abbreviations, etc.) to internal codes and display names
 */
export interface DepartmentMapping {
  code: string;           // Internal code (used in data processing)
  displayName: string;    // Name shown in UI
  aliases: string[];      // All possible CSV values that map to this department
}

/**
 * DEPARTMENT MAPPINGS
 * Add all possible department names/codes that might appear in your CSV files
 */
export const DEPARTMENT_MAPPINGS: DepartmentMapping[] = [
  {
    code: 'DTS',
    displayName: 'Digitale Transformation',
    aliases: [
      'DTS',
      'Digitale Transformation',
      'Digitale Transformation Services',
      'Digital Transformation',
    ],
  },
  {
    code: 'ISP',
    displayName: 'IT Solutions & Products',
    aliases: [
      'ISP',
      'IT Solutions',
      'IT Solutions & Products',
      'IT Solutions and Products',
    ],
  },
  {
    code: 'GK',
    displayName: 'Großkunden',
    aliases: [
      'GK',
      'Großkunden',
      'Grosskunden',
      'Large Customers',
    ],
  },
  {
    code: 'AUSB',
    displayName: 'Ausbildung',
    aliases: [
      'AUSB',
      'Ausbildung',
      'Telekom Ausbildung',
      'Auszubildende',
      'Azubi',
      'Azubis',
    ],
  },
];

/**
 * Get all department codes (for compact CSV format detection)
 */
export const getDepartmentCodes = (): string[] => {
  return DEPARTMENT_MAPPINGS.map(d => d.code);
};

/**
 * Get all department aliases (all possible CSV values)
 */
export const getAllDepartmentAliases = (): string[] => {
  return DEPARTMENT_MAPPINGS.flatMap(d => d.aliases);
};

/**
 * Map CSV department value to internal code
 * Returns the department code if found, undefined otherwise
 */
export const mapDepartmentValue = (csvValue: string): string | undefined => {
  if (!csvValue) return undefined;

  const normalized = csvValue.trim().toLowerCase();

  for (const dept of DEPARTMENT_MAPPINGS) {
    for (const alias of dept.aliases) {
      if (alias.toLowerCase() === normalized) {
        return dept.code;
      }
    }
  }

  // If no mapping found, return original value (for backwards compatibility)
  return csvValue.trim();
};

/**
 * Get display name for a department code
 */
export const getDepartmentDisplayName = (code: string): string => {
  const dept = DEPARTMENT_MAPPINGS.find(d => d.code === code);
  return dept ? dept.displayName : code;
};

/**
 * Map CSV column name to internal field name
 */
export const mapColumnName = (csvColumnName: string): string => {
  const normalized = csvColumnName.trim().toLowerCase();
  return COLUMN_MAPPING[normalized] || csvColumnName;
};

/**
 * Check if a column name is a department column (for compact format detection)
 */
export const isDepartmentColumn = (columnName: string): boolean => {
  const normalized = columnName.trim().toLowerCase();

  // Check if it's a department code
  const codes = getDepartmentCodes().map(c => c.toLowerCase());
  if (codes.includes(normalized)) {
    return true;
  }

  // Check if it's a department alias
  const aliases = getAllDepartmentAliases().map(a => a.toLowerCase());
  return aliases.includes(normalized);
};
