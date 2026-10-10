"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import {
  Search,
  MapPin,
  ArrowRight,
  PenTool,
  ArrowLeft,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  Compass,
} from "lucide-react";
import { GeoJsonPolygon, LandCreatePayload } from "@/types/farm";
import { createLandApi, createAlertScenarioApi, getToken } from "@/lib/api";
import {
  parseCoordinates,
  calculatePolygonAreaKm2,
  formatAreaKm2,
  EGYPT_BBOX,
  isPolygonInsideEgypt,
} from "./geoUtils";

const DEFAULT_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ;

export default function DedicatedRegisterLandMap() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapBearing, setMapBearing] = useState(0);

  // Boundary & Drawing state
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJsonPolygon | null>(null);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [soilType, setSoilType] = useState("Clay");
  const [irrigationType, setIrrigationType] = useState("Drip");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Mapbox & Draw tools
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agrisat_mapbox_token")
        : null;
    const token = storedToken || DEFAULT_MAPBOX_TOKEN;
    mapboxgl.accessToken = token;

    // Enable RTL Arabic Text Plugin
    try {
      if (mapboxgl.getRTLTextPluginStatus() === "unavailable") {
        mapboxgl.setRTLTextPlugin(
          "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js",
          null,
          true
        );
      }
    } catch {
      // ignore if already set
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [30.8025, 28.5],
      zoom: 7,
      pitch: 0,
      bearing: 0,
      maxBounds: EGYPT_BBOX,
    });

    mapRef.current = map;

    map.on("rotate", () => {
      setMapBearing(Math.round(map.getBearing()));
    });

    // Drawing tools
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon", // Automatically activate polygon tool
    });
    drawRef.current = draw;
    map.addControl(draw, "top-right");

    map.on("load", () => {
      // 1. Force Arabic labels on text layers
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer) => {
          if (
            layer.type === "symbol" &&
            layer.layout &&
            (layer.layout as any)["text-field"]
          ) {
            try {
              map.setLayoutProperty(layer.id, "text-field", [
                "coalesce",
                ["get", "name_ar"],
                ["get", "name"],
              ]);
            } catch {
              // ignore
            }
          }
        });
      }
    });

    // Drawing handlers: save polygon and validate strictly within Egypt
    const handleDrawChange = (e: any) => {
      const allFeatures = draw.getAll();
      if (allFeatures.features.length > 0) {
        const lastFeature =
          allFeatures.features[allFeatures.features.length - 1];
        if (
          lastFeature.geometry &&
          lastFeature.geometry.type === "Polygon"
        ) {
          const poly = lastFeature.geometry as GeoJsonPolygon;
          const coords = poly.coordinates[0];
          if (!isPolygonInsideEgypt(coords)) {
            setError("Selected land must be strictly within Egyptian territory.");
          } else {
            setError(null);
          }
          setDrawnPolygon(poly);
        }
      } else {
        setDrawnPolygon(null);
        setError(null);
      }
    };

    map.on("draw.create", handleDrawChange);
    map.on("draw.update", handleDrawChange);
    map.on("draw.delete", () => {
      setDrawnPolygon(null);
      setError(null);
    });

    return () => {
      map.remove();
    };
  }, []);

  // Search execution
  const handleSearch = useCallback(async (query: string) => {
    const map = mapRef.current;
    if (!map) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const coords = parseCoordinates(trimmed);
    if (coords) {
      map.flyTo({ center: coords, zoom: 14 });
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = mapboxgl.accessToken || DEFAULT_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmed
        )}.json?access_token=${token}&language=ar,en&types=place,locality,neighborhood,address,poi,region,country`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch (e) {
      console.error("Geocoding failed", e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectSearchResult = (item: any) => {
    const map = mapRef.current;
    if (map && item.center) {
      map.flyTo({
        center: item.center,
        zoom: 14,
        duration: 1800,
      });
      setSearchResults([]);
      setSearchQuery(item.place_name_ar || item.place_name);
    }
  };

  // Submit and return to main service
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a land name.");
      return;
    }
    if (!drawnPolygon) {
      setError("Please outline a land boundary on the map first.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Authentication required to register land.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Ensure closed ring
      const ring = [...drawnPolygon.coordinates[0]];
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }

      if (!isPolygonInsideEgypt(ring)) {
        setError("New land boundaries must be strictly within Egyptian territory.");
        setSubmitting(false);
        return;
      }

      const payload: LandCreatePayload = {
        name: name.trim(),
        location: location.trim() || undefined,
        soil_type: soilType,
        irrigation_type: irrigationType,
        notes: notes.trim() || undefined,
        boundary: {
          type: "Polygon",
          coordinates: [ring],
        },
      };

      setStatusMessage("Saving farm boundary in PostGIS...");
      const createdLand = await createLandApi(token, payload);

      // Automated default NDVI alert scenarios
      setStatusMessage("Configuring default NDVI Sentinel-2 scenarios...");
      try {
        await Promise.all([
          createAlertScenarioApi(token, {
            name: "Rapid NDVI Drop Watch",
            description: "Automated trigger for sudden vegetation health drop.",
            scenario_type: "rapid_ndvi_drop",
            land_id: createdLand.id,
            parameters: { drop_threshold: 15.0 },
            severity: "high",
            is_active: true,
          }),
          createAlertScenarioApi(token, {
            name: "Patchy Disease & Irrigation Leak Monitor",
            description: "Pixel-by-pixel spatial anomaly detector for localized stress.",
            scenario_type: "spatial_anomaly",
            land_id: createdLand.id,
            parameters: {
              anomaly_threshold_percent: 15.0,
              area_threshold_percent: 20.0,
            },
            severity: "critical",
            is_active: true,
          }),
        ]);
      } catch (e) {
        console.warn("Notice: automated default scenario creation:", e);
      }

      setStatusMessage("Land created! Returning to Crop Health service...");
      // Save ID so main service knows to select this land
      if (typeof window !== "undefined") {
        localStorage.setItem("agrisat_last_created_land_id", String(createdLand.id));
      }

      setTimeout(() => {
        router.push("/service");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to create land.");
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  const approxKm2 = drawnPolygon
    ? calculatePolygonAreaKm2(drawnPolygon.coordinates[0])
    : 0;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Top Left: Return Button, North Button & Search Bar */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 20,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/service")}
          className="hud-pill hud-btn"
          title="Return to Crop Health Service"
          style={{ padding: "10px 14px" }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Compass / North Reset Button */}
        <button
          type="button"
          onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 600 })}
          className="hud-pill hud-btn"
          title="Reset to True North (0°)"
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Compass
            size={17}
            style={{
              color: "#10B981",
              transform: `rotate(${-mapBearing}deg)`,
              transition: "transform 0.2s ease-out",
            }}
          />
          <span>North {mapBearing !== 0 ? `(${mapBearing}°)` : ""}</span>
        </button>

        {/* Search Bar */}
        <div className="map-search-container" style={{ width: "380px" }}>
          <div className="map-search-input-wrap">
            <Search size={18} style={{ color: "#64748B", flexShrink: 0 }} />
            <input
              type="text"
              className="map-search-input"
              placeholder="Search location in Egypt (Arabic/English) or coordinates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(searchQuery);
              }}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="search-result-item"
                  onClick={() => selectSearchResult(item)}
                >
                  <MapPin size={16} style={{ color: "#10B981", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#F8FAFC" }}>
                      {item.text_ar || item.text}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                      {item.place_name_ar || item.place_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Centered Instruction Banner */}
      <div className="registration-instruction-banner">
        <PenTool size={16} style={{ color: "#10B981" }} />
        <span>Select your new land on the map</span>
      </div>

      {/* Floating "Continue" Button: Only shown after user draws boundaries */}
      {drawnPolygon && !showDetailsForm && (
        <button
          type="button"
          className="registration-continue-fab"
          onClick={() => {
            if (drawnPolygon && !isPolygonInsideEgypt(drawnPolygon.coordinates[0])) {
              setError("Selected land must be strictly within Egyptian territory.");
              return;
            }
            setShowDetailsForm(true);
          }}
        >
          <span>Continue ({formatAreaKm2(approxKm2, true)})</span>
          <ArrowRight size={18} />
        </button>
      )}

      {/* Details Collection Modal (Only shown after user clicks "Continue") */}
      {showDetailsForm && (
        <div className="modal-overlay">
          <div className="modal-content-box" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                    Confirm Land Details
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Area: ~{formatAreaKm2(approxKm2, true)} &bull; PostGIS Geometry
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsForm(false)}
                disabled={submitting}
                style={{ color: "#94A3B8", padding: "4px" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box error" style={{ marginBottom: "16px" }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{error}</span>
                  </div>
                )}

                {statusMessage && (
                  <div className="alert-box info" style={{ marginBottom: "16px" }}>
                    <Sparkles size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#10B981" }} />
                    <span style={{ color: "#E2E8F0" }}>{statusMessage}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    <span>Land Name *</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Field #1 (Wheat)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Location / Region</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Nile Delta, Kafr El-Sheikh"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Soil Type</label>
                    <select
                      className="form-input"
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Loam">Loam</option>
                      <option value="Silty Clay">Silty Clay</option>
                      <option value="Peat">Peat</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Irrigation System</label>
                    <select
                      className="form-input"
                      value={irrigationType}
                      onChange={(e) => setIrrigationType(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="Drip">Drip Irrigation</option>
                      <option value="Sprinkler">Center Pivot / Sprinkler</option>
                      <option value="Surface">Surface / Flood</option>
                      <option value="Sub-surface">Sub-surface</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Agronomic details or observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    fontSize: "0.8rem",
                    color: "#A7F3D0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#10B981" }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                      Automated NDVI Scenarios Setup
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.75rem" }}>
                      Upon confirmation, Rapid Drop (15%) and Spatial Anomaly (15% drop over 20% area) alert scenarios will be automatically provisioned for this land.
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsForm(false)}
                  disabled={submitting}
                >
                  Adjust Boundary
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Creating & Activating..." : "Confirm & Create Land"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
