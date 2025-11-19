import Papa from 'papaparse';
import type { CSVRow } from '../types';

export interface ParseResult {
  data: CSVRow[];
  errors: string[];
}

/**
 * Parse CSV file and validate required fields
 */
export const parseCSVFile = (file: File): Promise<ParseResult> => {
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

        resolve({ data: validData, errors });
      },
      error: (error) => {
        errors.push(`Fehler beim Lesen der Datei: ${error.message}`);
        resolve({ data: [], errors });
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
