export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
}

export interface Land {
  id: number;
  user_id: number;
  name: string;
  location?: string | null;
  soil_type?: string | null;
  irrigation_type?: string | null;
  status: boolean;
  notes?: string | null;
  image_url?: string | null;
  boundary: GeoJsonPolygon;
  area_hectares?: number | null;
  created_date: string;
  last_updated: string;
}

export interface LandCreatePayload {
  name: string;
  location?: string;
  soil_type?: string;
  irrigation_type?: string;
  status?: boolean;
  notes?: string;
  image_url?: string;
  boundary: GeoJsonPolygon;
}

export interface Crop {
  id: number;
  crop_name: string;
  description?: string | null;
}

export interface CropOnLand {
  instance_id: number;
  crop_id: number;
  crop_name: string;
  description?: string | null;
  planting_date: string;
  harvest_date?: string | null;
  season?: string | null;
}

export interface VegetationIndexSet {
  id: number;
  land_id: number;
  satellite_name: string;
  acquisition_date: string;
  file_path: string;
  stats: Record<string, any>;
  created_at: string;
}
