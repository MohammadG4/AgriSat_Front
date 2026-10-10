"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Sliders,
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Activity,
  Layers,
  MapPin,
  Clock,
  X,
  RefreshCw,
  Info,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getLandByIdApi,
  getAlertScenariosApi,
  createAlertScenarioApi,
  updateAlertScenarioApi,
  bulkUpdateAlertScenariosApi,
  deleteAlertScenarioApi,
  getToken,
} from "@/lib/api";
import { Land } from "@/types/farm";
import {
  AlertScenario,
  ScenarioType,
  AlertSeverity,
  AlertScenarioCreatePayload,
  AlertScenarioUpdatePayload,
} from "@/types/alert";
import { formatAreaKm2 } from "@/components/service/geoUtils";
import Loader from "@/components/Loader";

function AlertOptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const landIdParam = searchParams.get("land_id");
  const landId = landIdParam ? parseInt(landIdParam, 10) : null;

  const { user, isLoading } = useAuth();
  const [land, setLand] = useState<Land | null>(null);
  const [scenarios, setScenarios] = useState<AlertScenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Card Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Add Scenario Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addType, setAddType] = useState<ScenarioType>("rapid_ndvi_drop");
  const [addName, setAddName] = useState<string>("");
  const [addDescription, setAddDescription] = useState<string>("");
  const [addSeverity, setAddSeverity] = useState<AlertSeverity>("high");
  // Default tunings: rapid_ndvi_drop: 15.0; spatial_anomaly: 15.0, 20.0
  const [addDropThreshold, setAddDropThreshold] = useState<number>(15.0);
  const [addAnomalyThreshold, setAddAnomalyThreshold] = useState<number>(15.0);
  const [addAreaThreshold, setAddAreaThreshold] = useState<number>(20.0);
  const [addSaving, setAddSaving] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit / Tune Scenario Modal State
  const [editingScenario, setEditingScenario] = useState<AlertScenario | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editSeverity, setEditSeverity] = useState<AlertSeverity>("high");
  const [editDropThreshold, setEditDropThreshold] = useState<number>(15.0);
  const [editAnomalyThreshold, setEditAnomalyThreshold] = useState<number>(15.0);
  const [editAreaThreshold, setEditAreaThreshold] = useState<number>(20.0);
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deletingScenario, setDeletingScenario] = useState<AlertScenario | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Route Protection
  useEffect(() => {
    if (!isLoading && !user && !getToken()) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Click outside listener for dropdown menus
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async () => {
    const token = getToken();
    if (!token || !landId) return;

    setLoading(true);
    try {
      const [landData, scenariosData] = await Promise.all([
        getLandByIdApi(token, landId),
        getAlertScenariosApi(token, landId),
      ]);
      setLand(landData);
      setScenarios(scenariosData);
    } catch (err: any) {
      console.error("Failed to load alert scenarios:", err);
      showToast(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [landId]);

  // Sync default name for Add modal whenever type or tunings change if user hasn't typed custom name
  useEffect(() => {
    if (showAddModal) {
      if (addType === "rapid_ndvi_drop") {
        setAddName(`Rapid NDVI Drop (Threshold: ${addDropThreshold}%)`);
        setAddDescription("Triggers an alert when field median NDVI drops abruptly compared to historical median.");
      } else {
        setAddName(`Spatial Patchy Anomaly (${addAnomalyThreshold}% over ${addAreaThreshold}% area)`);
        setAddDescription("Pixel-level detector identifying localized anomalies across the field.");
      }
    }
  }, [addType, addDropThreshold, addAnomalyThreshold, addAreaThreshold, showAddModal]);

  // Open Add Modal with fresh defaults
  const handleOpenAddModal = () => {
    setAddType("rapid_ndvi_drop");
    setAddDropThreshold(15.0);
    setAddAnomalyThreshold(15.0);
    setAddAreaThreshold(20.0);
    setAddSeverity("high");
    setAddError(null);
    setAddName("Rapid NDVI Drop (Threshold: 15%)");
    setAddDescription("Triggers an alert when field median NDVI drops abruptly compared to historical median.");
    setShowAddModal(true);
  };

  // Create Scenario Handler
  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !landId) return;

    setAddSaving(true);
    setAddError(null);

    const params =
      addType === "rapid_ndvi_drop"
        ? { drop_threshold: Number(addDropThreshold) }
        : {
            anomaly_threshold_percent: Number(addAnomalyThreshold),
            area_threshold_percent: Number(addAreaThreshold),
          };

    const payload: AlertScenarioCreatePayload = {
      name: addName.trim(),
      description: addDescription.trim() || undefined,
      scenario_type: addType,
      land_id: landId,
      parameters: params,
      severity: addSeverity,
      is_active: true,
    };

    try {
      await createAlertScenarioApi(token, payload);
      setShowAddModal(false);
      showToast("Alert scenario created successfully!");
      await loadData();
    } catch (err: any) {
      setAddError(err.message || "Failed to create scenario.");
    } finally {
      setAddSaving(false);
    }
  };

  // Open Edit Modal for a specific scenario
  const handleOpenEditModal = (sc: AlertScenario) => {
    setActiveMenuId(null);
    setEditingScenario(sc);
    setEditName(sc.name);
    setEditDescription(sc.description || "");
    setEditSeverity(sc.severity);
    setEditError(null);

    if (sc.scenario_type === "rapid_ndvi_drop") {
      setEditDropThreshold(sc.parameters?.drop_threshold ?? 15.0);
    } else {
      setEditAnomalyThreshold(sc.parameters?.anomaly_threshold_percent ?? 15.0);
      setEditAreaThreshold(sc.parameters?.area_threshold_percent ?? 20.0);
    }
  };

  // Save Edited Scenario Handler
  const handleSaveEditedScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScenario) return;
    const token = getToken();
    if (!token) return;

    setEditSaving(true);
    setEditError(null);

    const params =
      editingScenario.scenario_type === "rapid_ndvi_drop"
        ? { drop_threshold: Number(editDropThreshold) }
        : {
            anomaly_threshold_percent: Number(editAnomalyThreshold),
            area_threshold_percent: Number(editAreaThreshold),
          };

    const payload: AlertScenarioUpdatePayload = {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      severity: editSeverity,
      parameters: params,
    };

    try {
      await updateAlertScenarioApi(token, editingScenario.id, payload);
      setEditingScenario(null);
      showToast("Scenario parameters updated successfully!");
      await loadData();
    } catch (err: any) {
      setEditError(err.message || "Failed to update scenario.");
    } finally {
      setEditSaving(false);
    }
  };

  // Toggle Single Scenario Active State
  const handleToggleScenario = async (sc: AlertScenario) => {
    const token = getToken();
    if (!token) return;

    const newStatus = !sc.is_active;

    // Optimistic update
    setScenarios((prev) =>
      prev.map((item) =>
        item.id === sc.id ? { ...item, is_active: newStatus } : item
      )
    );

    try {
      await updateAlertScenarioApi(token, sc.id, { is_active: newStatus });
      showToast(
        `Scenario "${sc.name}" ${newStatus ? "activated" : "deactivated"}.`
      );
    } catch (err: any) {
      // Revert optimistic update
      setScenarios((prev) =>
        prev.map((item) =>
          item.id === sc.id ? { ...item, is_active: sc.is_active } : item
        )
      );
      showToast(err.message || "Failed to update scenario status.");
    }
  };

  // Bulk Activate/Deactivate
  const handleBulkUpdate = async (isActive: boolean) => {
    const token = getToken();
    if (!token || !landId) return;

    setBulkLoading(true);
    try {
      await bulkUpdateAlertScenariosApi(token, landId, isActive);
      showToast(
        `All alert scenarios successfully ${
          isActive ? "activated" : "deactivated"
        }!`
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to bulk update scenarios.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Delete Scenario Handler
  const handleDeleteScenario = async () => {
    if (!deletingScenario) return;
    const token = getToken();
    if (!token) return;

    setDeleteLoading(true);
    try {
      await deleteAlertScenarioApi(token, deletingScenario.id);
      showToast(`Scenario "${deletingScenario.name}" was permanently removed.`);
      setDeletingScenario(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete scenario.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading || (!user && !getToken())) {
    return <Loader fullPage size="lg" message="Authenticating session..." />;
  }

  const activeCount = scenarios.filter((s) => s.is_active).length;

  return (
    <main
      style={{
        minHeight: "calc(100vh - 70px)",
        backgroundColor: "#070B12",
        color: "#F8FAFC",
        padding: "36px 24px 60px 24px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              top: "84px",
              right: "24px",
              zIndex: 100,
              backgroundColor: "rgba(16, 185, 129, 0.95)",
              color: "#070B12",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backdropFilter: "blur(8px)",
            }}
          >
            <CheckCircle size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Breadcrumb Navigation & Back Link */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/lands"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#94A3B8",
                fontSize: "0.88rem",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                transition: "all 0.2s ease",
              }}
            >
              <ArrowLeft size={16} /> Back to Directory
            </Link>

            {land && (
              <Link
                href={`/lands/landdetails?land_id=${land.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#10B981",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                View Land Details
              </Link>
            )}
          </div>

          <div
            style={{
              fontSize: "0.78rem",
              color: "#64748B",
              fontFamily: "var(--font-mono)",
            }}
          >
            LAND ID: #{landId || "--"}
          </div>
        </div>

        {/* Header Block with Land Info */}
        <div
          style={{
            backgroundColor: "#0D1322",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "24px 28px",
            marginBottom: "28px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sliders size={20} />
              </div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#F8FAFC",
                }}
              >
                Alert Options &amp; Telemetry Scenarios
              </h1>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                flexWrap: "wrap",
                marginTop: "10px",
                color: "#94A3B8",
                fontSize: "0.88rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={15} style={{ color: "#10B981" }} />
                <span style={{ fontWeight: 700, color: "#E2E8F0" }}>
                  {land?.name || "Loading parcel..."}
                </span>
              </div>

              {land?.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={15} style={{ color: "#64748B" }} />
                  <span>{land.location}</span>
                </div>
              )}

              {land?.area_hectares !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "#10B981",
                      fontWeight: 600,
                    }}
                  >
                    Area: {formatAreaKm2(land.area_hectares)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ textAlign: "center", paddingRight: "12px", borderRight: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10B981" }}>
                {scenarios.length}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase" }}>
                Total Scenarios
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: activeCount > 0 ? "#10B981" : "#94A3B8" }}>
                {activeCount}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase" }}>
                Active Rules
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar: Bulk PUT Actions + Add Scenario Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Bulk Activate Button */}
            <button
              type="button"
              disabled={bulkLoading || scenarios.length === 0}
              onClick={() => handleBulkUpdate(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: bulkLoading || scenarios.length === 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: bulkLoading || scenarios.length === 0 ? 0.5 : 1,
              }}
            >
              <Power size={16} /> Activate all
            </button>

            {/* Bulk Deactivate Button */}
            <button
              type="button"
              disabled={bulkLoading || scenarios.length === 0}
              onClick={() => handleBulkUpdate(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#FCA5A5",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: bulkLoading || scenarios.length === 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: bulkLoading || scenarios.length === 0 ? 0.5 : 1,
              }}
            >
              <PowerOff size={16} /> Deactivate all
            </button>
          </div>

          {/* Add Alert Scenario Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 22px",
              fontSize: "0.9rem",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
            }}
          >
            <Plus size={18} /> Add Scenario
          </button>
        </div>

        {/* Content Body: Loading / Empty / Horizontal Cards */}
        {loading ? (
          <div
            style={{
              padding: "60px 0",
              textAlign: "center",
              color: "#94A3B8",
              backgroundColor: "rgba(13, 19, 34, 0.6)",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <RefreshCw
              size={28}
              className="spin-animation"
              style={{ margin: "0 auto 12px auto", color: "#10B981" }}
            />
            <p style={{ fontSize: "0.95rem" }}>Loading alert scenarios...</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div
            style={{
              backgroundColor: "rgba(13, 19, 34, 0.6)",
              border: "1px dashed rgba(255, 255, 255, 0.14)",
              borderRadius: "16px",
              padding: "50px 30px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <Activity size={28} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>
              No alert scenarios configured yet
            </h3>
            <p
              style={{
                color: "#94A3B8",
                fontSize: "0.9rem",
                maxWidth: "460px",
                margin: "0 auto 24px auto",
                lineHeight: 1.5,
              }}
            >
              Create automated satellite telemetry rules to monitor vegetation
              index drops or localized anomalies across this parcel.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <Plus size={16} /> Add Your First Scenario
            </button>
          </div>
        ) : (
          /* Horizontal Cards Container */
          <div
            ref={menuContainerRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {scenarios.map((sc) => {
              const isRapid = sc.scenario_type === "rapid_ndvi_drop";

              return (
                <div
                  key={sc.id}
                  style={{
                    backgroundColor: "#0D1322",
                    border: sc.is_active
                      ? "1px solid rgba(16, 185, 129, 0.25)"
                      : "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "20px",
                    flexWrap: "wrap",
                    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
                    transition: "all 0.2s ease",
                    position: "relative",
                  }}
                >
                  {/* Left Column: Icon + Scenario Info */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "16px",
                      flex: "1 1 500px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        backgroundColor: isRapid
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(168, 85, 247, 0.15)",
                        color: isRapid ? "#60A5FA" : "#C084FC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {isRapid ? <Activity size={22} /> : <AlertTriangle size={22} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            color: "#F8FAFC",
                          }}
                        >
                          {sc.name}
                        </span>

                        {/* Scenario Type Badge */}
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: isRapid
                              ? "rgba(59, 130, 246, 0.12)"
                              : "rgba(168, 85, 247, 0.12)",
                            color: isRapid ? "#93C5FD" : "#D8B4FE",
                            border: `1px solid ${
                              isRapid ? "rgba(59, 130, 246, 0.3)" : "rgba(168, 85, 247, 0.3)"
                            }`,
                            textTransform: "uppercase",
                          }}
                        >
                          {isRapid ? "Rapid NDVI Drop" : "Spatial Anomaly"}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`badge ${
                            sc.severity === "critical"
                              ? "badge-danger"
                              : sc.severity === "high"
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                          style={{
                            textTransform: "uppercase",
                            fontSize: "0.68rem",
                            padding: "2px 7px",
                          }}
                        >
                          {sc.severity}
                        </span>

                        {/* Active/Inactive Status Badge */}
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            backgroundColor: sc.is_active
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(148, 163, 184, 0.12)",
                            color: sc.is_active ? "#10B981" : "#94A3B8",
                            border: `1px solid ${
                              sc.is_active
                                ? "rgba(16, 185, 129, 0.35)"
                                : "rgba(148, 163, 184, 0.2)"
                            }`,
                          }}
                        >
                          {sc.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      {sc.description && (
                        <p
                          style={{
                            fontSize: "0.84rem",
                            color: "#94A3B8",
                            marginBottom: "10px",
                            lineHeight: 1.4,
                          }}
                        >
                          {sc.description}
                        </p>
                      )}

                      {/* Parameters Summary Badges */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        {isRapid && sc.parameters?.drop_threshold !== undefined && (
                          <div
                            style={{
                              backgroundColor: "rgba(0, 0, 0, 0.35)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "0.78rem",
                              fontFamily: "var(--font-mono)",
                              color: "#60A5FA",
                            }}
                          >
                            Drop Threshold:{" "}
                            <span style={{ color: "#F8FAFC", fontWeight: 700 }}>
                              {sc.parameters.drop_threshold}%
                            </span>
                          </div>
                        )}

                        {!isRapid && (
                          <>
                            {sc.parameters?.anomaly_threshold_percent !== undefined && (
                              <div
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.35)",
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  fontSize: "0.78rem",
                                  fontFamily: "var(--font-mono)",
                                  color: "#C084FC",
                                }}
                              >
                                Pixel Drop:{" "}
                                <span style={{ color: "#F8FAFC", fontWeight: 700 }}>
                                  {sc.parameters.anomaly_threshold_percent}%
                                </span>
                              </div>
                            )}
                            {sc.parameters?.area_threshold_percent !== undefined && (
                              <div
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.35)",
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  fontSize: "0.78rem",
                                  fontFamily: "var(--font-mono)",
                                  color: "#C084FC",
                                }}
                              >
                                Area Extent:{" "}
                                <span style={{ color: "#F8FAFC", fontWeight: 700 }}>
                                  {sc.parameters.area_threshold_percent}%
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        <span
                          style={{
                            fontSize: "0.74rem",
                            color: "#64748B",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Clock size={13} />
                          Updated: {new Date(sc.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Toggle Switch & Ellipsis Dropdown */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {/* Toggle Switch */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: sc.is_active ? "#10B981" : "#64748B",
                        }}
                      >
                        {sc.is_active ? "Enabled" : "Disabled"}
                      </span>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={sc.is_active}
                        onClick={() => handleToggleScenario(sc)}
                        title={sc.is_active ? "Deactivate Scenario" : "Activate Scenario"}
                        style={{
                          width: "48px",
                          height: "26px",
                          borderRadius: "13px",
                          backgroundColor: sc.is_active
                            ? "#10B981"
                            : "rgba(255, 255, 255, 0.15)",
                          border: `1px solid ${
                            sc.is_active ? "#059669" : "rgba(255, 255, 255, 0.25)"
                          }`,
                          position: "relative",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          padding: "2px",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "#FFFFFF",
                            transform: sc.is_active
                              ? "translateX(22px)"
                              : "translateX(0px)",
                            transition: "transform 0.25s ease",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                          }}
                        />
                      </button>
                    </div>

                    {/* Vertical Ellipsis Menu */}
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === sc.id ? null : sc.id);
                        }}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor:
                            activeMenuId === sc.id
                              ? "rgba(255, 255, 255, 0.1)"
                              : "transparent",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "#94A3B8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === sc.id && (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "42px",
                            width: "160px",
                            backgroundColor: "#162032",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "10px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
                            padding: "6px",
                            zIndex: 40,
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(sc)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              color: "#F8FAFC",
                              textAlign: "left",
                              width: "100%",
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(255, 255, 255, 0.08)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                          >
                            <Edit2 size={14} style={{ color: "#10B981" }} />
                            <span>Edit / Tune</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeletingScenario(sc);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              color: "#FCA5A5",
                              textAlign: "left",
                              width: "100%",
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(239, 68, 68, 0.12)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                          >
                            <Trash2 size={14} style={{ color: "#EF4444" }} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: ADD ALERT SCENARIO */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content-box" style={{ maxWidth: "600px" }}>
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
                    <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                      Add Alert Scenario
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748B" }}>
                      Configure automated telemetry thresholds for {land?.name}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ color: "#94A3B8" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {addError && (
                  <div className="alert-box error" style={{ marginBottom: "16px" }}>
                    <AlertTriangle size={16} />
                    <span>{addError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateScenario}>
                  {/* Select Algorithm Type */}
                  <div className="form-group">
                    <label className="form-label">Algorithm Type</label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setAddType("rapid_ndvi_drop");
                          setAddDropThreshold(15.0);
                        }}
                        className={`btn ${
                          addType === "rapid_ndvi_drop"
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                        style={{ fontSize: "0.85rem", padding: "10px" }}
                      >
                        Rapid NDVI Drop
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddType("spatial_anomaly");
                          setAddAnomalyThreshold(15.0);
                          setAddAreaThreshold(20.0);
                        }}
                        className={`btn ${
                          addType === "spatial_anomaly"
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                        style={{ fontSize: "0.85rem", padding: "10px" }}
                      >
                        Spatial Anomaly
                      </button>
                    </div>
                  </div>

                  {/* Parameter Tuning Inputs */}
                  {addType === "rapid_ndvi_drop" ? (
                    <div
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        marginBottom: "16px",
                      }}
                    >
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            NDVI Drop Threshold (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="70"
                            step="0.5"
                            value={addDropThreshold}
                            onChange={(e) =>
                              setAddDropThreshold(parseFloat(e.target.value) || 0)
                            }
                            style={{
                              width: "70px",
                              padding: "4px 8px",
                              fontSize: "0.85rem",
                              backgroundColor: "#0B0F19",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              color: "#10B981",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="1"
                          value={addDropThreshold}
                          onChange={(e) =>
                            setAddDropThreshold(parseFloat(e.target.value))
                          }
                          style={{ width: "100%", accentColor: "#10B981" }}
                        />
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748B",
                            marginTop: "6px",
                          }}
                        >
                          Default: 15.0%. Triggers if overall field vegetation
                          drops by &gt; {addDropThreshold}% between satellite
                          passes.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        marginBottom: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            Pixel Anomaly Drop Threshold (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="70"
                            step="0.5"
                            value={addAnomalyThreshold}
                            onChange={(e) =>
                              setAddAnomalyThreshold(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            style={{
                              width: "70px",
                              padding: "4px 8px",
                              fontSize: "0.85rem",
                              backgroundColor: "#0B0F19",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              color: "#C084FC",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="1"
                          value={addAnomalyThreshold}
                          onChange={(e) =>
                            setAddAnomalyThreshold(parseFloat(e.target.value))
                          }
                          style={{ width: "100%", accentColor: "#C084FC" }}
                        />
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748B",
                            marginTop: "6px",
                          }}
                        >
                          Default: 15.0%. Individual pixel drop deviation.
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            Minimum Affected Area (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="80"
                            step="0.5"
                            value={addAreaThreshold}
                            onChange={(e) =>
                              setAddAreaThreshold(parseFloat(e.target.value) || 0)
                            }
                            style={{
                              width: "70px",
                              padding: "4px 8px",
                              fontSize: "0.85rem",
                              backgroundColor: "#0B0F19",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              color: "#C084FC",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="60"
                          step="1"
                          value={addAreaThreshold}
                          onChange={(e) =>
                            setAddAreaThreshold(parseFloat(e.target.value))
                          }
                          style={{ width: "100%", accentColor: "#C084FC" }}
                        />
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748B",
                            marginTop: "6px",
                          }}
                        >
                          Default: 20.0%. Minimum parcel surface area affected.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Name and Severity */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">Scenario Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Severity Level</label>
                      <select
                        className="form-input"
                        value={addSeverity}
                        onChange={(e) =>
                          setAddSeverity(e.target.value as AlertSeverity)
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                    />
                  </div>

                  {/* Submit / Cancel */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAddModal(false)}
                      disabled={addSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={addSaving}
                    >
                      {addSaving ? "Creating..." : "Save & Activate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT / PARAMETER TUNING */}
        {editingScenario && (
          <div className="modal-overlay">
            <div className="modal-content-box" style={{ maxWidth: "600px" }}>
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
                    <Edit2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                      Edit Parameter Tunings
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748B" }}>
                      Adjust detection sensitivity for #{editingScenario.id}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingScenario(null)}
                  style={{ color: "#94A3B8" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {editError && (
                  <div className="alert-box error" style={{ marginBottom: "16px" }}>
                    <AlertTriangle size={16} />
                    <span>{editError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveEditedScenario}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Scenario Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Severity Level</label>
                      <select
                        className="form-input"
                        value={editSeverity}
                        onChange={(e) =>
                          setEditSeverity(e.target.value as AlertSeverity)
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>

                  {/* Tunable Parameter Sliders */}
                  {editingScenario.scenario_type === "rapid_ndvi_drop" ? (
                    <div
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        marginBottom: "16px",
                      }}
                    >
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            Drop Threshold (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="70"
                            step="0.5"
                            value={editDropThreshold}
                            onChange={(e) =>
                              setEditDropThreshold(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            style={{
                              width: "70px",
                              padding: "4px 8px",
                              fontSize: "0.85rem",
                              backgroundColor: "#0B0F19",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              color: "#10B981",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="1"
                          value={editDropThreshold}
                          onChange={(e) =>
                            setEditDropThreshold(parseFloat(e.target.value))
                          }
                          style={{ width: "100%", accentColor: "#10B981" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        marginBottom: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            Pixel Anomaly Drop Threshold (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="70"
                            step="0.5"
                            value={editAnomalyThreshold}
                            onChange={(e) =>
                              setEditAnomalyThreshold(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            style={{
                              width: "70px",
                              padding: "4px 8px",
                              fontSize: "0.85rem",
                              backgroundColor: "#0B0F19",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              color: "#C084FC",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="1"
                          value={editAnomalyThreshold}
                          onChange={(e) =>
                            setEditAnomalyThreshold(parseFloat(e.target.value))
                          }
                          style={{ width: "100%", accentColor: "#C084FC" }}
                        />
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            Minimum Affected Area (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="80"
                            step="0.5"
                            value={editAreaThreshold}
                            onChange={(e) =>
                              setEditAreaThreshold(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            style={{
                              width: "70px",
                              padding: "4px 8px",
                              fontSize: "0.85rem",
                              backgroundColor: "#0B0F19",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              color: "#C084FC",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="60"
                          step="1"
                          value={editAreaThreshold}
                          onChange={(e) =>
                            setEditAreaThreshold(parseFloat(e.target.value))
                          }
                          style={{ width: "100%", accentColor: "#C084FC" }}
                        />
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingScenario(null)}
                      disabled={editSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={editSaving}
                    >
                      {editSaving ? "Saving..." : "Save Tuned Parameters"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DELETE SCENARIO CONFIRMATION */}
        {deletingScenario && (
          <div className="modal-overlay">
            <div className="modal-content-box" style={{ maxWidth: "460px" }}>
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#EF4444",
                    }}
                  >
                    <Trash2 size={18} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                    Confirm Deletion
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingScenario(null)}
                  style={{ color: "#94A3B8" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p
                  style={{
                    color: "#E2E8F0",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                    marginBottom: "16px",
                  }}
                >
                  Are you sure you want to permanently delete the scenario{" "}
                  <strong style={{ color: "#FCA5A5" }}>
                    &quot;{deletingScenario.name}&quot;
                  </strong>
                  ? This will cease anomaly detection and alert notifications for
                  this rule.
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDeletingScenario(null)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteScenario}
                    disabled={deleteLoading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {deleteLoading ? "Deleting..." : "Delete Scenario"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AlertOptionsPage() {
  return (
    <Suspense fallback={<Loader fullPage size="lg" message="Loading Alert Configuration..." />}>
      <AlertOptionsContent />
    </Suspense>
  );
}
