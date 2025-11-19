import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyPolyfills, defineCustomElements } from '@telekom/scale-components/loader'
import './index.css'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import App from './App.tsx'

// Initialize Telekom Scale Components
applyPolyfills().then(() => {
  defineCustomElements(window)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
