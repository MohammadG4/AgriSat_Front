"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
import { useLanguage } from "@/context/LanguageContext";
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
  const { t, isRTL } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [dropdownState, setDropdownState] = useState<{
    land: Land;
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest(".land-options-btn")) {
          return;
        }
        setDropdownState(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close dropdown on window resize or when scrolling
  useEffect(() => {
    const handleScrollOrResize = () => {
      setDropdownState(null);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
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
              {t("service.imageryLayers")}
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
              <span>{t("service.globalAlerts")}</span>
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
                <span>{t("service.ndviLayer")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.68rem", color: "#10B981", fontWeight: 700 }}>
                  {isFeatureDetailsOpen ? "▼" : "▲"}
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
                <span>{t("service.ndwiLayer")}</span>
              </div>
              <span className="layer-badge">Soon</span>
            </button>

            <button type="button" className="layer-item disabled" disabled>
              <div className="layer-left">
                <Sprout size={18} />
                <span>{t("service.eviLayer")}</span>
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
            <span>{t("service.landsTitle")} ({lands.length})</span>
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
              <span>{t("lands.registerNewBtn")}</span>
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
                  {t("service.noLandsFound")}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: "2px" }}>
                  {t("service.noLandsDesc")}
                </div>
              </div>
              <button
                type="button"
                className="cta-register-btn"
                onClick={onNavigateToRegisterLand}
              >
                <span>{t("service.registerLandBtn")}</span>
                <ArrowRight size={15} className="icon-flip" />
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
                          {land.location ? ` • ${land.location}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Options: Vertical Ellipsis Button */}
                    <button
                      type="button"
                      className="land-options-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dropdownState?.land.id === land.id) {
                          setDropdownState(null);
                          return;
                        }
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const sidebarEl = document.querySelector(".service-sidebar");
                        const left = isRTL
                          ? (sidebarEl ? sidebarEl.getBoundingClientRect().left - 238 : rect.left - 238)
                          : (sidebarEl ? sidebarEl.getBoundingClientRect().right + 8 : rect.right + 12);
                        const top = Math.min(Math.max(12, rect.top - 8), window.innerHeight - 190);

                        setDropdownState({
                          land,
                          top,
                          left,
                        });
                      }}
                      title="Land options"
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        backgroundColor:
                          dropdownState?.land.id === land.id
                            ? "rgba(16, 185, 129, 0.2)"
                            : "transparent",
                        color:
                          dropdownState?.land.id === land.id
                            ? "#10B981"
                            : "#94A3B8",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MoreVertical size={16} />
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
              Severity: {activeAlerts[0].severity.toUpperCase()} •{" "}
              {new Date(activeAlerts[0].triggered_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. FLOATING OPTIONS OVERLAY: Rendered via portal to overlay the map on the right */}
      {mounted && dropdownState && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: dropdownState.top,
            left: dropdownState.left,
            width: "230px",
            backgroundColor: "rgba(11, 19, 43, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "10px",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(16, 185, 129, 0.25)",
            zIndex: 99999,
            overflow: "hidden",
            padding: "6px 0",
            backdropFilter: "blur(14px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "6px 14px 8px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#10B981",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {t("common.actions")}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#F8FAFC",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: "2px",
              }}
            >
              {dropdownState.land.name}
            </div>
          </div>

          {/* 1. Land details */}
          <button
            type="button"
            style={{
              width: "100%",
              padding: "9px 14px",
              textAlign: isRTL ? "right" : "left",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "transparent",
              border: "none",
              color: "#E2E8F0",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
              e.currentTarget.style.color = "#10B981";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#E2E8F0";
            }}
            onClick={() => {
              const id = dropdownState.land.id;
              setDropdownState(null);
              router.push(`/lands/landdetails?land_id=${id}`);
            }}
          >
            <FileText size={16} style={{ color: "#10B981", flexShrink: 0 }} />
            <span>{t("common.viewDetails")}</span>
          </button>

          {/* 2. Alert Options */}
          <button
            type="button"
            style={{
              width: "100%",
              padding: "9px 14px",
              textAlign: isRTL ? "right" : "left",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "transparent",
              border: "none",
              color: "#E2E8F0",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
              e.currentTarget.style.color = "#F59E0B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#E2E8F0";
            }}
            onClick={() => {
              const id = dropdownState.land.id;
              setDropdownState(null);
              router.push(`/lands/AlertOptions?land_id=${id}`);
            }}
          >
            <Sliders size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
            <span>{t("alertOptions.title")}</span>
          </button>

          {/* 3. Register new crop */}
          <button
            type="button"
            style={{
              width: "100%",
              padding: "9px 14px",
              textAlign: isRTL ? "right" : "left",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "transparent",
              border: "none",
              color: "#E2E8F0",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(52, 211, 153, 0.15)";
              e.currentTarget.style.color = "#34D399";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#E2E8F0";
            }}
            onClick={() => {
              const land = dropdownState.land;
              setDropdownState(null);
              if (onOpenCropRegistration) {
                onOpenCropRegistration(land);
              }
            }}
          >
            <Sprout size={16} style={{ color: "#34D399", flexShrink: 0 }} />
            <span>{t("landDetails.registerCropBtn")}</span>
          </button>
        </div>,
        document.body
      )}
    </aside>
  );
}
