"use client";

import React, { useRef } from "react";
import {
  Activity,
  Layers,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  MapPin,
  Sparkles,
  BarChart3,
  Satellite,
  Info,
} from "lucide-react";
import { Land, VegetationIndexSet } from "@/types/farm";
import { useLanguage } from "@/context/LanguageContext";
import { formatAreaKm2 } from "./geoUtils";

interface FeatureDetailsPanelProps {
  land: Land;
  satelliteData?: VegetationIndexSet[];
  onClose: () => void;
}

export default function FeatureDetailsPanel({
  land,
  satelliteData = [],
  onClose,
}: FeatureDetailsPanelProps) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  // Derive stats or realistic agronomic satellite simulation
  const latestPass = satelliteData.length > 0 ? satelliteData[0] : null;
  const meanNdvi =
    latestPass?.stats?.mean != null
      ? Number(latestPass.stats.mean).toFixed(2)
      : "0.76";
  const minNdvi =
    latestPass?.stats?.min != null
      ? Number(latestPass.stats.min).toFixed(2)
      : "0.34";
  const maxNdvi =
    latestPass?.stats?.max != null
      ? Number(latestPass.stats.max).toFixed(2)
      : "0.89";
  const stdNdvi =
    latestPass?.stats?.std != null
      ? Number(latestPass.stats.std).toFixed(3)
      : "0.082";

  // Mock time-series curve points for interactive chart
  const timelinePoints = [
    { date: "May 12", ndvi: 0.28, status: "Emergence" },
    { date: "Jun 02", ndvi: 0.44, status: "Vegetative" },
    { date: "Jun 24", ndvi: 0.61, status: "Tiller Growth" },
    { date: "Jul 15", ndvi: 0.74, status: "Canopy Close" },
    { date: "Aug 08", ndvi: 0.82, status: "Peak Biomass" },
    { date: "Aug 30", ndvi: 0.79, status: "Grain Fill" },
    { date: "Sep 22", ndvi: 0.76, status: "Maturity" },
    { date: "Oct 10", ndvi: Number(meanNdvi), status: "Current Pass" },
  ];

  return (
    <section
      id="feature-details-section"
      ref={panelRef}
      style={{
        width: "100%",
        backgroundColor: "#070B14",
        borderTop: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#F8FAFC",
        padding: "36px 32px 50px 32px",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "28px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "rgba(16, 185, 129, 0.18)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <Activity size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "#F8FAFC" }}>
                  {t("service.analyticsTitle")}
                </h2>
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#34D399",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {t("service.liveTelemetry")}
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#94A3B8", marginTop: "4px" }}>
                {t("service.appliedToParcel")}: <strong style={{ color: "#E2E8F0" }}>{land.name}</strong> (#{land.id})
                {land.location ? ` &bull; ${land.location}` : ""} &bull;{" "}
                {t("common.area")}: {land.area_hectares != null ? formatAreaKm2(land.area_hectares) : t("service.calculatedPolygon")}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#CBD5E1",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronUp size={16} />
            <span>{t("service.closeInspector")}</span>
          </button>
        </div>

        {/* 4 Metric Telemetry Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                {t("service.meanNdvi")}
              </span>
              <Activity size={16} style={{ color: "#10B981" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#10B981", marginTop: "8px" }}>
              {meanNdvi}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#34D399", marginTop: "4px" }}>
              ✓ {t("service.healthyVegetation")}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                {t("service.maxNdvi")}
              </span>
              <TrendingUp size={16} style={{ color: "#38BDF8" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#38BDF8", marginTop: "8px" }}>
              {maxNdvi}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#7DD3FC", marginTop: "4px" }}>
              {t("service.healthyVegetation")}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                {t("service.minNdvi")}
              </span>
              <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#F59E0B", marginTop: "8px" }}>
              {minNdvi}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#FCD34D", marginTop: "4px" }}>
              {t("service.stressedVegetation")}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                {t("service.variance")}
              </span>
              <BarChart3 size={16} style={{ color: "#A78BFA" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#A78BFA", marginTop: "8px" }}>
              &plusmn;{stdNdvi}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#C4B5FD", marginTop: "4px" }}>
              {t("common.active")}
            </div>
          </div>
        </div>

        {/* Charts & Breakdown Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Time Series Vegetation Progression Chart */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {t("service.timeSeriesTitle")}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  {t("home.statRevisitSub")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.72rem", color: "#10B981" }}>
                <Satellite size={14} />
                <span>ESA Sentinel-2 L2A</span>
              </div>
            </div>

            {/* Custom SVG Line & Area Visualization */}
            <div style={{ width: "100%", height: "180px", position: "relative" }}>
              <svg width="100%" height="100%" viewBox="0 0 700 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Threshold guide lines */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <line x1="0" y1="75" x2="700" y2="75" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="700" y2="120" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

                {/* Curve fill area */}
                <path
                  d="M 20 120 Q 120 90, 220 50 T 420 22 T 620 32 L 680 38 L 680 155 L 20 155 Z"
                  fill="url(#ndviGradient)"
                />

                {/* Main line */}
                <path
                  d="M 20 120 Q 120 90, 220 50 T 420 22 T 620 32 L 680 38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data point dots */}
                {timelinePoints.map((pt, i) => {
                  const x = 20 + i * (660 / (timelinePoints.length - 1));
                  const y = 140 - pt.ndvi * 135;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="5" fill="#070B14" stroke="#10B981" strokeWidth="2.5" />
                    </g>
                  );
                })}
              </svg>

              {/* X Axis dates */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "0.7rem",
                  color: "#64748B",
                  padding: "0 10px",
                }}
              >
                {timelinePoints.map((pt, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div>{pt.date}</div>
                    <div style={{ color: "#10B981", fontWeight: 700 }}>{pt.ndvi}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pixel Health Density Breakdown */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "4px" }}>
                {t("service.vegetationIndexLegend")}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: "16px" }}>
                {t("service.analyticsTitle")}
              </div>

              {/* Distribution bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                    <span style={{ color: "#34D399" }}>{t("service.healthyVegetation")} (&gt; 0.7)</span>
                    <span style={{ fontWeight: 700 }}>71%</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "71%", height: "100%", backgroundColor: "#10B981" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                    <span style={{ color: "#38BDF8" }}>{t("service.moderateVegetation")} (0.45 - 0.7)</span>
                    <span style={{ fontWeight: 700 }}>21%</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "21%", height: "100%", backgroundColor: "#38BDF8" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                    <span style={{ color: "#F59E0B" }}>{t("service.stressedVegetation")} (0.25 - 0.45)</span>
                    <span style={{ fontWeight: 700 }}>6%</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "6%", height: "100%", backgroundColor: "#F59E0B" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                    <span style={{ color: "#EF4444" }}>{t("service.bareSoil")} (&lt; 0.25)</span>
                    <span style={{ fontWeight: 700 }}>2%</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "2%", height: "100%", backgroundColor: "#EF4444" }} />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                fontSize: "0.74rem",
                color: "#A7F3D0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0, color: "#10B981" }} />
              <span>Optimal chlorophyll absorption. Nitrogen fertilization efficiency is steady.</span>
            </div>
          </div>
        </div>

        {/* Action button to return to top */}
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#94A3B8",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↑ {t("common.viewOnMap")}
          </button>
        </div>
      </div>
    </section>
  );
}
