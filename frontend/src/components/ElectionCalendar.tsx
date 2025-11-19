import { useState, useEffect } from 'react';
import {
  calculateElectionDeadlines,
  formatDate,
  isValidPostingDate,
  type ElectionDeadline
} from '../services/electionCalculator';

interface ElectionCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ElectionCalendar = ({ isOpen, onClose }: ElectionCalendarProps) => {
  const [electionDate, setElectionDate] = useState<string>('');
  const [postingDate, setPostingDate] = useState<string>('');
  const [deadlines, setDeadlines] = useState<ElectionDeadline[]>([]);
  const [validationError, setValidationError] = useState<string>('');

  // Calculate deadlines when dates change
  useEffect(() => {
    if (!electionDate || !postingDate) {
      setDeadlines([]);
      setValidationError('');
      return;
    }

    const election = new Date(electionDate);
    const posting = new Date(postingDate);

    // Validation
    if (posting >= election) {
      setValidationError('Wahlausschreiben muss vor dem Wahldatum ausgehängt werden!');
      setDeadlines([]);
      return;
    }

    if (!isValidPostingDate(election, posting)) {
      setValidationError('⚠ Hinweis: Wahlausschreiben sollte genau 6 Wochen (42 Tage) vor der Wahl ausgehängt werden.');
    } else {
      setValidationError('');
    }

    // Calculate all deadlines
    const calculated = calculateElectionDeadlines(election, posting);
    setDeadlines(calculated);
  }, [electionDate, postingDate]);

  // Get deadline style based on type
  const getDeadlineStyle = (type: ElectionDeadline['type']) => {
    switch (type) {
      case 'milestone':
        return { borderLeft: '4px solid #e20074', backgroundColor: '#fff0f6' };
      case 'deadline':
        return { borderLeft: '4px solid #dc3545', backgroundColor: '#fff5f5' };
      case 'period-start':
        return { borderLeft: '4px solid #28a745', backgroundColor: '#f0fff4' };
      case 'period-end':
        return { borderLeft: '4px solid #ffc107', backgroundColor: '#fffbf0' };
      default:
        return { borderLeft: '4px solid #6c757d', backgroundColor: '#f8f9fa' };
    }
  };

  // Icon for deadline type
  const getDeadlineIcon = (type: ElectionDeadline['type']) => {
    switch (type) {
      case 'milestone': return '🎯';
      case 'deadline': return '⚠️';
      case 'period-start': return '▶️';
      case 'period-end': return '⏹️';
      default: return '📅';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Slide-in Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-450px',
          width: '450px',
          height: '100vh',
          backgroundColor: 'white',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          transition: 'right 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #e20074',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#e20074', fontSize: '1.5rem' }}>
              ⚖️ BR-Wahlkalender
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6c757d',
                padding: '0.25rem 0.5rem'
              }}
              title="Schließen"
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
            Normales Wahlverfahren nach BetrVG
          </div>
        </div>

        {/* Input Section */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #dee2e6' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
              Wahldatum
            </label>
            <input
              type="date"
              value={electionDate}
              onChange={(e) => setElectionDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
              Aushang Wahlausschreiben
            </label>
            <input
              type="date"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
              Sollte 6 Wochen (42 Tage) vor der Wahl sein
            </div>
          </div>

          {validationError && (
            <div style={{
              padding: '0.5rem',
              backgroundColor: validationError.includes('⚠') ? '#fff3cd' : '#f8d7da',
              border: `1px solid ${validationError.includes('⚠') ? '#ffc107' : '#dc3545'}`,
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: validationError.includes('⚠') ? '#856404' : '#721c24'
            }}>
              {validationError}
            </div>
          )}
        </div>

        {/* Deadlines List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {deadlines.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6c757d',
              padding: '3rem 1rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <div>Bitte Wahldatum und Aushangdatum eingeben,<br />um Fristen zu berechnen.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deadlines.map((deadline, index) => (
                <div
                  key={index}
                  style={{
                    ...getDeadlineStyle(deadline.type),
                    padding: '0.75rem',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{getDeadlineIcon(deadline.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {formatDate(deadline.date)}
                      </div>
                      <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {deadline.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        {deadline.description}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6c757d', fontStyle: 'italic' }}>
                        {deadline.legal}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #dee2e6',
          backgroundColor: '#f8f9fa',
          fontSize: '0.75rem',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          Fristen nach BetrVG und Wahlordnung (WO)<br />
          Angaben ohne Gewähr – bitte rechtlich prüfen lassen
        </div>
      </div>
    </>
  );
};
