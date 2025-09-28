'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Target, Mountain, TrendingUp } from 'lucide-react';
import { useMarathonRoute } from '@/components/marathon-route';
import { TimeCalculator } from '@/components/time-calculator';
import { MileMarkerSystem } from '@/components/mile-marker-system';
import { RoutePlanner } from '@/components/route-planner';
import { trpc } from '../lib/trpc/client';

interface MileMarker {
  mile: number;
  time: string;
  actualTime?: string;
  pace?: number;
  split?: number;
  note?: string;
}

export default function MarathonTracker() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRoute] = useState('twin-cities-marathon');
  const [currentMile, setCurrentMile] = useState([0]);
  const [mileMarkers, setMileMarkers] = useState<MileMarker[]>([]);
  const [fastPace, setFastPace] = useState(7 * 60); // 7:00 per mile in seconds
  const [slowPace, setSlowPace] = useState(8 * 60 + 10); // 8:10 per mile in seconds
  const [routeDistance, setRouteDistance] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Get latest marker to set default position
  const { data: latestMarker } = trpc.marker.getLatest.useQuery();

  const {
    route,
    loading,
    getRouteCoordinates,
    getPointAtMile,
    getMileMarkers,
  } = useMarathonRoute(selectedRoute);

  useEffect(() => {
    if (!isPlaying) return;

    let animationId: number;
    let lastUpdateTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastUpdateTime;

      // Target 60fps but adapt to actual frame rate
      if (deltaTime >= 16) {
        setCurrentMile((prev) => {
          // Smooth increment based on actual time elapsed
          // Base rate: 0.6 miles per second at 1x speed (realistic marathon pace for viewing)
          const baseRatePerMs = 0.6 / 1000; // miles per millisecond
          const increment = baseRatePerMs * deltaTime * playbackSpeed;
          const maxDistance = routeDistance > 0 ? routeDistance : 26.2; // Fallback to 26.2 if no route loaded
          const newMile = Math.min(maxDistance, prev[0] + increment);

          if (newMile >= maxDistance) {
            setIsPlaying(false); // Stop at finish
          }
          return [newMile];
        });

        lastUpdateTime = currentTime;
      }

      if (isPlaying) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, playbackSpeed, routeDistance]);

  // Initialize route distance from existing route data
  useEffect(() => {
    if (route && route.totalDistance && routeDistance === 0) {
      setRouteDistance(route.totalDistance);
    }
  }, [route, routeDistance]);

  // Set current mile to latest marker distance (converted from km to miles)
  useEffect(() => {
    if (latestMarker && currentMile[0] === 0) {
      const distanceInMiles = latestMarker.distanceKm * 0.621371; // Convert km to miles
      setCurrentMile([distanceInMiles]);
    }
  }, [latestMarker, currentMile]);

  useEffect(() => {
    if (map.current || !mapContainer.current || loading || !route || route.points.length === 0) return;

    const initializeMap = async () => {
      const maplibregl = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');

      const routeCoordinates = getRouteCoordinates();
      if (routeCoordinates.length === 0) return;

      const center = routeCoordinates[0] || [-93.2650, 44.9778]; // Default to Minneapolis coordinates

      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://demotiles.maplibre.org/style.json',
        center: center,
        zoom: 12,
      });

      map.current.on('load', () => {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates,
            },
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#FF4500',
            'line-width': 4,
          },
        });

        const markers = getMileMarkers();
        map.current.addSource('mile-markers', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: markers.map((marker) => ({
              type: 'Feature',
              properties: {
                mile: marker.mile,
                landmark: marker.landmark || `Mile ${marker.mile}`,
              },
              geometry: {
                type: 'Point',
                coordinates: marker.coordinates,
              },
            })),
          },
        });

        map.current.addLayer({
          id: 'mile-markers',
          type: 'circle',
          source: 'mile-markers',
          paint: {
            'circle-radius': 4,
            'circle-color': '#FFFFFF',
            'circle-stroke-color': '#FF4500',
            'circle-stroke-width': 2,
          },
        });

        map.current.addLayer({
          id: 'mile-labels',
          type: 'symbol',
          source: 'mile-markers',
          layout: {
            'text-field': ['get', 'mile'],
            'text-font': ['Open Sans Regular'],
            'text-size': 10,
            'text-offset': [0, -2],
          },
          paint: {
            'text-color': '#FF4500',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1,
          },
        });

        map.current.addSource('current-position', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: routeCoordinates[0],
            },
          },
        });

        map.current.addLayer({
          id: 'current-position',
          type: 'circle',
          source: 'current-position',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FFD700',
            'circle-stroke-color': '#FF4500',
            'circle-stroke-width': 2,
          },
        });

        setMapLoaded(true);
      });
    };

    initializeMap();

    // Cleanup function to destroy the map when route changes
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, [route, loading, getRouteCoordinates, getMileMarkers]);

  useEffect(() => {
    if (!mapLoaded || !map.current || !route) return;

    const currentPoint = getPointAtMile(currentMile[0]);
    if (!currentPoint) return;

    map.current.getSource('current-position').setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: currentPoint.coordinates,
      },
    });

    map.current.flyTo({
      center: currentPoint.coordinates,
      zoom: 14,
      duration: 1000,
    });
  }, [currentMile, mapLoaded, route, getPointAtMile]);

  const handlePaceChange = (newFastPace: number, newSlowPace: number) => {
    setFastPace(newFastPace);
    setSlowPace(newSlowPace);
  };

  const currentPoint = getPointAtMile(currentMile[0]);
  const currentElevation = currentPoint?.elevation;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading marathon route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Marathon Tracker
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={isPlaying ? 'default' : 'secondary'}
                className="text-sm"
              >
                {isPlaying ? 'Simulating' : 'Paused'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {playbackSpeed}x Speed
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <RoutePlanner
              onRouteChange={(coordinates, distance) => {
                // Update route data for the application
                console.log('Route updated:', coordinates.length, 'points,', distance.toFixed(2), 'miles');
                setRouteDistance(distance);
              }}
              initialRoute={route?.points.map(p => p.coordinates) || []}
              currentMile={currentMile[0]}
              showSimulation={Boolean(route?.points?.length)}
              isPlaying={isPlaying}
              onPlayToggle={() => setIsPlaying(!isPlaying)}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
              onMileChange={setCurrentMile}
              routeDistance={routeDistance > 0 ? routeDistance : 26.2}
            />
          </div>

          <div className="space-y-6">

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                Current Status
              </h3>
              <div className="space-y-4">
                {currentElevation && (
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Mountain className="w-3 h-3" />
                      Current Elevation
                    </div>
                    <div className="font-mono text-sm font-semibold">
                      {Math.round(currentElevation)}ft
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {route && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Route Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-semibold">
                      {route.totalDistance} miles
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Elevation Gain:
                    </span>
                    <span className="font-semibold">
                      {route.elevationGain}ft
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-muted-foreground mb-1">Start:</div>
                    <div className="font-medium text-xs">
                      {route.startLocation}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Finish:</div>
                    <div className="font-medium text-xs">
                      {route.finishLocation}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8">
          <MileMarkerSystem
            mileMarkers={mileMarkers}
            onMarkersChange={setMileMarkers}
            targetPace={{ fast: fastPace, slow: slowPace }}
            currentMile={currentMile[0]}
          />
        </div>

        <div className="mt-8">
          <TimeCalculator
            route={route}
            currentMile={currentMile[0]}
            mileMarkers={mileMarkers}
            fastPace={fastPace}
            slowPace={slowPace}
          />
        </div>
      </div>
    </div>
  );
}
