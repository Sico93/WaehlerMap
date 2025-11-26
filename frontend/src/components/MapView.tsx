import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { AggregatedLocation } from '../types';
import { createBaseMap, createNumberedIcon, createPopupContent } from '../map/leafletSetup';
import { getClusterOptions } from '../map/clusterConfig';

interface MapViewProps {
  locations: AggregatedLocation[];
  selectedLocationIds?: Set<string>;
  isGroupingMode?: boolean;
  onToggleLocationSelection?: (locationId: string) => void;
}

export const MapView = ({
  locations,
  selectedLocationIds = new Set(),
  isGroupingMode = false,
  onToggleLocationSelection
}: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = createBaseMap(mapContainerRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing marker cluster
    if (markerClusterRef.current) {
      mapRef.current.removeLayer(markerClusterRef.current);
    }

    // Create new marker cluster group
    const markerCluster = L.markerClusterGroup(getClusterOptions());

    // Add markers for each location
    locations.forEach((location) => {
      const isSelected = selectedLocationIds.has(location.id);
      const icon = createNumberedIcon(location.totalCount, isSelected);

      const marker = L.marker([location.lat, location.lon], { icon });

      // Store totalCount and location ID on marker
      (marker as any).totalCount = location.totalCount;
      (marker as any).locationId = location.id;

      // Handle CTRL+Click for selection
      marker.on('click', (e: L.LeafletMouseEvent) => {
        if (isGroupingMode && e.originalEvent.ctrlKey && onToggleLocationSelection) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
          L.DomEvent.stopPropagation(e);
          onToggleLocationSelection(location.id);
        }
      });

      const popupContent = createPopupContent(
        location.address,
        location.totalCount,
        location.categoryCounts
      );

      marker.bindPopup(popupContent);
      markerCluster.addLayer(marker);
    });

    // Add cluster to map
    mapRef.current.addLayer(markerCluster);
    markerClusterRef.current = markerCluster;

    // Fit bounds to show all markers
    if (locations.length > 0) {
      const bounds = markerCluster.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        });
      }
    }
  }, [locations, selectedLocationIds, isGroupingMode, onToggleLocationSelection]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    />
  );
};
