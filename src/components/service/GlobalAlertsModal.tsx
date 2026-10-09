"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, AlertTriangle, ShieldAlert, MapPin, Calendar, RefreshCw } from "lucide-react";
import { Land } from "@/types/farm";
import { AlertNotification } from "@/types/alert";
import { getTriggeredAlertsApi, getToken } from "@/lib/api";

interface GlobalAlertsModalProps {
  lands: Land[];
  selectedLand: Land | null;
  onClose: () => void;
  onNavigateToLand: (land: Land) => void;
}

interface AlertWithLand extends AlertNotification {
  landName?: string;
}

export default function GlobalAlertsModal({
  lands,
  selectedLand,
  onClose,
  onNavigateToLand,
}: GlobalAlertsModalProps) {
  const [filterMode, setFilterMode] = useState<"all" | "selected">("all");
  const [alerts, setAlerts] = useState<AlertWithLand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllAlerts = async () => {
      const token = getToken();
      if (!token) return;
      setLoading(true);

      try {
        const targetLands =
          filterMode === "selected" && selectedLand
            ? [selectedLand]
            : lands;

        const results = await Promise.all(
          targetLands.map(async (l) => {
            try {
              const landAlerts = await getTriggeredAlertsApi(token, l.id);
              return landAlerts.map((a) => ({
                ...a,
                landName: l.name,
              }));
            } catch {
              return [];
            }
          })
        );

        const flattened = results.flat();
        // Sort by date (newest first)
        flattened.sort(
          (a, b) =>
            new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
        );

        setAlerts(flattened);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAlerts();
  }, [filterMode, selectedLand, lands]);

  const handleSelectAlert = (alertItem: AlertWithLand) => {
    const matchedLand = lands.find((l) => l.id === alertItem.land_id);
    if (matchedLand) {
      onNavigateToLand(matchedLand);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box" style={{ maxWidth: "620px" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F59E0B",
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                System Alerts &amp; Notifications
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Active triggers sorted by acquisition date
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

        {/* Filter Tabs */}
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
            onClick={() => setFilterMode("all")}
            style={{
              padding: "12px 0",
              fontSize: "0.86rem",
              fontWeight: 600,
              color: filterMode === "all" ? "#10B981" : "#94A3B8",
              borderBottom: filterMode === "all" ? "2px solid #10B981" : "2px solid transparent",
            }}
          >
            All Registered Lands ({lands.length})
          </button>

          {selectedLand && (
            <button
              type="button"
              onClick={() => setFilterMode("selected")}
              style={{
                padding: "12px 0",
                fontSize: "0.86rem",
                fontWeight: 600,
                color: filterMode === "selected" ? "#10B981" : "#94A3B8",
                borderBottom: filterMode === "selected" ? "2px solid #10B981" : "2px solid transparent",
              }}
            >
              Current: {selectedLand.name}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body" style={{ minHeight: "260px" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0",
                gap: "12px",
                color: "#64748B",
              }}
            >
              <RefreshCw size={22} className="spin-animation" />
              <span>Checking active anomalies across lands...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
              <ShieldAlert size={36} style={{ color: "#10B981", marginBottom: "12px" }} />
              <div style={{ fontWeight: 700, color: "#E2E8F0", marginBottom: "4px" }}>
                No Active Anomalies Detected
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748B" }}>
                All parcels have median NDVI indices adhering to scientific baselines.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="alert-list-item"
                  onClick={() => handleSelectAlert(alert)}
                  title="Click to zoom to this land on the map"
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: alert.severity === "critical" ? "#EF4444" : "#F59E0B",
                        marginTop: "6px",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#F8FAFC" }}>
                        {alert.message}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontSize: "0.74rem",
                          color: "#94A3B8",
                          marginTop: "4px",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={12} style={{ color: "#10B981" }} />
                          {alert.landName || `Land #${alert.land_id}`}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={12} />
                          {new Date(alert.triggered_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <span
                      className={`badge ${
                        alert.severity === "critical"
                          ? "badge-warning"
                          : "badge-warning"
                      }`}
                      style={{ textTransform: "uppercase" }}
                    >
                      {alert.severity}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#10B981", fontWeight: 600 }}>
                      View on Map &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
