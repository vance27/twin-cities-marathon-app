'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MarathonMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://api.maptiler.com/maps/bright/style.json?key=YOUR_KEY',
        center: [-73.9857, 40.7484], // Example: NYC Marathon start
        zoom: 12,
      });
    }
  }, []);

  return <div ref={mapContainer} className="w-full h-screen" />;
}
