'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Timer, Target, Mountain, TrendingUp } from 'lucide-react';
import { useMarathonRoute } from '@/components/marathon-route';
import { RouteSelector } from '@/components/route-selector';
import { TimeCalculator } from '@/components/time-calculator';
import { InteractiveControls } from '@/components/interactive-controls';
import { MileMarkerSystem } from '@/components/mile-marker-system';

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
  const [selectedRoute, setSelectedRoute] = useState('nyc-marathon');
  const [currentMile, setCurrentMile] = useState([0]);
  const [mileMarkers, setMileMarkers] = useState<MileMarker[]>([]);
  const [fastPace, setFastPace] = useState(7 * 60); // 7:00 per mile in seconds
  const [slowPace, setSlowPace] = useState(8 * 60 + 10); // 8:10 per mile in seconds

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const {
    route,
    loading,
    getRouteCoordinates,
    getPointAtMile,
    getMileMarkers,
  } = useMarathonRoute(selectedRoute);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentMile((prev) => {
        const newMile = Math.min(26.2, prev[0] + 0.1 * playbackSpeed);
        if (newMile >= 26.2) {
          setIsPlaying(false); // Stop at finish
        }
        return [newMile];
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  useEffect(() => {
    if (map.current || !mapContainer.current || loading || !route) return;

    const initializeMap = async () => {
      const maplibregl = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');

      const routeCoordinates = getRouteCoordinates();
      const center = routeCoordinates[0] || [-74.0059, 40.7128];

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
          <div className="lg:col-span-3 space-y-6">
            <RouteSelector
              selectedRoute={selectedRoute}
              onRouteChange={setSelectedRoute}
            />

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {route?.name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    Route
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent rounded-full"></div>
                    Current Position
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white border-2 border-primary rounded-full"></div>
                    Mile Markers
                  </div>
                </div>
              </div>
              <div
                ref={mapContainer}
                className="w-full h-96 rounded-lg border border-border"
                style={{ minHeight: '400px' }}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <InteractiveControls
              currentMile={currentMile}
              onMileChange={setCurrentMile}
              fastPace={fastPace}
              slowPace={slowPace}
              onPaceChange={handlePaceChange}
              isPlaying={isPlaying}
              onPlayToggle={() => setIsPlaying(!isPlaying)}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />

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
