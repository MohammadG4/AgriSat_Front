// Utility functions for geometry and geocoding

export function calculatePolygonAreaKm2(coords: number[][]): number {
  if (!coords || coords.length < 3) return 0;
  const radius = 6378137; // Earth's radius in meters
  let area = 0;
  const len = coords.length;
  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const lon1 = (p1[0] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * radius * radius) / 2.0);
  // 1 km² = 1,000,000 m²
  const km2 = area / 1000000.0;
  return Number(km2.toFixed(4));
}

export function formatAreaKm2(value?: number | null, isKm2: boolean = false): string {
  if (value == null || isNaN(value)) return "0.00 km²";
  const km2 = isKm2 ? value : value / 100.0;
  if (km2 < 0.01 && km2 > 0) {
    return `${km2.toFixed(4)} km²`;
  }
  return `${km2.toFixed(2)} km²`;
}

export function calculatePolygonAreaHectares(coords: number[][]): number {
  return calculatePolygonAreaKm2(coords) * 100;
}

// Egypt geographical boundary validation (covers Egyptian territory)
export const EGYPT_BBOX: [[number, number], [number, number]] = [
  [24.5, 21.8], // Southwest coordinates [lng, lat]
  [37.0, 32.0], // Northeast coordinates [lng, lat]
];

export function isPolygonInsideEgypt(coords: number[][]): boolean {
  if (!coords || coords.length === 0) return false;
  return coords.every(([lng, lat]) => {
    return lng >= 24.5 && lng <= 37.0 && lat >= 21.8 && lat <= 32.0;
  });
}

export function parseCoordinates(query: string): [number, number] | null {
  // Try pattern: "lat, lng" or "lat lng"
  const clean = query.trim();
  const parts = clean.split(/[,\s]+/).map((p) => parseFloat(p));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [val1, val2] = parts;
    // Latitude is [-90, 90], Longitude is [-180, 180]
    if (val1 >= -90 && val1 <= 90 && val2 >= -180 && val2 <= 180) {
      // Returns [lng, lat] for Mapbox
      return [val2, val1];
    }
    // Alternatively if user typed [lng, lat]
    if (val2 >= -90 && val2 <= 90 && val1 >= -180 && val1 <= 180) {
      return [val1, val2];
    }
  }
  return null;
}

export function getPolygonCenter(coordinates: number[][]): [number, number] {
  if (!coordinates || coordinates.length === 0) return [31.2357, 30.0444];
  let sumLng = 0;
  let sumLat = 0;
  const count = coordinates.length;
  coordinates.forEach(([lng, lat]) => {
    sumLng += lng;
    sumLat += lat;
  });
  return [sumLng / count, sumLat / count];
}
