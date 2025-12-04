import Papa from 'papaparse';
import type { CSVRow } from '../types';
import {
  mapColumnName,
  mapDepartmentValue,
  isDepartmentColumn,
} from '../config/mappings';

export interface ParseResult {
  data: CSVRow[];
  errors: string[];
  isCompactFormat?: boolean;
}

// Compact CSV format (aggregated by location)
// Dynamic interface - department columns are determined at runtime
export interface CompactCSVRow {
  address: string;
  [key: string]: string | number | undefined; // Dynamic department columns
}

/**
 * Map CSV headers to internal field names
 */
const mapHeaders = (headers: string[]): string[] => {
  return headers.map(header => mapColumnName(header));
};

/**
 * Detect CSV format based on headers
 *
 * - Compact format: address + department columns (DTS, ISP, GK, etc.) with counts
 * - Detailed format: one row per person, with optional category field
 */
const detectFormat = (headers: string[]): 'detailed' | 'compact' => {
  // First map headers to internal names
  const mappedHeaders = mapHeaders(headers);
  const headerSet = new Set(mappedHeaders.map(h => h.trim().toLowerCase()));

  // Check for department columns (any column that matches department aliases)
  const hasDepartmentColumns = headers.some(h => isDepartmentColumn(h));

  // Compact format requires: address + at least one department column (AND no category field)
  // This ensures CSVs with just "address, category" are treated as detailed format
  const hasCompactColumns =
    headerSet.has('address') &&
    hasDepartmentColumns &&
    !headerSet.has('category');

  if (hasCompactColumns) {
    return 'compact';
  }

  // All other formats (including minimal CSVs with just address) are detailed
  return 'detailed';
};

/**
 * Extract city from address string
 * German addresses typically follow: "Street Number, ZIP City"
 */
const extractCityFromAddress = (address: string): string | undefined => {
  // Try to match: "anything, 5-digit-zip City" pattern
  const match = address.match(/,\s*\d{5}\s+([^,]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: try to get last part after last comma
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Remove ZIP code if present
    const lastPart = parts[parts.length - 1];
    const withoutZip = lastPart.replace(/^\d{5}\s+/, '');
    return withoutZip || undefined;
  }

  return undefined;
};

/**
 * Parse compact CSV format (aggregated data)
 * Format: address, [department columns...]
 * Department columns are detected dynamically using isDepartmentColumn()
 */
const parseCompactCSV = (file: File, originalHeaders: string[]): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const expandedData: CSVRow[] = [];

    Papa.parse<CompactCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Map CSV header to internal name
        return mapColumnName(header);
      },
      complete: (results) => {
        results.data.forEach((row, index) => {
          const rowNumber = index + 2;

          // Validate address
          if (!row.address || row.address.trim() === '') {
            errors.push(`Zeile ${rowNumber}: Adresse fehlt`);
            return;
          }

          const address = row.address.trim();
          const city = extractCityFromAddress(address);

          // Process all department columns dynamically
          // Find which columns in the row are department columns
          Object.keys(row).forEach(columnName => {
            // Check if this is a department column (using original header for detection)
            const originalHeader = originalHeaders.find(h =>
              mapColumnName(h) === columnName
            );

            if (!originalHeader || !isDepartmentColumn(originalHeader)) {
              return; // Not a department column
            }

            // Map department value to internal code
            const departmentCode = mapDepartmentValue(originalHeader);
            if (!departmentCode) {
              return;
            }

            const value = row[columnName];
            const count = value ? parseInt(String(value)) : 0;

            // Skip if 0 or invalid
            if (isNaN(count) || count <= 0) {
              return;
            }

            // Create individual rows for each person (to match detailed format)
            for (let i = 0; i < count; i++) {
              expandedData.push({
                address,
                category: departmentCode,
                city, // Add extracted city information
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
      transformHeader: (header) => {
        // Map CSV header to internal name
        return mapColumnName(header);
      },
      complete: (results) => {
        // Validate each row
        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because of header and 0-index

          // Category field is OPTIONAL - defaults to "Sonstige" (SONST) if empty or missing
          let mappedCategory = 'SONST'; // Default value

          if (row.category && row.category.trim() !== '') {
            // Map department value to internal code
            const mapped = mapDepartmentValue(row.category);
            if (!mapped) {
              errors.push(`Zeile ${rowNumber}: Unbekannte Kategorie "${row.category}"`);
              return;
            }
            mappedCategory = mapped;
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

          // Extract city from address if not provided separately
          // This is important for groupByCity filter to work correctly
          let city = row.city;
          if (!city || city.trim() === '') {
            if (hasDirectAddress) {
              city = extractCityFromAddress(row.address!);
            }
          }

          // Store row with mapped category and extracted city
          validData.push({
            ...row,
            category: mappedCategory,
            city: city, // Ensure city is set for groupByCity filtering
          });
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
        const originalHeaders = previewResults.meta.fields || [];
        const format = detectFormat(originalHeaders);

        // Parse with appropriate parser
        if (format === 'compact') {
          parseCompactCSV(file, originalHeaders).then(resolve);
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
 *
 * Priority:
 * 1. Use 'address' field if available (complete address in one field)
 * 2. Otherwise construct from components: street, zip, city, country
 *
 * Note: 'houseNumber' is OPTIONAL and can be:
 * - In a separate column (e.g., street="Landgrabenweg", houseNumber="151")
 * - Included in the street column (e.g., street="Landgrabenweg 151")
 */
export const buildAddress = (row: CSVRow): string => {
  // Use direct address if available
  if (row.address && row.address.trim() !== '') {
    return row.address.trim();
  }

  // Build from components
  const parts: string[] = [];

  // Street: Can contain just street name or "street + house number" combined
  if (row.street) {
    let streetPart = row.street.trim();
    // If house number is in separate column, append it
    if (row.houseNumber && row.houseNumber.trim() !== '') {
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
