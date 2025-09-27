'use client';

import { useState, useEffect } from 'react';

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

// Example marathon routes - you can replace with actual GPS data
export const marathonRoutes: Record<string, MarathonRoute> = {
  'nyc-marathon': {
    name: 'NYC Marathon',
    description:
      'The iconic New York City Marathon route through all five boroughs',
    startLocation: 'Staten Island - Verrazzano Bridge',
    finishLocation: 'Central Park',
    totalDistance: 26.2,
    elevationGain: 312,
    points: [
      {
        coordinates: [-74.0445, 40.6067],
        mile: 0,
        elevation: 50,
        landmark: 'Start - Verrazzano Bridge',
      },
      { coordinates: [-74.0234, 40.6234], mile: 1, elevation: 45 },
      { coordinates: [-74.0123, 40.6345], mile: 2, elevation: 40 },
      {
        coordinates: [-74.0012, 40.6456],
        mile: 3,
        elevation: 35,
        landmark: 'Brooklyn - Bay Ridge',
      },
      { coordinates: [-73.9901, 40.6567], mile: 4, elevation: 30 },
      { coordinates: [-73.979, 40.6678], mile: 5, elevation: 25 },
      { coordinates: [-73.9679, 40.6789], mile: 6, elevation: 20 },
      {
        coordinates: [-73.9568, 40.69],
        mile: 7,
        elevation: 15,
        landmark: 'Brooklyn - Sunset Park',
      },
      { coordinates: [-73.9457, 40.7011], mile: 8, elevation: 10 },
      { coordinates: [-73.9346, 40.7122], mile: 9, elevation: 5 },
      { coordinates: [-73.9235, 40.7233], mile: 10, elevation: 0 },
      {
        coordinates: [-73.9124, 40.7344],
        mile: 11,
        elevation: 5,
        landmark: 'Brooklyn - Williamsburg',
      },
      { coordinates: [-73.9013, 40.7455], mile: 12, elevation: 10 },
      {
        coordinates: [-73.8902, 40.7566],
        mile: 13,
        elevation: 15,
        landmark: 'Halfway Point!',
      },
      { coordinates: [-73.8791, 40.7677], mile: 14, elevation: 20 },
      {
        coordinates: [-73.868, 40.7788],
        mile: 15,
        elevation: 25,
        landmark: 'Queens - Long Island City',
      },
      { coordinates: [-73.8569, 40.7899], mile: 16, elevation: 30 },
      { coordinates: [-73.8458, 40.801], mile: 17, elevation: 35 },
      {
        coordinates: [-73.8347, 40.8121],
        mile: 18,
        elevation: 40,
        landmark: 'Bronx - South Bronx',
      },
      { coordinates: [-73.8236, 40.8232], mile: 19, elevation: 45 },
      {
        coordinates: [-73.8125, 40.8343],
        mile: 20,
        elevation: 50,
        landmark: 'The Wall - Mile 20',
      },
      { coordinates: [-73.8014, 40.8454], mile: 21, elevation: 55 },
      {
        coordinates: [-73.7903, 40.8565],
        mile: 22,
        elevation: 60,
        landmark: 'Manhattan - Harlem',
      },
      { coordinates: [-73.7792, 40.8676], mile: 23, elevation: 65 },
      { coordinates: [-73.7681, 40.8787], mile: 24, elevation: 70 },
      {
        coordinates: [-73.757, 40.8898],
        mile: 25,
        elevation: 75,
        landmark: 'Central Park - Almost There!',
      },
      { coordinates: [-73.7459, 40.9009], mile: 26, elevation: 80 },
      {
        coordinates: [-73.7348, 40.912],
        mile: 26.2,
        elevation: 85,
        landmark: 'Finish Line - Central Park',
      },
    ],
  },
  'boston-marathon': {
    name: 'Boston Marathon',
    description: 'The historic Boston Marathon route from Hopkinton to Boston',
    startLocation: 'Hopkinton',
    finishLocation: 'Copley Square, Boston',
    totalDistance: 26.2,
    elevationGain: 450,
    points: [
      {
        coordinates: [-71.5226, 42.2287],
        mile: 0,
        elevation: 490,
        landmark: 'Start - Hopkinton',
      },
      { coordinates: [-71.5115, 42.2398], mile: 1, elevation: 480 },
      { coordinates: [-71.5004, 42.2509], mile: 2, elevation: 470 },
      {
        coordinates: [-71.4893, 42.262],
        mile: 3,
        elevation: 460,
        landmark: 'Ashland',
      },
      { coordinates: [-71.4782, 42.2731], mile: 4, elevation: 450 },
      { coordinates: [-71.4671, 42.2842], mile: 5, elevation: 440 },
      {
        coordinates: [-71.456, 42.2953],
        mile: 6,
        elevation: 430,
        landmark: 'Framingham',
      },
      { coordinates: [-71.4449, 42.3064], mile: 7, elevation: 420 },
      { coordinates: [-71.4338, 42.3175], mile: 8, elevation: 410 },
      {
        coordinates: [-71.4227, 42.3286],
        mile: 9,
        elevation: 400,
        landmark: 'Natick',
      },
      { coordinates: [-71.4116, 42.3397], mile: 10, elevation: 390 },
      { coordinates: [-71.4005, 42.3508], mile: 11, elevation: 380 },
      {
        coordinates: [-71.3894, 42.3619],
        mile: 12,
        elevation: 370,
        landmark: 'Wellesley - Scream Tunnel',
      },
      {
        coordinates: [-71.3783, 42.373],
        mile: 13,
        elevation: 360,
        landmark: 'Halfway Point!',
      },
      { coordinates: [-71.3672, 42.3841], mile: 14, elevation: 350 },
      { coordinates: [-71.3561, 42.3952], mile: 15, elevation: 340 },
      {
        coordinates: [-71.345, 42.4063],
        mile: 16,
        elevation: 330,
        landmark: 'Newton Lower Falls',
      },
      {
        coordinates: [-71.3339, 42.4174],
        mile: 17,
        elevation: 380,
        landmark: 'Newton Hills Begin',
      },
      { coordinates: [-71.3228, 42.4285], mile: 18, elevation: 430 },
      { coordinates: [-71.3117, 42.4396], mile: 19, elevation: 480 },
      {
        coordinates: [-71.3006, 42.4507],
        mile: 20,
        elevation: 530,
        landmark: 'Heartbreak Hill',
      },
      {
        coordinates: [-71.2895, 42.4618],
        mile: 21,
        elevation: 480,
        landmark: 'Boston College',
      },
      { coordinates: [-71.2784, 42.4729], mile: 22, elevation: 430 },
      { coordinates: [-71.2673, 42.484], mile: 23, elevation: 380 },
      {
        coordinates: [-71.2562, 42.4951],
        mile: 24,
        elevation: 330,
        landmark: 'Brookline',
      },
      { coordinates: [-71.2451, 42.5062], mile: 25, elevation: 280 },
      { coordinates: [-71.234, 42.5173], mile: 26, elevation: 230 },
      {
        coordinates: [-71.2229, 42.5284],
        mile: 26.2,
        elevation: 180,
        landmark: 'Finish - Copley Square',
      },
    ],
  },
};

export function useMarathonRoute(routeId = 'nyc-marathon') {
  const [route, setRoute] = useState<MarathonRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const selectedRoute = marathonRoutes[routeId];
    if (selectedRoute) {
      setRoute(selectedRoute);
    }
    setLoading(false);
  }, [routeId]);

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
    const interpolatedElevation = beforePoint.elevation
      ? beforePoint.elevation +
        (afterPoint.elevation! - beforePoint.elevation) * ratio
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
