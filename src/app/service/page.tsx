"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { getLandsApi, getTriggeredAlertsApi, getToken } from "@/lib/api";
import { GeoJsonPolygon, Land } from "@/types/farm";
import { AlertNotification } from "@/types/alert";

import ServiceLeftNav from "@/components/service/ServiceLeftNav";
import CreateLandModal from "@/components/service/CreateLandModal";
import AlertScenarioTuneModal from "@/components/service/AlertScenarioTuneModal";
import "@/components/service/service.css";

// Dynamic import with SSR disabled for Mapbox GL WebGL context
const MapboxServiceMap = dynamic(
  () => import("@/components/service/MapboxServiceMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="map-viewport"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070B12",
          color: "#64748B",
          fontSize: "0.95rem",
        }}
      >
        Initializing High-Resolution Satellite &amp; NDVI Engine...
      </div>
    ),
  }
);

export default function ServicePage() {
  const { user } = useAuth();
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertNotification[]>([]);
  const [drawnBoundary, setDrawnBoundary] = useState<GeoJsonPolygon | null>(null);
  const [tuningLand, setTuningLand] = useState<Land | null>(null);
  const [drawTrigger, setDrawTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch user lands
  const fetchLands = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getLandsApi(token);
      setLands(data);
      if (data.length > 0 && !selectedLand) {
        setSelectedLand(data[0]);
        // Also fetch any triggered alerts for this land
        try {
          const alerts = await getTriggeredAlertsApi(token, data[0].id);
          setActiveAlerts(alerts);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn("Could not fetch user lands:", e);
    }
  };

  useEffect(() => {
    fetchLands();
  }, [user]);

  // When selected land changes, fetch its triggered alerts
  useEffect(() => {
    if (!selectedLand) return;
    const token = getToken();
    if (!token) return;
    getTriggeredAlertsApi(token, selectedLand.id)
      .then((alerts) => setActiveAlerts(alerts))
      .catch(() => setActiveAlerts([]));
  }, [selectedLand]);

  // Triggered when user completes drawing a polygon in Mapbox
  const handlePolygonDrawn = (polygon: GeoJsonPolygon) => {
    setDrawnBoundary(polygon);
  };

  // Called after land is created & default scenarios are posted
  const handleLandCreated = (newLand: Land) => {
    setDrawnBoundary(null);
    setLands((prev) => [newLand, ...prev]);
    setSelectedLand(newLand);

    setToastMessage(
      `Land "${newLand.name}" registered successfully with automated NDVI scenarios!`
    );
    setTimeout(() => setToastMessage(null), 6000);

    // Prompt user with the Tune Scenarios modal as requested
    setTuningLand(newLand);
  };

  return (
    <div className="service-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#064E3B",
            border: "1px solid #10B981",
            color: "#ECFDF5",
            padding: "12px 24px",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
            zIndex: 999,
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <ServiceLeftNav
        lands={lands}
        selectedLand={selectedLand}
        onSelectLand={(land) => setSelectedLand(land)}
        onOpenTuneModal={(land) => setTuningLand(land)}
        onStartDraw={() => setDrawTrigger((prev) => prev + 1)}
        activeAlerts={activeAlerts}
        isLoggedIn={!!user}
      />

      {/* Main Mapbox Viewport */}
      <MapboxServiceMap
        lands={lands}
        selectedLand={selectedLand}
        onSelectLand={(land) => setSelectedLand(land)}
        onPolygonDrawn={handlePolygonDrawn}
        onOpenTuneModal={(land) => setTuningLand(land)}
        drawTrigger={drawTrigger}
      />

      {/* Land Creation Modal (Triggered by Mapbox Draw) */}
      {drawnBoundary && (
        <CreateLandModal
          boundary={drawnBoundary}
          onClose={() => setDrawnBoundary(null)}
          onSuccess={handleLandCreated}
        />
      )}

      {/* Tune Alert Scenarios Modal (Advanced Settings) */}
      {tuningLand && (
        <AlertScenarioTuneModal
          land={tuningLand}
          onClose={() => setTuningLand(null)}
        />
      )}
    </div>
  );
}
