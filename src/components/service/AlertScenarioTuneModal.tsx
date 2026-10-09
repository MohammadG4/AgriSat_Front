"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Bell,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  ShieldAlert,
  HelpCircle,
  Activity,
} from "lucide-react";
import { Land } from "@/types/farm";
import {
  AlertScenario,
  AlertNotification,
  ScenarioType,
  AlertSeverity,
} from "@/types/alert";
import {
  getAlertScenariosApi,
  createAlertScenarioApi,
  getTriggeredAlertsApi,
  getToken,
} from "@/lib/api";

interface AlertScenarioTuneModalProps {
  land: Land;
  onClose: () => void;
}

export default function AlertScenarioTuneModal({
  land,
  onClose,
}: AlertScenarioTuneModalProps) {
  const [scenarios, setScenarios] = useState<AlertScenario[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"scenarios" | "add" | "alerts">("scenarios");

  // Form states for adding/tuning a new scenario
  const [scenarioType, setScenarioType] = useState<ScenarioType>("rapid_ndvi_drop");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>("high");
  // Parameters
  const [dropThreshold, setDropThreshold] = useState<number>(15.0);
  const [anomalyThresholdPercent, setAnomalyThresholdPercent] = useState<number>(15.0);
  const [areaThresholdPercent, setAreaThresholdPercent] = useState<number>(20.0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [fetchedScenarios, fetchedAlerts] = await Promise.all([
        getAlertScenariosApi(token, land.id),
        getTriggeredAlertsApi(token, land.id),
      ]);
      setScenarios(fetchedScenarios);
      setAlerts(fetchedAlerts);
    } catch (err: any) {
      setError(err.message || "Failed to load alert configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [land.id]);

  // Set default form name according to scenario type
  useEffect(() => {
    if (scenarioType === "rapid_ndvi_drop") {
      setName(`Rapid NDVI Drop (Threshold: ${dropThreshold}%)`);
      setDescription("Triggers an alert when median field NDVI drops abruptly compared to historical median.");
    } else {
      setName(`Spatial Patchy Anomaly (${anomalyThresholdPercent}% over ${areaThresholdPercent}% area)`);
      setDescription("Pixel-by-pixel detector identifying localized patchy anomalies across the field.");
    }
  }, [scenarioType, dropThreshold, anomalyThresholdPercent, areaThresholdPercent]);

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setError("Authentication token required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const params =
        scenarioType === "rapid_ndvi_drop"
          ? { drop_threshold: Number(dropThreshold) }
          : {
              anomaly_threshold_percent: Number(anomalyThresholdPercent),
              area_threshold_percent: Number(areaThresholdPercent),
            };

      await createAlertScenarioApi(token, {
        name: name.trim(),
        description: description.trim() || undefined,
        scenario_type: scenarioType,
        land_id: land.id,
        parameters: params,
        severity: severity,
        is_active: true,
      });

      setSuccessMsg("New alert scenario successfully applied!");
      await loadData();
      setActiveTab("scenarios");
    } catch (err: any) {
      setError(err.message || "Failed to configure scenario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box" style={{ maxWidth: "680px" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              <Sliders size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                NDVI Intelligence &amp; Alert Scenarios
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                {land.name} &bull; ID: #{land.id} {land.area_hectares ? `&bull; ${land.area_hectares} ha` : ""}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: "#94A3B8", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "0 24px",
            background: "rgba(255, 255, 255, 0.02)",
            gap: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("scenarios")}
            style={{
              padding: "12px 0",
              fontSize: "0.86rem",
              fontWeight: 600,
              color: activeTab === "scenarios" ? "#10B981" : "#94A3B8",
              borderBottom: activeTab === "scenarios" ? "2px solid #10B981" : "2px solid transparent",
            }}
          >
            Active Scenarios ({scenarios.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("add")}
            style={{
              padding: "12px 0",
              fontSize: "0.86rem",
              fontWeight: 600,
              color: activeTab === "add" ? "#10B981" : "#94A3B8",
              borderBottom: activeTab === "add" ? "2px solid #10B981" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={15} /> Tune / Add Scenario
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            style={{
              padding: "12px 0",
              fontSize: "0.86rem",
              fontWeight: 600,
              color: activeTab === "alerts" ? "#10B981" : "#94A3B8",
              borderBottom: activeTab === "alerts" ? "2px solid #10B981" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Bell size={15} /> Triggered Alerts ({alerts.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ minHeight: "300px" }}>
          {error && (
            <div className="alert-box error" style={{ marginBottom: "16px" }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box success" style={{ marginBottom: "16px" }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 0",
                gap: "12px",
                color: "#64748B",
              }}
            >
              <RefreshCw size={24} className="spin-animation" />
              <span>Retrieving NDVI telemetry rules...</span>
            </div>
          ) : activeTab === "scenarios" ? (
            <div>
              {scenarios.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "36px 20px",
                    color: "#94A3B8",
                  }}
                >
                  <Activity size={32} style={{ color: "#64748B", marginBottom: "10px" }} />
                  <p>No active scenarios configured on this field yet.</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: "14px" }}
                    onClick={() => setActiveTab("add")}
                  >
                    <Plus size={16} /> Configure First Scenario
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {scenarios.map((sc) => (
                    <div
                      key={sc.id}
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#F8FAFC" }}>
                            {sc.name}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#94A3B8", marginTop: "2px" }}>
                            {sc.description || "Automated satellite detection rule"}
                          </div>
                        </div>

                        <span
                          className={`badge ${
                            sc.severity === "critical"
                              ? "badge-warning"
                              : sc.severity === "high"
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                          style={{ textTransform: "uppercase" }}
                        >
                          {sc.severity}
                        </span>
                      </div>

                      {/* Parameter Details */}
                      <div
                        style={{
                          backgroundColor: "#0B101E",
                          borderRadius: "6px",
                          padding: "10px 12px",
                          fontSize: "0.78rem",
                          fontFamily: "var(--font-mono)",
                          color: "#10B981",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                        }}
                      >
                        <div>
                          Type: <span style={{ color: "#E2E8F0" }}>{sc.scenario_type}</span>
                        </div>
                        {sc.parameters?.drop_threshold !== undefined && (
                          <div>
                            Drop Threshold:{" "}
                            <span style={{ color: "#E2E8F0" }}>
                              {sc.parameters.drop_threshold}%
                            </span>
                          </div>
                        )}
                        {sc.parameters?.anomaly_threshold_percent !== undefined && (
                          <div>
                            Anomaly Threshold:{" "}
                            <span style={{ color: "#E2E8F0" }}>
                              {sc.parameters.anomaly_threshold_percent}%
                            </span>
                          </div>
                        )}
                        {sc.parameters?.area_threshold_percent !== undefined && (
                          <div>
                            Area Threshold:{" "}
                            <span style={{ color: "#E2E8F0" }}>
                              {sc.parameters.area_threshold_percent}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "add" ? (
            <form onSubmit={handleCreateScenario}>
              <div className="form-group">
                <label className="form-label">Algorithm Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setScenarioType("rapid_ndvi_drop")}
                    className={`btn ${
                      scenarioType === "rapid_ndvi_drop" ? "btn-primary" : "btn-secondary"
                    }`}
                    style={{ fontSize: "0.82rem", padding: "10px" }}
                  >
                    Rapid NDVI Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setScenarioType("spatial_anomaly")}
                    className={`btn ${
                      scenarioType === "spatial_anomaly" ? "btn-primary" : "btn-secondary"
                    }`}
                    style={{ fontSize: "0.82rem", padding: "10px" }}
                  >
                    Spatial Anomaly (Patchy)
                  </button>
                </div>
              </div>

              {scenarioType === "rapid_ndvi_drop" ? (
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    padding: "14px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div className="form-group" style={{ marginBottom: "0" }}>
                    <div className="form-label">
                      <span>NDVI Drop Threshold (%)</span>
                      <span style={{ color: "#10B981", fontWeight: 700 }}>
                        {dropThreshold}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={dropThreshold}
                      onChange={(e) => setDropThreshold(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#10B981" }}
                    />
                    <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: "6px" }}>
                      Triggers if overall field median vegetation health decreases by more than {dropThreshold}% from previous readings.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    padding: "14px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div className="form-group" style={{ marginBottom: "0" }}>
                    <div className="form-label">
                      <span>Pixel Anomaly Threshold (%)</span>
                      <span style={{ color: "#10B981", fontWeight: 700 }}>
                        {anomalyThresholdPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={anomalyThresholdPercent}
                      onChange={(e) => setAnomalyThresholdPercent(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#10B981" }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "0" }}>
                    <div className="form-label">
                      <span>Minimum Affected Area (%)</span>
                      <span style={{ color: "#10B981", fontWeight: 700 }}>
                        {areaThresholdPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      value={areaThresholdPercent}
                      onChange={(e) => setAreaThresholdPercent(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#10B981" }}
                    />
                    <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: "6px" }}>
                      Triggers if at least {areaThresholdPercent}% of the land shows a localized pixel drop exceeding {anomalyThresholdPercent}%.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Scenario Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select
                    className="form-input"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab("scenarios")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving Scenario..." : "Apply Scenario Rule"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              {alerts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
                  <CheckCircle size={32} style={{ color: "#10B981", marginBottom: "10px" }} />
                  <p>No anomalies currently triggered for this parcel. Vegetation indices are within expected thresholds.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {alerts.map((al) => (
                    <div
                      key={al.id}
                      style={{
                        padding: "14px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#FCA5A5", fontSize: "0.88rem" }}>
                          {al.message}
                        </span>
                        <span className="badge badge-warning">{al.severity}</span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                        Index: {al.index_name} &bull; Triggered:{" "}
                        {new Date(al.triggered_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
