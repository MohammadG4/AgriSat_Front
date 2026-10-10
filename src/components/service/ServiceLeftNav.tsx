"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  MoreVertical,
  SlidersHorizontal,
  Bell,
  ArrowRight,
  FileText,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { Land } from "@/types/farm";
import { AlertNotification } from "@/types/alert";
import { formatAreaKm2 } from "./geoUtils";

interface ServiceLeftNavProps {
  lands: Land[];
  selectedLand: Land | null;
  onSelectLand: (land: Land) => void;
  onOpenOptionsModal: (land: Land) => void;
  onOpenGlobalAlerts: () => void;
  onNavigateToRegisterLand: () => void;
  onOpenCropRegistration?: (land: Land) => void;
  onToggleFeatureDetails?: () => void;
  isFeatureDetailsOpen?: boolean;
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
  onOpenCropRegistration,
  onToggleFeatureDetails,
  isFeatureDetailsOpen,
  activeAlerts,
  totalAlertsCount,
  isLoggedIn,
}: ServiceLeftNavProps) {
  const router = useRouter();
  const [activeDropdownLandId, setActiveDropdownLandId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownLandId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);
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
              title="Crop Health NDVI (Click to toggle detailed analytics below)"
              onClick={() => onToggleFeatureDetails?.()}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="layer-left">
                <Activity size={18} />
                <span>Health Map (NDVI)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.68rem", color: "#10B981", fontWeight: 700 }}>
                  {isFeatureDetailsOpen ? "Details ▼" : "Details ▲"}
                </span>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                    boxShadow: "0 0 8px #10B981",
                  }}
                />
              </div>
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
                          {land.area_hectares != null ? formatAreaKm2(land.area_hectares) : "Polygon"}
                          {land.location ? ` &bull; ${land.location}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Options: Vertical Ellipsis Dropdown with 3 actions */}
                    <div style={{ position: "relative" }} ref={dropdownRef}>
                      <button
                        type="button"
                        className="land-options-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownLandId(
                            activeDropdownLandId === land.id ? null : land.id
                          );
                        }}
                        title="Land options"
                        style={{
                          padding: "6px 8px",
                          borderRadius: "6px",
                          backgroundColor:
                            activeDropdownLandId === land.id
                              ? "rgba(16, 185, 129, 0.2)"
                              : "transparent",
                          color:
                            activeDropdownLandId === land.id
                              ? "#10B981"
                              : "#94A3B8",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu (3 actions) */}
                      {activeDropdownLandId === land.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "4px",
                            width: "220px",
                            backgroundColor: "#0B132B",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "8px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
                            zIndex: 100,
                            overflow: "hidden",
                            padding: "4px 0",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Land details */}
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#E2E8F0",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(16, 185, 129, 0.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                            onClick={() => {
                              setActiveDropdownLandId(null);
                              router.push(`/lands/landdetails?land_id=${land.id}`);
                            }}
                          >
                            <FileText size={15} style={{ color: "#10B981" }} />
                            <span>Land details</span>
                          </button>

                          {/* 2. Alert Options */}
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#E2E8F0",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(16, 185, 129, 0.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                            onClick={() => {
                              setActiveDropdownLandId(null);
                              router.push(`/lands/AlertOptions?land_id=${land.id}`);
                            }}
                          >
                            <Sliders size={15} style={{ color: "#F59E0B" }} />
                            <span>Alert Options</span>
                          </button>

                          {/* 3. Register a new crop for the land */}
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#E2E8F0",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(16, 185, 129, 0.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                            onClick={() => {
                              setActiveDropdownLandId(null);
                              if (onOpenCropRegistration) {
                                onOpenCropRegistration(land);
                              }
                            }}
                          >
                            <Sprout size={15} style={{ color: "#34D399" }} />
                            <span>Register new crop</span>
                          </button>
                        </div>
                      )}
                    </div>
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
