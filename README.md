# WaehlerMap

Eine OpenSource-Webanwendung zur Visualisierung von CSV-Adressdaten auf einer interaktiven OpenStreetMap-Karte mit automatischem Clustering und Filterung.

![](https://img.shields.io/badge/React-19.2-blue)
![](https://img.shields.io/badge/TypeScript-5.9-blue)
![](https://img.shields.io/badge/Vite-7.2-purple)
![](https://img.shields.io/badge/Leaflet-1.9-green)
![](https://img.shields.io/badge/OpenStreetMap-OSM-orange)

## Features

- **CSV-Upload**: Einfacher Upload von CSV-Dateien mit Adressdaten
- **Geocoding**: Automatische Adress-zu-Koordinaten-Konvertierung via Nominatim (OpenStreetMap)
- **Smart Caching**: Persistentes LocalStorage-Caching für schnellere Wiederverwendung
- **Marker Clustering**: Automatisches Gruppieren naher Standorte
- **Daten-Aggregation**: Zusammenfassung mehrerer Einträge pro Adresse
- **Filter**: Kategorie-Filter und Mindestanzahl-Filter
- **Telekom Scale Design**: Modernes UI mit Telekom Design System
- **100% Browser-basiert**: Keine Datenbank, alle Daten bleiben im Browser

## Tech-Stack

- **Frontend**: React 19 + TypeScript
- **Build-Tool**: Vite
- **UI-Komponenten**: Telekom Scale Components
- **Karte**: Leaflet + Leaflet.markercluster
- **CSV-Parsing**: PapaParse
- **Geocoding**: Nominatim (OpenStreetMap)
- **Styling**: Minimales CSS + Telekom Scale

## Schnellstart

### Voraussetzungen

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Repository klonen
git clone https://github.com/Sico93/WaehlerMap.git
cd WaehlerMap

# Dependencies installieren
cd frontend
npm install

# Development Server starten
npm run dev
```

Die Anwendung läuft dann auf http://localhost:5173

### Build für Produktion

```bash
npm run build
npm run preview
```

## CSV-Format

### Pflichtfelder

- `category` - Kategorie (z.B. DTS, ISP, GK)

### Adressfelder (mind. eine Option erforderlich)

**Option 1**: Vollständige Adresse
- `address` - Komplette Adresse (z.B. "Musterstraße 1, 12345 Berlin")

**Option 2**: Komponenten
- `street` - Straßenname
- `houseNumber` - Hausnummer (optional)
- `zip` - Postleitzahl
- `city` - Stadt
- `country` - Land (optional)

### Optionale Felder

- `additionalInfo` - Zusatzinformationen

### Beispiel CSV

```csv
address,category,street,houseNumber,zip,city,country,additionalInfo
"Musterstraße 1, 12345 Berlin",DTS,,,,,
,ISP,Hauptstraße,42,80331,München,Deutschland,Gebäude A
"Bahnhofstraße 10, 50667 Köln",GK,,,,,Abteilung Vertrieb
```

Eine vollständige Beispieldatei finden Sie in `example.csv`.

## Funktionsweise

1. **CSV-Upload**: Datei wird im Browser geparst und validiert
2. **Deduplizierung**: Gleiche Adressen werden identifiziert
3. **Geocoding**:
   - Cache-Lookup (LocalStorage)
   - Falls nicht cached: Nominatim API-Request (1,5s Rate-Limiting)
   - Retry-Logik bei Fehlern (max. 3 Versuche)
4. **Aggregation**: Mehrere Einträge pro Adresse werden zusammengefasst
5. **Visualisierung**: Marker mit Cluster auf Leaflet-Karte
6. **Filterung**: Live-Filter nach Kategorie und Mindestanzahl

## Projektstruktur

```
WaehlerMap/
├── frontend/
│   ├── src/
│   │   ├── components/       # React-Komponenten
│   │   │   ├── FileUpload.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── MapView.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   └── ErrorList.tsx
│   │   ├── services/         # Business-Logik
│   │   │   ├── csvParser.ts
│   │   │   ├── geocoding.ts
│   │   │   ├── cacheService.ts
│   │   │   └── dataAggregator.ts
│   │   ├── map/              # Leaflet-Setup
│   │   │   ├── leafletSetup.ts
│   │   │   └── clusterConfig.ts
│   │   ├── types/            # TypeScript-Interfaces
│   │   │   └── index.ts
│   │   ├── App.tsx           # Haupt-App
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── example.csv
├── Anforderung.md
├── ARBEITSPLAN.md
└── README.md
```

## Geocoding & Rate-Limiting

Die App nutzt die kostenlose **Nominatim API** von OpenStreetMap:

- **Rate-Limit**: 1 Request/Sekunde
- **Implementierung**: 1,5 Sekunden Delay zwischen Requests
- **Retry**: Max. 3 Versuche bei Fehlern
- **Cache**: LocalStorage für 30 Tage
- **User-Agent**: `WaehlerMap/1.0 (OpenSource Map Aggregator)`

**Wichtig**: Für Produktiv-Einsatz mit großen Datenmengen sollte eine selbst-gehostete Nominatim-Instanz verwendet werden.

## Datenschutz

- **Keine Server-Uploads**: Alle Daten werden nur im Browser verarbeitet
- **LocalStorage**: Nur gecachte Geocoding-Ergebnisse (Adressen → Koordinaten)
- **Keine Persistenz**: CSV-Daten werden nicht gespeichert
- **Nominatim**: Externe API-Calls für Geocoding (OpenStreetMap)

## Erweiterungsmöglichkeiten

- [ ] Backend für Bulk-Geocoding
- [ ] Eigene Nominatim-Instanz
- [ ] Export-Funktionen (JSON, GeoJSON)
- [ ] Heatmap-Visualisierung
- [ ] Multi-File Upload
- [ ] Batch-Processing

## Lizenz

MIT License - siehe [LICENSE](LICENSE)

## Credits

- **OpenStreetMap**: Map-Tiles & Geocoding
- **Nominatim**: Geocoding Service
- **Telekom Scale**: UI-Design System
- **Leaflet**: Map-Library
- **Leaflet.markercluster**: Clustering-Plugin

## Support

Bei Fragen oder Issues bitte ein GitHub Issue erstellen:
https://github.com/Sico93/WaehlerMap/issues
