"use client";

import React from "react";
import {
  Activity,
  Droplets,
  Sprout,
  Thermometer,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Sliders,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { Land } from "@/types/farm";
import { AlertNotification } from "@/types/alert";

interface ServiceLeftNavProps {
  lands: Land[];
  selectedLand: Land | null;
  onSelectLand: (land: Land) => void;
  onOpenTuneModal: (land: Land) => void;
  onStartDraw: () => void;
  activeAlerts: AlertNotification[];
  isLoggedIn: boolean;
}

export default function ServiceLeftNav({
  lands,
  selectedLand,
  onSelectLand,
  onOpenTuneModal,
  onStartDraw,
  activeAlerts,
  isLoggedIn,
}: ServiceLeftNavProps) {
  return (
    <aside className="service-sidebar">
      <div>
        {/* Header */}
        <div className="sidebar-header">NABTA DASHBOARD LAYERS</div>

        {/* Layers list */}
        <div className="layers-list">
          {/* Active: Health Map (NDVI) */}
          <button
            type="button"
            className="layer-item active"
            title="Crop Health NDVI (Active)"
          >
            <div className="layer-left">
              <Activity size={18} />
              <span>Health Map (NDVI)</span>
            </div>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                boxShadow: "0 0 8px #10B981",
              }}
            />
          </button>

          {/* Disabled layers */}
          <button type="button" className="layer-item disabled" disabled>
            <div className="layer-left">
              <Droplets size={18} />
              <span>Water &amp; Soil Moisture</span>
            </div>
            <span className="layer-badge">Soon</span>
          </button>

          <button type="button" className="layer-item disabled" disabled>
            <div className="layer-left">
              <Sprout size={18} />
              <span>Crop Classification</span>
            </div>
            <span className="layer-badge">Soon</span>
          </button>

          <button type="button" className="layer-item disabled" disabled>
            <div className="layer-left">
              <Thermometer size={18} />
              <span>Heat Tracker (LST)</span>
            </div>
            <span className="layer-badge">Soon</span>
          </button>

          <button type="button" className="layer-item disabled" disabled>
            <div className="layer-left">
              <ShieldAlert size={18} />
              <span>Pest &amp; Rust Risk</span>
            </div>
            <span className="layer-badge">Soon</span>
          </button>

          <button type="button" className="layer-item disabled" disabled>
            <div className="layer-left">
              <TrendingUp size={18} />
              <span>Yield Forecast Map</span>
            </div>
            <span className="layer-badge">Soon</span>
          </button>
        </div>

        {/* User's Lands Section */}
        <div className="user-lands-section">
          <div className="section-label">
            <span>My Registered Lands ({lands.length})</span>
            {isLoggedIn && (
              <button
                type="button"
                onClick={onStartDraw}
                title="Draw new land boundary"
                style={{
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <PlusCircle size={14} />
                <span>New</span>
              </button>
            )}
          </div>

          {!isLoggedIn ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                fontSize: "0.78rem",
                color: "#94A3B8",
              }}
            >
              Sign in to save and manage land parcels with automated NDVI scenarios.
            </div>
          ) : lands.length === 0 ? (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                fontSize: "0.8rem",
                color: "#94A3B8",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span>No lands registered yet. Use the drawing tool on the map to define your first boundary.</span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                onClick={onStartDraw}
              >
                <PlusCircle size={14} /> Draw First Land
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {lands.map((land) => {
                const isSelected = selectedLand?.id === land.id;
                return (
                  <div
                    key={land.id}
                    className={`land-pill-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => onSelectLand(land)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <MapPin
                        size={15}
                        style={{
                          color: isSelected ? "#10B981" : "#64748B",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, color: isSelected ? "#10B981" : "#E2E8F0" }}>
                          {land.name}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                          {land.area_hectares != null ? `${land.area_hectares} ha` : "Polygon"}
                          {land.location ? ` • ${land.location}` : ""}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTuneModal(land);
                      }}
                      title="Tune Alert Scenarios"
                      style={{
                        padding: "4px 6px",
                        color: "#94A3B8",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <Sliders size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Alert Box matching screenshot */}
      <div className="system-alert-card">
        <div className="system-alert-title">
          <AlertTriangle size={15} />
          <span>SYSTEM ALERT</span>
        </div>
        <div className="system-alert-desc">
          {activeAlerts.length > 0 ? (
            <div>
              <div style={{ fontWeight: 700, color: "#FBBF24", marginBottom: "4px" }}>
                {activeAlerts[0].message}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#B45309" }}>
                Severity: {activeAlerts[0].severity.toUpperCase()} • {new Date(activeAlerts[0].triggered_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            "NDVI vegetation index optimal across 82% of fields. Section 4 showing slight moisture stress."
          )}
        </div>
      </div>
    </aside>
  );
}
