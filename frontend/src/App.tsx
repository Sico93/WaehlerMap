import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ErrorList } from './components/ErrorList';
import { FilterPanel } from './components/FilterPanel';
import { MapView } from './components/MapView';
import { ElectionCalendar } from './components/ElectionCalendar';
import { GroupManagement } from './components/GroupManagement';
import type {
  ProcessedLocation,
  AggregatedLocation,
  GeocodingError,
  GeocodingProgress,
  FilterState,
  LocationGroup,
} from './types';
import { parseCSVFile, getUniqueAddresses } from './services/csvParser';
import { geocodeAddress } from './services/geocoding';
import {
  createProcessedLocation,
  aggregateLocations,
  applyFilters,
  getUniqueCategories,
  applyLocationGroups,
} from './services/dataAggregator';
import { calculateCouncilSize } from './services/electionCalculator';
import { loadGroups, saveGroups } from './services/groupStorage';

function App() {
  // State
  const [allLocations, setAllLocations] = useState<AggregatedLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<AggregatedLocation[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    selectedCategories: [],
    minCount: 0,
    groupByCity: false,
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [geocodingErrors, setGeocodingErrors] = useState<GeocodingError[]>([]);

  // Location grouping state
  const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set());
  const [isGroupingMode, setIsGroupingMode] = useState(false);

  // Load groups from LocalStorage on mount
  useEffect(() => {
    const savedGroups = loadGroups();
    setLocationGroups(savedGroups);
  }, []);

  // Handle file upload and processing
  const handleFileSelect = async (file: File) => {
    // Reset state
    setAllLocations([]);
    setFilteredLocations([]);
    setParseErrors([]);
    setGeocodingErrors([]);
    setFilterState({ selectedCategories: [], minCount: 0, groupByCity: false });
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
      groupByCity: false,
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

    // Apply location groups first, then filters
    const grouped = applyLocationGroups(allLocations, locationGroups);
    const filtered = applyFilters(
      grouped,
      newState.selectedCategories,
      newState.minCount,
      newState.groupByCity
    );
    setFilteredLocations(filtered);
  };

  // Update filtered locations when groups change
  useEffect(() => {
    if (allLocations.length > 0) {
      const grouped = applyLocationGroups(allLocations, locationGroups);
      const filtered = applyFilters(
        grouped,
        filterState.selectedCategories,
        filterState.minCount,
        filterState.groupByCity
      );
      setFilteredLocations(filtered);
    }
  }, [locationGroups, allLocations, filterState]);

  // Grouping handlers
  const handleToggleGroupingMode = () => {
    setIsGroupingMode(!isGroupingMode);
    if (isGroupingMode) {
      // Clear selection when leaving grouping mode
      setSelectedLocationIds(new Set());
    }
  };

  const handleToggleLocationSelection = (locationId: string) => {
    setSelectedLocationIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const handleCreateGroup = (name: string, locationIds: string[]) => {
    const newGroup: LocationGroup = {
      id: crypto.randomUUID(),
      name,
      locationIds,
      createdAt: Date.now(),
    };

    const updatedGroups = [...locationGroups, newGroup];
    setLocationGroups(updatedGroups);
    saveGroups(updatedGroups);

    // Clear selection
    setSelectedLocationIds(new Set());
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = locationGroups.filter(g => g.id !== groupId);
    setLocationGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  const handleClearSelection = () => {
    setSelectedLocationIds(new Set());
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

        {allLocations.length > 0 && (
          <GroupManagement
            groups={locationGroups}
            locations={allLocations}
            selectedLocationIds={selectedLocationIds}
            isGroupingMode={isGroupingMode}
            onToggleGroupingMode={handleToggleGroupingMode}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
            onClearSelection={handleClearSelection}
          />
        )}

        {filteredLocations.length > 0 && (() => {
          const totalPersonsFiltered = filteredLocations.reduce((sum, loc) => sum + loc.totalCount, 0);
          const totalPersonsAll = allLocations.reduce((sum, loc) => sum + loc.totalCount, 0);
          const councilSize = calculateCouncilSize(totalPersonsAll);

          return (
            <>
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#d4edda',
                borderRadius: '4px',
                fontSize: '0.875rem',
                color: '#155724',
              }}>
                <div><strong>📍 {filteredLocations.length}</strong> Standorte auf der Karte</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>👥 {totalPersonsFiltered}</strong> Personen auf der Karte
                </div>
                {councilSize > 0 && (
                  <div style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #28a745'
                  }}>
                    <strong>⚖️ BR-Größe: {councilSize} {councilSize === 1 ? 'Mitglied' : 'Mitglieder'}</strong>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                      (basierend auf {totalPersonsAll} importierten Personen, nach §9 BetrVG)
                    </div>
                  </div>
                )}
              </div>

              {/* Election Calendar Toggle Button */}
              <button
                onClick={() => setIsCalendarOpen(true)}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#e20074',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                ⚖️ BR-Wahlkalender öffnen
              </button>
            </>
          );
        })()}

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
          <MapView
            locations={filteredLocations}
            selectedLocationIds={selectedLocationIds}
            isGroupingMode={isGroupingMode}
            onToggleLocationSelection={handleToggleLocationSelection}
          />
        )}
      </div>

      {/* Election Calendar Slide-in Panel */}
      <ElectionCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </div>
  );
}

export default App;
