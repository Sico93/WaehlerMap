# WaehlerMap Deployment Guide

Dieses Dokument beschreibt, wie WaehlerMap auf GitHub Pages oder GitLab Pages bereitgestellt werden kann.

## Übersicht

WaehlerMap ist eine rein client-seitige React-Anwendung, die perfekt für statisches Hosting auf GitHub/GitLab Pages geeignet ist. Die Anwendung benötigt keinen Backend-Server, alle Daten werden im Browser verarbeitet.

## ✅ Was funktioniert auf Pages

- ✅ LocalStorage für Geocoding-Cache und Gruppen
- ✅ Nominatim Geocoding API (CORS-fähig)
- ✅ Leaflet Karten mit OpenStreetMap Tiles
- ✅ Alle Client-Side Features (CSV-Upload, Filterung, Gruppierung)
- ✅ Responsive Design für Desktop und Mobile

## ⚠️ Wichtige Hinweise

### Nominatim API Usage Policy

Die Anwendung nutzt die kostenlose Nominatim API von OpenStreetMap:

- **Rate Limit**: Max 1 Request/Sekunde (bereits implementiert: 1.5s Delay)
- **User-Agent**: Erforderlich und bereits gesetzt
- **Heavy Usage**: Bei sehr vielen Nutzern erwägen Sie:
  - Eigenen Nominatim-Server aufsetzen
  - Alternative Geocoding-API (Mapbox, Google Maps)

### CORS

- Nominatim erlaubt CORS von allen Origins
- Kein Problem für GitHub/GitLab Pages Domains

### Cache

- LocalStorage funktioniert domainspezifisch
- Jeder User hat eigenen Cache (30 Tage Gültigkeit)
- Kein serverseitiger Cache erforderlich

---

## 🚀 GitHub Pages Deployment

### Voraussetzungen

- GitHub Repository mit dem WaehlerMap Code
- Node.js 20+ installiert

### Schritt 1: Vite Konfiguration anpassen

Öffnen Sie `frontend/vite.config.ts` und setzen Sie den `base` Pfad:

\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/WaehlerMap/', // ⚠️ Anpassen an Ihren Repository-Namen!
  build: {
    outDir: 'dist',
  },
})
\`\`\`

**Wichtig**: Ersetzen Sie `/WaehlerMap/` durch `/<IhrRepositoryName>/`

Für Custom Domain: `base: '/'`

### Schritt 2: GitHub Actions Workflow erstellen

Erstellen Sie `.github/workflows/deploy.yml`:

\`\`\`yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./frontend/dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
\`\`\`

### Schritt 3: Repository Settings

1. Gehen Sie zu: **Settings → Pages**
2. Source: **GitHub Actions** (empfohlen) oder **Deploy from a branch**
3. Wenn Branch: Wählen Sie `gh-pages` oder `main`

### Schritt 4: Deployment

\`\`\`bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
\`\`\`

Die Actions Pipeline startet automatisch und deployed die App.

### Zugriff

**Standard URL**: `https://<username>.github.io/<repository-name>/`

**Beispiel**: `https://sico93.github.io/WaehlerMap/`

### Custom Domain (Optional)

1. Fügen Sie `CNAME` Datei in `frontend/public/` hinzu:
   \`\`\`
   waehlermap.example.com
   \`\`\`

2. Setzen Sie in `vite.config.ts`:
   \`\`\`typescript
   base: '/'
   \`\`\`

3. Konfigurieren Sie DNS:
   - A Record: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Oder CNAME: `<username>.github.io`

---

## 🦊 GitLab Pages Deployment

### Schritt 1: Vite Konfiguration

\`\`\`typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/WaehlerMap/', // ⚠️ Anpassen an Ihren Repository-Namen!
  build: {
    outDir: 'dist',
  },
})
\`\`\`

Für Custom Domain: `base: '/'`

### Schritt 2: GitLab CI Configuration

Erstellen Sie `.gitlab-ci.yml` im Root:

\`\`\`yaml
image: node:20

cache:
  paths:
    - frontend/node_modules/

pages:
  stage: deploy
  script:
    - cd frontend
    - npm ci
    - npm run build
    - cd ..
    - mv frontend/dist public
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
\`\`\`

### Schritt 3: Deployment

\`\`\`bash
git add .gitlab-ci.yml frontend/vite.config.ts
git commit -m "Add GitLab Pages deployment"
git push origin main
\`\`\`

Die Pipeline startet automatisch.

### Zugriff

**Standard URL**: `https://<username>.gitlab.io/<repository-name>/`

**Beispiel**: `https://sico93.gitlab.io/WaehlerMap/`

### Custom Domain (GitLab)

1. **Settings → Pages → New Domain**
2. Fügen Sie Domain hinzu und verifizieren Sie per DNS
3. Setzen Sie in `vite.config.ts`: `base: '/'`

---

## 🔧 Lokaler Build Test

Vor dem Deployment sollten Sie lokal testen:

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Preview the production build
npm run preview
\`\`\`

Der Preview-Server läuft auf `http://localhost:4173`

---

## 📊 Build-Optimierung

### Bundle Size Analyse

\`\`\`bash
cd frontend
npm run build

# Analysieren Sie dist/assets/
ls -lh dist/assets/
\`\`\`

### Performance-Tipps

1. **Code Splitting**: Bereits durch Vite implementiert
2. **Lazy Loading**: React Router mit `lazy()` für große Komponenten
3. **Image Optimization**: PNG/JPG komprimieren
4. **Tree Shaking**: Automatisch durch Vite/Rollup

---

## 🐛 Troubleshooting

### Problem: 404 bei Subpaths

**Ursache**: `base` in `vite.config.ts` falsch gesetzt

**Lösung**:
- GitHub: `base: '/<repository-name>/'`
- GitLab: `base: '/<repository-name>/'`
- Custom Domain: `base: '/'`

### Problem: Leere weiße Seite

**Debugging**:
1. Öffnen Sie Browser DevTools (F12)
2. Prüfen Sie Console auf Fehler
3. Prüfen Sie Network Tab auf 404s
4. Verifizieren Sie `base` Pfad

**Häufige Ursachen**:
- Falscher `base` Pfad
- Build-Fehler (prüfen Sie CI Logs)
- CORS-Probleme (sollten nicht auftreten)

### Problem: API Rate Limiting

**Symptom**: Geocoding schlägt fehl bei vielen Adressen

**Lösung**:
1. Nutzen Sie den Geocoding-Cache (LocalStorage)
2. Reduzieren Sie gleichzeitige Uploads
3. Erwägen Sie eigenen Nominatim-Server:
   \`\`\`bash
   docker run -d -p 8080:8080 \
     -e PBF_URL=https://download.geofabrik.de/europe/germany-latest.osm.pbf \
     mediagis/nominatim:4.2
   \`\`\`

### Problem: LocalStorage voll

**Symptom**: Cache kann nicht gespeichert werden

**Lösung**:
- Browser-Einstellungen → Site Data löschen
- Cache hat 30-Tage Auto-Expiry
- Limit: ~5-10 MB pro Domain

---

## 🔐 Sicherheit

### Best Practices

✅ **Keine sensiblen Daten im Frontend**
- Keine API Keys im Code (außer öffentliche wie Nominatim)
- Keine Passwörter oder Tokens

✅ **Content Security Policy** (Optional)

Fügen Sie in `index.html` hinzu:

\`\`\`html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data: https://*.tile.openstreetmap.org https://*.cdnjs.cloudflare.com;
               connect-src 'self' https://nominatim.openstreetmap.org;">
\`\`\`

✅ **Subresource Integrity** für CDN-Links

Bereits in `index.html` implementiert mit Leaflet CDN SRI.

---

## 📱 Mobile Optimierung

Die App ist responsive, aber für optimale Mobile-Erfahrung:

### Viewport Meta Tag

Bereits in `index.html`:
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

### Touch-Optimierung

Leaflet unterstützt Touch-Gesten:
- Pinch to Zoom
- Tap to select
- Swipe to pan

### PWA (Progressive Web App)

Optional: Fügen Sie `manifest.json` hinzu:

\`\`\`json
{
  "name": "WaehlerMap",
  "short_name": "WaehlerMap",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#e20074",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
\`\`\`

---

## 📈 Monitoring & Analytics (Optional)

### Google Analytics

Fügen Sie in `index.html` hinzu:

\`\`\`html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
\`\`\`

### Plausible Analytics (Privacy-friendly)

\`\`\`html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
\`\`\`

---

## 🔄 Updates & Wartung

### Regelmäßige Updates

\`\`\`bash
cd frontend

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
\`\`\`

### Version Tags

\`\`\`bash
# Create version tag
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
\`\`\`

---

## 📞 Support & Kontakt

Bei Problemen:

1. Prüfen Sie Browser Console (F12)
2. Prüfen Sie CI/CD Pipeline Logs
3. Erstellen Sie ein GitHub Issue mit:
   - Browser & Version
   - Fehlermeldung (Console Output)
   - Schritte zur Reproduktion

---

## 📄 Lizenz & Credits

- **WaehlerMap**: MIT License
- **OpenStreetMap**: © OpenStreetMap contributors
- **Nominatim**: © OpenStreetMap Foundation
- **Leaflet**: BSD 2-Clause License
- **React**: MIT License
- **Telekom Scale**: MIT License

---

**Version**: 1.0.0
**Letzte Aktualisierung**: 2025-01-26
