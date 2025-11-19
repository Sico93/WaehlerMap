import L from 'leaflet';

// Fix Leaflet default icon issue with Vite/Webpack
// https://github.com/Leaflet/Leaflet/issues/4968
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Create base map with OpenStreetMap tiles
 */
export const createBaseMap = (container: HTMLElement): L.Map => {
  const map = L.map(container, {
    center: [51.1657, 10.4515], // Germany center
    zoom: 6,
    zoomControl: true,
  });

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  return map;
};

/**
 * Create custom numbered marker icon
 * - Single person (count = 1): Magenta
 * - Aggregated (count > 1): Green
 */
export const createNumberedIcon = (count: number): L.DivIcon => {
  const isAggregated = count > 1;
  const backgroundColor = isAggregated ? '#28a745' : '#e20074'; // Green for aggregated, Magenta for single

  const size = count < 10 ? 25 : count < 100 ? 30 : 35;
  const fontSize = count < 10 ? '12px' : count < 100 ? '11px' : '10px';

  return L.divIcon({
    html: `
      <div style="
        background-color: ${backgroundColor};
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${fontSize};
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

/**
 * Create popup content for aggregated location
 */
export const createPopupContent = (
  address: string,
  totalCount: number,
  categoryCounts: Record<string, number>
): string => {
  const isAggregated = totalCount > 1;
  const headerColor = isAggregated ? '#28a745' : '#e20074'; // Green for aggregated, Magenta for single
  const aggregationBadge = isAggregated
    ? `<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.75rem; margin-left: 0.5rem;">Aggregiert</span>`
    : '';

  const categoryList = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => `<li><strong>${cat}:</strong> ${count}</li>`)
    .join('');

  return `
    <div style="min-width: 200px;">
      <h4 style="margin-top: 0; color: ${headerColor};">
        ${address}
        ${aggregationBadge}
      </h4>
      <div style="margin-bottom: 0.5rem;">
        <strong>Gesamt:</strong> ${totalCount} ${totalCount === 1 ? 'Person' : 'Personen'}
      </div>
      <div>
        <strong>Kategorien:</strong>
        <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
          ${categoryList}
        </ul>
      </div>
    </div>
  `;
};
