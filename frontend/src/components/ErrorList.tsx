import type { GeocodingError } from '../types';

interface ErrorListProps {
  errors: GeocodingError[];
  parseErrors: string[];
  onClose?: () => void;
}

export const ErrorList = ({ errors, parseErrors, onClose }: ErrorListProps) => {
  const totalErrors = errors.length + parseErrors.length;

  if (totalErrors === 0) return null;

  return (
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: '4px',
      padding: '1rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <strong style={{ color: '#856404' }}>
          ⚠ {totalErrors} Fehler gefunden
        </strong>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#856404'
            }}
          >
            ×
          </button>
        )}
      </div>

      {parseErrors.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            CSV-Fehler:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
            {parseErrors.map((error, index) => (
              <li key={index} style={{ marginBottom: '0.25rem' }}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Geocoding-Fehler:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
            {errors.map((error, index) => (
              <li key={index} style={{ marginBottom: '0.25rem' }}>
                <strong>{error.address}</strong> - {error.reason}
                {error.attempts > 1 && ` (${error.attempts} Versuche)`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.875rem',
        fontStyle: 'italic',
        color: '#856404'
      }}>
        Tipp: Überprüfen Sie die Adressen und laden Sie die CSV erneut hoch.
      </div>
    </div>
  );
};
