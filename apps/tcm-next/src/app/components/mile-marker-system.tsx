'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  Plus,
  BarChart3,
} from 'lucide-react';
import { trpc } from '../../lib/trpc/client';

// Database marker type with computed fields
interface EnrichedMarker {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  raceTime: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  miles: number;
  pace: number;
  split: number;
}

interface MileMarkerSystemProps {
  targetPace: { fast: number; slow: number };
  currentMile: number;
  routeCoordinates?: [number, number][]; // Add route data for calculating positions
}

export function MileMarkerSystem({
  targetPace,
  currentMile,
  routeCoordinates = [],
}: MileMarkerSystemProps) {
  const [selectedDistance, setSelectedDistance] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newNote, setNewNote] = useState('');

  // Debug: Check if updated component is being loaded
  console.log('🎯 MileMarkerSystem loaded - Updated version with pace analysis');

  // tRPC queries and mutations
  const { data: databaseMarkers, refetch: refetchMarkers } = trpc.marker.getAll.useQuery();
  const createMarker = trpc.marker.create.useMutation({
    onSuccess: () => {
      console.log('Race marker saved to database');
      // Refresh markers on the map
      refetchMarkers();
    }
  });

  // Function to calculate coordinates for a distance along the route
  const getCoordinatesAtDistance = (distanceMiles: number): [number, number] | null => {
    if (routeCoordinates.length === 0) return null;

    // Calculate cumulative distances and find position
    let cumulativeDistance = 0;
    for (let i = 1; i < routeCoordinates.length; i++) {
      const [lon1, lat1] = routeCoordinates[i - 1];
      const [lon2, lat2] = routeCoordinates[i];

      // Calculate segment distance using Haversine formula
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

      if (distanceMiles >= cumulativeDistance && distanceMiles <= nextCumulativeDistance) {
        // Interpolate position within the segment
        const ratio = (distanceMiles - cumulativeDistance) / segmentDistance;
        const interpolatedLon = lon1 + (lon2 - lon1) * ratio;
        const interpolatedLat = lat1 + (lat2 - lat1) * ratio;
        return [interpolatedLon, interpolatedLat];
      }

      cumulativeDistance = nextCumulativeDistance;
    }

    // If beyond route, return the last point
    return routeCoordinates[routeCoordinates.length - 1] || null;
  };

  // Predefined race distances in kilometers and miles
  const raceDistances = [
    { label: '5K', km: 5, miles: 3.11 },
    { label: '10K', km: 10, miles: 6.21 },
    { label: '15K', km: 15, miles: 9.32 },
    { label: '20K', km: 20, miles: 12.43 },
    { label: 'Half Marathon', km: 21.1, miles: 13.1 },
    { label: '25K', km: 25, miles: 15.53 },
    { label: '30K', km: 30, miles: 18.64 },
    { label: '35K', km: 35, miles: 21.75 },
    { label: '40K', km: 40, miles: 24.85 },
    { label: 'Finish', km: 42.2, miles: 26.2 },
  ];

  // Filter and enrich database markers that have race times
  const raceTimeMarkers = (databaseMarkers || [])
    .filter(marker => marker.raceTime) // Only markers with race times
    .sort((a, b) => a.distanceKm - b.distanceKm); // Sort by distance

  // Calculate pace and splits for markers
  const enrichedMarkers: EnrichedMarker[] = raceTimeMarkers.map((marker, index) => {
    let pace = 0;
    let split = 0;
    const miles = marker.distanceKm * 0.621371; // Convert km to miles

    if (marker.raceTime) {
      const [hours, minutes, seconds] = marker.raceTime
        .split(':')
        .map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      if (index === 0) {
        // First marker - pace is total time / distance
        pace = totalSeconds / miles;
        split = totalSeconds;
      } else {
        // Calculate split from previous marker
        const prevMarker = raceTimeMarkers[index - 1];
        if (prevMarker.raceTime) {
          const [prevH, prevM, prevS] = prevMarker.raceTime
            .split(':')
            .map(Number);
          const prevTotalSeconds = prevH * 3600 + prevM * 60 + prevS;
          split = totalSeconds - prevTotalSeconds;
          const prevMiles = prevMarker.distanceKm * 0.621371;
          pace = split / (miles - prevMiles);
        }
      }
    }

    return { ...marker, miles, pace, split };
  });

  // Set default time when enriched markers change
  React.useEffect(() => {
    if (enrichedMarkers.length > 0 && !newTime) {
      const lastMarkerTime = enrichedMarkers[enrichedMarkers.length - 1].raceTime;
      if (lastMarkerTime) {
        setNewTime(lastMarkerTime);
      }
    }
  }, [enrichedMarkers.length, newTime]);

  const addMileMarker = () => {
    if (!selectedDistance || !newTime) return;

    const selectedRaceDistance = raceDistances.find(d => d.label === selectedDistance);
    if (!selectedRaceDistance) return;

    const mile = selectedRaceDistance.miles;

    // Check if this distance or any higher distance has already been entered
    const existingHigherMarker = enrichedMarkers.find(m => m.miles >= mile);
    if (existingHigherMarker) {
      alert(`Cannot add marker at ${selectedRaceDistance.label}. You have already recorded a marker at ${existingHigherMarker.miles.toFixed(1)} miles or higher.`);
      return;
    }

    // Save to database with race time
    const coordinates = getCoordinatesAtDistance(mile);
    if (coordinates) {
      createMarker.mutate({
        name: selectedRaceDistance.label,
        description: newNote || `Race marker at ${selectedRaceDistance.label} (${selectedRaceDistance.km}K) - Time: ${newTime}`,
        latitude: coordinates[1],
        longitude: coordinates[0],
        distanceKm: selectedRaceDistance.km,
        raceTime: newTime,
        note: newNote || undefined,
      });
    } else {
      alert('Cannot place marker: route coordinates not available.');
      return;
    }

    // Clear form
    setSelectedDistance('');
    setNewTime('');
    setNewNote('');
  };


  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const formatPace = (paceSeconds: number): string => {
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };



  const getProgressPercentage = () => {
    return Math.min(100, (currentMile / 26.2) * 100);
  };

  const getNextMilestone = () => {
    const milestones = [5, 10, 13.1, 20, 26.2];
    return milestones.find((m) => m > currentMile) || 26.2;
  };

  const averagePace =
    enrichedMarkers.length > 0
      ? enrichedMarkers.reduce((sum, m) => sum + m.pace, 0) /
        enrichedMarkers.length
      : 0;

  // Enhanced pace analysis
  const paceAnalysis = () => {
    if (enrichedMarkers.length === 0) return null;

    const paces = enrichedMarkers.map(m => m.pace);
    const fastestPace = Math.min(...paces);
    const slowestPace = Math.max(...paces);
    const recentPaces = enrichedMarkers.slice(-3).map(m => m.pace); // Last 3 markers
    const recentAverage = recentPaces.reduce((sum, pace) => sum + pace, 0) / recentPaces.length;

    // Project finish times based on different scenarios
    const remainingDistance = 26.2 - currentMile;
    const marathonDistance = 26.2;

    const projectedFinishTimes = {
      current: (currentMile > 0) ?
        (enrichedMarkers[enrichedMarkers.length - 1]?.time ?
          calculateProjectedFinish(enrichedMarkers[enrichedMarkers.length - 1].time, currentMile, recentAverage, marathonDistance)
          : null) : null,
      average: averagePace * marathonDistance,
      fastest: fastestPace * marathonDistance,
      slowest: slowestPace * marathonDistance,
      recent: recentAverage * marathonDistance
    };

    return {
      fastestPace,
      slowestPace,
      recentAverage,
      projectedFinishTimes,
      paceVariation: slowestPace - fastestPace,
      consistency: paces.length > 1 ? calculateConsistency(paces) : 100
    };
  };

  const calculateProjectedFinish = (lastTime: string, currentDistance: number, currentPace: number, totalDistance: number) => {
    const [hours, minutes, seconds] = lastTime.split(':').map(Number);
    const currentTimeSeconds = hours * 3600 + minutes * 60 + seconds;
    const remainingDistance = totalDistance - currentDistance;
    const remainingTimeSeconds = remainingDistance * currentPace;
    return currentTimeSeconds + remainingTimeSeconds;
  };

  const calculateConsistency = (paces: number[]) => {
    const mean = paces.reduce((sum, pace) => sum + pace, 0) / paces.length;
    const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - mean, 2), 0) / paces.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = (standardDeviation / mean) * 100;
    return Math.max(0, 100 - coefficientOfVariation); // Higher is more consistent
  };

  const analysis = paceAnalysis();

  return (
    <div className="space-y-6">
      {/* Race Progress & Pace Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Race Progress & Pace Analysis
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm bg-pastel-blue border-pastel-blue text-gray-800">
              {enrichedMarkers.length} time markers
            </Badge>
            <Badge variant="secondary" className="text-sm bg-pastel-peach border-pastel-peach text-gray-800">
              {databaseMarkers?.length || 0} map markers
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Mile {currentMile.toFixed(1)}</span>
              <span>Next: Mile {getNextMilestone()}</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          {/* Pace Analysis Grid */}
          {analysis && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-pastel-yellow/50 rounded-lg border border-pastel-yellow">
                <div className="text-sm text-muted-foreground">Current Pace</div>
                <div className="font-mono text-lg font-semibold">
                  {formatPace(analysis.recentAverage)}
                </div>
              </div>
              <div className="p-3 bg-pastel-lavender/50 rounded-lg border border-pastel-lavender">
                <div className="text-sm text-muted-foreground">Average Pace</div>
                <div className="font-mono text-lg font-semibold">
                  {formatPace(averagePace)}
                </div>
              </div>
              <div className="p-3 bg-pastel-mint/50 rounded-lg border border-pastel-mint">
                <div className="text-sm text-muted-foreground">Fastest Split</div>
                <div className="font-mono text-lg font-semibold">
                  {formatPace(analysis.fastestPace)}
                </div>
              </div>
              <div className="p-3 bg-pastel-peach/50 rounded-lg border border-pastel-peach">
                <div className="text-sm text-muted-foreground">Consistency</div>
                <div className="font-mono text-lg font-semibold">
                  {analysis.consistency.toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          {/* Projected Finish Times */}
          {analysis && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">PROJECTED FINISH TIMES</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-pastel-blue/30 rounded-lg border border-pastel-blue">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">BEST CASE</div>
                    <div className="text-xs text-muted-foreground mb-1">(fastest pace sustained)</div>
                    <div className="font-mono text-xl font-bold">
                      {formatTime(analysis.projectedFinishTimes.fastest)}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-pastel-mint/30 rounded-lg border border-pastel-mint">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">CURRENT PACE</div>
                    <div className="text-xs text-muted-foreground mb-1">(recent average)</div>
                    <div className="font-mono text-xl font-bold">
                      {analysis.projectedFinishTimes.current ?
                        formatTime(analysis.projectedFinishTimes.current) :
                        formatTime(analysis.projectedFinishTimes.recent)}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-pastel-peach/30 rounded-lg border border-pastel-peach">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">CONSERVATIVE</div>
                    <div className="text-xs text-muted-foreground mb-1">(slowest pace)</div>
                    <div className="font-mono text-xl font-bold">
                      {formatTime(analysis.projectedFinishTimes.slowest)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pace Trend Analysis */}
          {enrichedMarkers.length > 1 && analysis && (
            <div className="p-4 bg-pastel-lavender/20 rounded-lg border border-pastel-lavender">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">PACE ANALYSIS</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Pace Range:</span>
                  <div className="font-mono">
                    {formatPace(analysis.fastestPace)} - {formatPace(analysis.slowestPace)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Variation:</span>
                  <div className="font-mono">
                    {formatPace(analysis.paceVariation)} difference
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Mile Marker Management */}
      <Card className="p-6">
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add Marker</TabsTrigger>
            <TabsTrigger value="splits">Race Splits</TabsTrigger>
            <TabsTrigger value="recent">Map Markers</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Add Race Marker</h4>
            </div>

            <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
              🏃‍♂️ Adding a race marker will record your split time and place a marker on the map at the race distance location.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distance" className="text-sm">
                  Race Distance
                </Label>
                <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select distance..." />
                  </SelectTrigger>
                  <SelectContent className="!bg-white border shadow-lg">
                    {raceDistances
                      .filter((distance) => {
                        // Only show distances that haven't been entered and are higher than the highest existing marker
                        const highestExistingMile = Math.max(0, ...enrichedMarkers.map(m => m.miles));
                        return distance.miles > highestExistingMile;
                      })
                      .map((distance) => (
                        <SelectItem key={distance.label} value={distance.label}>
                          {distance.label} ({distance.km}K / {distance.miles.toFixed(1)} mi)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time" className="text-sm">
                  Race Time (HH:MM:SS)
                </Label>
                <Input
                  id="time"
                  type="text"
                  inputMode="numeric"
                  placeholder="01:30:45"
                  pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-base font-mono" // Better for mobile, monospace for time format
                />
              </div>
            </div>

            <div>
              <Label htmlFor="note" className="text-sm">
                Note (optional)
              </Label>
              <Input
                id="note"
                placeholder="Feeling strong, good pace"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>

            <Button
              onClick={addMileMarker}
              className="w-full bg-pastel-mint hover:bg-pastel-mint/80 text-gray-800 border-pastel-mint"
              size="sm"
              disabled={!selectedDistance || !newTime || createMarker.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createMarker.isPending ? 'Adding Marker...' : 'Add Race Marker'}
            </Button>
          </TabsContent>

          <TabsContent value="splits" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Race Split Times</h4>
            </div>

            {enrichedMarkers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No race splits recorded yet</p>
                <p className="text-sm">
                  Add your first race marker to start tracking splits
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrichedMarkers.map((marker) => (
                  <div
                    key={marker.id}
                    className="p-3 border border-border rounded-lg bg-gradient-to-r from-pastel-yellow/10 to-pastel-mint/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">
                          {marker.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            marker.pace < targetPace.fast
                              ? 'bg-pastel-mint border-pastel-mint text-gray-800'
                              : marker.pace > targetPace.slow
                              ? 'bg-pastel-peach border-pastel-peach text-gray-800'
                              : 'bg-pastel-blue border-pastel-blue text-gray-800'
                          }`}
                        >
                          {marker.pace < targetPace.fast && '🏃‍♂️ Fast'}
                          {marker.pace > targetPace.slow && '🚶‍♂️ Slow'}
                          {marker.pace >= targetPace.fast && marker.pace <= targetPace.slow && '🎯 Target'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold">
                          {marker.raceTime}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatPace(marker.pace)} pace
                        </div>
                        {marker.split > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {formatTime(marker.split)} split
                          </div>
                        )}
                      </div>
                    </div>
                    {marker.note && (
                      <div className="mt-2 text-sm text-muted-foreground italic">
                        {marker.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Map Markers</h4>
            </div>

            {(!databaseMarkers || databaseMarkers.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No markers found</p>
                <p className="text-sm">
                  Add your first marker to start tracking
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {databaseMarkers.slice(-10).reverse().map((marker) => (
                  <div
                    key={marker.id}
                    className="p-3 border border-border rounded-lg bg-gradient-to-r from-pastel-blue/10 to-pastel-mint/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">
                          {marker.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs bg-pastel-lavender border-pastel-lavender text-gray-800"
                        >
                          {marker.distanceKm}K / {(marker.distanceKm * 0.621371).toFixed(1)}mi
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Lat: {marker.latitude.toFixed(4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Lng: {marker.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    {marker.description && (
                      <div className="mt-2 text-sm text-muted-foreground italic">
                        {marker.description}
                      </div>
                    )}
                  </div>
                ))}
                {databaseMarkers.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    Showing latest 10 of {databaseMarkers.length} markers
                  </div>
                )}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </Card>
    </div>
  );
}
