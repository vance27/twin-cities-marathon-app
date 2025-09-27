'use client';

import { useState, useEffect } from 'react';
import { loadGPXFile, convertGPXToRoutePoints, calculateElevationGain } from '@/utils/gpx-parser';

export interface RoutePoint {
  coordinates: [number, number];
  mile: number;
  elevation?: number;
  landmark?: string;
}

export interface MarathonRoute {
  name: string;
  description: string;
  startLocation: string;
  finishLocation: string;
  points: RoutePoint[];
  totalDistance: number;
  elevationGain: number;
}

// Marathon routes - populated from GPX data
export const marathonRoutes: Record<string, MarathonRoute> = {
  'twin-cities-marathon': {
    name: 'Twin Cities Marathon',
    description: 'The iconic Twin Cities Marathon route through Minneapolis and St. Paul',
    startLocation: 'Minneapolis',
    finishLocation: 'St. Paul State Capitol',
    totalDistance: 26.2,
    elevationGain: 0, // Will be calculated from GPX data
    points: [], // Will be populated from GPX data
  },
};

/**
 * Load GPX data and populate route
 */
export async function loadGPXRoute(source: string | File): Promise<MarathonRoute> {
  try {
    const gpxData = await loadGPXFile(source);
    const routePoints = convertGPXToRoutePoints(gpxData);
    const elevationGain = calculateElevationGain(routePoints);

    return {
      name: gpxData.name,
      description: gpxData.description || 'Twin Cities Marathon route',
      startLocation: 'Minneapolis',
      finishLocation: 'St. Paul State Capitol',
      totalDistance: 26.2,
      elevationGain,
      points: routePoints,
    };
  } catch (error) {
    console.error('Error loading GPX route:', error);
    throw error;
  }
}

export function useMarathonRoute(routeId = 'twin-cities-marathon', gpxSource?: string | File) {
  const [route, setRoute] = useState<MarathonRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoute = async () => {
      setLoading(true);

      try {
        if (gpxSource) {
          // Load from GPX file
          const gpxRoute = await loadGPXRoute(gpxSource);
          setRoute(gpxRoute);

          // Update the static route data
          marathonRoutes[routeId] = gpxRoute;
        } else {
          // Use existing route data
          const selectedRoute = marathonRoutes[routeId];
          if (selectedRoute) {
            // If route has no points, try to load default GPX
            if (selectedRoute.points.length === 0 && routeId === 'twin-cities-marathon') {
              // Try to load a default GPX file from public folder
              try {
                const defaultGpxRoute = await loadGPXRoute('/twin-cities-marathon.gpx');
                marathonRoutes[routeId] = defaultGpxRoute;
                setRoute(defaultGpxRoute);
              } catch {
                console.warn('Could not load default GPX file, using empty route');
                setRoute(selectedRoute);
              }
            } else {
              setRoute(selectedRoute);
            }
          }
        }
      } catch (error) {
        console.error('Error loading route:', error);
        // Fallback to empty route
        setRoute(marathonRoutes[routeId] || null);
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [routeId, gpxSource]);

  const getRouteCoordinates = () => {
    if (!route) return [];
    return route.points.map((point) => point.coordinates);
  };

  const getPointAtMile = (mile: number): RoutePoint | null => {
    if (!route) return null;

    // Find the exact mile marker or interpolate between points
    const exactPoint = route.points.find(
      (point) => Math.abs(point.mile - mile) < 0.01
    );
    if (exactPoint) return exactPoint;

    // Find surrounding points for interpolation
    const beforePoint = route.points
      .filter((point) => point.mile <= mile)
      .sort((a, b) => b.mile - a.mile)[0];
    const afterPoint = route.points
      .filter((point) => point.mile >= mile)
      .sort((a, b) => a.mile - b.mile)[0];

    if (!beforePoint || !afterPoint) return null;

    // Interpolate coordinates
    const ratio =
      (mile - beforePoint.mile) / (afterPoint.mile - beforePoint.mile);
    const interpolatedLng =
      beforePoint.coordinates[0] +
      (afterPoint.coordinates[0] - beforePoint.coordinates[0]) * ratio;
    const interpolatedLat =
      beforePoint.coordinates[1] +
      (afterPoint.coordinates[1] - beforePoint.coordinates[1]) * ratio;
    const interpolatedElevation = beforePoint.elevation && afterPoint.elevation
      ? beforePoint.elevation +
        (afterPoint.elevation - beforePoint.elevation) * ratio
      : undefined;

    return {
      coordinates: [interpolatedLng, interpolatedLat],
      mile,
      elevation: interpolatedElevation,
    };
  };

  const getMileMarkers = () => {
    if (!route) return [];
    return route.points.filter(
      (point) => point.mile % 1 === 0 || point.landmark
    );
  };

  return {
    route,
    loading,
    getRouteCoordinates,
    getPointAtMile,
    getMileMarkers,
  };
}
