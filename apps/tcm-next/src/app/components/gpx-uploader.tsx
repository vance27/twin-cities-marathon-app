'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface GPXUploaderProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  isLoading?: boolean;
  uploadedFileName?: string;
}

export function GPXUploader({
  onFileSelect,
  onClear,
  isLoading = false,
  uploadedFileName
}: GPXUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.gpx')) {
        onFileSelect(file);
      } else {
        alert('Please select a GPX file (.gpx extension)');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.gpx')) {
        onFileSelect(file);
      } else {
        alert('Please select a GPX file (.gpx extension)');
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (uploadedFileName) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">GPX Route Loaded</h3>
              <p className="text-xs text-muted-foreground">{uploadedFileName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload GPX Route
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a GPX file containing the Twin Cities Marathon route
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>

            {isLoading ? (
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Processing GPX file...</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your GPX file here, or
                </p>
                <Button onClick={handleButtonClick} size="sm">
                  Choose File
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supports .gpx files only
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> GPX files should contain track points with coordinates and
            optionally elevation data for the best experience.
          </p>
        </div>
      </div>
    </Card>
  );
}