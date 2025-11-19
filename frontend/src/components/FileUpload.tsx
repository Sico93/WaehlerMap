import { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload = ({ onFileSelect, disabled = false }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        alert('Bitte wählen Sie eine CSV-Datei aus.');
        return;
      }

      onFileSelect(file);

      // Reset input so the same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>CSV-Datei hochladen</h3>

      <div style={{
        border: '2px dashed #ccc',
        borderRadius: '4px',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        <div style={{ marginBottom: '1rem', color: '#6c757d' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ marginBottom: '0.5rem' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>CSV-Datei mit Adressdaten</div>
        </div>

        <button
          onClick={handleButtonClick}
          disabled={disabled}
          style={{
            backgroundColor: disabled ? '#ccc' : '#e20074',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          Datei auswählen
        </button>

        <div style={{
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#6c757d'
        }}>
          <div>Zwei Formate werden unterstützt:</div>
          <div><strong>1) Detailliert</strong> (pro Person eine Zeile)</div>
          <div><strong>2) Vereinfacht</strong> (Aggregiert pro Standort)</div>
        </div>
      </div>

      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', color: '#e20074', fontWeight: 'bold' }}>
          CSV-Format Hilfe
        </summary>
        <div style={{
          marginTop: '0.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          <h4 style={{ marginTop: 0 }}>Format 1: Detaillierte Liste (empfohlen)</h4>
          <p>Eine Zeile pro Person mit individuellen Daten:</p>
          <pre style={{
            backgroundColor: '#fff',
            padding: '0.5rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
{`address,category,street,houseNumber,zip,city,country
"Musterstraße 1, 12345 Berlin",DTS,,,,,
,ISP,Hauptstraße,42,80331,München,Deutschland
"Bahnhofstraße 10, 50667 Köln",GK,,,,,`}
          </pre>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
            <li><strong>category</strong> ist Pflichtfeld (DTS, ISP, GK)</li>
            <li>Entweder <strong>address</strong> ODER <strong>street+zip+city</strong></li>
          </ul>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Format 2: Vereinfacht (Vorabversion)</h4>
          <p>Eine Zeile pro Standort mit aggregierten Zahlen:</p>
          <pre style={{
            backgroundColor: '#fff',
            padding: '0.5rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
{`address,DTS,ISP,GK
"Friedrich-Ebert-Allee 140, 53113 Bonn",15,8,3
"Landgrabenweg 151, 53227 Bonn",5,,2
"Heinrich-Hertz-Straße 3-7, 64295 Darmstadt",,12,`}
          </pre>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
            <li><strong>address</strong> ist Pflichtfeld</li>
            <li><strong>DTS, ISP, GK</strong>: Anzahl Personen (leer = 0)</li>
            <li>Schneller Upload für Vorabvisualisierung</li>
          </ul>

          <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            <strong>💡 Tipp:</strong> Die App erkennt automatisch das Format anhand der Spalten.
          </p>
        </div>
      </details>
    </div>
  );
};
