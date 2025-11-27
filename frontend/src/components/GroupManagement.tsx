import { useState } from 'react';
import type { LocationGroup, AggregatedLocation } from '../types';

interface GroupManagementProps {
  groups: LocationGroup[];
  locations: AggregatedLocation[];
  selectedLocationIds: Set<string>;
  isGroupingMode: boolean;
  onToggleGroupingMode: () => void;
  onCreateGroup: (name: string, locationIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onClearSelection: () => void;
}

export const GroupManagement = ({
  groups,
  locations,
  selectedLocationIds,
  isGroupingMode,
  onToggleGroupingMode,
  onCreateGroup,
  onDeleteGroup,
  onClearSelection,
}: GroupManagementProps) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const selectedLocations = locations.filter(loc =>
    selectedLocationIds.has(loc.id)
  );

  const handleCreateGroup = () => {
    if (selectedLocationIds.size < 2) {
      alert('Bitte wählen Sie mindestens 2 Standorte aus');
      return;
    }

    if (!newGroupName.trim()) {
      alert('Bitte geben Sie einen Gruppennamen ein');
      return;
    }

    onCreateGroup(newGroupName.trim(), Array.from(selectedLocationIds));
    setNewGroupName('');
    setShowNameInput(false);
  };

  const handleStartGrouping = () => {
    if (selectedLocationIds.size >= 2) {
      setShowNameInput(true);
    } else {
      alert('Bitte wählen Sie mindestens 2 Standorte aus (STRG+Klick auf Marker)');
    }
  };

  return (
    <div style={{
      marginBottom: '1.5rem',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #dee2e6'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>
        🔗 Standort-Verknüpfung
      </h3>

      {/* Grouping Mode Toggle */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: isGroupingMode ? '#e200740a' : 'transparent',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}
      >
        <input
          type="checkbox"
          checked={isGroupingMode}
          onChange={onToggleGroupingMode}
          style={{
            marginRight: '0.5rem',
            cursor: 'pointer'
          }}
        />
        <span style={{ fontSize: '0.875rem' }}>Auswahl-Modus aktivieren</span>
      </label>

      {isGroupingMode && (
        <>
          <div style={{
            fontSize: '0.75rem',
            color: '#6c757d',
            marginBottom: '1rem',
            padding: '0.5rem',
            backgroundColor: '#e7f3ff',
            borderRadius: '4px'
          }}>
            💡 Halten Sie STRG gedrückt und klicken Sie auf Marker, um Standorte auszuwählen
          </div>

          {/* Selection Display */}
          {selectedLocationIds.size > 0 && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                ✓ {selectedLocationIds.size} Standorte ausgewählt
              </div>
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '0.75rem'
              }}>
                {selectedLocations.map(loc => (
                  <div key={loc.id} style={{
                    padding: '0.25rem 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    • {loc.address} ({loc.totalCount} Pers.)
                  </div>
                ))}
              </div>

              {/* Group Creation */}
              {!showNameInput ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    onClick={handleStartGrouping}
                    disabled={selectedLocationIds.size < 2}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: selectedLocationIds.size >= 2 ? '#28a745' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedLocationIds.size >= 2 ? 'pointer' : 'not-allowed',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Verknüpfen
                  </button>
                  <button
                    onClick={onClearSelection}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'white',
                      color: '#6c757d',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Gruppenname (z.B. Berlin Zentrum)"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateGroup();
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleCreateGroup}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Erstellen
                    </button>
                    <button
                      onClick={() => {
                        setShowNameInput(false);
                        setNewGroupName('');
                      }}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'white',
                        color: '#6c757d',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Existing Groups */}
      {groups.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: '#495057'
          }}>
            Verknüpfte Gruppen ({groups.length})
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {groups.map(group => {
              const groupLocations = locations.filter(loc =>
                group.locationIds.includes(loc.id)
              );
              const totalPersons = groupLocations.reduce((sum, loc) => sum + loc.totalCount, 0);

              return (
                <div
                  key={group.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                        {group.locationIds.length} Standorte · {totalPersons} Personen
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Gruppe "${group.name}" auflösen?`)) {
                          onDeleteGroup(group.id);
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
