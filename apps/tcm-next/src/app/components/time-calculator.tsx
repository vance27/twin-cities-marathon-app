'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Target, AlertTriangle } from 'lucide-react';
import type { MarathonRoute, RoutePoint } from './marathon-route';

interface MileMarker {
  mile: number;
  time: string;
  actualTime?: string;
}

interface PaceZone {
  name: string;
  minPace: number; // seconds per mile
  maxPace: number; // seconds per mile
  color: string;
  description: string;
}

interface TimeCalculatorProps {
  route: MarathonRoute | null;
  currentMile: number;
  mileMarkers: MileMarker[];
  fastPace: number;
  slowPace: number;
}

const paceZones: PaceZone[] = [
  {
    name: 'Easy',
    minPace: 8 * 60 + 30, // 8:30
    maxPace: 9 * 60 + 30, // 9:30
    color: 'bg-green-500',
    description: 'Comfortable, conversational pace',
  },
  {
    name: 'Target',
    minPace: 7 * 60, // 7:00
    maxPace: 8 * 60 + 10, // 8:10
    color: 'bg-blue-500',
    description: 'Goal marathon pace',
  },
  {
    name: 'Aggressive',
    minPace: 6 * 60 + 30, // 6:30
    maxPace: 7 * 60, // 7:00
    color: 'bg-orange-500',
    description: 'Fast, challenging pace',
  },
  {
    name: 'Elite',
    minPace: 5 * 60, // 5:00
    maxPace: 6 * 60 + 30, // 6:30
    color: 'bg-red-500',
    description: 'Professional level pace',
  },
];

export function TimeCalculator({
  route,
  currentMile,
  mileMarkers,
  fastPace,
  slowPace,
}: TimeCalculatorProps) {
  const [customPace, setCustomPace] = useState('');
  const [targetFinishTime, setTargetFinishTime] = useState('');
  const [splitStrategy, setSplitStrategy] = useState<
    'even' | 'negative' | 'positive'
  >('even');

  // Calculate elevation adjustment factor
  const getElevationAdjustment = (
    point: RoutePoint,
    nextPoint?: RoutePoint
  ): number => {
    if (!point.elevation || !nextPoint?.elevation) return 1;

    const elevationChange = nextPoint.elevation - point.elevation;
    const distance = 1; // assuming 1 mile segments

    // Rough approximation: 10 seconds per 100ft of elevation gain per mile
    const adjustmentSeconds = (elevationChange / 100) * 10;
    return Math.max(0.8, Math.min(1.3, 1 + adjustmentSeconds / (7.5 * 60))); // Cap between 80% and 130%
  };

  // Calculate predicted time for any mile based on current data
  const calculatePredictedTime = (
    targetMile: number,
    paceSeconds: number
  ): string => {
    if (!route) return '0:00:00';

    // Find the most recent actual time marker
    const relevantMarkers = mileMarkers
      .filter((marker) => marker.actualTime && marker.mile <= targetMile)
      .sort((a, b) => b.mile - a.mile);

    let baseTime = 0;
    let startMile = 0;

    if (relevantMarkers.length > 0) {
      const lastMarker = relevantMarkers[0];
      const [hours, minutes, seconds] = lastMarker
        .actualTime!.split(':')
        .map(Number);
      baseTime = hours * 3600 + minutes * 60 + seconds;
      startMile = lastMarker.mile;
    }

    // Calculate time for remaining distance with elevation adjustments
    let totalTime = baseTime;
    const remainingMiles = targetMile - startMile;

    if (route.points && route.points.length > 0) {
      // Apply elevation adjustments mile by mile
      for (let mile = startMile; mile < targetMile; mile += 1) {
        const currentPoint = route.points.find(
          (p) => Math.abs(p.mile - mile) < 0.1
        );
        const nextPoint = route.points.find(
          (p) => Math.abs(p.mile - (mile + 1)) < 0.1
        );

        let adjustedPace = paceSeconds;
        if (currentPoint && nextPoint) {
          const elevationFactor = getElevationAdjustment(
            currentPoint,
            nextPoint
          );
          adjustedPace = paceSeconds * elevationFactor;
        }

        const remainingInThisMile = Math.min(1, targetMile - mile);
        totalTime += adjustedPace * remainingInThisMile;
      }
    } else {
      // Fallback: simple calculation without elevation
      totalTime += remainingMiles * paceSeconds;
    }

    const formatTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    };

    return formatTime(totalTime);
  };

  // Calculate current pace based on recent mile markers
  const getCurrentPace = (): {
    pace: number;
    trend: 'faster' | 'slower' | 'steady';
  } => {
    if (mileMarkers.length < 2) {
      return { pace: (fastPace + slowPace) / 2, trend: 'steady' };
    }

    const recentMarkers = mileMarkers
      .filter((m) => m.actualTime)
      .sort((a, b) => a.mile - b.mile)
      .slice(-2);

    if (recentMarkers.length < 2) {
      return { pace: (fastPace + slowPace) / 2, trend: 'steady' };
    }

    const [earlier, later] = recentMarkers;
    const [h1, m1, s1] = earlier.actualTime!.split(':').map(Number);
    const [h2, m2, s2] = later.actualTime!.split(':').map(Number);

    const time1 = h1 * 3600 + m1 * 60 + s1;
    const time2 = h2 * 3600 + m2 * 60 + s2;

    const timeDiff = time2 - time1;
    const mileDiff = later.mile - earlier.mile;
    const currentPace = timeDiff / mileDiff;

    // Determine trend by comparing to target pace range
    const targetPaceAvg = (fastPace + slowPace) / 2;
    let trend: 'faster' | 'slower' | 'steady' = 'steady';

    if (currentPace < targetPaceAvg - 15) trend = 'faster';
    else if (currentPace > targetPaceAvg + 15) trend = 'slower';

    return { pace: currentPace, trend };
  };

  // Calculate split times for different strategies
  const calculateSplits = () => {
    if (!route) return [];

    const splits = [];
    const totalTime =
      parseTimeString(targetFinishTime) || 26.2 * ((fastPace + slowPace) / 2);

    for (let mile = 5; mile <= 26; mile += 5) {
      let splitTime = 0;

      switch (splitStrategy) {
        case 'even':
          splitTime = (totalTime / 26.2) * mile;
          break;
        case 'negative':
          // Start 5% slower, finish 5% faster
          const avgPace = totalTime / 26.2;
          const firstHalfPace = avgPace * 1.025;
          const secondHalfPace = avgPace * 0.975;
          if (mile <= 13.1) {
            splitTime = firstHalfPace * mile;
          } else {
            splitTime = firstHalfPace * 13.1 + secondHalfPace * (mile - 13.1);
          }
          break;
        case 'positive':
          // Start 5% faster, finish 5% slower
          const avgPacePos = totalTime / 26.2;
          const firstHalfPacePos = avgPacePos * 0.975;
          const secondHalfPacePos = avgPacePos * 1.025;
          if (mile <= 13.1) {
            splitTime = firstHalfPacePos * mile;
          } else {
            splitTime =
              firstHalfPacePos * 13.1 + secondHalfPacePos * (mile - 13.1);
          }
          break;
      }

      splits.push({
        mile,
        time: formatTime(splitTime),
        pace: formatPace(splitTime / mile),
      });
    }

    return splits;
  };

  const parseTimeString = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
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

  const currentPaceData = getCurrentPace();
  const timeRange = {
    fast: calculatePredictedTime(26.2, fastPace),
    slow: calculatePredictedTime(26.2, slowPace),
    current: calculatePredictedTime(26.2, currentPaceData.pace),
  };

  const splits = calculateSplits();

  return (
    <div className="space-y-6">
      {/* Current Pace Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Pace Analysis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Current Pace</div>
            <div className="text-xl font-bold font-mono">
              {formatPace(currentPaceData.pace)}
            </div>
            <Badge
              variant={
                currentPaceData.trend === 'faster'
                  ? 'default'
                  : currentPaceData.trend === 'slower'
                  ? 'destructive'
                  : 'secondary'
              }
              className="mt-1"
            >
              {currentPaceData.trend === 'faster' && 'Ahead of Target'}
              {currentPaceData.trend === 'slower' && 'Behind Target'}
              {currentPaceData.trend === 'steady' && 'On Target'}
            </Badge>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground">
              Predicted Finish
            </div>
            <div className="text-xl font-bold font-mono">
              {timeRange.current}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Based on current pace
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Target Range</div>
            <div className="text-sm font-mono font-semibold">
              {timeRange.fast} - {timeRange.slow}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Goal finish window
            </div>
          </div>
        </div>

        {/* Pace Zones */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pace Zones</Label>
          {paceZones.map((zone) => (
            <div
              key={zone.name}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            >
              <div className={`w-3 h-3 rounded-full ${zone.color}`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{zone.name}</span>
                  <span className="font-mono text-sm">
                    {formatPace(zone.minPace)} - {formatPace(zone.maxPace)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {zone.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Time Predictions */}
      <Card className="p-6">
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="splits">Split Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Finish Time Predictions</h4>
            </div>

            <div className="space-y-3">
              {[5, 10, 13.1, 20, 26.2].map((mile) => (
                <div
                  key={mile}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="font-medium">
                    {mile === 13.1
                      ? 'Half Marathon'
                      : mile === 26.2
                      ? 'Finish'
                      : `Mile ${mile}`}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">
                      {calculatePredictedTime(mile, currentPaceData.pace)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPace(currentPaceData.pace)} pace
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {route && route.elevationGain > 200 && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-orange-800 dark:text-orange-200">
                    Elevation Alert
                  </div>
                  <div className="text-orange-700 dark:text-orange-300">
                    This course has {route.elevationGain}ft of elevation gain.
                    Times are adjusted for terrain.
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="splits" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="target-time" className="text-sm font-medium">
                  Target Finish Time
                </Label>
                <Input
                  id="target-time"
                  type="time"
                  step="1"
                  value={targetFinishTime}
                  onChange={(e) => setTargetFinishTime(e.target.value)}
                  placeholder="3:30:00"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Split Strategy</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={splitStrategy === 'even' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSplitStrategy('even')}
                  >
                    Even
                  </Button>
                  <Button
                    variant={
                      splitStrategy === 'negative' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSplitStrategy('negative')}
                  >
                    Negative
                  </Button>
                  <Button
                    variant={
                      splitStrategy === 'positive' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSplitStrategy('positive')}
                  >
                    Positive
                  </Button>
                </div>
              </div>

              {splits.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Split Times</Label>
                  {splits.map((split) => (
                    <div
                      key={split.mile}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="font-medium">Mile {split.mile}</span>
                      <div className="text-right">
                        <div className="font-mono text-sm">{split.time}</div>
                        <div className="text-xs text-muted-foreground">
                          {split.pace}/mi
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
