"use client";

import React, { useState } from "react";
import { X, Sliders, Settings, AlertCircle, CheckCircle, MapPin } from "lucide-react";
import { Land, LandUpdatePayload } from "@/types/farm";
import { updateLandApi, getToken } from "@/lib/api";
import { formatAreaKm2 } from "./geoUtils";

interface UpdateLandModalProps {
  land: Land;
  onClose: () => void;
  onSuccess: (updatedLand: Land) => void;
  onOpenTuneScenarios: (land: Land) => void;
}

export default function UpdateLandModal({
  land,
  onClose,
  onSuccess,
  onOpenTuneScenarios,
}: UpdateLandModalProps) {
  const [name, setName] = useState(land.name || "");
  const [location, setLocation] = useState(land.location || "");
  const [soilType, setSoilType] = useState(land.soil_type || "Clay");
  const [irrigationType, setIrrigationType] = useState(land.irrigation_type || "Drip");
  const [notes, setNotes] = useState(land.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setError("Authentication required to update land details.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: LandUpdatePayload = {
        name: name.trim(),
        location: location.trim() || undefined,
        soil_type: soilType,
        irrigation_type: irrigationType,
        notes: notes.trim() || undefined,
      };

      const updated = await updateLandApi(token, land.id, payload);
      setSuccessMsg("Land details updated successfully!");
      setTimeout(() => {
        onSuccess(updated);
      }, 400);
    } catch (err: any) {
      setError(err.message || "Failed to update land details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box" style={{ maxWidth: "540px" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                Land Options &amp; Details
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                ID: #{land.id} &bull; {land.area_hectares != null ? formatAreaKm2(land.area_hectares) : "Polygon"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ color: "#94A3B8", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert-box error" style={{ marginBottom: "16px" }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert-box success" style={{ marginBottom: "16px" }}>
                <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <span>Land Name *</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Location / Region</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Nile Delta, Minya, Cairo"
                disabled={saving}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <select
                  className="form-input"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  disabled={saving}
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
                  disabled={saving}
                >
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Center Pivot / Sprinkler</option>
                  <option value="Surface">Surface / Flood</option>
                  <option value="Sub-surface">Sub-surface</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agronomic notes, planting season, soil observations..."
                disabled={saving}
              />
            </div>

            {/* Read-only Boundary Note */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "0.78rem",
                color: "#94A3B8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ color: "#F8FAFC", fontWeight: 600 }}>Calculated Area: </span>
                {land.area_hectares != null ? formatAreaKm2(land.area_hectares) : "N/A"}
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                (Geographic boundaries are locked)
              </span>
            </div>

            {/* Quick Action: Tune Alert Scenarios */}
            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px", fontSize: "0.84rem" }}
                onClick={() => {
                  onClose();
                  onOpenTuneScenarios(land);
                }}
              >
                <Sliders size={15} style={{ color: "#10B981" }} />
                <span>Tune NDVI Alert Scenarios</span>
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
