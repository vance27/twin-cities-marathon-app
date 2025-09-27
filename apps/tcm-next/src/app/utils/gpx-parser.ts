import { RoutePoint } from '@/components/marathon-route';

interface GPXTrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

export interface GPXData {
  name: string;
  description?: string;
  trackPoints: GPXTrackPoint[];
}

/**
 * Parse GPX XML content and extract track points
 */
export function parseGPX(gpxContent: string): GPXData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');

  // Get track name
  const trackElement = xmlDoc.querySelector('trk');
  const nameElement = trackElement?.querySelector('name');
  const name = nameElement?.textContent || 'Twin Cities Marathon';

  // Get track description
  const descElement = trackElement?.querySelector('desc');
  const description = descElement?.textContent || '';

  // Extract track points
  const trackPoints: GPXTrackPoint[] = [];
  const trkptElements = xmlDoc.querySelectorAll('trkpt');

  trkptElements.forEach((trkpt) => {
    const lat = parseFloat(trkpt.getAttribute('lat') || '0');
    const lon = parseFloat(trkpt.getAttribute('lon') || '0');

    // Get elevation if available
    const eleElement = trkpt.querySelector('ele');
    const ele = eleElement ? parseFloat(eleElement.textContent || '0') : undefined;

    // Get waypoint name if available
    const nameElement = trkpt.querySelector('name');
    const pointName = nameElement?.textContent || undefined;

    trackPoints.push({
      lat,
      lon,
      ele,
      name: pointName,
    });
  });

  return {
    name,
    description,
    trackPoints,
  };
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return R * c;
}

/**
 * Convert GPX track points to marathon route points - preserves ALL track points
 */
export function convertGPXToRoutePoints(gpxData: GPXData): RoutePoint[] {
  const { trackPoints } = gpxData;
  if (trackPoints.length === 0) return [];

  const routePoints: RoutePoint[] = [];
  let cumulativeDistance = 0;

  // Process each track point and preserve ALL of them
  for (let i = 0; i < trackPoints.length; i++) {
    const currentPoint = trackPoints[i];

    // Calculate cumulative distance
    if (i > 0) {
      const prevPoint = trackPoints[i - 1];
      const segmentDistance = calculateDistance(
        prevPoint.lat,
        prevPoint.lon,
        currentPoint.lat,
        currentPoint.lon
      );
      cumulativeDistance += segmentDistance;
    }

    // Determine if this is a significant point
    const mile = cumulativeDistance;
    const isStart = i === 0;
    const isFinish = i === trackPoints.length - 1;
    const isMileMarker = Math.abs(mile - Math.round(mile)) < 0.1; // Within 0.1 miles of a whole mile
    const isHalfway = Math.abs(mile - 13.1) < 0.2; // Around halfway point
    const isWall = Math.abs(mile - 20) < 0.2; // Around mile 20

    let landmark: string | undefined;
    if (isStart) {
      landmark = currentPoint.name || 'Start';
    } else if (isFinish) {
      landmark = currentPoint.name || 'Finish';
    } else if (isHalfway) {
      landmark = 'Halfway Point!';
    } else if (isWall) {
      landmark = 'The Wall - Mile 20';
    } else if (isMileMarker && Math.round(mile) > 0 && Math.round(mile) <= 26) {
      landmark = `Mile ${Math.round(mile)}`;
    } else if (currentPoint.name) {
      landmark = currentPoint.name;
    }

    // Add every single track point to preserve the full route
    routePoints.push({
      coordinates: [currentPoint.lon, currentPoint.lat],
      mile: mile,
      elevation: currentPoint.ele ? Math.round(currentPoint.ele * 3.28084) : undefined, // Convert meters to feet
      landmark: landmark,
    });
  }

  return routePoints;
}

/**
 * Convert GPX track points to coordinate array for mapping libraries
 * This preserves ALL track points for accurate route rendering
 */
export function convertGPXToCoordinates(gpxData: GPXData): [number, number][] {
  return gpxData.trackPoints.map(point => [point.lon, point.lat]);
}

/**
 * Calculate total elevation gain from route points
 */
export function calculateElevationGain(routePoints: RoutePoint[]): number {
  let totalGain = 0;
  let previousElevation = routePoints[0]?.elevation;

  for (let i = 1; i < routePoints.length; i++) {
    const currentElevation = routePoints[i].elevation;
    if (previousElevation !== undefined && currentElevation !== undefined) {
      const gain = currentElevation - previousElevation;
      if (gain > 0) {
        totalGain += gain;
      }
      previousElevation = currentElevation;
    }
  }

  return Math.round(totalGain);
}

/**
 * Load and parse GPX file from a URL or File object
 */
export async function loadGPXFile(source: string | File): Promise<GPXData> {
  let gpxContent: string;

  if (typeof source === 'string') {
    // Load from URL
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to load GPX file: ${response.statusText}`);
    }
    gpxContent = await response.text();
  } else {
    // Load from File object
    gpxContent = await source.text();
  }

  return parseGPX(gpxContent);
}