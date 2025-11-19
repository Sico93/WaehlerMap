import L from 'leaflet';
import 'leaflet.markercluster';

/**
 * Create custom cluster icon (green, showing locations count + total persons)
 */
const createClusterIcon = (cluster: L.MarkerCluster): L.DivIcon => {
  const markers = cluster.getAllChildMarkers();
  const locationCount = markers.length; // Anzahl Standorte
  const totalPersons = markers.reduce((sum, marker) => {
    return sum + ((marker as any).totalCount || 0);
  }, 0);

  let size = 50;
  let fontSize = '13px';
  let lineHeight = '1.2';

  if (locationCount < 10) {
    size = 50;
    fontSize = '13px';
  } else if (locationCount < 100) {
    size = 60;
    fontSize = '14px';
  } else {
    size = 70;
    fontSize = '15px';
  }

  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #28a745 0%, #218838 100%);
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${fontSize};
        line-height: ${lineHeight};
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      ">
        <div style="font-size: ${fontSize};">${locationCount}</div>
        <div style="font-size: 10px; opacity: 0.9;">${totalPersons} Pers.</div>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
  });
};

/**
 * Default marker cluster options
 */
export const getClusterOptions = (): L.MarkerClusterGroupOptions => {
  return {
    iconCreateFunction: createClusterIcon,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 80,
    disableClusteringAtZoom: 18,
  };
};
