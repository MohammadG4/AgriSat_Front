"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  ArrowLeft,
  Calendar,
  Layers,
  Sprout,
  Plus,
  Sliders,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Lock,
  MoreVertical,
  X,
  Clock,
  Compass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  getLandByIdApi,
  getLandCropsApi,
  updateLandApi,
  deleteLandApi,
  deleteCropFromLandApi,
  getToken,
} from "@/lib/api";
import { Land, CropOnLand } from "@/types/farm";
import { formatAreaKm2 } from "@/components/service/geoUtils";
import CropRegistrationModal from "@/components/service/CropRegistrationModal";
import Loader from "@/components/Loader";

function LandDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const landIdParam = searchParams.get("land_id");
  const landId = landIdParam ? parseInt(landIdParam, 10) : null;

  const { user, isLoading } = useAuth();
  const { t, locale, isRTL } = useLanguage();
  const [land, setLand] = useState<Land | null>(null);
  const [crops, setCrops] = useState<CropOnLand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Land General Info State
  const [isEditingLand, setIsEditingLand] = useState<boolean>(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSoilType, setEditSoilType] = useState("");
  const [editIrrigationType, setEditIrrigationType] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingLand, setSavingLand] = useState(false);

  // Delete Land Confirmation Modal State
  const [showDeleteLandModal, setShowDeleteLandModal] = useState(false);
  const [deletingLand, setDeletingLand] = useState(false);

  // Crop Modal States
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedCropToEdit, setSelectedCropToEdit] = useState<CropOnLand | null>(null);
  const [cropToDelete, setCropToDelete] = useState<CropOnLand | null>(null);
  const [deletingCrop, setDeletingCrop] = useState(false);

  // Crop card ellipsis menu state
  const [activeCropMenuId, setActiveCropMenuId] = useState<number | null>(null);
  const cropMenuRef = useRef<HTMLDivElement>(null);

  // Route Protection (Requirement 2)
  useEffect(() => {
    if (!isLoading && !user && !getToken()) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Click outside crop dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (cropMenuRef.current && !cropMenuRef.current.contains(e.target as Node)) {
        setActiveCropMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const loadData = async () => {
    const token = getToken();
    if (!token || !landId) return;

    setLoading(true);
    try {
      const [landData, cropsData] = await Promise.all([
        getLandByIdApi(token, landId),
        getLandCropsApi(token, landId),
      ]);
      setLand(landData);
      setCrops(cropsData);

      // Populate edit states
      setEditName(landData.name);
      setEditLocation(landData.location || "");
      setEditSoilType(landData.soil_type || "Clay");
      setEditIrrigationType(landData.irrigation_type || "Drip");
      setEditNotes(landData.notes || "");
    } catch (err: any) {
      console.error("Failed to load land details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (landId) {
      loadData();
    }
  }, [landId]);

  // Handle Land Update Submit
  const handleSaveLandEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!land) return;
    const token = getToken();
    if (!token) return;

    setSavingLand(true);
    try {
      const updated = await updateLandApi(token, land.id, {
        name: editName.trim(),
        location: editLocation.trim() || undefined,
        soil_type: editSoilType || undefined,
        irrigation_type: editIrrigationType || undefined,
        notes: editNotes.trim() || undefined,
      });
      setLand(updated);
      setIsEditingLand(false);
      setToastMessage("Land details updated successfully.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(err.message || "Failed to update land.");
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSavingLand(false);
    }
  };

  // Handle Land Delete Submit
  const handleConfirmDeleteLand = async () => {
    if (!land) return;
    const token = getToken();
    if (!token) return;

    setDeletingLand(true);
    try {
      await deleteLandApi(token, land.id);
      router.push("/lands");
    } catch (err: any) {
      setToastMessage(err.message || "Failed to delete land.");
      setDeletingLand(false);
      setShowDeleteLandModal(false);
    }
  };

  // Handle Crop Delete
  const handleConfirmDeleteCrop = async () => {
    if (!cropToDelete || !land) return;
    const token = getToken();
    if (!token) return;

    setDeletingCrop(true);
    try {
      await deleteCropFromLandApi(token, land.id, cropToDelete.instance_id);
      setCrops((prev) => prev.filter((c) => c.instance_id !== cropToDelete.instance_id));
      setCropToDelete(null);
      setToastMessage(`Crop record deleted successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(err.message || "Failed to delete crop record.");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setDeletingCrop(false);
    }
  };

  if (isLoading || (!user && !getToken())) {
    return <Loader fullPage size="lg" message="Authenticating session..." />;
  }

  if (!landId) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "#F8FAFC", backgroundColor: "#070B12", minHeight: "calc(100vh - 70px)" }}>
        <p>No land ID specified in URL.</p>
        <Link href="/lands" className="btn btn-primary" style={{ marginTop: "12px" }}>
          Return to Your Lands
        </Link>
      </div>
    );
  }

  if (loading && !land) {
    return <Loader fullPage size="lg" message="Loading parcel intelligence & crop records..." />;
  }

  if (!land) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "#EF4444", backgroundColor: "#070B12", minHeight: "calc(100vh - 70px)" }}>
        <p>Land not found or unauthorized.</p>
        <Link href="/lands" className="btn btn-secondary" style={{ marginTop: "12px" }}>
          Return to Lands Directory
        </Link>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 70px)",
        backgroundColor: "#070B12",
        color: "#F8FAFC",
        padding: "36px 24px 60px 24px",
      }}
    >
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

      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        {/* Navigation Breadcrumb & Back */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/lands")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#CBD5E1",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} className="icon-flip" />
            <span>{t("landDetails.backToLands")}</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href={`/lands/AlertOptions?land_id=${land.id}`}
              className="btn btn-secondary"
              style={{
                fontSize: "0.84rem",
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Sliders size={15} style={{ color: "#F59E0B" }} />
              <span>{t("alertOptions.title")}</span>
            </Link>

            <Link
              href="/service"
              className="btn btn-secondary"
              style={{
                fontSize: "0.84rem",
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Compass size={15} style={{ color: "#38BDF8" }} />
              <span>{t("common.viewOnMap")}</span>
            </Link>
          </div>
        </div>

        {/* 5.1 & 5.2 General Info & Edit/Delete Controls Card */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "28px",
            marginBottom: "36px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "20px",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(16, 185, 129, 0.16)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10B981",
                }}
              >
                <MapPin size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0 }}>
                    {land.name}
                  </h1>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: "#94A3B8",
                      fontWeight: 700,
                    }}
                  >
                    ID: #{land.id}
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8", marginTop: "4px" }}>
                  {land.location || "Egypt Basin"} &bull; {t("common.date")}:{" "}
                  {new Date(land.created_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                </div>
              </div>
            </div>

            {/* Edit / Delete Controls */}
            {!isEditingLand ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditingLand(true)}
                  className="btn btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.84rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <Edit2 size={15} />
                  <span>{t("landDetails.editLandBtn")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteLandModal(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#FCA5A5",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.12)")}
                >
                  <Trash2 size={15} />
                  <span>{t("landDetails.deleteLandBtn")}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingLand(false);
                    // Reset fields
                    setEditName(land.name);
                    setEditLocation(land.location || "");
                    setEditSoilType(land.soil_type || "Clay");
                    setEditIrrigationType(land.irrigation_type || "Drip");
                    setEditNotes(land.notes || "");
                  }}
                  className="btn btn-secondary"
                  disabled={savingLand}
                  style={{ padding: "8px 16px", fontSize: "0.84rem" }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveLandEdits}
                  className="btn btn-primary"
                  disabled={savingLand}
                  style={{
                    padding: "8px 20px",
                    fontSize: "0.84rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <CheckCircle size={15} />
                  <span>{savingLand ? t("common.saving") : t("landDetails.saveChanges")}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form / Field Display Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Editable Field: Land Name */}
            <div>
              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                {t("modals.parcelNameLabel")}
              </label>
              {isEditingLand ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid #10B981",
                    color: "#F8FAFC",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              ) : (
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#F8FAFC" }}>{land.name}</div>
              )}
            </div>

            {/* Editable Field: Location */}
            <div>
              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                {t("modals.locationLabel")}
              </label>
              {isEditingLand ? (
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Kafr El-Sheikh, Delta"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              ) : (
                <div style={{ fontSize: "0.95rem", color: "#E2E8F0" }}>{land.location || "N/A"}</div>
              )}
            </div>

            {/* STRICTLY UNEDITABLE: Land Area in km2 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  {t("landDetails.area")} ({t("common.km2")})
                </span>
                <Lock size={12} style={{ color: "#F59E0B" }} />
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10B981" }}>
                {land.area_hectares != null ? formatAreaKm2(land.area_hectares) : t("common.calculatedPolygon")}
              </div>
              <span style={{ fontSize: "0.68rem", color: "#64748B" }}>{t("common.calculatedPolygon")}</span>
            </div>

            {/* STRICTLY UNEDITABLE: System Creation Date & ID */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  {t("common.date")}
                </span>
                <Lock size={12} style={{ color: "#F59E0B" }} />
              </div>
              <div style={{ fontSize: "0.95rem", color: "#CBD5E1" }}>
                {new Date(land.created_date).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
              </div>
              <span style={{ fontSize: "0.68rem", color: "#64748B" }}>Immutable system log</span>
            </div>

            {/* Editable Field: Soil Type */}
            <div>
              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                {t("common.soilType")}
              </label>
              {isEditingLand ? (
                <select
                  value={editSoilType}
                  onChange={(e) => setEditSoilType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                >
                  <option value="Clay">{t("common.clay")}</option>
                  <option value="Sandy">{t("common.sandy")}</option>
                  <option value="Loam">{t("common.loam")}</option>
                  <option value="Calcareous">Calcareous</option>
                  <option value="Saline">Saline Soil</option>
                </select>
              ) : (
                <div style={{ fontSize: "0.95rem", color: "#E2E8F0" }}>{land.soil_type || "Standard"}</div>
              )}
            </div>

            {/* Editable Field: Irrigation Type */}
            <div>
              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                {t("common.irrigationType")}
              </label>
              {isEditingLand ? (
                <select
                  value={editIrrigationType}
                  onChange={(e) => setEditIrrigationType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                >
                  <option value="Drip">{t("common.drip")}</option>
                  <option value="Center Pivot">{t("common.centerPivot")}</option>
                  <option value="Flood / Surface">{t("common.flood")}</option>
                  <option value="Sub-surface">{t("common.subSurface")}</option>
                </select>
              ) : (
                <div style={{ fontSize: "0.95rem", color: "#E2E8F0" }}>{land.irrigation_type || "Drip"}</div>
              )}
            </div>
          </div>
        </div>

        {/* 5.3 Registered Crop History Section */}
        <section style={{ marginTop: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10B981",
                  }}
                >
                  <Sprout size={20} />
                </div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                  {t("landDetails.cropsHeader")}
                </h2>
                <span
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    color: "#94A3B8",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {crops.length}
                </span>
              </div>
            </div>

            {/* "Register a new crop for the land" Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedCropToEdit(null);
                setShowCropModal(true);
              }}
              className="btn btn-primary"
              style={{
                fontSize: "0.85rem",
                padding: "9px 18px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Plus size={16} />
              <span>{t("landDetails.registerCropBtn")}</span>
            </button>
          </div>

          {/* Chronological Crop Card List */}
          {crops.length === 0 ? (
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                border: "1px dashed rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <Sprout size={32} style={{ color: "#64748B", margin: "0 auto 12px auto" }} />
              <div style={{ fontWeight: 700, color: "#E2E8F0", fontSize: "1rem" }}>
                {t("landDetails.noCrops")}
              </div>
              <p style={{ color: "#94A3B8", fontSize: "0.82rem", maxWidth: "420px", margin: "6px auto 18px auto" }}>
                Track seasonal yields, planting dates, and growth stages.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCropToEdit(null);
                  setShowCropModal(true);
                }}
                className="btn btn-secondary"
                style={{ fontSize: "0.84rem", padding: "8px 18px" }}
              >
                <Plus size={15} />
                <span>{t("landDetails.addFirstCrop")}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {crops.map((crop) => {
                const isGrowing =
                  crop.status === "growing/in_ground" ||
                  crop.status === "growing" ||
                  (!crop.actual_harvest_date && !!crop.expected_harvest_date) ||
                  !crop.harvest_date;

                return (
                  <div
                    key={crop.instance_id}
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "18px 22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "16px",
                      position: "relative",
                    }}
                  >
                    {/* Left: Crop Identity & Status */}
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "220px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          backgroundColor: isGrowing ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.12)",
                          border: `1px solid ${isGrowing ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isGrowing ? "#10B981" : "#F59E0B",
                        }}
                      >
                        <Sprout size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#F8FAFC" }}>
                            {crop.crop_name}
                          </h4>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: "6px",
                              backgroundColor: isGrowing ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.2)",
                              color: isGrowing ? "#34D399" : "#94A3B8",
                              border: `1px solid ${isGrowing ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                            }}
                          >
                            {isGrowing ? "In Ground (Growing)" : "Harvested"}
                          </span>
                        </div>
                        {crop.description && (
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "3px" }}>
                            {crop.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Timeline metrics */}
                    <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                          Planted Date
                        </div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#E2E8F0", marginTop: "2px" }}>
                          {crop.planting_date}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                          {isGrowing ? "Expected Harvest" : "Actual Harvest"}
                        </div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: isGrowing ? "#38BDF8" : "#94A3B8", marginTop: "2px" }}>
                          {crop.expected_harvest_date || crop.actual_harvest_date || crop.harvest_date || "Pending"}
                        </div>
                      </div>

                      {crop.season && (
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                            Season
                          </div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#E2E8F0", marginTop: "2px" }}>
                            {crop.season}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Crop Card Controls (Vertical Ellipsis for Edit & Delete) */}
                    <div style={{ position: "relative" }} ref={cropMenuRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCropMenuId(
                            activeCropMenuId === crop.instance_id ? null : crop.instance_id
                          );
                        }}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "6px",
                          backgroundColor:
                            activeCropMenuId === crop.instance_id
                              ? "rgba(16, 185, 129, 0.2)"
                              : "transparent",
                          color: "#94A3B8",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Crop controls"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Options */}
                      {activeCropMenuId === crop.instance_id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "4px",
                            width: "140px",
                            backgroundColor: "#0B132B",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "8px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
                            zIndex: 100,
                            overflow: "hidden",
                            padding: "4px 0",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              padding: "8px 12px",
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
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                            onClick={() => {
                              setActiveCropMenuId(null);
                              setSelectedCropToEdit(crop);
                              setShowCropModal(true);
                            }}
                          >
                            <Edit2 size={13} style={{ color: "#10B981" }} />
                            <span>Edit Crop</span>
                          </button>

                          <button
                            type="button"
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#FCA5A5",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.18)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                            onClick={() => {
                              setActiveCropMenuId(null);
                              setCropToDelete(crop);
                            }}
                          >
                            <Trash2 size={13} style={{ color: "#EF4444" }} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5.2 Strict Delete Land Confirmation Modal */}
        {showDeleteLandModal && (
          <div className="modal-overlay">
            <div className="modal-content-box" style={{ maxWidth: "480px" }}>
              <div className="modal-header" style={{ borderBottomColor: "rgba(239, 68, 68, 0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#EF4444",
                    }}
                  >
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#FCA5A5" }}>
                      Permanent Data Loss Warning
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                      Action cannot be undone
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteLandModal(false)}
                  disabled={deletingLand}
                  style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ color: "#CBD5E1", fontSize: "0.88rem", lineHeight: 1.6 }}>
                <p style={{ marginTop: 0 }}>
                  Are you absolutely sure you want to permanently delete parcel{" "}
                  <strong style={{ color: "#F8FAFC" }}>&ldquo;{land.name}&rdquo;</strong> (#{land.id})?
                </p>
                <div
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    fontSize: "0.8rem",
                    color: "#FCA5A5",
                  }}
                >
                  ✓ All registered crop history records will be erased.
                  <br />
                  ✓ All active Sentinel-2 NDVI scenario watches will be terminated.
                  <br />
                  ✓ PostGIS geospatial boundaries will be permanently dropped.
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  padding: "16px 20px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteLandModal(false)}
                  disabled={deletingLand}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteLand}
                  disabled={deletingLand}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {deletingLand ? "Deleting Parcel..." : "Yes, Permanently Delete Land"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Crop Confirmation Modal */}
        {cropToDelete && (
          <div className="modal-overlay">
            <div className="modal-content-box" style={{ maxWidth: "440px" }}>
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <AlertTriangle size={18} style={{ color: "#F59E0B" }} />
                  <div style={{ fontWeight: 800, fontSize: "1rem" }}>Confirm Crop Deletion</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCropToDelete(null)}
                  style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ fontSize: "0.86rem", color: "#CBD5E1" }}>
                Remove crop record <strong style={{ color: "#F8FAFC" }}>{cropToDelete.crop_name}</strong>{" "}
                (planted {cropToDelete.planting_date}) from this land?
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCropToDelete(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCrop}
                  disabled={deletingCrop}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    backgroundColor: "#EF4444",
                    color: "#FFF",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                  }}
                >
                  {deletingCrop ? "Deleting..." : "Delete Crop Record"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Crop Registration / Edit Modal */}
        {showCropModal && (
          <CropRegistrationModal
            landId={land.id}
            landName={land.name}
            initialCrop={selectedCropToEdit}
            onClose={() => {
              setShowCropModal(false);
              setSelectedCropToEdit(null);
            }}
            onSuccess={(updatedOrNewCrop) => {
              setShowCropModal(false);
              setSelectedCropToEdit(null);
              // Refresh crops list
              loadData();
              setToastMessage(
                selectedCropToEdit
                  ? `Crop "${updatedOrNewCrop.crop_name}" updated successfully.`
                  : `Crop "${updatedOrNewCrop.crop_name}" registered successfully.`
              );
              setTimeout(() => setToastMessage(null), 4000);
            }}
          />
        )}
      </div>
    </main>
  );
}

export default function LandDetailsPage() {
  return (
    <Suspense fallback={<Loader fullPage size="lg" message="Loading land details..." />}>
      <LandDetailsContent />
    </Suspense>
  );
}
