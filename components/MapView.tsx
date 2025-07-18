
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Location } from '../types';

interface MapViewProps {
  locations: Location[];
  center: [number, number];
  zoom: number;
  homeLocation: Location | undefined;
}

// Fix for default icon issue with bundlers like Webpack/Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const homeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>`;

const homeIcon = L.divIcon({
    html: `<div class="p-1 bg-blue-600 rounded-full shadow-lg text-white">${homeIconSvg}</div>`,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});


const MapView: React.FC<MapViewProps> = ({ locations, center, zoom, homeLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize the map
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      mapRef.current = map;

      // Add the tile layer from OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Initialize the marker group
      markersRef.current = L.featureGroup().addTo(map);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom]); // Only re-run if center or zoom props change

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;

    if (!map || !markers) return;

    // Clear existing markers
    markers.clearLayers();

    const defaultIcon = new L.Icon.Default();

    // Add new markers for each location
    locations.forEach(location => {
      const isHome = homeLocation && location.id === homeLocation.id;
      const marker = L.marker([location.lat, location.lng], {
          icon: isHome ? homeIcon : defaultIcon
      });
      marker.bindPopup(`<b>${location.name}</b><br>${location.address}`);
      markers.addLayer(marker);
    });

    // Adjust map view to fit all markers
    if (locations.length > 0) {
      map.fitBounds(markers.getBounds(), { padding: [50, 50] });
    } else {
      map.setView(center, zoom);
    }

    // Force map to re-evaluate its size, useful when container size changes (e.g., on tab switch)
    map.invalidateSize();

  }, [locations, center, zoom, homeLocation]); // Re-run whenever locations or home location changes

  return <div ref={mapContainerRef} className="absolute inset-0" />;
};

export default MapView;
