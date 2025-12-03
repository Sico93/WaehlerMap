import type { FilterState } from '../types';
import { getDepartmentDisplayName } from '../config/mappings';

interface FilterPanelProps {
  categories: string[];
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
  disabled?: boolean;
}

export const FilterPanel = ({
  categories,
  filterState,
  onFilterChange,
  disabled = false
}: FilterPanelProps) => {
  const handleCategoryToggle = (category: string) => {
    const newSelected = filterState.selectedCategories.includes(category)
      ? filterState.selectedCategories.filter(c => c !== category)
      : [...filterState.selectedCategories, category];

    onFilterChange({
      ...filterState,
      selectedCategories: newSelected
    });
  };

  const handleMinCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 0;
    onFilterChange({
      ...filterState,
      minCount: value
    });
  };

  const handleGroupByCityToggle = () => {
    onFilterChange({
      ...filterState,
      groupByCity: !filterState.groupByCity
    });
  };

  const handleSelectAll = () => {
    onFilterChange({
      ...filterState,
      selectedCategories: categories
    });
  };

  const handleClearAll = () => {
    onFilterChange({
      ...filterState,
      selectedCategories: []
    });
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Filter</h3>

      {/* Category Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <strong>Kategorien</strong>
          {categories.length > 0 && (
            <div style={{ fontSize: '0.875rem' }}>
              <button
                onClick={handleSelectAll}
                disabled={disabled}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e20074',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                Alle
              </button>
              <button
                onClick={handleClearAll}
                disabled={disabled}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6c757d',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Keine
              </button>
            </div>
          )}
        </div>

        {categories.length === 0 ? (
          <div style={{ color: '#6c757d', fontSize: '0.875rem', fontStyle: 'italic' }}>
            Keine Kategorien verfügbar. Bitte laden Sie eine CSV-Datei hoch.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {categories.map(category => (
              <label
                key={category}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  padding: '0.5rem',
                  backgroundColor: filterState.selectedCategories.includes(category)
                    ? '#e200740a'
                    : 'transparent',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                <input
                  type="checkbox"
                  checked={filterState.selectedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  disabled={disabled}
                  style={{
                    marginRight: '0.5rem',
                    cursor: disabled ? 'not-allowed' : 'pointer'
                  }}
                />
                <span>{getDepartmentDisplayName(category)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Minimum Count Filter */}
      <div>
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          Mindestanzahl
        </strong>
        <input
          type="number"
          value={filterState.minCount}
          onChange={handleMinCountChange}
          disabled={disabled}
          placeholder="0"
          min={0}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
        <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
          Zeigt nur Standorte mit ≥ dieser Anzahl
        </div>

        {/* City Grouping Toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            marginTop: '0.75rem',
            padding: '0.5rem',
            backgroundColor: filterState.groupByCity ? '#e200740a' : 'transparent',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
        >
          <input
            type="checkbox"
            checked={filterState.groupByCity}
            onChange={handleGroupByCityToggle}
            disabled={disabled}
            style={{
              marginRight: '0.5rem',
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          />
          <span style={{ fontSize: '0.875rem' }}>Nach Stadt gruppieren</span>
        </label>
        <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
          Standorte innerhalb derselben Stadt werden für die Mindestanzahl zusammengezählt
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filterState.selectedCategories.length > 0 || filterState.minCount > 0 || filterState.groupByCity) && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          <strong>Aktive Filter:</strong>
          {filterState.selectedCategories.length > 0 && (
            <div>📌 {filterState.selectedCategories.length} Kategorie(n)</div>
          )}
          {filterState.minCount > 0 && (
            <div>📊 Mindestens {filterState.minCount} Einträge{filterState.groupByCity ? ' (stadtweise)' : ''}</div>
          )}
          {filterState.groupByCity && filterState.minCount === 0 && (
            <div>🏙️ Nach Stadt gruppiert</div>
          )}
        </div>
      )}
    </div>
  );
};
