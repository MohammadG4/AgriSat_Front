"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getLandsApi,
  getTriggeredAlertsApi,
  getLandSatelliteDataApi,
  getToken,
} from "@/lib/api";
import { Land, VegetationIndexSet } from "@/types/farm";
import { AlertNotification } from "@/types/alert";

import ServiceLeftNav from "@/components/service/ServiceLeftNav";
import UpdateLandModal from "@/components/service/UpdateLandModal";
import AlertScenarioTuneModal from "@/components/service/AlertScenarioTuneModal";
import GlobalAlertsModal from "@/components/service/GlobalAlertsModal";
import CropRegistrationModal from "@/components/service/CropRegistrationModal";
import FeatureDetailsPanel from "@/components/service/FeatureDetailsPanel";
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
        Loading High-Resolution Satellite &amp; NDVI Visualization...
      </div>
    ),
  }
);

export default function ServicePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);

  // Satellite Data & Overlay State
  const [hasSatelliteData, setHasSatelliteData] = useState<boolean>(false);
  const [overlayActive, setOverlayActive] = useState<boolean>(false);
  const [satelliteData, setSatelliteData] = useState<VegetationIndexSet[]>([]);
  const [isFeatureDetailsOpen, setIsFeatureDetailsOpen] = useState<boolean>(false);

  // Alerts State
  const [activeAlerts, setActiveAlerts] = useState<AlertNotification[]>([]);
  const [totalAlertsCount, setTotalAlertsCount] = useState<number>(0);

  // Modals State
  const [editingLand, setEditingLand] = useState<Land | null>(null);
  const [tuningLand, setTuningLand] = useState<Land | null>(null);
  const [showGlobalAlerts, setShowGlobalAlerts] = useState<boolean>(false);
  const [cropRegistrationLand, setCropRegistrationLand] = useState<Land | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auth Route Protection
  useEffect(() => {
    if (!isLoading && !user && !getToken()) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Fetch all user lands
  const fetchLands = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getLandsApi(token);
      setLands(data);

      // Check if newly created land was flagged from registration tab/page
      const lastCreatedId =
        typeof window !== "undefined"
          ? localStorage.getItem("agrisat_last_created_land_id")
          : null;

      if (lastCreatedId) {
        const found = data.find((l) => String(l.id) === lastCreatedId);
        if (found) {
          setSelectedLand(found);
          localStorage.removeItem("agrisat_last_created_land_id");
          setToastMessage(`Land "${found.name}" registered and selected.`);
          setTimeout(() => setToastMessage(null), 5000);
          return;
        }
      }

      // Default select the first land if none selected
      if (data.length > 0 && !selectedLand) {
        setSelectedLand(data[0]);
      }
    } catch (e) {
      console.warn("Could not fetch user lands:", e);
    }
  }, [selectedLand]);

  useEffect(() => {
    fetchLands();
  }, [user]);

  // Listen for window focus to refresh lands (e.g. after registering in new tab)
  useEffect(() => {
    const onWindowFocus = () => {
      fetchLands();
    };
    window.addEventListener("focus", onWindowFocus);
    return () => window.removeEventListener("focus", onWindowFocus);
  }, [fetchLands]);

  // When selectedLand changes: Fetch satellite data & triggered alerts
  useEffect(() => {
    if (!selectedLand) {
      setHasSatelliteData(false);
      setOverlayActive(false);
      setActiveAlerts([]);
      return;
    }

    const token = getToken();
    if (!token) return;

    // 1. Fetch satellite data: GET /api/v1/farms/lands/{land_id}/satellite-data
    getLandSatelliteDataApi(token, selectedLand.id, {
      skip: 0,
      limit: 50,
    })
      .then((satData) => {
        setSatelliteData(satData || []);
        if (!satData || satData.length === 0) {
          // If the request returns no data: deactivate the NDVI overlay button (false)
          setHasSatelliteData(false);
          setOverlayActive(false);
        } else {
          setHasSatelliteData(true);
          setOverlayActive(true);
        }
      })
      .catch(() => {
        setSatelliteData([]);
        setHasSatelliteData(false);
        setOverlayActive(false);
      });

    // 2. Fetch triggered alerts for this land: GET /api/v1/alerts/?land_id={land_id}
    getTriggeredAlertsApi(token, selectedLand.id)
      .then((alerts) => {
        setActiveAlerts(alerts || []);
      })
      .catch(() => {
        setActiveAlerts([]);
      });
  }, [selectedLand]);

  // Fetch total active alerts across all lands for the global alerts badge
  useEffect(() => {
    const token = getToken();
    if (!token || lands.length === 0) {
      setTotalAlertsCount(0);
      return;
    }

    Promise.all(
      lands.map((l) =>
        getTriggeredAlertsApi(token, l.id).catch(() => [])
      )
    ).then((results) => {
      const total = results.reduce((acc, curr) => acc + (curr?.length || 0), 0);
      setTotalAlertsCount(total);
    });
  }, [lands]);

  // Navigate to Dedicated Registration Page
  const handleOpenRegisterPage = () => {
    // Open in a new tab/page as requested: "Clicking +New must open a new tab/page"
    window.open("/service/register-land", "_blank");
  };

  // Land Options Success handler
  const handleLandUpdated = (updatedLand: Land) => {
    setEditingLand(null);
    setLands((prev) =>
      prev.map((l) => (l.id === updatedLand.id ? updatedLand : l))
    );
    if (selectedLand?.id === updatedLand.id) {
      setSelectedLand(updatedLand);
    }
    setToastMessage(`Land "${updatedLand.name}" updated successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleFeatureDetails = () => {
    setIsFeatureDetailsOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          document
            .getElementById("feature-details-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
      return next;
    });
  };

  if (isLoading || (!user && !getToken())) {
    return (
      <div
        style={{
          width: "100vw",
          height: "calc(100vh - 70px)",
          backgroundColor: "#070B12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#10B981",
          fontSize: "0.95rem",
        }}
      >
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="service-page-wrapper">
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

      {/* Main Map & Left Nav Section */}
      <div className="service-container">
        {/* 1. Left Navigation Sidebar */}
        <ServiceLeftNav
          lands={lands}
          selectedLand={selectedLand}
          onSelectLand={(land) => setSelectedLand(land)}
          onOpenOptionsModal={(land) => setEditingLand(land)}
          onOpenGlobalAlerts={() => setShowGlobalAlerts(true)}
          onNavigateToRegisterLand={handleOpenRegisterPage}
          onOpenCropRegistration={(land) => setCropRegistrationLand(land)}
          onToggleFeatureDetails={handleToggleFeatureDetails}
          isFeatureDetailsOpen={isFeatureDetailsOpen}
          activeAlerts={activeAlerts}
          totalAlertsCount={totalAlertsCount}
          isLoggedIn={!!user}
        />

        {/* 2. Read-Only Visuals Mapbox Viewport */}
        <MapboxServiceMap
          lands={lands}
          selectedLand={selectedLand}
          onSelectLand={(land) => setSelectedLand(land)}
          hasSatelliteData={hasSatelliteData}
          overlayActive={overlayActive}
          onToggleOverlay={() => setOverlayActive((prev) => !prev)}
        />
      </div>

      {/* 3. Feature Details UI Extension (Extends downward when NDVI feature is clicked) */}
      {isFeatureDetailsOpen && selectedLand && (
        <FeatureDetailsPanel
          land={selectedLand}
          satelliteData={satelliteData}
          onClose={() => setIsFeatureDetailsOpen(false)}
        />
      )}

      {/* 4. Land Details Options Modal */}
      {editingLand && (
        <UpdateLandModal
          land={editingLand}
          onClose={() => setEditingLand(null)}
          onSuccess={handleLandUpdated}
          onOpenTuneScenarios={(land) => {
            setEditingLand(null);
            setTuningLand(land);
          }}
        />
      )}

      {/* 5. Crop Registration Modal (Opened from ellipsis menu or history) */}
      {cropRegistrationLand && (
        <CropRegistrationModal
          landId={cropRegistrationLand.id}
          landName={cropRegistrationLand.name}
          onClose={() => setCropRegistrationLand(null)}
          onSuccess={(crop) => {
            setCropRegistrationLand(null);
            setToastMessage(`Crop "${crop.crop_name}" registered for land "${cropRegistrationLand.name}".`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* 6. Tune Alert Scenarios Modal */}
      {tuningLand && (
        <AlertScenarioTuneModal
          land={tuningLand}
          onClose={() => setTuningLand(null)}
        />
      )}

      {/* 7. Global Alerts Modal */}
      {showGlobalAlerts && (
        <GlobalAlertsModal
          lands={lands}
          selectedLand={selectedLand}
          onClose={() => setShowGlobalAlerts(false)}
          onNavigateToLand={(land) => setSelectedLand(land)}
        />
      )}
    </div>
  );
}
