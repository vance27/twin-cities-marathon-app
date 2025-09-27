'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mountain, Route } from 'lucide-react';
import { marathonRoutes } from './marathon-route';

interface RouteSelectorProps {
  selectedRoute: string;
  onRouteChange: (routeId: string) => void;
}

export function RouteSelector({
  selectedRoute,
  onRouteChange,
}: RouteSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentRoute = marathonRoutes[selectedRoute];

  if (!isExpanded) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Route className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{currentRoute.name}</h3>
              <p className="text-xs text-muted-foreground">
                {currentRoute.startLocation} → {currentRoute.finishLocation}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
          >
            Change Route
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          Select Marathon Route
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
          ×
        </Button>
      </div>

      <div className="space-y-3">
        {Object.entries(marathonRoutes).map(([routeId, route]) => (
          <div
            key={routeId}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedRoute === routeId
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
            onClick={() => {
              onRouteChange(routeId);
              setIsExpanded(false);
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-sm">{route.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {route.description}
                </p>
              </div>
              {selectedRoute === routeId && (
                <Badge variant="default" className="text-xs">
                  Selected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {route.totalDistance} mi
              </div>
              <div className="flex items-center gap-1">
                <Mountain className="w-3 h-3" />
                {route.elevationGain}ft gain
              </div>
            </div>

            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">Start:</span>{' '}
              {route.startLocation}
              <br />
              <span className="text-muted-foreground">Finish:</span>{' '}
              {route.finishLocation}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
