'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import { LineString, Point } from 'ol/geom';
import { Feature } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { getLength } from 'ol/sphere';
import 'ol/ol.css';

interface InteractiveMapProps {
  onRouteChange?: (coordinates: [number, number][], distanceMiles: number) => void;
  initialRoute?: [number, number][];
  center?: [number, number];
  zoom?: number;
  height?: string;
  currentMile?: number;
  showSimulation?: boolean;
}

export function InteractiveMap({
  onRouteChange,
  initialRoute,
  center = [-93.2650, 44.9778], // Minneapolis default
  zoom = 12,
  height = '500px',
  currentMile = 0,
  showSimulation = false,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const currentPositionSourceRef = useRef<VectorSource>(new VectorSource());
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);

  // Route style
  const routeStyle = new Style({
    stroke: new Stroke({
      color: '#FF4500',
      width: 4,
    }),
  });

  // Point style for waypoints
  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#FF4500',
      }),
      stroke: new Stroke({
        color: '#FFFFFF',
        width: 2,
      }),
    }),
  });

  // Current position marker style
  const currentPositionStyle = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({
        color: '#FFD700', // Gold color
      }),
      stroke: new Stroke({
        color: '#FF4500',
        width: 3,
      }),
    }),
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create vector layer for route
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: (feature) => {
        return feature.getGeometry()?.getType() === 'Point' ? pointStyle : routeStyle;
      },
    });

    // Create layer for current position marker
    const currentPositionLayer = new VectorLayer({
      source: currentPositionSourceRef.current,
      style: currentPositionStyle,
    });

    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          }),
        }),
        vectorLayer,
        currentPositionLayer,
      ],
      view: new View({
        center: fromLonLat(center),
        zoom: zoom,
      }),
    });

    mapInstanceRef.current = map;

    // Setup interactions
    setupDrawingInteractions(map);

    // Load initial route if provided
    if (initialRoute && initialRoute.length > 0) {
      loadInitialRoute(initialRoute);
    }

    return () => {
      map.setTarget();
    };
  }, []);

  // Watch for route changes and update map
  useEffect(() => {
    if (initialRoute && initialRoute.length > 0 && mapInstanceRef.current) {
      loadInitialRoute(initialRoute);
    }
  }, [initialRoute]);

  // Function to calculate position at a specific mile
  const getPositionAtMile = (mile: number): [number, number] | null => {
    if (!initialRoute || initialRoute.length === 0 || mile < 0) return null;

    // Calculate cumulative distances
    let cumulativeDistance = 0;
    for (let i = 1; i < initialRoute.length; i++) {
      const [lon1, lat1] = initialRoute[i - 1];
      const [lon2, lat2] = initialRoute[i];

      // Calculate segment distance
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const segmentDistance = R * c;

      const nextCumulativeDistance = cumulativeDistance + segmentDistance;

      // Check if the target mile is within this segment
      if (mile >= cumulativeDistance && mile <= nextCumulativeDistance) {
        // Interpolate position within the segment
        const ratio = (mile - cumulativeDistance) / segmentDistance;
        const interpolatedLon = lon1 + (lon2 - lon1) * ratio;
        const interpolatedLat = lat1 + (lat2 - lat1) * ratio;
        return [interpolatedLon, interpolatedLat];
      }

      cumulativeDistance = nextCumulativeDistance;
    }

    // If mile is beyond the route, return the last point
    return initialRoute[initialRoute.length - 1] || null;
  };

  // Store current position feature for efficient updates
  const currentPositionFeatureRef = useRef<Feature | null>(null);

  // Update current position marker when mile changes
  useEffect(() => {
    if (!showSimulation || !mapInstanceRef.current || !initialRoute || initialRoute.length === 0) return;

    const position = getPositionAtMile(currentMile);
    if (!position) return;

    const projectedPosition = fromLonLat(position);

    // More efficient: update existing feature instead of clearing and recreating
    if (currentPositionFeatureRef.current) {
      // Update existing feature geometry
      const geometry = currentPositionFeatureRef.current.getGeometry() as Point;
      geometry.setCoordinates(projectedPosition);
    } else {
      // Create new feature only if it doesn't exist
      currentPositionFeatureRef.current = new Feature({
        geometry: new Point(projectedPosition),
      });
      currentPositionSourceRef.current.addFeature(currentPositionFeatureRef.current);
    }

  }, [currentMile, showSimulation, initialRoute]);

  // Clear position feature when simulation stops and return to full route view
  useEffect(() => {
    if (!showSimulation && currentPositionFeatureRef.current) {
      currentPositionSourceRef.current.clear();
      currentPositionFeatureRef.current = null;

      // Return to full route view when simulation stops
      if (mapInstanceRef.current && initialRoute && initialRoute.length > 0) {
        const projectedCoords = initialRoute.map(coord => fromLonLat(coord));
        const lineString = new LineString(projectedCoords);

        mapInstanceRef.current.getView().fit(lineString, {
          padding: [50, 50, 50, 50],
          maxZoom: 16,
          duration: 1000, // Smooth transition back to full view
        });
      }
    }
  }, [showSimulation, initialRoute]);

  const setupDrawingInteractions = (map: Map) => {
    // Draw interaction for creating new routes
    const draw = new Draw({
      source: vectorSourceRef.current,
      type: 'LineString',
      style: routeStyle,
    });

    // Modify interaction for editing existing routes
    const modify = new Modify({
      source: vectorSourceRef.current,
    });

    // Snap interaction for snapping to existing features
    const snap = new Snap({
      source: vectorSourceRef.current,
    });

    drawInteractionRef.current = draw;
    modifyInteractionRef.current = modify;
    snapInteractionRef.current = snap;

    // Event listeners
    draw.on('drawstart', () => {
      setIsDrawing(true);
      // Clear existing route when starting new one
      vectorSourceRef.current.clear();
    });

    draw.on('drawend', (event) => {
      setIsDrawing(false);
      const feature = event.feature;
      const geometry = feature.getGeometry() as LineString;
      handleRouteUpdate(geometry);
    });

    modify.on('modifyend', (event) => {
      const features = event.features.getArray();
      if (features.length > 0) {
        const geometry = features[0].getGeometry() as LineString;
        handleRouteUpdate(geometry);
      }
    });

    // Add interactions to map
    map.addInteraction(modify);
    map.addInteraction(snap);
  };

  const handleRouteUpdate = (geometry: LineString) => {
    const coordinates = geometry.getCoordinates().map(coord => toLonLat(coord)) as [number, number][];
    const lengthMeters = getLength(geometry);
    const lengthMiles = lengthMeters * 0.000621371; // Convert meters to miles

    setTotalDistance(lengthMiles);

    if (onRouteChange) {
      onRouteChange(coordinates, lengthMiles);
    }
  };

  const loadInitialRoute = (coordinates: [number, number][]) => {
    if (coordinates.length === 0) return;

    // Clear existing features first
    vectorSourceRef.current.clear();

    const projectedCoords = coordinates.map(coord => fromLonLat(coord));
    const lineString = new LineString(projectedCoords);
    const feature = new Feature({
      geometry: lineString,
    });

    vectorSourceRef.current.addFeature(feature);

    // Calculate distance
    const lengthMeters = getLength(lineString);
    const lengthMiles = lengthMeters * 0.000621371;
    setTotalDistance(lengthMiles);

    // Call the route change handler to update parent
    if (onRouteChange) {
      onRouteChange(coordinates, lengthMiles);
    }

    // Fit view to route
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().fit(lineString, {
        padding: [50, 50, 50, 50],
        maxZoom: 16,
      });
    }
  };

  const startDrawing = () => {
    if (mapInstanceRef.current && drawInteractionRef.current) {
      mapInstanceRef.current.addInteraction(drawInteractionRef.current);
    }
  };

  const stopDrawing = () => {
    if (mapInstanceRef.current && drawInteractionRef.current) {
      mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
    }
  };

  const clearRoute = () => {
    vectorSourceRef.current.clear();
    setTotalDistance(0);
    if (onRouteChange) {
      onRouteChange([], 0);
    }
  };

  const exportRoute = () => {
    const features = vectorSourceRef.current.getFeatures();
    if (features.length > 0) {
      const geometry = features[0].getGeometry() as LineString;
      const coordinates = geometry.getCoordinates().map(coord => toLonLat(coord));

      // Create GPX format
      const gpx = createGPX(coordinates as [number, number][]);

      // Download file
      const blob = new Blob([gpx], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'twin-cities-marathon-route.gpx';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const createGPX = (coordinates: [number, number][]) => {
    const trackPoints = coordinates.map((coord, index) =>
      `    <trkpt lat="${coord[1]}" lon="${coord[0]}">
      <ele>300</ele>
      ${index === 0 ? '<name>Start</name>' : ''}
      ${index === coordinates.length - 1 ? '<name>Finish</name>' : ''}
    </trkpt>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Twin Cities Marathon Route Planner">
  <trk>
    <name>Twin Cities Marathon Custom Route</name>
    <desc>Custom drawn marathon route</desc>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
  };

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={startDrawing}
            disabled={isDrawing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isDrawing ? 'Drawing...' : 'Draw Route'}
          </button>
          <button
            onClick={stopDrawing}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Stop Drawing
          </button>
          <button
            onClick={clearRoute}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Clear Route
          </button>
          <button
            onClick={exportRoute}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90"
          >
            Export GPX
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Distance: <span className="font-semibold">{totalDistance.toFixed(2)} miles</span>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full rounded-lg border border-border overflow-hidden"
        style={{ height }}
      />

      {/* Instructions */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        <p><strong>How to use:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Click &quot;Draw Route&quot; to start drawing a new marathon route</li>
          <li>Click on the map to add points along your route</li>
          <li>Double-click to finish drawing</li>
          <li>Drag points to modify the route after drawing</li>
          <li>Use &quot;Export GPX&quot; to download your route as a GPX file</li>
        </ul>
      </div>
    </div>
  );
}