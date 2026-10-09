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
  Plus,
  SlidersHorizontal,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Land } from "@/types/farm";
import { AlertNotification } from "@/types/alert";

interface ServiceLeftNavProps {
  lands: Land[];
  selectedLand: Land | null;
  onSelectLand: (land: Land) => void;
  onOpenOptionsModal: (land: Land) => void;
  onOpenGlobalAlerts: () => void;
  onNavigateToRegisterLand: () => void;
  activeAlerts: AlertNotification[];
  totalAlertsCount: number;
  isLoggedIn: boolean;
}

export default function ServiceLeftNav({
  lands,
  selectedLand,
  onSelectLand,
  onOpenOptionsModal,
  onOpenGlobalAlerts,
  onNavigateToRegisterLand,
  activeAlerts,
  totalAlertsCount,
  isLoggedIn,
}: ServiceLeftNavProps) {
  return (
    <aside className="service-sidebar">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* 1. TOP SECTION: FEATURES */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
              paddingLeft: "6px",
            }}
          >
            <span className="sidebar-header" style={{ marginBottom: 0, paddingLeft: 0 }}>
              Features
            </span>

            {/* Global Alerts Button */}
            <button
              type="button"
              onClick={onOpenGlobalAlerts}
              title="View System Alerts"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                borderRadius: "6px",
                backgroundColor: totalAlertsCount > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.05)",
                border: totalAlertsCount > 0 ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                color: totalAlertsCount > 0 ? "#F59E0B" : "#94A3B8",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Bell size={13} />
              <span>Alerts</span>
              {totalAlertsCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#F59E0B",
                    color: "#0F172A",
                    borderRadius: "10px",
                    padding: "1px 5px",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                  }}
                >
                  {totalAlertsCount}
                </span>
              )}
            </button>
          </div>

          {/* Features Layer List */}
          <div className="layers-list" style={{ marginBottom: 0 }}>
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

            {/* Disabled Upcoming Features */}
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
        </div>

        {/* 2. BOTTOM SECTION: REGISTERED LANDS */}
        <div className="user-lands-section" style={{ marginTop: 0 }}>
          <div className="section-label">
            <span>Registered Lands ({lands.length})</span>
            {/* The ONLY way to register a land is via this +New button */}
            <button
              type="button"
              onClick={onNavigateToRegisterLand}
              title="Open dedicated registration page"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10B981",
                borderRadius: "6px",
                padding: "3px 8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={13} />
              <span>New</span>
            </button>
          </div>

          {/* Zero lands state: highly visible CTA */}
          {lands.length === 0 ? (
            <div className="zero-lands-cta">
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10B981",
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#F8FAFC" }}>
                  No Lands Registered
                </div>
                <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: "2px" }}>
                  Draw and register your farm parcel to unlock automated Sentinel-2 NDVI monitoring.
                </div>
              </div>
              <button
                type="button"
                className="cta-register-btn"
                onClick={onNavigateToRegisterLand}
              >
                <span>Register Your First Land</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "260px",
                overflowY: "auto",
                paddingRight: "2px",
              }}
            >
              {lands.map((land) => {
                const isSelected = selectedLand?.id === land.id;
                return (
                  <div
                    key={land.id}
                    className={`land-pill-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => onSelectLand(land)}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", flex: 1 }}>
                      <MapPin
                        size={16}
                        style={{
                          color: isSelected ? "#10B981" : "#64748B",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 700, color: isSelected ? "#10B981" : "#E2E8F0", fontSize: "0.85rem" }}>
                          {land.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                          {land.area_hectares != null ? `${land.area_hectares} ha` : "Polygon"}
                          {land.location ? ` &bull; ${land.location}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Options button: opens Update details modal (excludes border edits and deletions) */}
                    <button
                      type="button"
                      className="land-options-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOptionsModal(land);
                      }}
                      title="Update land details"
                    >
                      <SlidersHorizontal size={13} />
                      <span>Options</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. SYSTEM ALERT SECTION: Hide completely if there are no alerts */}
      {activeAlerts.length > 0 ? (
        <div className="system-alert-card">
          <div className="system-alert-title">
            <AlertTriangle size={15} />
            <span>SYSTEM ALERT</span>
          </div>
          <div className="system-alert-desc">
            <div style={{ fontWeight: 700, color: "#FBBF24", marginBottom: "4px" }}>
              {activeAlerts[0].message}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#B45309" }}>
              Severity: {activeAlerts[0].severity.toUpperCase()} &bull;{" "}
              {new Date(activeAlerts[0].triggered_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
