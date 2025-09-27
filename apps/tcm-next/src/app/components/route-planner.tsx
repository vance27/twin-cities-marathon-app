'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Route, Upload } from 'lucide-react';
import { InteractiveMap } from './interactive-map';
import { GPXUploader } from './gpx-uploader';

interface RoutePlannerProps {
  onRouteChange?: (coordinates: [number, number][], distanceMiles: number) => void;
  initialRoute?: [number, number][];
  currentMile?: number;
  showSimulation?: boolean;
}

export function RoutePlanner({ onRouteChange, initialRoute, currentMile = 0, showSimulation = false }: RoutePlannerProps) {
  const [currentRoute, setCurrentRoute] = useState<[number, number][]>(initialRoute || []);
  const [routeDistance, setRouteDistance] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [activeTab, setActiveTab] = useState('draw');

  const handleRouteUpdate = (coordinates: [number, number][], distanceMiles: number) => {
    setCurrentRoute(coordinates);
    setRouteDistance(distanceMiles);

    if (onRouteChange) {
      onRouteChange(coordinates, distanceMiles);
    }
  };

  const handleGPXUpload = async (file: File) => {
    setUploadedFileName(file.name);

    try {
      // Parse the GPX file
      const { loadGPXFile, convertGPXToCoordinates } = await import('@/utils/gpx-parser');
      const gpxData = await loadGPXFile(file);
      const coordinates = convertGPXToCoordinates(gpxData);

      // Calculate total distance
      let totalDistance = 0;
      for (let i = 1; i < coordinates.length; i++) {
        const [lon1, lat1] = coordinates[i - 1];
        const [lon2, lat2] = coordinates[i];

        // Simple distance calculation (you could import the calculateDistance function)
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
        totalDistance += R * c;
      }

      // Update the route
      handleRouteUpdate(coordinates, totalDistance);

    } catch (error) {
      console.error('Error parsing GPX file:', error);
      alert('Error parsing GPX file. Please check the file format.');
    }
  };

  const clearGPX = () => {
    setUploadedFileName('');
    setCurrentRoute([]);
    setRouteDistance(0);
    if (onRouteChange) {
      onRouteChange([], 0);
    }
  };

  const isMarathonDistance = routeDistance >= 26.0 && routeDistance <= 26.5;

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
              <h2 className="text-xl font-semibold">Route Planner</h2>
              <p className="text-sm text-muted-foreground">
                Create or upload your Twin Cities Marathon route
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {routeDistance > 0 && (
              <Badge variant={isMarathonDistance ? 'default' : 'secondary'}>
                {routeDistance.toFixed(2)} miles
              </Badge>
            )}
            {isMarathonDistance && (
              <Badge variant="default" className="bg-green-600">
                Marathon Distance ✓
              </Badge>
            )}
          </div>
        </div>

        {/* Route Planning Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Draw Route
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload GPX
            </TabsTrigger>
          </TabsList>

          {/* Interactive Drawing Tab */}
          <TabsContent value="draw" className="mt-6">
            <InteractiveMap
              onRouteChange={handleRouteUpdate}
              initialRoute={currentRoute}
              center={[-93.2650, 44.9778]} // Minneapolis/St. Paul
              zoom={12}
              height="600px"
              currentMile={currentMile}
              showSimulation={showSimulation}
            />
          </TabsContent>

          {/* GPX Upload Tab */}
          <TabsContent value="upload" className="mt-6">
            <div className="space-y-4">
              <GPXUploader
                onFileSelect={handleGPXUpload}
                onClear={clearGPX}
                uploadedFileName={uploadedFileName}
              />

              {uploadedFileName && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Route Loaded</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your GPX route has been loaded. You can view and edit it in the Draw Route tab.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Switch to draw tab to show the route
                      setActiveTab('draw');
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View on Map
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
                {routeDistance.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Miles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {isMarathonDistance ? '✓' : (26.2 - routeDistance).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isMarathonDistance ? 'Ready' : 'Miles to go'}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground p-3 bg-accent/20 rounded-lg">
          <p><strong>Pro Tips:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Use the Twin Cities area (Minneapolis/St. Paul) for authentic marathon routes</li>
            <li>A marathon is 26.2 miles - aim for this distance</li>
            <li>Consider elevation changes and scenic areas for the best route</li>
            <li>You can switch between drawing and uploading modes</li>
            <li>Export your final route as GPX for GPS devices</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}