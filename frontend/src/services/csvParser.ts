import Papa from 'papaparse';
import type { CSVRow } from '../types';

export interface ParseResult {
  data: CSVRow[];
  errors: string[];
  isCompactFormat?: boolean;
}

// Compact CSV format (aggregated by location)
export interface CompactCSVRow {
  address: string;
  DTS?: string | number;
  ISP?: string | number;
  GK?: string | number;
}

/**
 * Detect CSV format based on headers
 */
const detectFormat = (headers: string[]): 'detailed' | 'compact' => {
  const headerSet = new Set(headers.map(h => h.trim().toLowerCase()));

  // Compact format has: address + category columns (DTS, ISP, GK)
  const hasCompactColumns =
    headerSet.has('address') &&
    (headerSet.has('dts') || headerSet.has('isp') || headerSet.has('gk'));

  // Detailed format has: category field
  const hasDetailedColumns = headerSet.has('category');

  if (hasCompactColumns && !hasDetailedColumns) {
    return 'compact';
  }

  return 'detailed';
};

/**
 * Parse compact CSV format (aggregated data)
 * Format: address, DTS, ISP, GK
 */
const parseCompactCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const expandedData: CSVRow[] = [];

    Papa.parse<CompactCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        results.data.forEach((row, index) => {
          const rowNumber = index + 2;

          // Validate address
          if (!row.address || row.address.trim() === '') {
            errors.push(`Zeile ${rowNumber}: Adresse fehlt`);
            return;
          }

          const address = row.address.trim();

          // Process each category column
          const categories = ['DTS', 'ISP', 'GK'] as const;
          categories.forEach(category => {
            const value = row[category];
            const count = value ? parseInt(String(value)) : 0;

            // Skip if 0 or invalid
            if (isNaN(count) || count <= 0) {
              return;
            }

            // Create individual rows for each person (to match detailed format)
            for (let i = 0; i < count; i++) {
              expandedData.push({
                address,
                category,
              });
            }
          });
        });

        // Check if any data was generated
        if (expandedData.length === 0 && errors.length === 0) {
          errors.push('Keine gültigen Daten gefunden. Bitte überprüfen Sie die Zahlenwerte in den Kategoriespalten.');
        }

        resolve({
          data: expandedData,
          errors,
          isCompactFormat: true
        });
      },
      error: (error) => {
        errors.push(`Fehler beim Lesen der Datei: ${error.message}`);
        resolve({ data: [], errors, isCompactFormat: true });
      },
    });
  });
};

/**
 * Parse detailed CSV file and validate required fields
 */
const parseDetailedCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const validData: CSVRow[] = [];

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate each row
        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because of header and 0-index

          // Check required field: category
          if (!row.category || row.category.trim() === '') {
            errors.push(`Zeile ${rowNumber}: Kategorie fehlt`);
            return;
          }

          // Check if either 'address' OR combination of address fields exists
          const hasDirectAddress = row.address && row.address.trim() !== '';
          const hasAddressComponents =
            (row.street && row.street.trim() !== '') &&
            (row.zip && row.zip.trim() !== '') &&
            (row.city && row.city.trim() !== '');

          if (!hasDirectAddress && !hasAddressComponents) {
            errors.push(
              `Zeile ${rowNumber}: Weder 'address' noch vollständige Adressfelder (street, zip, city) vorhanden`
            );
            return;
          }

          validData.push(row);
        });

        // Check for parsing errors
        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push(`CSV-Parser Fehler: ${error.message} (Zeile ${error.row})`);
          });
        }

        resolve({ data: validData, errors, isCompactFormat: false });
      },
      error: (error) => {
        errors.push(`Fehler beim Lesen der Datei: ${error.message}`);
        resolve({ data: [], errors, isCompactFormat: false });
      },
    });
  });
};

/**
 * Parse CSV file (auto-detect format)
 */
export const parseCSVFile = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    // First, peek at headers to detect format
    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (previewResults) => {
        const headers = previewResults.meta.fields || [];
        const format = detectFormat(headers);

        // Parse with appropriate parser
        if (format === 'compact') {
          parseCompactCSV(file).then(resolve);
        } else {
          parseDetailedCSV(file).then(resolve);
        }
      },
      error: () => {
        // Fallback to detailed format on error
        parseDetailedCSV(file).then(resolve);
      },
    });
  });
};

/**
 * Build full address from CSV row
 * Uses 'address' field if available, otherwise constructs from components
 */
export const buildAddress = (row: CSVRow): string => {
  // Use direct address if available
  if (row.address && row.address.trim() !== '') {
    return row.address.trim();
  }

  // Build from components
  const parts: string[] = [];

  if (row.street) {
    let streetPart = row.street.trim();
    if (row.houseNumber) {
      streetPart += ' ' + row.houseNumber.trim();
    }
    parts.push(streetPart);
  }

  if (row.zip && row.city) {
    parts.push(`${row.zip.trim()} ${row.city.trim()}`);
  } else if (row.city) {
    parts.push(row.city.trim());
  }

  if (row.country) {
    parts.push(row.country.trim());
  }

  return parts.join(', ');
};

/**
 * Normalize address for consistent comparison and caching
 * (lowercase, remove extra spaces)
 */
export const normalizeAddress = (address: string): string => {
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ', ');
};

/**
 * Get unique addresses from CSV data
 */
export const getUniqueAddresses = (data: CSVRow[]): Map<string, CSVRow[]> => {
  const addressMap = new Map<string, CSVRow[]>();

  data.forEach((row) => {
    const address = buildAddress(row);
    const normalized = normalizeAddress(address);

    if (!addressMap.has(normalized)) {
      addressMap.set(normalized, []);
    }
    addressMap.get(normalized)!.push(row);
  });

  return addressMap;
};
