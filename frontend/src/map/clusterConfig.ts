import L from 'leaflet';
import 'leaflet.markercluster';

/**
 * Create custom cluster icon
 */
const createClusterIcon = (cluster: L.MarkerCluster): L.DivIcon => {
  const childCount = cluster.getChildCount();
  let size = 40;
  let fontSize = '14px';

  if (childCount < 10) {
    size = 40;
    fontSize = '14px';
  } else if (childCount < 100) {
    size = 50;
    fontSize = '16px';
  } else {
    size = 60;
    fontSize = '18px';
  }

  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #e20074 0%, #c7005e 100%);
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${fontSize};
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      ">
        ${childCount}
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
