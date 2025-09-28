'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Route,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
} from 'lucide-react';
import { InteractiveMap } from './interactive-map';

interface RoutePlannerProps {
  onRouteChange?: (
    coordinates: [number, number][],
    distanceMiles: number
  ) => void;
  initialRoute?: [number, number][];
  currentMile?: number;
  showSimulation?: boolean;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  onMileChange?: (mile: number[]) => void;
  routeDistance?: number;
}

export function RoutePlanner({
  onRouteChange,
  initialRoute,
  currentMile = 0,
  showSimulation = false,
  isPlaying = false,
  onPlayToggle,
  playbackSpeed = 1,
  onSpeedChange,
  onMileChange,
  routeDistance = 26.2,
}: RoutePlannerProps) {
  const [currentRoute, setCurrentRoute] = useState<[number, number][]>(
    initialRoute || []
  );
  const [localRouteDistance, setLocalRouteDistance] = useState(0);

  const handleRouteUpdate = (
    coordinates: [number, number][],
    distanceMiles: number
  ) => {
    setCurrentRoute(coordinates);
    setLocalRouteDistance(distanceMiles);

    if (onRouteChange) {
      onRouteChange(coordinates, distanceMiles);
    }
  };

  const jumpForward = () => {
    if (onMileChange) {
      const newMile = Math.min(routeDistance, currentMile + 1);
      onMileChange([newMile]);
    }
  };

  const jumpBackward = () => {
    if (onMileChange) {
      const newMile = Math.max(0, currentMile - 1);
      onMileChange([newMile]);
    }
  };

  const resetPosition = () => {
    if (onMileChange) {
      onMileChange([0]);
    }
  };

  const isMarathonDistance =
    localRouteDistance >= 26.0 && localRouteDistance <= 26.5;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Route className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Race Simulator</h2>
              <p className="text-sm text-muted-foreground">
                Experience the Twin Cities Marathon route
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {localRouteDistance && (
              <Badge variant={isMarathonDistance ? 'default' : 'secondary'}>
                {currentMile.toFixed(2)} completed out of{' '}
                {localRouteDistance.toFixed(2)} miles
              </Badge>
            )}
            {isMarathonDistance && (
              <Badge variant="default" className="bg-green-600">
                Marathon Distance ✓
              </Badge>
            )}
          </div>
        </div>

        {/* Simulation Controls */}
        {currentRoute.length > 0 && (
          <div className="space-y-4">
            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4 p-4 bg-pastel-blue/30 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={jumpBackward}
                className="flex items-center gap-2 bg-pastel-peach border-pastel-peach hover:bg-pastel-peach/80"
              >
                <SkipBack className="w-4 h-4" />
                -1 Mile
              </Button>

              <Button
                onClick={onPlayToggle}
                size="lg"
                className="flex items-center gap-2 bg-pastel-mint hover:bg-pastel-mint/80 text-gray-800"
                disabled={!onPlayToggle}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={jumpForward}
                className="flex items-center gap-2 bg-pastel-peach border-pastel-peach hover:bg-pastel-peach/80"
              >
                <SkipForward className="w-4 h-4" />
                +1 Mile
              </Button>

              {/* <div className="h-6 w-px bg-border mx-2"></div> */}
            </div>

            <div className="flex items-center justify-center gap-4 p-4 bg-pastel-lavender/30 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetPosition}
                className="flex items-center gap-1 bg-pastel-yellow border-pastel-yellow hover:bg-pastel-yellow/80"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
              <div className="text-sm text-muted-foreground">Speed:</div>
              {[0.5, 1, 2, 5].map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSpeedChange?.(speed)}
                  className={`text-xs ${
                    playbackSpeed === speed
                      ? 'bg-pastel-pink border-pastel-pink text-gray-800'
                      : 'bg-white border-pastel-pink hover:bg-pastel-pink/20'
                  }`}
                >
                  {speed}x
                </Button>
              ))}
            </div>
            {/* Position Slider */}
            <div className="flex justify-center">
              <div className="w-full max-w-md space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Start</span>
                  <span>
                    Mile {currentMile.toFixed(1)} of {routeDistance.toFixed(1)}
                  </span>
                  <span>Finish</span>
                </div>
                <Slider
                  value={[currentMile]}
                  onValueChange={(value) => onMileChange?.(value)}
                  min={0}
                  max={routeDistance}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Race Route Map */}
        <div className="mt-6">
          <InteractiveMap
            onRouteChange={handleRouteUpdate}
            initialRoute={currentRoute}
            center={[-93.265, 44.9778]} // Minneapolis/St. Paul
            zoom={12}
            height="600px"
            currentMile={currentMile}
            showSimulation={showSimulation}
          />
        </div>

        {/* Route Statistics */}
        {currentRoute.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentRoute.length}
              </div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {localRouteDistance.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Miles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {isMarathonDistance
                  ? '✓'
                  : (localRouteDistance - currentMile).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isMarathonDistance ? 'Ready' : 'Miles to go'}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground p-3 bg-accent/20 rounded-lg">
          <p>
            <strong>How to use:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>
              Use the simulation controls to follow a runner through the race
            </li>
            <li>Add race markers at specific distances to log split times</li>
            <li>
              Track your progress through the famous Twin Cities Marathon route
            </li>
            <li>Adjust playback speed to review different parts of the race</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
