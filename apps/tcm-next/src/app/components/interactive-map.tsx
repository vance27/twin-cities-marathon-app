'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { LineString, Point } from 'ol/geom';
import { Feature } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { getLength } from 'ol/sphere';
import 'ol/ol.css';

interface InteractiveMapProps {
  onRouteChange?: (
    coordinates: [number, number][],
    distanceMiles: number
  ) => void;
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
  center = [-93.265, 44.9778], // Minneapolis default
  zoom = 12,
  height = '500px',
  currentMile = 0,
  showSimulation = false,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const currentPositionSourceRef = useRef<VectorSource>(new VectorSource());
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
        return feature.getGeometry()?.getType() === 'Point'
          ? pointStyle
          : routeStyle;
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
    if (
      !showSimulation ||
      !mapInstanceRef.current ||
      !initialRoute ||
      initialRoute.length === 0
    )
      return;

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
      currentPositionSourceRef.current.addFeature(
        currentPositionFeatureRef.current
      );
    }
  }, [currentMile, showSimulation, initialRoute]);

  // Clear position feature when simulation stops and return to full route view
  useEffect(() => {
    if (!showSimulation && currentPositionFeatureRef.current) {
      currentPositionSourceRef.current.clear();
      currentPositionFeatureRef.current = null;

      // Return to full route view when simulation stops
      if (mapInstanceRef.current && initialRoute && initialRoute.length > 0) {
        const projectedCoords = initialRoute.map((coord) => fromLonLat(coord));
        const lineString = new LineString(projectedCoords);

        mapInstanceRef.current.getView().fit(lineString, {
          padding: [50, 50, 50, 50],
          maxZoom: 16,
          duration: 1000, // Smooth transition back to full view
        });
      }
    }
  }, [showSimulation, initialRoute]);

  const loadInitialRoute = (coordinates: [number, number][]) => {
    if (coordinates.length === 0) return;

    // Clear existing features first
    vectorSourceRef.current.clear();

    const projectedCoords = coordinates.map((coord) => fromLonLat(coord));
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

  return (
    <div className="space-y-4">
      {/* Simulation Display */}
      {/* {showSimulation && totalDistance > 0 && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <div className="text-sm text-muted-foreground">
            <span>Current Position: Mile {currentMile.toFixed(1)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Distance: <span className="font-semibold">{totalDistance.toFixed(2)} miles</span>
          </div>
        </div>
      )} */}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full rounded-lg border border-border overflow-hidden"
        style={{ height }}
      />
    </div>
  );
}
