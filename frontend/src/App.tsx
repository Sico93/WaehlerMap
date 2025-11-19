import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ErrorList } from './components/ErrorList';
import { FilterPanel } from './components/FilterPanel';
import { MapView } from './components/MapView';
import type {
  ProcessedLocation,
  AggregatedLocation,
  GeocodingError,
  GeocodingProgress,
  FilterState,
} from './types';
import { parseCSVFile, getUniqueAddresses } from './services/csvParser';
import { geocodeAddress } from './services/geocoding';
import {
  createProcessedLocation,
  aggregateLocations,
  applyFilters,
  getUniqueCategories,
} from './services/dataAggregator';

function App() {
  // State
  const [allLocations, setAllLocations] = useState<AggregatedLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<AggregatedLocation[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    selectedCategories: [],
    minCount: 0,
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [geocodingProgress, setGeocodingProgress] = useState<GeocodingProgress>({
    total: 0,
    processed: 0,
    cached: 0,
    failed: 0,
    current: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompactFormat, setIsCompactFormat] = useState(false);

  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [geocodingErrors, setGeocodingErrors] = useState<GeocodingError[]>([]);

  // Handle file upload and processing
  const handleFileSelect = async (file: File) => {
    // Reset state
    setAllLocations([]);
    setFilteredLocations([]);
    setParseErrors([]);
    setGeocodingErrors([]);
    setFilterState({ selectedCategories: [], minCount: 0 });
    setIsProcessing(true);

    // Step 1: Parse CSV
    const parseResult = await parseCSVFile(file);

    // Set format flag
    setIsCompactFormat(parseResult.isCompactFormat || false);

    if (parseResult.errors.length > 0) {
      setParseErrors(parseResult.errors);
    }

    if (parseResult.data.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Step 2: Get unique addresses
    const uniqueAddresses = getUniqueAddresses(parseResult.data);
    const addressList = Array.from(uniqueAddresses.entries());

    setGeocodingProgress({
      total: addressList.length,
      processed: 0,
      cached: 0,
      failed: 0,
      current: '',
    });

    // Step 3: Geocode addresses
    const processedLocations: ProcessedLocation[] = [];
    const errors: GeocodingError[] = [];
    let cachedCount = 0;

    for (const [address, rows] of addressList) {
      setGeocodingProgress((prev) => ({
        ...prev,
        current: address,
      }));

      const result = await geocodeAddress(address);

      if (result) {
        // Create ProcessedLocation for each row with this address
        rows.forEach((row) => {
          processedLocations.push(
            createProcessedLocation(row, result.lat, result.lon)
          );
        });

        cachedCount++;
      } else {
        // Geocoding failed
        errors.push({
          address,
          reason: 'Adresse konnte nicht gefunden werden',
          attempts: 3,
        });
      }

      setGeocodingProgress((prev) => ({
        ...prev,
        processed: prev.processed + 1,
        cached: cachedCount,
        failed: errors.length,
      }));
    }

    // Step 4: Aggregate locations
    const aggregated = aggregateLocations(processedLocations);

    // Step 5: Extract categories and set initial filter (all selected)
    const categories = getUniqueCategories(aggregated);
    setAvailableCategories(categories);
    setFilterState({
      selectedCategories: categories, // Initially select all
      minCount: 0,
    });

    // Step 6: Set locations
    setAllLocations(aggregated);
    setFilteredLocations(aggregated);
    setGeocodingErrors(errors);
    setIsProcessing(false);

    console.log(`Processed ${processedLocations.length} locations, ${errors.length} errors`);
  };

  // Handle filter changes
  const handleFilterChange = (newState: FilterState) => {
    setFilterState(newState);
    const filtered = applyFilters(
      allLocations,
      newState.selectedCategories,
      newState.minCount
    );
    setFilteredLocations(filtered);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'TeleNeoWeb, Arial, sans-serif',
    }}>
      {/* Left Panel: Upload & Filters */}
      <div style={{
        width: '400px',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        overflowY: 'auto',
        borderRight: '1px solid #dee2e6',
      }}>
        <h1 style={{
          marginTop: 0,
          marginBottom: '1.5rem',
          color: '#e20074',
          fontSize: '1.75rem',
        }}>
          WaehlerMap
        </h1>

        <FileUpload
          onFileSelect={handleFileSelect}
          disabled={isProcessing}
        />

        <ProgressIndicator
          progress={geocodingProgress}
          visible={isProcessing}
        />

        {isCompactFormat && allLocations.length > 0 && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#e7f3ff',
            border: '1px solid #0078d4',
            borderRadius: '4px',
            fontSize: '0.875rem',
            color: '#004578'
          }}>
            <strong>ℹ Vereinfachtes Format erkannt</strong>
            <div style={{ marginTop: '0.25rem' }}>
              Die aggregierten Daten wurden erfolgreich verarbeitet.
            </div>
          </div>
        )}

        <ErrorList
          errors={geocodingErrors}
          parseErrors={parseErrors}
        />

        <FilterPanel
          categories={availableCategories}
          filterState={filterState}
          onFilterChange={handleFilterChange}
          disabled={isProcessing || allLocations.length === 0}
        />

        {filteredLocations.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#d4edda',
            borderRadius: '4px',
            fontSize: '0.875rem',
            color: '#155724',
          }}>
            <strong>📍 {filteredLocations.length}</strong> Standorte auf der Karte
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #dee2e6',
          fontSize: '0.75rem',
          color: '#6c757d',
        }}>
          <div>OpenStreetMap & Nominatim</div>
          <div>Telekom Scale Design System</div>
          <div style={{ marginTop: '0.5rem' }}>
            <a
              href="https://github.com/Sico93/WaehlerMap"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#e20074' }}
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel: Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {allLocations.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6c757d',
            textAlign: 'center',
            padding: '2rem',
          }}>
            <div>
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginBottom: '1rem', opacity: 0.3 }}
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                Keine Daten geladen
              </h2>
              <p>Laden Sie eine CSV-Datei hoch, um die Karte zu sehen.</p>
            </div>
          </div>
        ) : (
          <MapView locations={filteredLocations} />
        )}
      </div>
    </div>
  );
}

export default App;
