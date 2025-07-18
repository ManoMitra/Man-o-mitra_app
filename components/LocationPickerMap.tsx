
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LocationPickerMapProps {
  center: [number, number];
  zoom: number;
  markerCoords: { lat: number, lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  homeCoords: { lat: number, lng: number } | null;
}

// Icon fix for bundlers
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

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ center, zoom, markerCoords, onMapClick, homeCoords }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      mapRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add click listener
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }
    
    // Cleanup on unmount
    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    }
  }, []); // Run only once

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Pan to new center and set zoom if they change
    map.setView(center, zoom);
    // Crucial fix for maps in modals or initially hidden containers.
    // A small delay helps if the modal has CSS transitions.
    const timer = setTimeout(() => map.invalidateSize({ pan: false }), 100);
    return () => clearTimeout(timer);

  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Update marker position
    if (markerCoords) {
      if (!markerRef.current) {
        const marker = L.marker([markerCoords.lat, markerCoords.lng]).addTo(map);
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([markerCoords.lat, markerCoords.lng]);
      }
    } else {
        // Remove marker if coords are null
        if (markerRef.current) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
        }
    }
  }, [markerCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing home marker if it's there
    if(homeMarkerRef.current) {
        map.removeLayer(homeMarkerRef.current);
        homeMarkerRef.current = null;
    }

    // Add new home marker if coords are provided
    if (homeCoords) {
        const homeMarker = L.marker([homeCoords.lat, homeCoords.lng], {
            icon: homeIcon,
            interactive: false,
            zIndexOffset: -100 // Keep it below the main marker
        }).addTo(map);
        homeMarkerRef.current = homeMarker;
    }
  }, [homeCoords]);


  return <div ref={mapContainerRef} className="absolute inset-0" />;
};

export default LocationPickerMap;
