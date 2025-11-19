import type { GeocodingProgress } from '../types';

interface ProgressIndicatorProps {
  progress: GeocodingProgress;
  visible: boolean;
}

export const ProgressIndicator = ({ progress, visible }: ProgressIndicatorProps) => {
  if (!visible) return null;

  const percentage = progress.total > 0
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <strong>Geocoding läuft...</strong>
        <span style={{ color: '#e20074' }}>{percentage}%</span>
      </div>

      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: '#e20074',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.875rem',
        color: '#6c757d'
      }}>
        <div>
          {progress.processed} / {progress.total} Adressen verarbeitet
        </div>
        {progress.cached > 0 && (
          <div>✓ {progress.cached} aus Cache geladen</div>
        )}
        {progress.failed > 0 && (
          <div style={{ color: '#dc3545' }}>
            ⚠ {progress.failed} Fehler
          </div>
        )}
        {progress.current && (
          <div style={{
            marginTop: '0.25rem',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Aktuell: {progress.current}
          </div>
        )}
      </div>
    </div>
  );
};
