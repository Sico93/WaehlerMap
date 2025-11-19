# Arbeitsplan – Map Aggregator (WaehlerMap)

**Projekt:** OpenStreetMap-basierte Webanwendung zur Visualisierung von CSV-Daten
**Tech-Stack:** React + TypeScript + Vite + Telekom Scale + Leaflet

---

## Phase 1: Projekt-Setup & Grundstruktur

### 1.1 Projekt initialisieren
- [ ] Vite + React + TypeScript Projekt aufsetzen
- [ ] Git-Konfiguration (.gitignore, .editorconfig)
- [ ] package.json konfigurieren

### 1.2 Dependencies installieren
- [ ] Telekom Scale UI-Bibliothek
- [ ] Leaflet + Leaflet.markercluster
- [ ] PapaParse (CSV-Parser)
- [ ] TypeScript Types (@types/leaflet, etc.)

### 1.3 Projektstruktur anlegen
```
/frontend
  /src
    /components       # React-Komponenten
      FileUpload.tsx
      FilterPanel.tsx
      MapView.tsx
      ErrorList.tsx
      ProgressIndicator.tsx
    /map              # Leaflet-Setup
      leafletSetup.ts
      clusterConfig.ts
    /services         # Business-Logik
      csvParser.ts
      geocoding.ts
      dataAggregator.ts
      cacheService.ts
    /types            # TypeScript Interfaces
      index.ts
    /styles           # CSS
    App.tsx
    main.tsx
```

**Status:** ✅ Vorbereitung abgeschlossen | 🔄 In Arbeit | ⏳ Ausstehend

---

## Phase 2: CSV-Upload & Datenverarbeitung

### 2.1 CSV-Upload Komponente
- [ ] FileUpload-Komponente mit Telekom Scale UI
- [ ] Drag & Drop Unterstützung
- [ ] Datei-Validierung (CSV-Format)

### 2.2 CSV-Parser
- [ ] PapaParse Integration
- [ ] Header-Validierung (`address`, `category` Pflichtfelder)
- [ ] Datenmodell-Mapping
- [ ] Fehlerhafte Zeilen erfassen

### 2.3 Datenvalidierung
- [ ] Adress-Deduplizierung (gleiche Adressen nur einmal)
- [ ] Kategorie-Extraktion (DTS, ISP, GK, etc.)
- [ ] Vollständigkeitsprüfung (`address` ODER `street`+`zip`+`city`)

**Erwartetes Datenmodell:**
```typescript
interface CSVRow {
  address?: string;
  category: string;
  street?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  country?: string;
  additionalInfo?: string;
}

interface ProcessedLocation {
  id: string;
  lat: number;
  lon: number;
  category: string;
  rawAddress: string;
  sourceRow: CSVRow;
}
```

---

## Phase 3: Geocoding & Caching

### 3.1 Nominatim Geocoding Service
- [ ] API-Integration (Nominatim OpenStreetMap)
- [ ] Rate-Limiting: 1,5 Sekunden Delay zwischen Requests
- [ ] Retry-Logik (max. 3 Versuche bei Fehlern)
- [ ] Adress-Normalisierung (aus optionalen Feldern bauen)

### 3.2 Geocoding-Cache
- [ ] LocalStorage-Implementierung
- [ ] Cache-Key-Strategie (normalisierte Adresse als Key)
- [ ] Cache-Lookup vor API-Request
- [ ] Persistenz über Sessions

### 3.3 Fehler-Tracking
- [ ] Liste fehlerhafter Adressen sammeln
- [ ] Fehlertypen kategorisieren (nicht gefunden, API-Fehler, etc.)
- [ ] Export-Funktion für Fehler-Report

### 3.4 Progress-Anzeige
- [ ] Geocoding-Fortschritt (x / y Adressen)
- [ ] Echtzeit-Update während Verarbeitung
- [ ] Telekom Scale Progress Bar

---

## Phase 4: Daten-Aggregation

### 4.1 Aggregation nach Adresse
- [ ] Gruppierung identischer Koordinaten
- [ ] Summierung der Einträge pro Standort
- [ ] Kategorien-Häufigkeit berechnen

**Aggregiertes Datenmodell:**
```typescript
interface AggregatedLocation {
  id: string;
  lat: number;
  lon: number;
  address: string;
  totalCount: number;
  categoryCounts: Record<string, number>; // z.B. { "DTS": 15, "ISP": 8 }
  entries: ProcessedLocation[];
}
```

---

## Phase 5: Karte & Visualisierung

### 5.1 Leaflet Basis-Karte
- [ ] Leaflet initialisieren
- [ ] OpenStreetMap Tiles einbinden
- [ ] Container-Setup mit React

### 5.2 MarkerCluster Plugin
- [ ] Leaflet.markercluster konfigurieren
- [ ] Custom iconCreateFunction (Cluster-Styling)
- [ ] Cluster-Optionen (spiderfyOnMaxZoom, etc.)

### 5.3 Marker & Popups
- [ ] Marker pro aggregierter Adresse erstellen
- [ ] Custom Marker-Icons (Anzahl anzeigen)
- [ ] Popup-Template:
  - Vollständige Adresse
  - Gesamtanzahl am Standort
  - Kategorien-Breakdown (DTS: 15, ISP: 8, etc.)
  - Zusatzinfos

### 5.4 Initial-Ansicht
- [ ] fitBounds auf alle Marker (automatischer Zoom)
- [ ] Fallback bei 0 Markern

---

## Phase 6: Filter-Funktionalität

### 6.1 Kategorie-Filter
- [ ] Checkbox-Liste aller Kategorien (Telekom Scale)
- [ ] Mehrfachauswahl
- [ ] Live-Update der Karte bei Änderung

### 6.2 Mindestanzahl-Filter
- [ ] Numeric Input (Telekom Scale)
- [ ] Slider als Alternative (optional)
- [ ] Filter nur Standorte mit ≥ X Einträgen

### 6.3 Filter-Logik
- [ ] Marker dynamisch ein-/ausblenden
- [ ] Cluster neu berechnen
- [ ] fitBounds bei aktiven Filtern anpassen

---

## Phase 7: UI & Layout

### 7.1 Haupt-Layout
- [ ] Responsive Grid-Layout
- [ ] Linke Seite: Filter-Panel + Upload
- [ ] Rechte Seite: Karte (Vollhöhe)
- [ ] Telekom Scale Design System

### 7.2 Komponenten-Integration
- [ ] App.tsx als Container
- [ ] State-Management (React Context oder useState)
- [ ] Event-Handling zwischen Komponenten

### 7.3 Status-Komponenten
- [ ] Progress-Bar (Geocoding)
- [ ] Fehler-Liste (ErrorList.tsx)
- [ ] Success-/Warning-Notifications (Telekom Scale)

---

## Phase 8: Finalisierung & Dokumentation

### 8.1 CSV-Beispieldatei
- [ ] `example.csv` mit 50-100 Beispieldaten erstellen
- [ ] Alle drei Kategorien (DTS, ISP, GK) vertreten
- [ ] Mix aus `address`-Feld und optionalen Feldern

### 8.2 README.md
- [ ] Setup-Anleitung (npm install, npm run dev)
- [ ] Feature-Übersicht
- [ ] CSV-Format-Dokumentation
- [ ] Screenshots (optional)

### 8.3 Testing & Edge Cases
- [ ] Leere CSV hochladen
- [ ] Fehlerhafte Adressen
- [ ] Sehr große Dateien (Performance)
- [ ] Filter-Kombinationen
- [ ] Browser-Kompatibilität (Chrome, Firefox, Safari)

### 8.4 Performance-Optimierungen
- [ ] React.memo für teure Komponenten
- [ ] Debouncing bei Filter-Inputs
- [ ] Lazy Loading (optional)

---

## Zusammenfassung

**Geschätzter Aufwand:** 25-30 Tasks
**Priorität:** Phase 1-3 (Setup, CSV, Geocoding) → Phase 5 (Karte) → Phase 6-7 (Filter, UI) → Phase 8 (Finalisierung)

**Nächster Schritt:** Phase 1 starten (Vite + React + TypeScript Setup)
