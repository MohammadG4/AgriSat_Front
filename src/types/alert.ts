export type ScenarioType = "rapid_ndvi_drop" | "spatial_anomaly";
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface RapidDropParameters {
  drop_threshold: number; // percentage, e.g. 15.0
}

export interface SpatialAnomalyParameters {
  anomaly_threshold_percent: number; // e.g. 15.0
  area_threshold_percent: number; // e.g. 20.0
}

export type ScenarioParameters = RapidDropParameters | SpatialAnomalyParameters | Record<string, any>;

export interface AlertScenario {
  id: number;
  name: string;
  description?: string | null;
  scenario_type: ScenarioType;
  land_id: number;
  parameters: Record<string, any>;
  severity: AlertSeverity;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertScenarioCreatePayload {
  name: string;
  description?: string;
  scenario_type: ScenarioType;
  land_id: number;
  parameters: Record<string, any>;
  severity?: AlertSeverity;
  is_active?: boolean;
}

export interface AlertNotification {
  id: number;
  scenario_id: number;
  land_id: number;
  status: string;
  severity: AlertSeverity;
  index_name: string;
  message: string;
  context_data: Record<string, any>;
  triggered_at: string;
  resolved_at?: string | null;
}
