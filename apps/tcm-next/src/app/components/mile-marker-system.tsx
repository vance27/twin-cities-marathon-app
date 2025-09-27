'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  AlertCircle,
} from 'lucide-react';

interface MileMarker {
  mile: number;
  time: string;
  actualTime?: string;
  pace?: number;
  split?: number;
  note?: string;
}

interface MileMarkerSystemProps {
  mileMarkers: MileMarker[];
  onMarkersChange: (markers: MileMarker[]) => void;
  targetPace: { fast: number; slow: number };
  currentMile: number;
}

export function MileMarkerSystem({
  mileMarkers,
  onMarkersChange,
  targetPace,
  currentMile,
}: MileMarkerSystemProps) {
  const [selectedDistance, setSelectedDistance] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newNote, setNewNote] = useState('');

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
  const [editingMarker, setEditingMarker] = useState<number | null>(null);

  // Calculate pace and splits for markers
  const enrichedMarkers = mileMarkers.map((marker, index) => {
    let pace = 0;
    let split = 0;

    if (marker.actualTime) {
      const [hours, minutes, seconds] = marker.actualTime
        .split(':')
        .map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      if (index === 0) {
        // First marker - pace is total time / distance
        pace = totalSeconds / marker.mile;
        split = totalSeconds;
      } else {
        // Calculate split from previous marker
        const prevMarker = mileMarkers[index - 1];
        if (prevMarker.actualTime) {
          const [prevH, prevM, prevS] = prevMarker.actualTime
            .split(':')
            .map(Number);
          const prevTotalSeconds = prevH * 3600 + prevM * 60 + prevS;
          split = totalSeconds - prevTotalSeconds;
          pace = split / (marker.mile - prevMarker.mile);
        }
      }
    }

    return { ...marker, pace, split };
  });

  const addMileMarker = () => {
    if (!selectedDistance || !newTime) return;

    const selectedRaceDistance = raceDistances.find(d => d.label === selectedDistance);
    if (!selectedRaceDistance) return;

    const mile = selectedRaceDistance.miles;
    const newMarker: MileMarker = {
      mile,
      time: newTime,
      actualTime: newTime,
      note: newNote || `${selectedRaceDistance.label} (${selectedRaceDistance.km}K)`,
    };

    const updatedMarkers = [
      ...mileMarkers.filter((m) => m.mile !== mile),
      newMarker,
    ].sort((a, b) => a.mile - b.mile);
    onMarkersChange(updatedMarkers);
    setSelectedDistance('');
    setNewTime('');
    setNewNote('');
  };

  const deleteMarker = (mile: number) => {
    const updatedMarkers = mileMarkers.filter((m) => m.mile !== mile);
    onMarkersChange(updatedMarkers);
  };

  const updateMarker = (mile: number, updates: Partial<MileMarker>) => {
    const updatedMarkers = mileMarkers.map((m) =>
      m.mile === mile ? { ...m, ...updates } : m
    );
    onMarkersChange(updatedMarkers);
    setEditingMarker(null);
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

  const getPaceStatus = (pace: number): 'fast' | 'target' | 'slow' => {
    if (pace < targetPace.fast) return 'fast';
    if (pace > targetPace.slow) return 'slow';
    return 'target';
  };

  const exportMarkers = () => {
    const csvData = [
      'Mile,Time,Pace,Split,Note',
      ...enrichedMarkers.map((m) =>
        [
          m.mile,
          m.actualTime || '',
          formatPace(m.pace),
          formatTime(m.split),
          m.note || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marathon-splits.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMarkers = () => {
    try {
      const lines = bulkData.trim().split('\n');
      const newMarkers: MileMarker[] = [];

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          const mile = Number.parseFloat(parts[0]);
          const time = parts[1];
          const note = parts[4] || undefined;

          if (
            mile >= 0 &&
            mile <= 26.2 &&
            time.match(/^\d{1,2}:\d{2}:\d{2}$/)
          ) {
            newMarkers.push({ mile, time, actualTime: time, note });
          }
        }
      }

      if (newMarkers.length > 0) {
        const combinedMarkers = [...mileMarkers, ...newMarkers];
        const uniqueMarkers = combinedMarkers.filter(
          (marker, index, self) =>
            index === self.findIndex((m) => m.mile === marker.mile)
        );
        onMarkersChange(uniqueMarkers.sort((a, b) => a.mile - b.mile));
        setBulkData('');
      }
    } catch (error) {
      console.error('Error importing markers:', error);
    }
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

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Race Progress
          </h3>
          <Badge variant="outline" className="text-sm">
            {enrichedMarkers.length} markers recorded
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Mile {currentMile.toFixed(1)}</span>
              <span>Next: Mile {getNextMilestone()}</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          {enrichedMarkers.length > 0 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Average Pace
                </div>
                <div className="font-mono text-lg font-semibold">
                  {formatPace(averagePace)}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Last Split</div>
                <div className="font-mono text-lg font-semibold">
                  {enrichedMarkers.length > 0
                    ? formatTime(
                        enrichedMarkers[enrichedMarkers.length - 1].split
                      )
                    : '--:--'}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">On Target</div>
                <div className="font-mono text-lg font-semibold">
                  {
                    enrichedMarkers.filter(
                      (m) => getPaceStatus(m.pace) === 'target'
                    ).length
                  }
                  /{enrichedMarkers.length}
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
            <TabsTrigger value="list">View All</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Add Race Marker</h4>
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
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                    {raceDistances.map((distance) => (
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
                  placeholder="01:30:45"
                  pattern="^([0-9]{2}):([0-5][0-9]):([0-5][0-9])$"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
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
              className="w-full"
              size="sm"
              disabled={!selectedDistance || !newTime}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Race Marker
            </Button>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">All Mile Markers</h4>
              {enrichedMarkers.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportMarkers}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>

            {enrichedMarkers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No mile markers recorded yet</p>
                <p className="text-sm">
                  Add your first marker to start tracking splits
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {enrichedMarkers.map((marker, index) => (
                  <div
                    key={marker.mile}
                    className="p-4 border border-border rounded-lg"
                  >
                    {editingMarker === marker.mile ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="time"
                            step="1"
                            defaultValue={marker.actualTime}
                            onChange={(e) =>
                              updateMarker(marker.mile, {
                                actualTime: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Note"
                            defaultValue={marker.note || ''}
                            onChange={(e) =>
                              updateMarker(marker.mile, {
                                note: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setEditingMarker(null)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMarker(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">
                              Mile {marker.mile}
                            </span>
                            <Badge
                              variant={
                                getPaceStatus(marker.pace) === 'fast'
                                  ? 'default'
                                  : getPaceStatus(marker.pace) === 'slow'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {getPaceStatus(marker.pace) === 'fast' && (
                                <>
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Fast
                                </>
                              )}
                              {getPaceStatus(marker.pace) === 'slow' && (
                                <>
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                  Slow
                                </>
                              )}
                              {getPaceStatus(marker.pace) === 'target' && (
                                <>
                                  <Target className="w-3 h-3 mr-1" />
                                  Target
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Time:
                              </span>
                              <div className="font-mono font-semibold">
                                {marker.actualTime}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Pace:
                              </span>
                              <div className="font-mono font-semibold">
                                {formatPace(marker.pace)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Split:
                              </span>
                              <div className="font-mono font-semibold">
                                {formatTime(marker.split)}
                              </div>
                            </div>
                          </div>
                          {marker.note && (
                            <div className="mt-2 text-sm text-muted-foreground italic">
                              {marker.note}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMarker(marker.mile)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMarker(marker.mile)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Import/Export Data</h4>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-data" className="text-sm font-medium">
                  Bulk Import (CSV Format)
                </Label>
                <Textarea
                  id="bulk-data"
                  placeholder="5,1:30:00,Good pace&#10;10,2:45:00,Feeling strong&#10;13.1,3:35:00,Halfway point"
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  rows={6}
                />
                <div className="text-xs text-muted-foreground mt-2">
                  Format: Mile,Time,Note (one per line). Example: 5,1:30:00,Good
                  pace
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={importMarkers}
                  disabled={!bulkData.trim()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
                <Button
                  variant="outline"
                  onClick={exportMarkers}
                  disabled={enrichedMarkers.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {enrichedMarkers.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Export Preview
                  </div>
                  <div className="text-xs font-mono bg-background p-2 rounded border max-h-32 overflow-y-auto">
                    Mile,Time,Pace,Split,Note
                    <br />
                    {enrichedMarkers.slice(0, 3).map((m) => (
                      <div key={m.mile}>
                        {m.mile},{m.actualTime},{formatPace(m.pace)},
                        {formatTime(m.split)},{m.note || ''}
                      </div>
                    ))}
                    {enrichedMarkers.length > 3 && (
                      <div>... and {enrichedMarkers.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
