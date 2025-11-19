# Anforderungen – Map Aggregator (OpenStreetMap, OpenSource-first)

## 1. Ziel
Eine Webanwendung, die aus einer CSV-Datei automatisch eine interaktive Karte auf Basis von **OpenStreetMap** erzeugt.  
Die Karte soll Standorte **clustern**, die **Anzahl pro Standort oder Cluster** anzeigen und nach **Kategorien bzw. Mindestanzahl** gefiltert werden können.  
Es sollen **ausschließlich OpenSource-Bibliotheken** verwendet werden, sofern technisch möglich.
Ich möchte die Anwendung lokal laufen lassen können. 

---

## 2. Eingabedaten

### 2.1 CSV-Upload
- Upload einer CSV-Datei mit ca. **2500 Zeilen** und ca. **100–150 eindeutigen Adressen**.  
- Pro Zeile: **eine Position / ein Mitarbeitender**.

### 2.2 Pflicht-Felder
- `address` (vollständige Adresse ODER Kombination der optionalen Felder)
- `category` (z. B. Abteilung)

### 2.3 Optionale Felder
- `street` (Straßenname)
- `houseNumber`
- `zip`
- `city`
- `country`
- `additionalInfo`

Die App soll entweder `address` direkt verwenden oder aus den optionalen Feldern eine vollständige Adresse bauen.

### 2.4 CSV-Format (Beispiel)
```csv
address,category,street,houseNumber,zip,city,country,additionalInfo
"Musterstraße 1, 12345 Berlin",DTS,,,,,
,ISP,Hauptstraße,42,80331,München,Deutschland,Gebäude A
"Bahnhofstraße 10, 50667 Köln",GK,,,,,Abteilung Vertrieb
```

**Hinweise:**
- Header-Zeile erforderlich (case-sensitive: `address`, `category`)
- Entweder `address` gefüllt ODER Kombination aus `street`, `houseNumber`, `zip`, `city`
- `category` ist Pflichtfeld (z.B. DTS, ISP, GK)
- Kommas in Adressen mit Anführungszeichen escapen

## 3. Verarbeitung

### 3.1 Geocoding (OpenSource-freundlich)
- Primär mit **Nominatim (OpenStreetMap)** oder einer selbst gehosteten Instanz.
- API-Keys sollen **nicht erforderlich** sein.
- Deduplizierung: Gleiche Adressen nur **einmal** geokodieren (Cache / Map).
- **Rate-Limiting:** 1,5 Sekunden Delay zwischen Requests (Nominatim Limit: 1 req/sec)
- **Retry-Logik:** Bei Fehlern automatisch wiederholen (max. 3 Versuche)
- **Cache:** LocalStorage für persistentes Caching über Sessions hinweg
- **Fehlerhafte Adressen:** Am Ende Liste aller nicht-geokodierter Adressen ausgeben

### 3.2 Datenmodell
```ts
{
  id: string;
  lat: number;
  lon: number;
  category: string;
  rawAddress: string;
  sourceRow?: any;
}
```

### 3.3 Aggregation (optional erweiterbar)

Mehrere Einträge derselben Adresse sollen gruppiert werden.

Aggregat enthält Summe und Kategorienhäufigkeit.

## 4. Kartenfunktionalität
### 4.1 Basiskarte
- Leaflet (OpenSource)
- Tiles: bevorzugt OSM Standard Tile Server oder ein eigener Tile-Proxy

### 4.2 Marker & Clustering
- Leaflet.markercluster (OpenSource)
- **Ein Marker pro individueller Adresse** (aggregiert)
- Marker zeigt die **Gesamtanzahl aller Personen** am Standort
- Cluster sollen automatisch entstehen beim Herauszoomen
- Jeder Cluster zeigt die Anzahl der enthaltenen Marker
- Eigene iconCreateFunction für individuell gestaltete Cluster
- **Initial-Ansicht:** fitBounds auf alle Marker (automatischer Zoom)

### 4.3 Standort-Popup
Popup zeigt:
- Vollständige Adresse
- Summe aller Einträge am Standort
- Kategorienübersicht (z. B. Abteilung → Anzahl)
- Optional zusätzliche Informationen

## 5. Filter
### 5.1 Kategorie-Filter
- Liste aller vorhandenen Kategorien
- Mehrfachauswahl (Checkboxes)
- Karte aktualisiert Marker/Cluster automatisch

### 5.2 Mindestanzahl-Filter
- Numeric Input (z. B. „≥ 50“)
  - Zeigt nur Standorte oder Cluster, deren Summe diesen Wert erreicht

## 6. UI / Frontend
### 6.1 Grundanforderungen
- Web-UI als Single Page Application
- Minimalistisches Design
- Übersichtliches Layout:
  - Linke Seite: Filter + Upload
  - Rechte Seite: Karte
 
### 6.2 Tech-Stack (final)

- **Frontend-Framework:** React mit TypeScript
- **Build-Tool:** Vite (schneller Dev-Server, HMR, optimiertes Build)
- **UI-Bibliothek:** Telekom Scale (https://telekom.github.io/scale/)
- **CSV-Parsing:** PapaParse (OpenSource)
- **Karte:** Leaflet + Leaflet.markercluster (OpenSource)
- **Styling:** Minimale eigene CSS + Telekom Scale Komponenten

### 6.3 Statusanzeigen
- Fortschritt beim Geocoding: x / y Adressen verarbeitet
- Fehlerhafte Adressen markieren / anzeigen

## 7. Projektstruktur (Blanko-Repository)
```bash
/frontend
  /src
    /components
      FileUpload.tsx / .svelte
      FilterPanel.tsx / .svelte
      MapView.ts
    /map
      leafletSetup.ts
      clusterConfig.ts
    /services
      csvParser.ts
      geocoding.ts
      dataAggregator.ts
  package.json
  vite.config.js    // oder rollup/svelte.config.js

/docs
  requirements.md   // enthält diese Datei

/.editorconfig
/.gitignore
/README.md
```

Optionale spätere Erweiterungen:
- /backend (Node/Express) für Bulk-Geocoding oder Caching
- Persistente Speicherung (SQLite)

## 8. Datenspeicherung & Datenschutz
- **Keine Datenbank** erforderlich
- **Alle Daten verbleiben im Browser** des Users (keine Server-Uploads)
- **LocalStorage** für Geocoding-Cache (Performance-Optimierung)
- CSV-Daten werden nur im Browser-Speicher (RAM) verarbeitet
- Keine persistente Speicherung der CSV-Daten selbst

## 9. Nicht-Ziele
- Keine Benutzerverwaltung
- Keine Cloud-Anbindung
- Keine proprietären Dienste (nur OpenSource-Tools)
- Kein Design-Framework-Zwang
- Kein fortgeschrittenes Performance-Tuning
- Keine Datenbank oder Backend (reine Frontend-Lösung)

## 10. Zusammenfassung
Das Repository soll die Basis für eine vollständig OpenSource-basierte Webanwendung bieten, die CSV-Daten (mit Adresse + Kategorie) visualisiert, geokodiert, clustert und filterbar auf einer OpenStreetMap-Karte darstellt.
Schwerpunkt: OpenStreetMap + Leaflet + OpenSource-Bibliotheken, klare Struktur, gute Erweiterbarkeit.
