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

## 3. Verarbeitung

### 3.1 Geocoding (OpenSource-freundlich)
- Primär mit **Nominatim (OpenStreetMap)** oder einer selbst gehosteten Instanz.
- API-Keys sollen **nicht erforderlich** sein.
- Deduplizierung: Gleiche Adressen nur **einmal** geokodieren (Cache / Map).

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
- Marker pro Eintrag oder pro Adresse
- Cluster sollen automatisch entstehen beim Herauszoomen
- Jeder Cluster zeigt die Anzahl der enthaltenen Marker
- Eigene iconCreateFunction für individuell gestaltete Cluster

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
 
### 6.2 Komponenten (empfohlen)

- PapaParse (OpenSource) für CSV-Verarbeitung
- Leaflet + MarkerCluster für Kartenlogik
- Svelte, React oder Vanilla JS (alles OpenSource)

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

## 8. Nicht-Ziele
- Keine Benutzerverwaltung
- Keine Cloud-Anbindung
- Keine proprietären Dienste (nur OpenSource-Tools)
- Kein Design-Framework-Zwang
- Kein fortgeschrittenes Performance-Tuning

## 9. Zusammenfassung
Das Repository soll die Basis für eine vollständig OpenSource-basierte Webanwendung bieten, die CSV-Daten (mit Adresse + Kategorie) visualisiert, geokodiert, clustert und filterbar auf einer OpenStreetMap-Karte darstellt.
Schwerpunkt: OpenStreetMap + Leaflet + OpenSource-Bibliotheken, klare Struktur, gute Erweiterbarkeit.
