"use client";

import React, { useState } from "react";
import { X, Layers, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { GeoJsonPolygon, Land, LandCreatePayload } from "@/types/farm";
import { createLandApi, createAlertScenarioApi, getToken } from "@/lib/api";
import { calculatePolygonAreaKm2, formatAreaKm2 } from "./geoUtils";

interface CreateLandModalProps {
  boundary: GeoJsonPolygon | null;
  onClose: () => void;
  onSuccess: (newLand: Land) => void;
}

export default function CreateLandModal({
  boundary,
  onClose,
  onSuccess,
}: CreateLandModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [soilType, setSoilType] = useState("Clay");
  const [irrigationType, setIrrigationType] = useState("Drip");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!boundary) return null;

  // Estimate area in km2
  const coords = boundary.coordinates[0] || [];
  const approxKm2 = calculatePolygonAreaKm2(coords);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a name for this land parcel.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("You must be logged in to register a land.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Ensure closed ring in boundary
      const ring = [...boundary.coordinates[0]];
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }

      const payload: LandCreatePayload = {
        name: name.trim(),
        location: location.trim() || undefined,
        soil_type: soilType,
        irrigation_type: irrigationType,
        notes: notes.trim() || undefined,
        boundary: {
          type: "Polygon",
          coordinates: [ring],
        },
      };

      setStatusMessage("Registering boundary with PostGIS...");
      const createdLand = await createLandApi(token, payload);

      // 2. Automatically generate default alert scenarios as requested
      setStatusMessage("Configuring automated Sentinel-2 NDVI alert scenarios...");
      try {
        // Scenario 1: Rapid NDVI Drop
        await createAlertScenarioApi(token, {
          name: "Rapid NDVI Drop Watch",
          description: "Alerts when median NDVI decreases abruptly compared to historical baselines.",
          scenario_type: "rapid_ndvi_drop",
          land_id: createdLand.id,
          parameters: { drop_threshold: 15.0 },
          severity: "high",
          is_active: true,
        });

        // Scenario 2: Spatial Anomaly
        await createAlertScenarioApi(token, {
          name: "Patchy Disease & Irrigation Leak Monitor",
          description: "Pixel-by-pixel spatial detector identifying localized vegetation stress.",
          scenario_type: "spatial_anomaly",
          land_id: createdLand.id,
          parameters: {
            anomaly_threshold_percent: 15.0,
            area_threshold_percent: 20.0,
          },
          severity: "critical",
          is_active: true,
        });
      } catch (scenarioErr) {
        console.warn("Notice: Default scenarios initialization:", scenarioErr);
      }

      setStatusMessage("Land registered and NDVI intelligence activated!");
      setTimeout(() => {
        onSuccess(createdLand);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to register land.");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box" style={{ maxWidth: "540px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                Register New Land Parcel
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Mapbox Polygon &bull; Approx. {formatAreaKm2(approxKm2, true)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ color: "#94A3B8", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert-box error" style={{ marginBottom: "16px" }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{error}</span>
              </div>
            )}

            {statusMessage && (
              <div className="alert-box info" style={{ marginBottom: "16px" }}>
                <Sparkles size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#10B981" }} />
                <span style={{ color: "#E2E8F0" }}>{statusMessage}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <span>Land Name *</span>
                <span style={{ color: "#64748B", fontSize: "0.75rem" }}>e.g. Field #1 (Wheat)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Field #1 (Wheat 0.82 NDVI)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Location Name / Region</span>
                <span style={{ color: "#64748B", fontSize: "0.75rem" }}>City or Sector</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Nile Delta, Kafr El-Sheikh, Cairo"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <select
                  className="form-input"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  disabled={loading}
                >
                  <option value="Clay">Clay</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Loam">Loam</option>
                  <option value="Silty Clay">Silty Clay</option>
                  <option value="Peat">Peat</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Irrigation System</label>
                <select
                  className="form-input"
                  value={irrigationType}
                  onChange={(e) => setIrrigationType(e.target.value)}
                  disabled={loading}
                >
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Center Pivot / Sprinkler</option>
                  <option value="Surface">Surface / Flood</option>
                  <option value="Sub-surface">Sub-surface</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "10px" }}>
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Planting dates, crop stage, or moisture observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Default Automated Scenarios Info */}
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "0.8rem",
                color: "#A7F3D0",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#10B981" }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                  Automated Default Scenarios Included
                </div>
                <div style={{ color: "#94A3B8", fontSize: "0.75rem" }}>
                  This land will automatically receive <strong>Rapid NDVI Drop (15%)</strong> and <strong>Spatial Patchy Anomaly (15% drop over 20% area)</strong> alert scenarios. You can tune these parameters immediately after creation.
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Registering & Activating..." : "Save Land & Activate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
