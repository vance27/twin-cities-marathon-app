'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Settings,
  Keyboard,
  Zap,
  Clock,
  Target,
} from 'lucide-react';

interface InteractiveControlsProps {
  currentMile: number[];
  onMileChange: (mile: number[]) => void;
  fastPace: number;
  slowPace: number;
  onPaceChange: (fast: number, slow: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function InteractiveControls({
  currentMile,
  onMileChange,
  fastPace,
  slowPace,
  onPaceChange,
  isPlaying,
  onPlayToggle,
  playbackSpeed,
  onSpeedChange,
}: InteractiveControlsProps) {
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [customFastPace, setCustomFastPace] = useState('');
  const [customSlowPace, setCustomSlowPace] = useState('');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'p':
          e.preventDefault();
          onPlayToggle();
          break;
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          jumpBackward();
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          jumpForward();
          break;
        case 'r':
          e.preventDefault();
          resetPosition();
          break;
        case '1':
          e.preventDefault();
          onSpeedChange(0.5);
          break;
        case '2':
          e.preventDefault();
          onSpeedChange(1);
          break;
        case '3':
          e.preventDefault();
          onSpeedChange(2);
          break;
        case '4':
          e.preventDefault();
          onSpeedChange(4);
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPlayToggle, onSpeedChange, showKeyboardShortcuts]);

  const jumpForward = useCallback(() => {
    const newMile = Math.min(26.2, currentMile[0] + 1);
    onMileChange([newMile]);
  }, [currentMile, onMileChange]);

  const jumpBackward = useCallback(() => {
    const newMile = Math.max(0, currentMile[0] - 1);
    onMileChange([newMile]);
  }, [currentMile, onMileChange]);

  const resetPosition = useCallback(() => {
    onMileChange([0]);
  }, [onMileChange]);

  const formatPace = (paceSeconds: number): string => {
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const parsePace = (paceString: string): number => {
    const parts = paceString.split(':');
    if (parts.length === 2) {
      const minutes = Number.parseInt(parts[0]) || 0;
      const seconds = Number.parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  const updatePaces = () => {
    if (customFastPace && customSlowPace) {
      const newFastPace = parsePace(customFastPace);
      const newSlowPace = parsePace(customSlowPace);
      if (newFastPace > 0 && newSlowPace > 0 && newFastPace <= newSlowPace) {
        onPaceChange(newFastPace, newSlowPace);
      }
    }
  };

  const presetPaces = [
    { name: 'Elite', fast: 5 * 60, slow: 5 * 60 + 30, color: 'bg-red-500' },
    {
      name: 'Sub-3',
      fast: 6 * 60 + 45,
      slow: 6 * 60 + 55,
      color: 'bg-orange-500',
    },
    { name: 'Sub-3:30', fast: 7 * 60 + 30, slow: 8 * 60, color: 'bg-blue-500' },
    {
      name: 'Sub-4',
      fast: 8 * 60 + 30,
      slow: 9 * 60 + 10,
      color: 'bg-green-500',
    },
    {
      name: 'Sub-5',
      fast: 10 * 60 + 30,
      slow: 11 * 60 + 30,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Playback Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Simulation Controls
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="flex items-center gap-2"
          >
            <Keyboard className="w-4 h-4" />
            Shortcuts
          </Button>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={jumpBackward}
            className="flex items-center gap-2 bg-transparent"
          >
            <SkipBack className="w-4 h-4" />
            -1 Mile
          </Button>

          <Button
            onClick={onPlayToggle}
            size="lg"
            className="flex items-center gap-2"
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
            className="flex items-center gap-2 bg-transparent"
          >
            <SkipForward className="w-4 h-4" />
            +1 Mile
          </Button>
        </div>

        {/* Position Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Position: Mile {currentMile[0].toFixed(1)}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetPosition}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
          <Slider
            value={currentMile}
            onValueChange={onMileChange}
            max={26.2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span>13.1 mi</span>
            <span>Finish</span>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="mt-6 space-y-3">
          <Label className="text-sm font-medium">
            Playback Speed: {playbackSpeed}x
          </Label>
          <div className="flex gap-2">
            {[0.5, 1, 2, 4].map((speed) => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSpeedChange(speed)}
                className="flex-1"
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>

        {/* Auto-advance toggle */}
        <div className="mt-4 flex items-center justify-between">
          <Label htmlFor="auto-advance" className="text-sm font-medium">
            Auto-advance on mile markers
          </Label>
          <Switch
            id="auto-advance"
            checked={autoAdvance}
            onCheckedChange={setAutoAdvance}
          />
        </div>
      </Card>

      {/* Pace Configuration */}
      <Card className="p-6">
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Pace Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom Pace</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Goal Pace Presets</h4>
            </div>

            <div className="space-y-3">
              {presetPaces.map((preset) => (
                <div
                  key={preset.name}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    fastPace === preset.fast && slowPace === preset.slow
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => onPaceChange(preset.fast, preset.slow)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${preset.color}`}
                      ></div>
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    <div className="text-sm font-mono">
                      {formatPace(preset.fast)} - {formatPace(preset.slow)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Current Target</div>
              <div className="font-mono text-lg">
                {formatPace(fastPace)} - {formatPace(slowPace)} per mile
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Custom Pace Range</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fast-pace" className="text-sm">
                  Fast Pace (MM:SS)
                </Label>
                <Input
                  id="fast-pace"
                  placeholder="7:00"
                  value={customFastPace}
                  onChange={(e) => setCustomFastPace(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="slow-pace" className="text-sm">
                  Slow Pace (MM:SS)
                </Label>
                <Input
                  id="slow-pace"
                  placeholder="8:10"
                  value={customSlowPace}
                  onChange={(e) => setCustomSlowPace(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={updatePaces} className="w-full" size="sm">
              Update Pace Range
            </Button>

            <div className="text-xs text-muted-foreground">
              Enter pace in MM:SS format (e.g., 7:30 for 7 minutes 30 seconds
              per mile)
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMileChange([5])}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Mile 5
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMileChange([13.1])}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Half
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMileChange([20])}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Mile 20
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMileChange([26.2])}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Finish
          </Button>
        </div>
      </Card>

      {/* Keyboard Shortcuts */}
      {showKeyboardShortcuts && (
        <Card className="p-6 border-primary/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Play/Pause</span>
                <Badge variant="outline">Space / P</Badge>
              </div>
              <div className="flex justify-between">
                <span>Jump Forward</span>
                <Badge variant="outline">→ / D</Badge>
              </div>
              <div className="flex justify-between">
                <span>Jump Backward</span>
                <Badge variant="outline">← / A</Badge>
              </div>
              <div className="flex justify-between">
                <span>Reset Position</span>
                <Badge variant="outline">R</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Speed 0.5x</span>
                <Badge variant="outline">1</Badge>
              </div>
              <div className="flex justify-between">
                <span>Speed 1x</span>
                <Badge variant="outline">2</Badge>
              </div>
              <div className="flex justify-between">
                <span>Speed 2x</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex justify-between">
                <span>Speed 4x</span>
                <Badge variant="outline">4</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Press ? to toggle this help panel
          </div>
        </Card>
      )}
    </div>
  );
}
