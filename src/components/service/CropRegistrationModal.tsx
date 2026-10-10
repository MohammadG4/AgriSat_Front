"use client";

import React, { useState, useEffect } from "react";
import { X, Sprout, Calendar, AlertCircle, CheckCircle, Tag } from "lucide-react";
import { Crop, CropOnLand, CropCreatePayload, CropUpdatePayload } from "@/types/farm";
import {
  getReferenceCropsApi,
  plantCropOnLandApi,
  updateCropOnLandApi,
  getToken,
} from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface CropRegistrationModalProps {
  landId: number;
  landName?: string;
  initialCrop?: CropOnLand | null;
  onClose: () => void;
  onSuccess: (crop: CropOnLand) => void;
}

export default function CropRegistrationModal({
  landId,
  landName,
  initialCrop,
  onClose,
  onSuccess,
}: CropRegistrationModalProps) {
  const { t, isRTL } = useLanguage();
  const isEditing = !!initialCrop;

  const [availableCrops, setAvailableCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<number | "">("");
  const [plantingDate, setPlantingDate] = useState<string>(() => {
    if (initialCrop?.planting_date) return initialCrop.planting_date;
    return new Date().toISOString().split("T")[0];
  });
  const [inGround, setInGround] = useState<boolean>(() => {
    if (!initialCrop) return true;
    return (
      initialCrop.status === "growing/in_ground" ||
      initialCrop.status === "growing" ||
      (!initialCrop.actual_harvest_date && !!initialCrop.expected_harvest_date) ||
      !initialCrop.harvest_date
    );
  });
  const [harvestDateInput, setHarvestDateInput] = useState<string>(() => {
    if (initialCrop) {
      return (
        initialCrop.expected_harvest_date ||
        initialCrop.actual_harvest_date ||
        initialCrop.harvest_date ||
        ""
      );
    }
    return "";
  });
  const [season, setSeason] = useState<string>(initialCrop?.season || "");

  const [loading, setLoading] = useState(false);
  const [fetchingCrops, setFetchingCrops] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reference crops strictly from GET /api/v1/farms/crops
  useEffect(() => {
    getReferenceCropsApi()
      .then((crops) => {
        setAvailableCrops(crops);
        if (crops.length > 0) {
          if (initialCrop?.crop_id) {
            setSelectedCropId(initialCrop.crop_id);
          } else {
            setSelectedCropId(crops[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load reference crops:", err);
        setError("Could not load reference crops dictionary.");
      })
      .finally(() => {
        setFetchingCrops(false);
      });
  }, [initialCrop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCropId) {
      setError("Please select a crop from the catalog.");
      return;
    }
    if (!plantingDate) {
      setError("Please specify the planting date.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Authentication required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const statusValue = inGround ? "growing/in_ground" : "harvested";
      const expectedHarvest = inGround ? (harvestDateInput || null) : null;
      const actualHarvest = !inGround ? (harvestDateInput || null) : null;

      let result: CropOnLand;

      if (isEditing && initialCrop) {
        const updatePayload: CropUpdatePayload = {
          instance_id: initialCrop.instance_id,
          crop_id: Number(selectedCropId),
          planting_date: plantingDate,
          harvest_date: harvestDateInput || null,
          status: statusValue,
          expected_harvest_date: expectedHarvest,
          actual_harvest_date: actualHarvest,
          season: season.trim() || undefined,
        };
        result = await updateCropOnLandApi(token, landId, updatePayload);
      } else {
        const createPayload: CropCreatePayload = {
          land_id: landId,
          crop_id: Number(selectedCropId),
          planting_date: plantingDate,
          harvest_date: harvestDateInput || null,
          status: statusValue,
          expected_harvest_date: expectedHarvest,
          actual_harvest_date: actualHarvest,
          season: season.trim() || undefined,
        };
        const createdInstance = await plantCropOnLandApi(token, landId, createPayload);
        const cropObj = availableCrops.find((c) => c.id === Number(selectedCropId));
        result = {
          instance_id: createdInstance.id,
          crop_id: Number(selectedCropId),
          crop_name: cropObj?.crop_name || "Planted Crop",
          description: cropObj?.description || null,
          planting_date: plantingDate,
          harvest_date: harvestDateInput || null,
          season: season.trim() || null,
          status: statusValue,
          expected_harvest_date: expectedHarvest,
          actual_harvest_date: actualHarvest,
        };
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save crop registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box" style={{ maxWidth: "520px" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <Sprout size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#F8FAFC" }}>
                {isEditing ? t("modals.cropEditHeader") : t("modals.cropAddHeader")}
              </div>
              <div style={{ fontSize: "0.74rem", color: "#64748B" }}>
                {landName ? `${landName}` : `#${landId}`} &bull; Crop Lifecycle Registry
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ color: "#94A3B8", padding: "4px", background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                  fontSize: "0.82rem",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Crop Name Dropdown (strictly populated by GET /api/v1/farms/crops) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#CBD5E1",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {t("modals.cropTypeLabel")} <span style={{ color: "#10B981" }}>*</span>
              </label>
              {fetchingCrops ? (
                <div style={{ color: "#64748B", fontSize: "0.85rem" }}>{t("modals.cropCatalogLoading")}</div>
              ) : (
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(Number(e.target.value))}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#F8FAFC",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                >
                  <option value="" disabled>{t("modals.cropCatalogSelect")}</option>
                  {availableCrops.map((c) => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: "#0F172A", color: "#F8FAFC" }}>
                      {c.crop_name} {c.description ? `— ${c.description.slice(0, 45)}...` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Planting Date (auto-fills to current date, editable) */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#CBD5E1",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                <Calendar size={13} style={{ color: "#10B981" }} />
                <span>{t("modals.plantingDateLabel")} <span style={{ color: "#10B981" }}>*</span></span>
              </label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#F8FAFC",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
            </div>

            {/* In Ground / Growing Checkbox */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <input
                type="checkbox"
                id="in_ground_status"
                checked={inGround}
                onChange={(e) => setInGround(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "#10B981",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="in_ground_status"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: inGround ? "#34D399" : "#E2E8F0",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {t("modals.inGroundCheckbox")}
              </label>
            </div>

            {/* Dynamic Harvest Date input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#CBD5E1",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {inGround ? t("modals.expectedHarvestDate") : t("modals.actualHarvestDate")}
                {!inGround && <span style={{ color: "#F59E0B", marginLeft: "4px" }}>*</span>}
              </label>
              <input
                type="date"
                value={harvestDateInput}
                onChange={(e) => setHarvestDateInput(e.target.value)}
                required={!inGround}
                placeholder={inGround ? "Expected harvest date" : "Actual date harvested"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#F8FAFC",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "#64748B", marginTop: "4px", display: "block" }}>
                {inGround
                  ? "Field mapped to expected_harvest_date while crop is growing."
                  : "Field mapped to actual_harvest_date once crop is completed."}
              </span>
            </div>

            {/* Season Text Input */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#CBD5E1",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                <Tag size={13} style={{ color: "#10B981" }} />
                <span>{t("modals.seasonLabel")}</span>
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder={t("modals.seasonPlaceholder")}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#F8FAFC",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              onClick={onClose}
              disabled={loading}
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || fetchingCrops}
              style={{
                padding: "8px 20px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <span>{t("common.loading")}</span>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>{isEditing ? t("modals.updateDetails") : t("service.registerCrop")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
